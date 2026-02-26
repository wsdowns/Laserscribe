package main

import (
	"database/sql"
	"laserscribe/backend/db"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

var queries *db.Queries
var dbConn *sql.DB

func main() {
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

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Auth
	r.POST("/api/register", registerHandler)
	r.POST("/api/login", loginHandler)

	// Materials
	r.GET("/api/materials", getMaterialsHandler)
	r.GET("/api/materials/:id/aliases", getAliasesHandler)
	r.GET("/api/categories", getCategoriesHandler)

	// Settings
	r.GET("/api/settings", searchSettingsHandler)
	r.GET("/api/settings/top", getTopSettingsHandler)
	r.GET("/api/settings/:id", getSettingHandler)
	r.POST("/api/settings", authMiddleware(), createSettingHandler)
	r.PUT("/api/settings/:id", authMiddleware(), updateSettingHandler)
	r.DELETE("/api/settings/:id", authMiddleware(), deleteSettingHandler)
	r.POST("/api/settings/:id/vote", authMiddleware(), voteHandler)

	// User profile
	r.GET("/api/profile/settings", authMiddleware(), getUserSettingsHandler)

	log.Println("Laserscribe API running on :8080")
	r.Run(":8080")
}

// =====================
// AUTH MIDDLEWARE
// =====================

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Simple token-based auth: Authorization: Bearer <user_id>
		// In production, use JWT. This is a scaffold placeholder.
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}
		token := strings.TrimPrefix(auth, "Bearer ")
		userID, err := strconv.Atoi(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}
		c.Set("user_id", int32(userID))
		c.Next()
	}
}

// =====================
// AUTH HANDLERS
// =====================

type RegisterRequest struct {
	Username    string `json:"username" binding:"required"`
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
		displayName = req.Username
	}

	result, err := queries.CreateUser(c.Request.Context(), db.CreateUserParams{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hash),
		DisplayName:  sql.NullString{String: displayName, Valid: true},
	})
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate") {
			c.JSON(http.StatusConflict, gin.H{"error": "username or email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{
		"id":          id,
		"username":    req.Username,
		"displayName": displayName,
		"token":       strconv.FormatInt(id, 10),
	})
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func loginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := queries.GetUserByUsername(c.Request.Context(), req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	displayName := ""
	if user.DisplayName.Valid {
		displayName = user.DisplayName.String
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          user.ID,
		"username":    user.Username,
		"displayName": displayName,
		"token":       strconv.FormatInt(int64(user.ID), 10),
	})
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
	MaterialID     int32   `json:"materialId" binding:"required"`
	LaserType      string  `json:"laserType" binding:"required"`
	Wattage        int32   `json:"wattage" binding:"required"`
	OperationType  string  `json:"operationType" binding:"required"`
	MaxPower       string  `json:"maxPower" binding:"required"`
	MinPower       string  `json:"minPower"`
	MaxPower2      *string `json:"maxPower2"`
	MinPower2      *string `json:"minPower2"`
	Speed          string  `json:"speed" binding:"required"`
	NumPasses      int32   `json:"numPasses"`
	ZOffset        *string `json:"zOffset"`
	ZPerPass       *string `json:"zPerPass"`
	ScanInterval   *string `json:"scanInterval"`
	Angle          *string `json:"angle"`
	AnglePerPass   *string `json:"anglePerPass"`
	CrossHatch     bool    `json:"crossHatch"`
	Bidir          *bool   `json:"bidir"`
	ScanOpt        *string `json:"scanOpt"`
	FloodFill      bool    `json:"floodFill"`
	AutoRotate     bool    `json:"autoRotate"`
	Overscan       *string `json:"overscan"`
	OverscanPercent *string `json:"overscanPercent"`
	Frequency      *string `json:"frequency"`
	WobbleEnable   *bool   `json:"wobbleEnable"`
	UseDotCorrection *bool `json:"useDotCorrection"`
	Kerf           *string `json:"kerf"`
	RunBlower      *bool   `json:"runBlower"`
	LayerName      *string `json:"layerName"`
	LayerSubname   *string `json:"layerSubname"`
	Priority       *int32  `json:"priority"`
	TabCount       *int32  `json:"tabCount"`
	TabCountMax    *int32  `json:"tabCountMax"`
	Notes          string  `json:"notes"`
}

