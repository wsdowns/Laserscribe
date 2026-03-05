package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"laserscribe/backend/db"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

var queries *db.Queries
var dbConn *sql.DB

var jwtSecret []byte

const cookieName = "laserscribe_token"
const tokenExpiry = 7 * 24 * time.Hour // 7 days

func main() {
	// Load .env file if present (no error if missing)
	_ = godotenv.Load("../.env")

	// JWT secret from env, with dev fallback
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "laserscribe-dev-secret-change-in-production"
		log.Println("WARNING: Using default JWT_SECRET. Set JWT_SECRET env var in production.")
	}
	jwtSecret = []byte(secret)

	conn, err := sql.Open("mysql", "laserscribe:laserscribe123@tcp(127.0.0.1:3306)/laserscribe?parseTime=true")
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer conn.Close()

	if err := conn.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	queries = db.New(conn)
	dbConn = conn

	r := gin.Default()

	// CORS — allow frontend dev server with credentials
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Auth
	r.POST("/api/auth/register", registerHandler)
	r.POST("/api/auth/login", loginHandler)
	r.POST("/api/auth/logout", logoutHandler)
	r.GET("/api/auth/me", authMiddleware(), meHandler)
	r.PUT("/api/auth/password", authMiddleware(), changePasswordHandler)
	r.GET("/api/auth/verify", verifyEmailHandler)
	r.POST("/api/auth/resend-verification", resendVerificationHandler)

	// Materials
	r.GET("/api/materials", getMaterialsHandler)
	r.GET("/api/materials/:id/aliases", getAliasesHandler)
	r.GET("/api/categories", getCategoriesHandler)

	// Settings (public)
	r.GET("/api/settings", searchSettingsHandler)
	r.GET("/api/settings/top", getTopSettingsHandler)
	r.GET("/api/settings/:id", getSettingHandler)

	// Settings (require authentication + email verification)
	r.POST("/api/settings", authMiddleware(), emailVerifiedMiddleware(), createSettingHandler)
	r.POST("/api/settings/import", authMiddleware(), emailVerifiedMiddleware(), importCLBHandler)
	r.GET("/api/settings/export", authMiddleware(), exportCLBHandler)
	r.PUT("/api/settings/:id", authMiddleware(), emailVerifiedMiddleware(), updateSettingHandler)
	r.DELETE("/api/settings/:id", authMiddleware(), emailVerifiedMiddleware(), deleteSettingHandler)
	r.POST("/api/settings/:id/vote", authMiddleware(), voteHandler)

	// User profile
	r.GET("/api/profile/settings", authMiddleware(), getUserSettingsHandler)

	// Admin routes
	r.GET("/api/admin/stats", authMiddleware(), adminMiddleware(), adminStatsHandler)
	r.GET("/api/admin/users", authMiddleware(), adminMiddleware(), adminUsersHandler)
	r.GET("/api/admin/users/:id", authMiddleware(), adminMiddleware(), adminUserDetailHandler)
	r.POST("/api/admin/users/:id/set-admin", authMiddleware(), adminMiddleware(), setUserAdminHandler)
	r.GET("/api/admin/settings", authMiddleware(), adminMiddleware(), adminSettingsHandler)

	log.Println("Laserscribe API running on :8080")
	r.Run(":8080")
}

// =====================
// JWT HELPERS
// =====================

func generateToken(userID int32) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(tokenExpiry).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func validateToken(tokenString string) (int32, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		return 0, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return 0, fmt.Errorf("invalid token")
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return 0, fmt.Errorf("invalid user_id claim")
	}

	return int32(userIDFloat), nil
}

func setAuthCookie(c *gin.Context, token string) {
	c.SetCookie(cookieName, token, int(tokenExpiry.Seconds()), "/", "", false, true)
}

func clearAuthCookie(c *gin.Context) {
	c.SetCookie(cookieName, "", -1, "/", "", false, true)
}

// =====================
// AUTH MIDDLEWARE
// =====================

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie(cookieName)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		userID, err := validateToken(tokenString)
		if err != nil {
			clearAuthCookie(c)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("user_id", userID)
		c.Next()
	}
}

func emailVerifiedMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		userID := userIDVal.(int32)
		user, err := queries.GetUserByID(c.Request.Context(), userID)
		if err != nil || !user.EmailVerified {
			c.JSON(http.StatusForbidden, gin.H{"error": "email not verified", "message": "Please verify your email before contributing settings."})
			c.Abort()
			return
		}

		c.Next()
	}
}

func adminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		userID := userIDVal.(int32)
		user, err := queries.GetUserByID(c.Request.Context(), userID)
		if err != nil || !user.IsAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// =====================
// AUTH HANDLERS
// =====================

type RegisterRequest struct {
	FirstName   string `json:"firstName" binding:"required"`
	LastName    string `json:"lastName" binding:"required"`
	Email       string `json:"email" binding:"required"`
	Password    string `json:"password" binding:"required"`
	DisplayName string `json:"displayName"`
}

func registerHandler(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	displayName := req.DisplayName
	if displayName == "" {
		displayName = req.FirstName + " " + req.LastName
	}

	result, err := queries.CreateUser(c.Request.Context(), db.CreateUserParams{
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Email:        req.Email,
		PasswordHash: string(hash),
		DisplayName:  sql.NullString{String: displayName, Valid: true},
	})
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate") {
			c.JSON(http.StatusConflict, gin.H{"error": "email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()

	// Generate verification token and send email
	if err := sendVerificationEmail(c, int32(id), req.Email); err != nil {
		log.Printf("WARNING: Failed to send verification email to %s: %v", req.Email, err)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Account created. Please check your email to verify your account.",
	})
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func loginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := queries.GetUserByEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if !user.EmailVerified {
		c.JSON(http.StatusForbidden, gin.H{"error": "email not verified"})
		return
	}

	token, err := generateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}
	setAuthCookie(c, token)

	displayName := ""
	if user.DisplayName.Valid {
		displayName = user.DisplayName.String
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          user.ID,
		"firstName":   user.FirstName,
		"lastName":    user.LastName,
		"displayName": displayName,
	})
}

func logoutHandler(c *gin.Context) {
	clearAuthCookie(c)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

func meHandler(c *gin.Context) {
	userID, _ := c.Get("user_id")
	user, err := queries.GetUserByID(c.Request.Context(), userID.(int32))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	displayName := ""
	if user.DisplayName.Valid {
		displayName = user.DisplayName.String
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          user.ID,
		"firstName":   user.FirstName,
		"lastName":    user.LastName,
		"email":       user.Email,
		"displayName": displayName,
		"isAdmin":     user.IsAdmin,
	})
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required"`
}

