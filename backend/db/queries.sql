-- =====================
-- USERS
-- =====================

-- name: GetUserByID :one
SELECT id, username, email, password_hash, display_name, created_at
FROM users
WHERE id = ?;

-- name: GetUserByUsername :one
SELECT id, username, email, password_hash, display_name, created_at
FROM users
WHERE username = ?;

-- name: GetUserByEmail :one
SELECT id, username, email, password_hash, display_name, created_at
FROM users
WHERE email = ?;

-- name: CreateUser :execresult
INSERT INTO users (username, email, password_hash, display_name)
VALUES (?, ?, ?, ?);

-- =====================
-- MACHINE BRANDS
-- =====================

-- name: GetAllBrands :many
SELECT id, name, slug
FROM machine_brands
ORDER BY name;

-- name: GetBrandByID :one
SELECT id, name, slug
FROM machine_brands
WHERE id = ?;

-- =====================
-- MACHINE MODELS
-- =====================

-- name: GetModelsByBrand :many
SELECT id, brand_id, name, laser_type, wattage, slug
FROM machine_models
WHERE brand_id = ?
ORDER BY name;

-- name: GetModelByID :one
SELECT id, brand_id, name, laser_type, wattage, slug
FROM machine_models
WHERE id = ?;

-- name: GetAllModels :many
SELECT m.id, m.brand_id, m.name, m.laser_type, m.wattage, m.slug,
       b.name as brand_name
FROM machine_models m
JOIN machine_brands b ON m.brand_id = b.id
ORDER BY b.name, m.name;

-- =====================
-- MATERIAL CATEGORIES
-- =====================

-- name: GetAllCategories :many
SELECT id, name
FROM material_categories
ORDER BY name;

-- =====================
-- MATERIALS
-- =====================

-- name: GetAllMaterials :many
SELECT m.id, m.category_id, m.name, m.slug,
       c.name as category_name
FROM materials m
JOIN material_categories c ON m.category_id = c.id
ORDER BY c.name, m.name;

-- name: GetMaterialsByCategory :many
SELECT id, category_id, name, slug
FROM materials
WHERE category_id = ?
ORDER BY name;

-- name: GetMaterialByID :one
SELECT m.id, m.category_id, m.name, m.slug,
       c.name as category_name
FROM materials m
JOIN material_categories c ON m.category_id = c.id
WHERE m.id = ?;

-- name: SearchMaterials :many
SELECT m.id, m.category_id, m.name, m.slug,
       c.name as category_name
FROM materials m
JOIN material_categories c ON m.category_id = c.id
WHERE m.name LIKE CONCAT('%', ?, '%')
   OR m.slug LIKE CONCAT('%', ?, '%')
ORDER BY m.name
LIMIT 20;

-- name: GetAliasesByMaterial :many
SELECT id, material_id, alias
FROM material_aliases
WHERE material_id = ?
ORDER BY alias;

-- =====================
-- OPERATIONS
-- =====================

-- name: GetAllOperations :many
SELECT id, name
FROM operations
ORDER BY name;

-- =====================
-- SETTINGS
-- =====================

-- name: GetSettingByID :one
SELECT s.id, s.user_id, s.machine_model_id, s.material_id, s.operation_id,
       s.power, s.speed, s.passes, s.frequency, s.dpi, s.notes,
       s.created_at, s.updated_at,
       u.username, u.display_name,
       mm.name as model_name, mb.name as brand_name,
       mat.name as material_name, mc.name as category_name,
       op.name as operation_name,
       COALESCE(SUM(v.value), 0) as vote_score,
       COUNT(v.id) as vote_count
FROM settings s
JOIN users u ON s.user_id = u.id
JOIN machine_models mm ON s.machine_model_id = mm.id
JOIN machine_brands mb ON mm.brand_id = mb.id
JOIN materials mat ON s.material_id = mat.id
JOIN material_categories mc ON mat.category_id = mc.id
JOIN operations op ON s.operation_id = op.id
LEFT JOIN votes v ON v.setting_id = s.id
WHERE s.id = ?
GROUP BY s.id, s.user_id, s.machine_model_id, s.material_id, s.operation_id,
         s.power, s.speed, s.passes, s.frequency, s.dpi, s.notes,
         s.created_at, s.updated_at,
         u.username, u.display_name,
         mm.name, mb.name, mat.name, mc.name, op.name;

-- name: SearchSettings :many
SELECT s.id, s.user_id, s.machine_model_id, s.material_id, s.operation_id,
       s.power, s.speed, s.passes, s.frequency, s.dpi, s.notes,
       s.created_at, s.updated_at,
       u.username, u.display_name,
       mm.name as model_name, mb.name as brand_name,
       mat.name as material_name, mc.name as category_name,
       op.name as operation_name,
       COALESCE(SUM(v.value), 0) as vote_score,
       COUNT(v.id) as vote_count
