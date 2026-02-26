CREATE DATABASE IF NOT EXISTS laserscribe;
USE laserscribe;

-- =============================================================================
-- USERS
-- =============================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- MATERIAL CATEGORIES
-- =============================================================================
CREATE TABLE material_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- =============================================================================
-- MATERIALS
-- =============================================================================
CREATE TABLE materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    FOREIGN KEY (category_id) REFERENCES material_categories(id) ON DELETE CASCADE
);

-- =============================================================================
-- MATERIAL ALIASES
-- =============================================================================
CREATE TABLE material_aliases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    alias VARCHAR(200) NOT NULL,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- =============================================================================
-- SETTINGS
--
-- Stores laser cut/engrave parameters mapped 1:1 to LightBurn .clb CutSetting
-- fields. Decoupled from machine models — laser_type and wattage are stored
-- directly so .clb imports don't require picking a specific machine.
--
-- operation_type maps to LightBurn CutSetting type attribute:
--   'Cut'     = type="Cut"      (Line mode)
--   'Scan'    = type="Scan"     (Fill mode)
--   'ScanCut' = type="Scan+Cut" (Fill+Line mode)
-- =============================================================================
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Attribution
    user_id INT NOT NULL,
    material_id INT NOT NULL,

    -- Laser identification (decoupled from machine models)
    laser_type ENUM('CO2', 'Fiber', 'Diode', 'UV', 'Infrared') NOT NULL,
    wattage INT NOT NULL,

    -- Operation type (maps to CutSetting type attribute)
    operation_type ENUM('Cut', 'Scan', 'ScanCut') NOT NULL,

    -- Core power/speed
    max_power DECIMAL(7,3) NOT NULL,
    min_power DECIMAL(7,3) NOT NULL DEFAULT 0,
    max_power2 DECIMAL(7,3),
    min_power2 DECIMAL(7,3),
    speed DECIMAL(10,3) NOT NULL,

    -- Passes and Z-axis
    num_passes INT NOT NULL DEFAULT 1,
    z_offset DECIMAL(8,3),
    z_per_pass DECIMAL(8,3),

    -- Scan / Fill parameters
    scan_interval DECIMAL(8,4),
    angle DECIMAL(7,3),
    angle_per_pass DECIMAL(7,3),
    cross_hatch BOOLEAN NOT NULL DEFAULT FALSE,
    bidir BOOLEAN NOT NULL DEFAULT TRUE,
    scan_opt VARCHAR(50),
    flood_fill BOOLEAN NOT NULL DEFAULT FALSE,
    auto_rotate BOOLEAN NOT NULL DEFAULT FALSE,
    overscan DECIMAL(8,3),
    overscan_percent DECIMAL(7,3),

    -- Fiber / Galvo specific
    frequency DECIMAL(12,3),
    wobble_enable BOOLEAN,
    use_dot_correction BOOLEAN,

    -- Cut / Line specific
    kerf DECIMAL(8,4),
    run_blower BOOLEAN,

    -- Layer naming
    layer_name VARCHAR(200),
    layer_subname VARCHAR(200),

    -- Meta / ordering
    priority INT,
    tab_count INT,
    tab_count_max INT,

    -- User notes (not from CLB)
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,

    -- One setting per user per material+operation+laser combo
    UNIQUE KEY uq_user_material_op_laser (user_id, material_id, operation_type, laser_type, wattage)
);

-- =============================================================================
-- VOTES
-- =============================================================================
CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    setting_id INT NOT NULL,
    value TINYINT NOT NULL CHECK (value IN (-1, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (setting_id) REFERENCES settings(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_setting_vote (user_id, setting_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Settings: primary search (material + laser config)
CREATE INDEX idx_settings_material_laser_watt ON settings(material_id, laser_type, wattage);

-- Settings: upload flow (all settings for my laser)
CREATE INDEX idx_settings_laser_watt ON settings(laser_type, wattage);

-- Settings: filter by individual columns
CREATE INDEX idx_settings_user ON settings(user_id);
CREATE INDEX idx_settings_operation_type ON settings(operation_type);

-- Settings: profile page (my settings, newest first)
CREATE INDEX idx_settings_user_created ON settings(user_id, created_at DESC);

-- Votes
CREATE INDEX idx_votes_setting ON votes(setting_id);

-- Materials
CREATE INDEX idx_materials_category ON materials(category_id);
CREATE INDEX idx_aliases_material ON material_aliases(material_id);

-- Full-text search for material name and aliases
ALTER TABLE materials ADD FULLTEXT INDEX ft_material_name (name);
ALTER TABLE material_aliases ADD FULLTEXT INDEX ft_alias (alias);