func changePasswordHandler(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(int32)

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := queries.GetUserByID(c.Request.Context(), int32(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "current password is incorrect"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	_, err = dbConn.ExecContext(c.Request.Context(),
		"UPDATE users SET password_hash = ? WHERE id = ?", string(hash), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated"})
}

func verifyEmailHandler(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing token"})
		return
	}

	user, err := queries.GetUserByVerificationToken(c.Request.Context(),
		sql.NullString{String: token, Valid: true})
	if err != nil {
		c.Redirect(http.StatusFound, "/login?verified=invalid")
		return
	}

	if user.VerificationExpires.Valid && user.VerificationExpires.Time.Before(time.Now()) {
		c.Redirect(http.StatusFound, "/login?verified=expired")
		return
	}

	if err := queries.VerifyUserEmail(c.Request.Context(), user.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "verification failed"})
		return
	}

	c.Redirect(http.StatusFound, "/verified")
}

type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required"`
}

func resendVerificationHandler(c *gin.Context) {
	var req ResendVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Always return success to avoid leaking whether email exists
	user, err := queries.GetUserByEmail(c.Request.Context(), req.Email)
	if err != nil || user.EmailVerified {
		c.JSON(http.StatusOK, gin.H{"message": "If that email is registered and unverified, a verification link has been sent."})
		return
	}

	if err := sendVerificationEmail(c, user.ID, user.Email); err != nil {
		log.Printf("WARNING: Failed to resend verification email to %s: %v", user.Email, err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "If that email is registered and unverified, a verification link has been sent."})
}

// =====================
// EMAIL HELPERS
// =====================

func generateVerificationToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func sendVerificationEmail(c *gin.Context, userID int32, email string) error {
	token, err := generateVerificationToken()
	if err != nil {
		return fmt.Errorf("failed to generate token: %w", err)
	}

	expires := time.Now().Add(24 * time.Hour)
	err = queries.SetVerificationToken(c.Request.Context(), db.SetVerificationTokenParams{
		VerificationToken:   sql.NullString{String: token, Valid: true},
		VerificationExpires: sql.NullTime{Time: expires, Valid: true},
		ID:                  userID,
	})
	if err != nil {
		return fmt.Errorf("failed to save token: %w", err)
	}

	baseURL := os.Getenv("APP_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:5173"
	}
	verifyURL := fmt.Sprintf("%s/api/auth/verify?token=%s", baseURL, token)

	// Send via SMTP2GO API if configured, otherwise log to console
	apiKey := os.Getenv("SMTP2GO_API_KEY")
	if apiKey == "" {
		log.Printf("VERIFICATION EMAIL for %s: %s", email, verifyURL)
		return nil
	}

	smtpFrom := os.Getenv("SMTP_FROM")
	if smtpFrom == "" {
		smtpFrom = "info@laserscribed.com"
	}

	subject := "Verify your Laserscribe account"
	textBody := fmt.Sprintf("Welcome to Laserscribe!\n\nPlease verify your email by clicking the link below:\n\n%s\n\nThis link expires in 24 hours.\n\nIf you didn't create this account, you can ignore this email.", verifyURL)

	// Use SMTP2GO HTTP API
	payload := map[string]interface{}{
		"api_key": apiKey,
		"to":      []string{email},
		"sender":  smtpFrom,
		"subject": subject,
		"text_body": textBody,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.smtp2go.com/v3/email/send", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send email via API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("SMTP2GO API error (status %d): %s", resp.StatusCode, string(body))
	}

	log.Printf("Verification email sent to %s", email)
	return nil
}

// =====================
// MATERIAL HANDLERS
// =====================

func getCategoriesHandler(c *gin.Context) {
	categories, err := queries.GetAllCategories(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, categories)
}

func getMaterialsHandler(c *gin.Context) {
	search := c.Query("search")
	categoryID := c.Query("category_id")

	if search != "" {
		materials, err := queries.SearchMaterials(c.Request.Context(), db.SearchMaterialsParams{
			CONCAT:   search,
			CONCAT_2: search,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, materials)
		return
	}

	if categoryID != "" {
		catID, err := strconv.Atoi(categoryID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category_id"})
			return
		}
		materials, err := queries.GetMaterialsByCategory(c.Request.Context(), int32(catID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, materials)
		return
	}

	materials, err := queries.GetAllMaterials(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, materials)
}

func getAliasesHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid material id"})
		return
	}
	aliases, err := queries.GetAliasesByMaterial(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, aliases)
}

// =====================
// SETTINGS HANDLERS
// =====================

func searchSettingsHandler(c *gin.Context) {
	params := db.SearchSettingsParams{}

	if v := c.Query("material_id"); v != "" {
		id, _ := strconv.Atoi(v)
		params.MaterialID = sql.NullInt32{Int32: int32(id), Valid: true}
	}
	if v := c.Query("laser_type"); v != "" {
		params.LaserType = db.NullSettingsLaserType{
			SettingsLaserType: db.SettingsLaserType(v),
			Valid:             true,
		}
	}
	if v := c.Query("wattage"); v != "" {
		w, _ := strconv.Atoi(v)
		params.Wattage = sql.NullInt32{Int32: int32(w), Valid: true}
	}
	if v := c.Query("operation_type"); v != "" {
		params.OperationType = db.NullSettingsOperationType{
			SettingsOperationType: db.SettingsOperationType(v),
			Valid:                 true,
		}
	}
	if v := c.Query("user_id"); v != "" {
		id, _ := strconv.Atoi(v)
		params.UserID = sql.NullInt32{Int32: int32(id), Valid: true}
	}
	if v := c.Query("keyword"); v != "" {
		params.Keyword = sql.NullString{String: v, Valid: true}
	}

	settings, err := queries.SearchSettings(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func getTopSettingsHandler(c *gin.Context) {
	settings, err := queries.GetTopSettings(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func getSettingHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid setting id"})
		return
	}
	setting, err := queries.GetSettingByID(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "setting not found"})
		return
	}
	c.JSON(http.StatusOK, setting)
}