FROM settings s
JOIN users u ON s.user_id = u.id
JOIN machine_models mm ON s.machine_model_id = mm.id
JOIN machine_brands mb ON mm.brand_id = mb.id
JOIN materials mat ON s.material_id = mat.id
JOIN material_categories mc ON mat.category_id = mc.id
JOIN operations op ON s.operation_id = op.id
LEFT JOIN votes v ON v.setting_id = s.id
WHERE (sqlc.narg(machine_model_id) IS NULL OR s.machine_model_id = sqlc.narg(machine_model_id))
  AND (sqlc.narg(material_id) IS NULL OR s.material_id = sqlc.narg(material_id))
  AND (sqlc.narg(operation_id) IS NULL OR s.operation_id = sqlc.narg(operation_id))
GROUP BY s.id, s.user_id, s.machine_model_id, s.material_id, s.operation_id,
         s.power, s.speed, s.passes, s.frequency, s.dpi, s.notes,
         s.created_at, s.updated_at,
         u.username, u.display_name,
         mm.name, mb.name, mat.name, mc.name, op.name
ORDER BY vote_score DESC, s.created_at DESC
LIMIT 50;

-- name: GetTopSettings :many
SELECT s.id, s.user_id, s.machine_model_id, s.material_id, s.operation_id,
       s.power, s.speed, s.passes, s.frequency, s.dpi, s.notes,
       s.created_at, s.updated_at,
       u.username, u.display_name,
       mm.name as model_name, mb.name as brand_name,
       mat.name as material_name, mc.name as category_name,
       op.name as operation_name,
       COALESCE(SUM(v.value), 0) as vote_score,
       COUNT(v.id) as vote_count
FROM settings s
JOIN users u ON s.user_id = u.id
JOIN machine_models mm ON s.machine_model_id = mm.id
JOIN machine_brands mb ON mm.brand_id = mb.id
JOIN materials mat ON s.material_id = mat.id
JOIN material_categories mc ON mat.category_id = mc.id
JOIN operations op ON s.operation_id = op.id
LEFT JOIN votes v ON v.setting_id = s.id
GROUP BY s.id, s.user_id, s.machine_model_id, s.material_id, s.operation_id,
         s.power, s.speed, s.passes, s.frequency, s.dpi, s.notes,
         s.created_at, s.updated_at,
         u.username, u.display_name,
         mm.name, mb.name, mat.name, mc.name, op.name
ORDER BY vote_score DESC
LIMIT 20;

-- name: GetUserSettings :many
SELECT s.id, s.user_id, s.machine_model_id, s.material_id, s.operation_id,
       s.power, s.speed, s.passes, s.frequency, s.dpi, s.notes,
       s.created_at, s.updated_at,
       mm.name as model_name, mb.name as brand_name,
       mat.name as material_name, mc.name as category_name,
       op.name as operation_name,
       COALESCE(SUM(v.value), 0) as vote_score,
       COUNT(v.id) as vote_count
FROM settings s
JOIN machine_models mm ON s.machine_model_id = mm.id
JOIN machine_brands mb ON mm.brand_id = mb.id
JOIN materials mat ON s.material_id = mat.id
JOIN material_categories mc ON mat.category_id = mc.id
JOIN operations op ON s.operation_id = op.id
LEFT JOIN votes v ON v.setting_id = s.id
WHERE s.user_id = ?
GROUP BY s.id, s.user_id, s.machine_model_id, s.material_id, s.operation_id,
         s.power, s.speed, s.passes, s.frequency, s.dpi, s.notes,
         s.created_at, s.updated_at,
         mm.name, mb.name, mat.name, mc.name, op.name
ORDER BY s.created_at DESC;

-- name: CreateSetting :execresult
INSERT INTO settings (user_id, machine_model_id, material_id, operation_id, power, speed, passes, frequency, dpi, notes)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: UpdateSetting :exec
UPDATE settings
SET power = ?, speed = ?, passes = ?, frequency = ?, dpi = ?, notes = ?
WHERE id = ? AND user_id = ?;

-- name: DeleteSetting :exec
DELETE FROM settings
WHERE id = ? AND user_id = ?;

-- =====================
-- VOTES
-- =====================

-- name: GetUserVoteForSetting :one
SELECT id, user_id, setting_id, value, created_at
FROM votes
WHERE user_id = ? AND setting_id = ?;

-- name: UpsertVote :exec
INSERT INTO votes (user_id, setting_id, value)
VALUES (?, ?, ?)
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- name: DeleteVote :exec
DELETE FROM votes
WHERE user_id = ? AND setting_id = ?;

-- name: GetVoteScore :one
SELECT COALESCE(SUM(value), 0) as score, COUNT(id) as total
FROM votes
WHERE setting_id = ?;