func createSettingHandler(c *gin.Context) {
	userID := c.GetInt("user_id")
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
		UserID:           int32(userID),
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
		Frequency:        nullString(req.Frequency),
		WobbleEnable:     nullBool(req.WobbleEnable),
		UseDotCorrection: nullBool(req.UseDotCorrection),
		Kerf:             nullString(req.Kerf),
		RunBlower:        nullBool(req.RunBlower),
		LayerName:        nullString(req.LayerName),
		LayerSubname:     nullString(req.LayerSubname),
		Priority:         nullInt32(req.Priority),
		TabCount:         nullInt32(req.TabCount),
		TabCountMax:      nullInt32(req.TabCountMax),
		Notes:            sql.NullString{String: req.Notes, Valid: req.Notes != ""},
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
	MaxPower       string  `json:"maxPower" binding:"required"`
	MinPower       string  `json:"minPower"`
	MaxPower2      *string `json:"maxPower2"`
	MinPower2      *string `json:"minPower2"`
	Speed          string  `json:"speed" binding:"required"`
	NumPasses      int32   `json:"numPasses"`
	ZOffset        *string `json:"zOffset"`
	ZPerPass       *string `json:"zPerPass"`
	ScanInterval   *string `json:"scanInterval"`
	Angle          *string `json:"angle"`
	AnglePerPass   *string `json:"anglePerPass"`
	CrossHatch     bool    `json:"crossHatch"`
	Bidir          *bool   `json:"bidir"`
	ScanOpt        *string `json:"scanOpt"`
	FloodFill      bool    `json:"floodFill"`
	AutoRotate     bool    `json:"autoRotate"`
	Overscan       *string `json:"overscan"`
	OverscanPercent *string `json:"overscanPercent"`
	Frequency      *string `json:"frequency"`
	WobbleEnable   *bool   `json:"wobbleEnable"`
	UseDotCorrection *bool `json:"useDotCorrection"`
	Kerf           *string `json:"kerf"`
	RunBlower      *bool   `json:"runBlower"`
	LayerName      *string `json:"layerName"`
	LayerSubname   *string `json:"layerSubname"`
	Priority       *int32  `json:"priority"`
	TabCount       *int32  `json:"tabCount"`
	TabCountMax    *int32  `json:"tabCountMax"`
	Notes          string  `json:"notes"`
}

func updateSettingHandler(c *gin.Context) {
	userID := c.GetInt("user_id")
	settingID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid setting id"})
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
		Frequency:        nullString(req.Frequency),
		WobbleEnable:     nullBool(req.WobbleEnable),
		UseDotCorrection: nullBool(req.UseDotCorrection),
		Kerf:             nullString(req.Kerf),
		RunBlower:        nullBool(req.RunBlower),
		LayerName:        nullString(req.LayerName),
		LayerSubname:     nullString(req.LayerSubname),
		Priority:         nullInt32(req.Priority),
		TabCount:         nullInt32(req.TabCount),
		TabCountMax:      nullInt32(req.TabCountMax),
		Notes:            sql.NullString{String: req.Notes, Valid: req.Notes != ""},
		ID:               int32(settingID),
		UserID:           int32(userID),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func deleteSettingHandler(c *gin.Context) {
	userID := c.GetInt("user_id")
	settingID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid setting id"})
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
// VOTE HANDLER
// =====================

type VoteRequest struct {
	Value int8 `json:"value" binding:"required"`
}

func voteHandler(c *gin.Context) {
	userID := c.GetInt("user_id")
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
	userID := c.GetInt("user_id")
	settings, err := queries.GetUserSettings(c.Request.Context(), int32(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, settings)
}

// =====================
// HELPERS
// =====================

func nullString(v *string) sql.NullString {
	if v == nil {
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