type CreateSettingRequest struct {
	MaterialID       int32   `json:"materialId" binding:"required"`
	LaserType        string  `json:"laserType" binding:"required"`
	Wattage          int32   `json:"wattage" binding:"required"`
	OperationType    string  `json:"operationType" binding:"required"`
	MaxPower         string  `json:"maxPower" binding:"required"`
	MinPower         string  `json:"minPower"`
	MaxPower2        *string `json:"maxPower2"`
	MinPower2        *string `json:"minPower2"`
	Speed            string  `json:"speed" binding:"required"`
	NumPasses        int32   `json:"numPasses"`
	ZOffset          *string `json:"zOffset"`
	ZPerPass         *string `json:"zPerPass"`
	ScanInterval     *string `json:"scanInterval"`
	Angle            *string `json:"angle"`
	AnglePerPass     *string `json:"anglePerPass"`
	CrossHatch       bool    `json:"crossHatch"`
	Bidir            *bool   `json:"bidir"`
	ScanOpt          *string `json:"scanOpt"`
	FloodFill        bool    `json:"floodFill"`
	AutoRotate       bool    `json:"autoRotate"`
	Overscan         *string `json:"overscan"`
	OverscanPercent  *string `json:"overscanPercent"`
	Frequency        *string `json:"frequency"`
	WobbleEnable     *bool   `json:"wobbleEnable"`
	UseDotCorrection *bool   `json:"useDotCorrection"`
	PerforationMode  bool    `json:"perforationMode"`
	ImageMode        *string `json:"imageMode"`
	NegativeImage    bool    `json:"negativeImage"`
	DotWidth         *string `json:"dotWidth"`
	Kerf               *string `json:"kerf"`
	RunBlower          *bool   `json:"runBlower"`
	LayerName          *string `json:"layerName"`
	LayerSubname       *string `json:"layerSubname"`
	Priority           *int32  `json:"priority"`
	TabCount           *int32  `json:"tabCount"`
	TabCountMax        *int32  `json:"tabCountMax"`
	Notes              string  `json:"notes"`
}

