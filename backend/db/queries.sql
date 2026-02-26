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

-- name: SearchMaterialsWithAliases :many
SELECT DISTINCT m.id, m.category_id, m.name, m.slug,
       c.name as category_name
FROM materials m
JOIN material_categories c ON m.category_id = c.id
LEFT JOIN material_aliases ma ON ma.material_id = m.id
WHERE m.name LIKE CONCAT('%', ?, '%')
   OR m.slug LIKE CONCAT('%', ?, '%')
   OR ma.alias LIKE CONCAT('%', ?, '%')
ORDER BY m.name
LIMIT 20;

-- name: GetAliasesByMaterial :many
SELECT id, material_id, alias
FROM material_aliases
WHERE material_id = ?
ORDER BY alias;

-- =====================
-- SETTINGS
-- =====================

-- name: GetSettingByID :one
SELECT s.id, s.user_id, s.material_id,
       s.laser_type, s.wattage, s.operation_type,
       s.max_power, s.min_power, s.max_power2, s.min_power2, s.speed,
       s.num_passes, s.z_offset, s.z_per_pass,
       s.scan_interval, s.angle, s.angle_per_pass,
       s.cross_hatch, s.bidir, s.scan_opt,
       s.flood_fill, s.auto_rotate, s.overscan, s.overscan_percent,
       s.frequency, s.wobble_enable, s.use_dot_correction,
       s.kerf, s.run_blower,
       s.layer_name, s.layer_subname,
       s.priority, s.tab_count, s.tab_count_max,
       s.notes, s.created_at, s.updated_at,
       u.username, u.display_name,
       mat.name as material_name, mc.name as category_name,
       COALESCE(SUM(v.value), 0) as vote_score,
       COUNT(v.id) as vote_count
FROM settings s
JOIN users u ON s.user_id = u.id
JOIN materials mat ON s.material_id = mat.id
JOIN material_categories mc ON mat.category_id = mc.id
LEFT JOIN votes v ON v.setting_id = s.id
WHERE s.id = ?
GROUP BY s.id;

-- name: SearchSettings :many
SELECT s.id, s.user_id, s.material_id,
       s.laser_type, s.wattage, s.operation_type,
       s.max_power, s.min_power, s.speed,
       s.num_passes, s.scan_interval, s.frequency,
       s.cross_hatch, s.angle, s.angle_per_pass,
       s.notes, s.created_at,
       u.username, u.display_name,
       mat.name as material_name, mc.name as category_name,
       COALESCE(SUM(v.value), 0) as vote_score,
       COUNT(v.id) as vote_count
FROM settings s
JOIN users u ON s.user_id = u.id
JOIN materials mat ON s.material_id = mat.id
JOIN material_categories mc ON mat.category_id = mc.id
LEFT JOIN votes v ON v.setting_id = s.id
WHERE (sqlc.narg(material_id) IS NULL OR s.material_id = sqlc.narg(material_id))
  AND (sqlc.narg(laser_type) IS NULL OR s.laser_type = sqlc.narg(laser_type))
  AND (sqlc.narg(wattage) IS NULL OR s.wattage = sqlc.narg(wattage))
  AND (sqlc.narg(operation_type) IS NULL OR s.operation_type = sqlc.narg(operation_type))
  AND (sqlc.narg(user_id) IS NULL OR s.user_id = sqlc.narg(user_id))
GROUP BY s.id
ORDER BY vote_score DESC, s.created_at DESC
LIMIT 50;

-- name: GetTopSettings :many
SELECT s.id, s.user_id, s.material_id,
       s.laser_type, s.wattage, s.operation_type,
       s.max_power, s.min_power, s.speed,
       s.num_passes, s.scan_interval, s.frequency,
       s.cross_hatch, s.angle, s.angle_per_pass,
       s.notes, s.created_at,
       u.username, u.display_name,
       mat.name as material_name, mc.name as category_name,
       COALESCE(SUM(v.value), 0) as vote_score,
       COUNT(v.id) as vote_count
FROM settings s
JOIN users u ON s.user_id = u.id
JOIN materials mat ON s.material_id = mat.id
JOIN material_categories mc ON mat.category_id = mc.id
LEFT JOIN votes v ON v.setting_id = s.id
GROUP BY s.id
ORDER BY vote_score DESC
LIMIT 20;

-- name: GetUserSettings :many
SELECT s.id, s.user_id, s.material_id,
       s.laser_type, s.wattage, s.operation_type,
       s.max_power, s.min_power, s.speed,
       s.num_passes, s.scan_interval, s.frequency,
       s.cross_hatch, s.angle, s.angle_per_pass,
       s.notes, s.created_at, s.updated_at,
       mat.name as material_name, mc.name as category_name,
       COALESCE(SUM(v.value), 0) as vote_score,
       COUNT(v.id) as vote_count
FROM settings s
JOIN materials mat ON s.material_id = mat.id
JOIN material_categories mc ON mat.category_id = mc.id
LEFT JOIN votes v ON v.setting_id = s.id
WHERE s.user_id = ?
GROUP BY s.id
ORDER BY s.created_at DESC;

-- name: CreateSetting :execresult
INSERT INTO settings (
    user_id, material_id, laser_type, wattage, operation_type,
    max_power, min_power, max_power2, min_power2, speed,
    num_passes, z_offset, z_per_pass,
    scan_interval, angle, angle_per_pass,
    cross_hatch, bidir, scan_opt,
    flood_fill, auto_rotate, overscan, overscan_percent,
    frequency, wobble_enable, use_dot_correction,
    kerf, run_blower,
    layer_name, layer_subname,
    priority, tab_count, tab_count_max,
    notes
) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?,
    ?, ?,
    ?, ?, ?,
    ?
);

-- name: UpdateSetting :exec
UPDATE settings SET
    max_power = ?, min_power = ?, max_power2 = ?, min_power2 = ?, speed = ?,
    num_passes = ?, z_offset = ?, z_per_pass = ?,
    scan_interval = ?, angle = ?, angle_per_pass = ?,
    cross_hatch = ?, bidir = ?, scan_opt = ?,
    flood_fill = ?, auto_rotate = ?, overscan = ?, overscan_percent = ?,
    frequency = ?, wobble_enable = ?, use_dot_correction = ?,
    kerf = ?, run_blower = ?,
    layer_name = ?, layer_subname = ?,
    priority = ?, tab_count = ?, tab_count_max = ?,
    notes = ?
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
