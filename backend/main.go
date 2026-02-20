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

	// Brands & Models
	r.GET("/api/brands", getBrandsHandler)
	r.GET("/api/brands/:id/models", getModelsByBrandHandler)

	// Materials
	r.GET("/api/materials", getMaterialsHandler)
	r.GET("/api/materials/:id/aliases", getAliasesHandler)
	r.GET("/api/categories", getCategoriesHandler)

	// Operations
	r.GET("/api/operations", getOperationsHandler)

	// Settings (PowerScale)
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
// BRAND & MODEL HANDLERS
// =====================

func getBrandsHandler(c *gin.Context) {
	brands, err := queries.GetAllBrands(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, brands)
}

func getModelsByBrandHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid brand id"})
		return
	}
	models, err := queries.GetModelsByBrand(c.Request.Context(), int32(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, models)
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
// OPERATION HANDLERS
// =====================

func getOperationsHandler(c *gin.Context) {
	operations, err := queries.GetAllOperations(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, operations)
}

// =====================
// SETTINGS HANDLERS
// =====================

func searchSettingsHandler(c *gin.Context) {
	params := db.SearchSettingsParams{}

	if v := c.Query("machine_model_id"); v != "" {
		id, _ := strconv.Atoi(v)
		params.MachineModelID = sql.NullInt32{Int32: int32(id), Valid: true}
	}
	if v := c.Query("material_id"); v != "" {
		id, _ := strconv.Atoi(v)
		params.MaterialID = sql.NullInt32{Int32: int32(id), Valid: true}
	}
	if v := c.Query("operation_id"); v != "" {
		id, _ := strconv.Atoi(v)
		params.OperationID = sql.NullInt32{Int32: int32(id), Valid: true}
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
	MachineModelID int32  `json:"machineModelId" binding:"required"`
	MaterialID     int32  `json:"materialId" binding:"required"`
	OperationID    int32  `json:"operationId" binding:"required"`
	Power          int32  `json:"power" binding:"required"`
	Speed          int32  `json:"speed" binding:"required"`
	Passes         int32  `json:"passes"`
	Frequency      *int32 `json:"frequency"`
	DPI            *int32 `json:"dpi"`
	Notes          string `json:"notes"`
}

func createSettingHandler(c *gin.Context) {
	userID := c.GetInt("user_id")
	var req CreateSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	passes := req.Passes
	if passes == 0 {
		passes = 1
	}

	freq := sql.NullInt32{}
	if req.Frequency != nil {
		freq = sql.NullInt32{Int32: *req.Frequency, Valid: true}
	}
	dpi := sql.NullInt32{}
	if req.DPI != nil {
		dpi = sql.NullInt32{Int32: *req.DPI, Valid: true}
	}

	result, err := queries.CreateSetting(c.Request.Context(), db.CreateSettingParams{
		UserID:         int32(userID),
		MachineModelID: req.MachineModelID,
		MaterialID:     req.MaterialID,
		OperationID:    req.OperationID,
		Power:          req.Power,
		Speed:          req.Speed,
		Passes:         passes,
		Frequency:      freq,
		Dpi:            dpi,
		Notes:          sql.NullString{String: req.Notes, Valid: req.Notes != ""},
	})
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate") {
			c.JSON(http.StatusConflict, gin.H{"error": "you already have a setting for this machine/material/operation combination"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

type UpdateSettingRequest struct {
	Power     int32  `json:"power" binding:"required"`
	Speed     int32  `json:"speed" binding:"required"`
	Passes    int32  `json:"passes"`
	Frequency *int32 `json:"frequency"`
	DPI       *int32 `json:"dpi"`
	Notes     string `json:"notes"`
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

	passes := req.Passes
	if passes == 0 {
		passes = 1
	}

	freq := sql.NullInt32{}
	if req.Frequency != nil {
		freq = sql.NullInt32{Int32: *req.Frequency, Valid: true}
	}
	dpi := sql.NullInt32{}
	if req.DPI != nil {
		dpi = sql.NullInt32{Int32: *req.DPI, Valid: true}
	}

	err = queries.UpdateSetting(c.Request.Context(), db.UpdateSettingParams{
		Power:     req.Power,
		Speed:     req.Speed,
		Passes:    passes,
		Frequency: freq,
		Dpi:       dpi,
		Notes:     sql.NullString{String: req.Notes, Valid: req.Notes != ""},
		ID:        int32(settingID),
		UserID:    int32(userID),
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