func createSettingHandler(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(int32)
	var req CreateSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	numPasses := req.NumPasses
	if numPasses == 0 {
		numPasses = 1
	}

	bidir := true
	if req.Bidir != nil {
		bidir = *req.Bidir
	}

	minPower := req.MinPower
	if minPower == "" {
		minPower = "0"
	}

	result, err := queries.CreateSetting(c.Request.Context(), db.CreateSettingParams{
		UserID:           userID,
		MaterialID:       req.MaterialID,
		LaserType:        db.SettingsLaserType(req.LaserType),
		Wattage:          req.Wattage,
		OperationType:    db.SettingsOperationType(req.OperationType),
		MaxPower:         req.MaxPower,
		MinPower:         minPower,
		MaxPower2:        nullString(req.MaxPower2),
		MinPower2:        nullString(req.MinPower2),
		Speed:            req.Speed,
		NumPasses:        numPasses,
		ZOffset:          nullString(req.ZOffset),
		ZPerPass:         nullString(req.ZPerPass),
		ScanInterval:     nullString(req.ScanInterval),
		Angle:            nullString(req.Angle),
		AnglePerPass:     nullString(req.AnglePerPass),
		CrossHatch:       req.CrossHatch,
		Bidir:            bidir,
		ScanOpt:          nullString(req.ScanOpt),
		FloodFill:        req.FloodFill,
		AutoRotate:       req.AutoRotate,
		Overscan:         nullString(req.Overscan),
		OverscanPercent:  nullString(req.OverscanPercent),
		Frequency:            nullString(req.Frequency),
		WobbleEnable:     nullBool(req.WobbleEnable),
		UseDotCorrection: nullBool(req.UseDotCorrection),
		PerforationMode:  req.PerforationMode,
		ImageMode:        nullString(req.ImageMode),
		NegativeImage:    req.NegativeImage,
		DotWidth:         nullString(req.DotWidth),
		Kerf:             nullString(req.Kerf),
		RunBlower:            nullBool(req.RunBlower),
		LayerName:            nullString(req.LayerName),
		LayerSubname:         nullString(req.LayerSubname),
		Priority:             nullInt32(req.Priority),
		TabCount:             nullInt32(req.TabCount),
		TabCountMax:          nullInt32(req.TabCountMax),
		Notes:                sql.NullString{String: req.Notes, Valid: req.Notes != ""},
	})
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate") {
			c.JSON(http.StatusConflict, gin.H{"error": "you already have a setting for this material/operation/laser combination"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

type UpdateSettingRequest struct {
	MaxPower         string  `json:"maxPower" binding:"required"`
	MinPower         string  `json:"minPower"`
	MaxPower2        *string `json:"maxPower2"`
	MinPower2        *string `json:"minPower2"`
	Speed            string  `json:"speed" binding:"required"`
	NumPasses        int32   `json:"numPasses"`
	ZOffset          *string `json:"zOffset"`
	ZPerPass         *string `json:"zPerPass"`
	ScanInterval     *string `json:"scanInterval"`
	Angle            *string `json:"angle"`
	AnglePerPass     *string `json:"anglePerPass"`
	CrossHatch       bool    `json:"crossHatch"`
	Bidir            *bool   `json:"bidir"`
	ScanOpt          *string `json:"scanOpt"`
	FloodFill        bool    `json:"floodFill"`
	AutoRotate       bool    `json:"autoRotate"`
	Overscan         *string `json:"overscan"`
	OverscanPercent  *string `json:"overscanPercent"`
	Frequency        *string `json:"frequency"`
	WobbleEnable     *bool   `json:"wobbleEnable"`
	UseDotCorrection *bool   `json:"useDotCorrection"`
	PerforationMode  bool    `json:"perforationMode"`
	ImageMode        *string `json:"imageMode"`
	NegativeImage    bool    `json:"negativeImage"`
	DotWidth         *string `json:"dotWidth"`
	Kerf             *string `json:"kerf"`
	RunBlower        *bool   `json:"runBlower"`
	LayerName        *string `json:"layerName"`
	LayerSubname     *string `json:"layerSubname"`
	Priority         *int32  `json:"priority"`
	TabCount         *int32  `json:"tabCount"`
	TabCountMax      *int32  `json:"tabCountMax"`
	Notes            string  `json:"notes"`
}

func updateSettingHandler(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(int32)
	settingID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid setting id"})
		return
	}

	// Verify ownership
	setting, err := queries.GetSettingByID(c.Request.Context(), int32(settingID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "setting not found"})
		return
	}
	if setting.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only edit your own settings"})
		return
	}

	var req UpdateSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	numPasses := req.NumPasses
	if numPasses == 0 {
		numPasses = 1
	}

	bidir := true
	if req.Bidir != nil {
		bidir = *req.Bidir
	}

	minPower := req.MinPower
	if minPower == "" {
		minPower = "0"
	}

	err = queries.UpdateSetting(c.Request.Context(), db.UpdateSettingParams{
		MaxPower:         req.MaxPower,
		MinPower:         minPower,
		MaxPower2:        nullString(req.MaxPower2),
		MinPower2:        nullString(req.MinPower2),
		Speed:            req.Speed,
		NumPasses:        numPasses,
		ZOffset:          nullString(req.ZOffset),
		ZPerPass:         nullString(req.ZPerPass),
		ScanInterval:     nullString(req.ScanInterval),
		Angle:            nullString(req.Angle),
		AnglePerPass:     nullString(req.AnglePerPass),
		CrossHatch:       req.CrossHatch,
		Bidir:            bidir,
		ScanOpt:          nullString(req.ScanOpt),
		FloodFill:        req.FloodFill,
		AutoRotate:       req.AutoRotate,
		Overscan:         nullString(req.Overscan),
		OverscanPercent:  nullString(req.OverscanPercent),
		Frequency:            nullString(req.Frequency),
		WobbleEnable:     nullBool(req.WobbleEnable),
		UseDotCorrection: nullBool(req.UseDotCorrection),
		PerforationMode:  req.PerforationMode,
		ImageMode:        nullString(req.ImageMode),
		NegativeImage:    req.NegativeImage,
		DotWidth:         nullString(req.DotWidth),
		Kerf:             nullString(req.Kerf),
		RunBlower:            nullBool(req.RunBlower),
		LayerName:            nullString(req.LayerName),
		LayerSubname:         nullString(req.LayerSubname),
		Priority:             nullInt32(req.Priority),
		TabCount:             nullInt32(req.TabCount),
		TabCountMax:          nullInt32(req.TabCountMax),
		Notes:                sql.NullString{String: req.Notes, Valid: req.Notes != ""},
		ID:                   int32(settingID),
		UserID:               int32(userID),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func deleteSettingHandler(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(int32)
	settingID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid setting id"})
		return
	}

	// Verify ownership
	setting, err := queries.GetSettingByID(c.Request.Context(), int32(settingID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "setting not found"})
		return
	}
	if setting.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only delete your own settings"})
		return
	}

	err = queries.DeleteSetting(c.Request.Context(), db.DeleteSettingParams{
		ID:     int32(settingID),
		UserID: int32(userID),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// =====================
// CLB XML STRUCTURES
// =====================

type LightBurnLibrary struct {
	XMLName     xml.Name   `xml:"LightBurnLibrary"`
	DisplayName string     `xml:"DisplayName,attr"`
	Materials   []Material `xml:"Material"`
}

type Material struct {
	Name    string  `xml:"name,attr"`
	Entries []Entry `xml:"Entry"`
}

type Entry struct {
	Thickness    string      `xml:"Thickness,attr"`
	Desc         string      `xml:"Desc,attr"`
	NoThickTitle string      `xml:"NoThickTitle,attr"`
	CutSetting   CutSetting  `xml:"CutSetting"`
}

type CutSetting struct {
	Type             string        `xml:"type,attr"`
	Index            ValueElement  `xml:"index"`
	Name             ValueElement  `xml:"name"`
	LinkPath         ValueElement  `xml:"LinkPath"`
	MaxPower         ValueElement  `xml:"maxPower"`
	MaxPower2        ValueElement  `xml:"maxPower2"`
	MinPower         ValueElement  `xml:"minPower"`
	MinPower2        ValueElement  `xml:"minPower2"`
	Speed            ValueElement  `xml:"speed"`
	Frequency        ValueElement  `xml:"frequency"`
	NumPasses        ValueElement  `xml:"numPasses"`
	ZOffset          ValueElement  `xml:"zOffset"`
	ZPerPass         ValueElement  `xml:"zPerPass"`
	ScanInterval     ValueElement  `xml:"interval"`
	Angle            ValueElement  `xml:"angle"`
	AnglePerPass     ValueElement  `xml:"anglePerPass"`
	CrossHatch       ValueElement  `xml:"crossHatch"`
	Bidir            ValueElement  `xml:"bidir"`
	ScanOpt          ValueElement  `xml:"scanOpt"`
	FloodFill        ValueElement  `xml:"floodFill"`
	AutoRotate       ValueElement  `xml:"autoRotate"`
	Overscan         ValueElement  `xml:"overscan"`
	OverscanPercent  ValueElement  `xml:"overscanPercent"`
	WobbleEnable         ValueElement  `xml:"wobbleEnable"`
	UseDotCorrection     ValueElement  `xml:"useDotCorrection"`
	PerforationMode      ValueElement  `xml:"perforationMode"`
	ImageMode            ValueElement  `xml:"imageMode"`
	DitherMode           ValueElement  `xml:"ditherMode"`
	NegativeImage        ValueElement  `xml:"negativeImage"`
	EnableDotWidthAdjust ValueElement  `xml:"enableDotWidthAdjust"`
	DotWidth             ValueElement  `xml:"dotWidth"`
	Kerf                 ValueElement  `xml:"kerf"`
	RunBlower        ValueElement  `xml:"runBlower"`
	Subname          ValueElement  `xml:"subname"`
	Priority         ValueElement  `xml:"priority"`
	TabCount         ValueElement  `xml:"tabCount"`
	TabCountMax      ValueElement  `xml:"tabCountMax"`
	SubLayers        []SubLayer    `xml:"SubLayer"`
}

type ValueElement struct {
	Value string `xml:"Value,attr"`
}

type SubLayer struct {
	Type         string       `xml:"type,attr"`
	Index        string       `xml:"index,attr"`
	MaxPower     ValueElement `xml:"maxPower"`
	MaxPower2    ValueElement `xml:"maxPower2"`
	MinPower     ValueElement `xml:"minPower"`
	MinPower2    ValueElement `xml:"minPower2"`
	Speed        ValueElement `xml:"speed"`
	Frequency    ValueElement `xml:"frequency"`
	NumPasses    ValueElement `xml:"numPasses"`
	IsCleanup    ValueElement `xml:"isCleanup"`
	ScanInterval ValueElement `xml:"interval"`
	Subname      ValueElement `xml:"subname"`
}

// =====================
// CLB IMPORT HANDLER
// =====================

type ImportCLBRequest struct {
	LaserMakeModel string `form:"laserMakeModel" binding:"required"`
	LaserType      string `form:"laserType" binding:"required"`
	Wattage        int32  `form:"wattage" binding:"required"`
}

func importCLBHandler(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(int32)

	// Parse form data
	var req ImportCLBRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	// Check file size (10MB limit)
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file too large (max 10MB)"})
		return
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open file"})
		return
	}
	defer src.Close()

	// Parse XML
	var library LightBurnLibrary
	decoder := xml.NewDecoder(src)
	if err := decoder.Decode(&library); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid CLB file format: " + err.Error()})
		return
	}

	// Track results
	imported := 0
	failed := 0
	var errors []string

	// Process each material
	for _, material := range library.Materials {
		// Extract base material name (remove laser make/model if present)
		baseMaterialName := material.Name
		if idx := strings.LastIndex(baseMaterialName, " ("); idx > 0 {
			baseMaterialName = baseMaterialName[:idx]
		}

		for _, entry := range material.Entries {
			// Use base material name without modification
			materialName := baseMaterialName

			// Create setting from main CutSetting
			if err := createSettingFromCutSetting(
				entry.CutSetting,
				materialName,
				entry.Desc,
				req.LaserMakeModel,
				req.LaserType,
				req.Wattage,
				userID,
			); err != nil {
				failed++
				errors = append(errors, fmt.Sprintf("%s/%s: %v", materialName, entry.Desc, err))
			} else {
				imported++
			}

			// Process SubLayers
			for _, subLayer := range entry.CutSetting.SubLayers {
				subMaterialName := materialName
				subDesc := entry.Desc
				if subLayer.Subname.Value != "" {
					subMaterialName = materialName + " - " + subLayer.Subname.Value
				}

				if err := createSettingFromSubLayer(
					subLayer,
					subMaterialName,
					subDesc,
					req.LaserMakeModel,
					req.LaserType,
					req.Wattage,
					userID,
				); err != nil {
					failed++
					errors = append(errors, fmt.Sprintf("%s/%s (SubLayer): %v", subMaterialName, subDesc, err))
				} else {
					imported++
				}
			}
		}
	}

	response := gin.H{
		"message":  "CLB import completed",
		"imported": imported,
		"failed":   failed,
	}
	if len(errors) > 0 {
		response["errors"] = errors
	}

	c.JSON(http.StatusCreated, response)
}

// Helper function to get or create material by name
func getOrCreateMaterial(materialName string) (int32, error) {
	// Try to find existing material
	material, err := queries.GetMaterialByName(context.Background(), materialName)
	if err == nil {
		return material.ID, nil
	}

	// Material doesn't exist, create it
	// Default to category_id = 1 (you might want to make this smarter)
	slug := strings.ToLower(strings.ReplaceAll(materialName, " ", "-"))
	slug = strings.ReplaceAll(slug, "/", "-")

	result, err := queries.CreateMaterial(context.Background(), db.CreateMaterialParams{
		CategoryID: 1, // Default category
		Name:       materialName,
		Slug:       slug,
	})
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int32(id), nil
}

// Helper functions for CLB import
func createSettingFromCutSetting(cs CutSetting, materialName, operation, laserMakeModel, laserType string, wattage int32, userID int32) error {
	// Get or create material
	materialID, err := getOrCreateMaterial(materialName)
	if err != nil {
		return fmt.Errorf("failed to get/create material: %w", err)
	}

	// Parse required fields
	maxPower := cs.MaxPower.Value
	if maxPower == "" {
		maxPower = "0"
	}
	minPower := cs.MinPower.Value
	if minPower == "" {
		minPower = "0"
	}
	speed := cs.Speed.Value
	if speed == "" {
		speed = "0"
	}

	// Parse optional numeric fields
	numPasses := parseInt32(cs.NumPasses.Value, 1)

	// Parse booleans
	bidir := true // default
	if cs.Bidir.Value != "" {
		bidir = parseBool(cs.Bidir.Value)
	}

	// Map operation type
	operationType := db.SettingsOperationTypeCut
	if cs.Type == "Scan" {
		operationType = db.SettingsOperationTypeScan
	} else if cs.Type == "Image" {
		// Image mode should be treated as Scan type with imageMode set
		operationType = db.SettingsOperationTypeScan
	}

	// Convert laser type string to enum
	laserTypeEnum := stringToLaserType(laserType)

	// Create setting
	_, err = queries.CreateSetting(context.Background(), db.CreateSettingParams{
		UserID:           userID,
		MaterialID:       materialID,
		LaserType:        laserTypeEnum,
		Wattage:          wattage,
		OperationType:    operationType,
		MaxPower:         maxPower,
		MinPower:         minPower,
		MaxPower2:        nullString(&cs.MaxPower2.Value),
		MinPower2:        nullString(&cs.MinPower2.Value),
		Speed:            speed,
		NumPasses:        numPasses,
		ZOffset:          nullString(&cs.ZOffset.Value),
		ZPerPass:         nullString(&cs.ZPerPass.Value),
		ScanInterval:     nullString(&cs.ScanInterval.Value),
		Angle:            nullString(&cs.Angle.Value),
		AnglePerPass:     nullString(&cs.AnglePerPass.Value),
		CrossHatch:       parseBool(cs.CrossHatch.Value),
		Bidir:            bidir,
		ScanOpt:          nullString(&cs.ScanOpt.Value),
		FloodFill:        parseBool(cs.FloodFill.Value),
		AutoRotate:       parseBool(cs.AutoRotate.Value),
		Overscan:         nullString(&cs.Overscan.Value),
		OverscanPercent:  nullString(&cs.OverscanPercent.Value),
		Frequency:        nullString(&cs.Frequency.Value),
		WobbleEnable:     nullBoolFromString(&cs.WobbleEnable.Value),
		UseDotCorrection: parseBoolOrFallback(cs.UseDotCorrection.Value, cs.EnableDotWidthAdjust.Value),
		PerforationMode:  parseBool(cs.PerforationMode.Value),
		ImageMode:        imageMode(cs),
		NegativeImage:    parseBool(cs.NegativeImage.Value),
		DotWidth:         nullString(&cs.DotWidth.Value),
		Kerf:             nullString(&cs.Kerf.Value),
		RunBlower:        nullBoolFromString(&cs.RunBlower.Value),
		LayerName:        sql.NullString{String: laserMakeModel, Valid: true},
		LayerSubname:     nullString(&cs.Subname.Value),
		Priority:         nullInt32FromString(&cs.Priority.Value),
		TabCount:         nullInt32FromString(&cs.TabCount.Value),
		TabCountMax:      nullInt32FromString(&cs.TabCountMax.Value),
		Notes:            sql.NullString{String: "", Valid: false},
	})

	return err
}

func createSettingFromSubLayer(sl SubLayer, materialName, operation, laserMakeModel, laserType string, wattage int32, userID int32) error {
	// Get or create material
	materialID, err := getOrCreateMaterial(materialName)
	if err != nil {
		return fmt.Errorf("failed to get/create material: %w", err)
	}

	maxPower := sl.MaxPower.Value
	if maxPower == "" {
		maxPower = "0"
	}
	minPower := sl.MinPower.Value
	if minPower == "" {
		minPower = "0"
	}
	speed := sl.Speed.Value
	if speed == "" {
		speed = "0"
	}

	numPasses := parseInt32(sl.NumPasses.Value, 1)

	// Map operation type
	operationType := db.SettingsOperationTypeCut
	if sl.Type == "Scan" {
		operationType = db.SettingsOperationTypeScan
	}

	// Convert laser type string to enum
	laserTypeEnum := stringToLaserType(laserType)

	_, err = queries.CreateSetting(context.Background(), db.CreateSettingParams{
		UserID:        userID,
		MaterialID:    materialID,
		LaserType:     laserTypeEnum,
		Wattage:       wattage,
		OperationType: operationType,
		MaxPower:         maxPower,
		MinPower:         minPower,
		MaxPower2:        nullString(&sl.MaxPower2.Value),
		MinPower2:        nullString(&sl.MinPower2.Value),
		Speed:            speed,
		NumPasses:        numPasses,
		ZOffset:          sql.NullString{Valid: false},
		ZPerPass:         sql.NullString{Valid: false},
		ScanInterval:     nullString(&sl.ScanInterval.Value),
		Angle:            sql.NullString{Valid: false},
		AnglePerPass:     sql.NullString{Valid: false},
		CrossHatch:       false,
		Bidir:            true,
		ScanOpt:          sql.NullString{Valid: false},
		FloodFill:        false,
		AutoRotate:       false,
		Overscan:         sql.NullString{Valid: false},
		OverscanPercent:  sql.NullString{Valid: false},
		Frequency:        nullString(&sl.Frequency.Value),
		WobbleEnable:     sql.NullBool{Valid: false},
		UseDotCorrection: sql.NullBool{Valid: false},
		Kerf:             sql.NullString{Valid: false},
		RunBlower:        sql.NullBool{Valid: false},
		LayerName:        sql.NullString{String: laserMakeModel, Valid: true},
		LayerSubname:     nullString(&sl.Subname.Value),
		Priority:         sql.NullInt32{Valid: false},
		TabCount:         sql.NullInt32{Valid: false},
		TabCountMax:      sql.NullInt32{Valid: false},
		Notes:            sql.NullString{Valid: false},
	})

	return err
}

// Parse helpers
func parseInt32(s string, defaultVal int32) int32 {
	if s == "" {
		return defaultVal
	}
	val, err := strconv.ParseInt(s, 10, 32)
	if err != nil {
		return defaultVal
	}
	return int32(val)
}

func parseBool(s string) bool {
	return s == "1" || strings.ToLower(s) == "true"
}

// parseBoolOrFallback tries primary first, falls back to secondary for backward compatibility
func parseBoolOrFallback(primary, secondary string) sql.NullBool {
	if primary != "" {
		return sql.NullBool{Bool: parseBool(primary), Valid: true}
	}
	if secondary != "" {
		return sql.NullBool{Bool: parseBool(secondary), Valid: true}
	}
	return sql.NullBool{Valid: false}
}

// imageMode extracts the image mode from a CutSetting, preferring ditherMode
func imageMode(cs CutSetting) sql.NullString {
	// Prefer ditherMode as that's what LightBurn uses for Image mode
	if cs.DitherMode.Value != "" {
		return sql.NullString{String: cs.DitherMode.Value, Valid: true}
	}
	// Fall back to imageMode if present
	if cs.ImageMode.Value != "" {
		return sql.NullString{String: cs.ImageMode.Value, Valid: true}
	}
	return sql.NullString{Valid: false}
}

func nullBoolFromString(s *string) sql.NullBool {
	if s == nil || *s == "" {
		return sql.NullBool{Valid: false}
	}
	return sql.NullBool{Bool: parseBool(*s), Valid: true}
}

func nullInt32FromString(s *string) sql.NullInt32 {
	if s == nil || *s == "" {
		return sql.NullInt32{Valid: false}
	}
	val := parseInt32(*s, 0)
	return sql.NullInt32{Int32: val, Valid: true}
}

func stringToLaserType(s string) db.SettingsLaserType {
	switch strings.ToUpper(s) {
	case "CO2":
		return db.SettingsLaserTypeCO2
	case "FIBER":
		return db.SettingsLaserTypeFiber
	case "DIODE":
		return db.SettingsLaserTypeDiode
	case "UV":
		return db.SettingsLaserTypeUV
	case "INFRARED":
		return db.SettingsLaserTypeInfrared
	default:
		return db.SettingsLaserTypeCO2 // Default fallback
	}
}

// =====================
// VOTE HANDLER
// =====================

type VoteRequest struct {
	Value int8 `json:"value" binding:"required"`
}

func voteHandler(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(int32)
	settingID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid setting id"})
		return
	}

	var req VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Value != 1 && req.Value != -1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "value must be 1 or -1"})
		return
	}

	err = queries.UpsertVote(c.Request.Context(), db.UpsertVoteParams{
		UserID:    int32(userID),
		SettingID: int32(settingID),
		Value:     int8(req.Value),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	score, err := queries.GetVoteScore(c.Request.Context(), int32(settingID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"score": score.Score, "total": score.Total})
}

// =====================
// PROFILE HANDLER
// =====================

func getUserSettingsHandler(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(int32)
	settings, err := queries.GetUserSettings(c.Request.Context(), int32(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, settings)
}

// =====================
// CLB EXPORT HANDLER
// =====================

func exportCLBHandler(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(int32)

	// Get user's settings
	allSettings, err := queries.GetUserSettings(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve settings"})
		return
	}

	// Filter by specific IDs if provided
	idsParam := c.Query("ids")
	var settings []db.GetUserSettingsRow

	if idsParam != "" {
		// Parse comma-separated IDs
		idStrings := strings.Split(idsParam, ",")
		idMap := make(map[int32]bool)
		for _, idStr := range idStrings {
			if id, err := strconv.Atoi(strings.TrimSpace(idStr)); err == nil {
				idMap[int32(id)] = true
			}
		}

		// Filter settings by requested IDs
		for _, setting := range allSettings {
			if idMap[setting.ID] {
				settings = append(settings, setting)
			}
		}
	} else {
		settings = allSettings
	}

	if len(settings) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No settings found to export"})
		return
	}

	// Group settings by material
	type MaterialSettings struct {
		MaterialName string
		Settings     []db.GetUserSettingsRow
	}
	materialsMap := make(map[string]*MaterialSettings)

	for _, setting := range settings {
		materialName := setting.MaterialName
		if materialsMap[materialName] == nil {
			materialsMap[materialName] = &MaterialSettings{
				MaterialName: materialName,
				Settings:     []db.GetUserSettingsRow{},
			}
		}
		materialsMap[materialName].Settings = append(materialsMap[materialName].Settings, setting)
	}

	// Generate CLB XML
	var xmlBuilder strings.Builder
	xmlBuilder.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	xmlBuilder.WriteString(`<LightBurnLibrary DisplayName="Laserscribe Export">` + "\n")

	for _, materialData := range materialsMap {
		xmlBuilder.WriteString(fmt.Sprintf(`  <Material name="%s">`, materialData.MaterialName) + "\n")

		for idx, setting := range materialData.Settings {
			// Map operation type to CutSetting type
			// If imageMode is set, use type="Image"
			cutType := "Cut"
			noThickTitle := "Line Settings"
			desc := "Line"

			if setting.ImageMode.Valid && setting.ImageMode.String != "" {
				cutType = "Image"
				// Convert dither mode from database format to display format
				imageMode := setting.ImageMode.String
				imageModeDisplay := imageMode
				imageModeShort := imageMode

				// Reverse mapping: database format → display format
				switch strings.ToLower(imageMode) {
				case "jarvis":
					imageModeDisplay = "Jarvis"
					imageModeShort = "Jarvis"
				case "3dslice":
					imageModeDisplay = "3D Sliced"
					imageModeShort = "3D"
				case "stucki":
					imageModeDisplay = "Stucki"
					imageModeShort = "Stucki"
				case "atkinson":
					imageModeDisplay = "Atkinson"
					imageModeShort = "Atkinson"
				default:
					// Capitalize first letter
					if len(imageMode) > 0 {
						imageModeDisplay = strings.ToUpper(imageMode[:1]) + imageMode[1:]
						imageModeShort = imageModeDisplay
					}
				}

				noThickTitle = "Image-" + imageModeShort
				desc = imageModeDisplay + " Optimized"
			} else if setting.OperationType == "Scan" {
				cutType = "Scan"
				noThickTitle = "Fill Settings"
				desc = "Fill"
			} else if setting.OperationType == "ScanCut" {
				cutType = "Scan"
				noThickTitle = "Fill+Line Settings"
				desc = "Fill+Line"
			}

			xmlBuilder.WriteString(fmt.Sprintf(`    <Entry Thickness="-1.0000" Desc="%s" NoThickTitle="%s">`, desc, noThickTitle) + "\n")
			xmlBuilder.WriteString(fmt.Sprintf(`      <CutSetting type="%s">`, cutType) + "\n")

			// Write fields in minimal format - only include non-empty values
			xmlBuilder.WriteString(fmt.Sprintf(`        <index Value="%d"/>`, idx) + "\n")
			xmlBuilder.WriteString(`        <name Value=""/>` + "\n")
			linkPath := fmt.Sprintf("%s/%s/%s", materialData.MaterialName, noThickTitle, desc)
			xmlBuilder.WriteString(fmt.Sprintf(`        <LinkPath Value="%s"/>`, linkPath) + "\n")
			xmlBuilder.WriteString(fmt.Sprintf(`        <minPower Value="%s"/>`, setting.MinPower) + "\n")
			xmlBuilder.WriteString(fmt.Sprintf(`        <maxPower Value="%s"/>`, setting.MaxPower) + "\n")
			xmlBuilder.WriteString(`        <maxPower2 Value="20"/>` + "\n")
			xmlBuilder.WriteString(fmt.Sprintf(`        <speed Value="%s"/>`, setting.Speed) + "\n")

			// Only include frequency if set
			if setting.Frequency.Valid && setting.Frequency.String != "" && setting.Frequency.String != "0" {
				xmlBuilder.WriteString(fmt.Sprintf(`        <frequency Value="%s"/>`, setting.Frequency.String) + "\n")
			}

			// Only include numPasses if > 1
			if setting.NumPasses > 1 {
				xmlBuilder.WriteString(fmt.Sprintf(`        <numPasses Value="%d"/>`, setting.NumPasses) + "\n")
			}

			// Only include anglePerPass if set
			if setting.AnglePerPass.Valid && setting.AnglePerPass.String != "" && setting.AnglePerPass.String != "0" {
				xmlBuilder.WriteString(fmt.Sprintf(`        <anglePerPass Value="%s"/>`, setting.AnglePerPass.String) + "\n")
			}

			// crossHatch and bidir
			if setting.CrossHatch {
				xmlBuilder.WriteString(`        <crossHatch Value="1"/>` + "\n")
			}
			if setting.Bidir {
				xmlBuilder.WriteString(`        <bidir Value="1"/>` + "\n")
			} else {
				xmlBuilder.WriteString(`        <bidir Value="0"/>` + "\n")
			}

			// Only include interval if set
			if setting.ScanInterval.Valid && setting.ScanInterval.String != "" && setting.ScanInterval.String != "0" {
				xmlBuilder.WriteString(fmt.Sprintf(`        <interval Value="%s"/>`, setting.ScanInterval.String) + "\n")
			}

			// Only include angle if set
			if setting.Angle.Valid && setting.Angle.String != "" && setting.Angle.String != "0" {
				xmlBuilder.WriteString(fmt.Sprintf(`        <angle Value="%s"/>`, setting.Angle.String) + "\n")
			}

			// Always include priority
			xmlBuilder.WriteString(`        <priority Value="0"/>` + "\n")

			// Optional fields
			if setting.WobbleEnable.Valid && setting.WobbleEnable.Bool {
				xmlBuilder.WriteString(`        <wobbleEnable Value="1"/>` + "\n")
			}
			if setting.PerforationMode {
				xmlBuilder.WriteString(`        <perforationMode Value="1"/>` + "\n")
			}
			// ditherMode for Image mode (convert to lowercase LightBurn format)
			if setting.ImageMode.Valid && setting.ImageMode.String != "" {
				ditherMode := strings.ToLower(strings.ReplaceAll(setting.ImageMode.String, " ", ""))
				// Fix known mappings
				if ditherMode == "3dsliced" {
					ditherMode = "3dslice"
				}
				xmlBuilder.WriteString(fmt.Sprintf(`        <ditherMode Value="%s"/>`, ditherMode) + "\n")
			}
			if setting.NegativeImage {
				xmlBuilder.WriteString(`        <negativeImage Value="1"/>` + "\n")
			}
			if setting.UseDotCorrection.Valid && setting.UseDotCorrection.Bool {
				xmlBuilder.WriteString(`        <useDotCorrection Value="1"/>` + "\n")
			}
			if setting.DotWidth.Valid && setting.DotWidth.String != "" && setting.DotWidth.String != "0" {
				xmlBuilder.WriteString(fmt.Sprintf(`        <dotWidth Value="%s"/>`, setting.DotWidth.String) + "\n")
			}
			if setting.FloodFill {
				xmlBuilder.WriteString(`        <floodFill Value="1"/>` + "\n")
			}
			if setting.AutoRotate {
				xmlBuilder.WriteString(`        <autoRotate Value="1"/>` + "\n")
			}

			xmlBuilder.WriteString(`      </CutSetting>` + "\n")
			xmlBuilder.WriteString(`    </Entry>` + "\n")
		}

		xmlBuilder.WriteString(`  </Material>` + "\n")
	}

	xmlBuilder.WriteString(`</LightBurnLibrary>` + "\n")

	// Set headers for file download
	filename := "LASERSCRIBED.CLB"
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Header("Content-Type", "application/xml")
	c.Data(http.StatusOK, "application/xml", []byte(xmlBuilder.String()))
}

// =====================
// HELPERS
// =====================

func nullString(v *string) sql.NullString {
	if v == nil || *v == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: *v, Valid: true}
}

