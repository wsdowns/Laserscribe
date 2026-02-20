CREATE DATABASE IF NOT EXISTS laserscribe;
USE laserscribe;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE machine_brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE machine_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    laser_type ENUM('CO2', 'Diode', 'Fiber') NOT NULL,
    wattage INT NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    FOREIGN KEY (brand_id) REFERENCES machine_brands(id) ON DELETE CASCADE
);

CREATE TABLE material_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    FOREIGN KEY (category_id) REFERENCES material_categories(id) ON DELETE CASCADE
);

CREATE TABLE material_aliases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    alias VARCHAR(200) NOT NULL,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

CREATE TABLE operations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    machine_model_id INT NOT NULL,
    material_id INT NOT NULL,
    operation_id INT NOT NULL,
    power INT NOT NULL,
    speed INT NOT NULL,
    passes INT NOT NULL DEFAULT 1,
    frequency INT,
    dpi INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (machine_model_id) REFERENCES machine_models(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_machine_material_op (user_id, machine_model_id, material_id, operation_id)
);

CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    setting_id INT NOT NULL,
    value TINYINT NOT NULL CHECK (value IN (-1, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (setting_id) REFERENCES settings(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_setting_vote (user_id, setting_id)
);

CREATE INDEX idx_settings_machine ON settings(machine_model_id);
CREATE INDEX idx_settings_material ON settings(material_id);
CREATE INDEX idx_settings_operation ON settings(operation_id);
CREATE INDEX idx_settings_user ON settings(user_id);
CREATE INDEX idx_votes_setting ON votes(setting_id);
CREATE INDEX idx_materials_category ON materials(category_id);
CREATE INDEX idx_models_brand ON machine_models(brand_id);
CREATE INDEX idx_aliases_material ON material_aliases(material_id);
