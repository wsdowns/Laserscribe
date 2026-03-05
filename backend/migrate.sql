-- Migration: Update to first_name/last_name and email verification
-- Date: 2026-03-05

USE laserscribe;

-- Backup users table
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Check if migration needed
SET @column_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'laserscribe' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username');

-- Add new columns if they don't exist
SET @query = IF(@column_exists > 0,
    'ALTER TABLE users
        ADD COLUMN IF NOT EXISTS first_name VARCHAR(50) AFTER id,
        ADD COLUMN IF NOT EXISTS last_name VARCHAR(50) AFTER first_name',
    'SELECT "Migration already applied" AS status');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrate username data to first_name/last_name
UPDATE users
SET first_name = COALESCE(first_name, SUBSTRING_INDEX(username, ' ', 1)),
    last_name = COALESCE(last_name, COALESCE(NULLIF(SUBSTRING_INDEX(username, ' ', -1), SUBSTRING_INDEX(username, ' ', 1)), ''))
WHERE @column_exists > 0;

-- Make columns NOT NULL
SET @query = IF(@column_exists > 0,
    'ALTER TABLE users
        MODIFY first_name VARCHAR(50) NOT NULL,
        MODIFY last_name VARCHAR(50) NOT NULL',
    'SELECT "Columns already updated" AS status');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop username column
SET @query = IF(@column_exists > 0,
    'ALTER TABLE users DROP COLUMN username',
    'SELECT "Username column already removed" AS status');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add new settings columns (safe - uses IF NOT EXISTS equivalent)
ALTER TABLE settings
    ADD COLUMN IF NOT EXISTS perforation_mode BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS enable_dot_width_adjust BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS dot_width DECIMAL(8,4),
    ADD COLUMN IF NOT EXISTS image_mode VARCHAR(50),
    ADD COLUMN IF NOT EXISTS negative_image BOOLEAN NOT NULL DEFAULT FALSE;

-- Drop unique constraint if it exists
SET @index_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'laserscribe' AND TABLE_NAME = 'settings' AND INDEX_NAME = 'uq_user_material_op_laser');

SET @query = IF(@index_exists > 0,
    'ALTER TABLE settings DROP INDEX uq_user_material_op_laser',
    'SELECT "Index already removed" AS status');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed successfully!' AS status;