func nullBool(v *bool) sql.NullBool {
	if v == nil {
		return sql.NullBool{}
	}
	return sql.NullBool{Bool: *v, Valid: true}
}

func nullInt32(v *int32) sql.NullInt32 {
	if v == nil {
		return sql.NullInt32{}
	}
	return sql.NullInt32{Int32: *v, Valid: true}
}

// =====================
// ADMIN HANDLERS
// =====================

func adminStatsHandler(c *gin.Context) {
	// Get overall stats
	stats, err := queries.GetAdminStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get top materials
	topMaterials, err := queries.GetTopMaterialsBySettings(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get settings by laser type
	laserTypeBreakdown, err := queries.GetSettingsByLaserType(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"totalUsers":         stats.TotalUsers,
		"verifiedUsers":      stats.VerifiedUsers,
		"usersThisWeek":      stats.UsersThisWeek,
		"totalSettings":      stats.TotalSettings,
		"settingsThisWeek":   stats.SettingsThisWeek,
		"totalVotes":         stats.TotalVotes,
		"votesThisWeek":      stats.VotesThisWeek,
		"topMaterials":       topMaterials,
		"laserTypeBreakdown": laserTypeBreakdown,
	})
}

func adminUsersHandler(c *gin.Context) {
	// Parse pagination params
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// Parse search param
	search := c.Query("search")
	var searchParam sql.NullString
	if search != "" {
		searchParam = sql.NullString{String: search, Valid: true}
	}

	// Get users
	users, err := queries.GetAllUsersAdmin(c.Request.Context(), db.GetAllUsersAdminParams{
		Search: searchParam,
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get total count
	count, err := queries.GetUserCountAdmin(c.Request.Context(), db.GetUserCountAdminParams{
		Search: searchParam,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Transform users to flatten sql.Null types
	usersResponse := make([]map[string]interface{}, len(users))
	for i, user := range users {
		displayName := ""
		if user.DisplayName.Valid {
			displayName = user.DisplayName.String
		}
		createdAt := ""
		if user.CreatedAt.Valid {
			createdAt = user.CreatedAt.Time.Format(time.RFC3339)
		}
		usersResponse[i] = map[string]interface{}{
			"id":            user.ID,
			"firstName":     user.FirstName,
			"lastName":      user.LastName,
			"email":         user.Email,
			"displayName":   displayName,
			"emailVerified": user.EmailVerified,
			"isAdmin":       user.IsAdmin,
			"createdAt":     createdAt,
			"settingCount":  user.SettingCount,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"users":  usersResponse,
		"total":  count,
		"limit":  limit,
		"offset": offset,
	})
}

func adminUserDetailHandler(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	user, err := queries.GetUserByIDAdmin(c.Request.Context(), int32(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// Get user's settings
	settings, err := queries.GetUserSettings(c.Request.Context(), int32(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":     user,
		"settings": settings,
	})
}

func adminSettingsHandler(c *gin.Context) {
	// Parse pagination params
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// Parse filter params
	var materialID sql.NullInt32
	if m := c.Query("material_id"); m != "" {
		if parsed, err := strconv.Atoi(m); err == nil {
			materialID = sql.NullInt32{Int32: int32(parsed), Valid: true}
		}
	}

	var laserType db.NullSettingsLaserType
	if lt := c.Query("laser_type"); lt != "" {
		laserType = db.NullSettingsLaserType{
			SettingsLaserType: db.SettingsLaserType(lt),
			Valid:             true,
		}
	}

	// Get settings
	settings, err := queries.GetAllSettingsAdmin(c.Request.Context(), db.GetAllSettingsAdminParams{
		MaterialID: materialID,
		LaserType:  laserType,
		Limit:      int32(limit),
		Offset:     int32(offset),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get total count
	count, err := queries.GetSettingsCountAdmin(c.Request.Context(), db.GetSettingsCountAdminParams{
		MaterialID: materialID,
		LaserType:  laserType,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Transform settings to flatten sql.Null types
	settingsResponse := make([]map[string]interface{}, len(settings))
	for i, setting := range settings {
		userDisplayName := ""
		if setting.UserDisplayName.Valid {
			userDisplayName = setting.UserDisplayName.String
		}
		createdAt := ""
		if setting.CreatedAt.Valid {
			createdAt = setting.CreatedAt.Time.Format(time.RFC3339)
		}
		settingsResponse[i] = map[string]interface{}{
			"id":              setting.ID,
			"userId":          setting.UserID,
			"materialId":      setting.MaterialID,
			"laserType":       string(setting.LaserType),
			"wattage":         setting.Wattage,
			"operationType":   string(setting.OperationType),
			"maxPower":        setting.MaxPower,
			"minPower":        setting.MinPower,
			"speed":           setting.Speed,
			"createdAt":       createdAt,
			"userEmail":       setting.UserEmail,
			"userDisplayName": userDisplayName,
			"materialName":    setting.MaterialName,
			"voteScore":       setting.VoteScore,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"settings": settingsResponse,
		"total":    count,
		"limit":    limit,
		"offset":   offset,
	})
}

type SetAdminRequest struct {
	IsAdmin bool `json:"isAdmin" binding:"required"`
}

func setUserAdminHandler(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var req SetAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the user's admin status
	_, err = dbConn.ExecContext(c.Request.Context(),
		"UPDATE users SET is_admin = ? WHERE id = ?", req.IsAdmin, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update admin status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "admin status updated"})
}
