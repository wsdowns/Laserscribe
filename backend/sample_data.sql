USE laserscribe;

-- Machine Brands
INSERT INTO machine_brands (name, slug) VALUES
('xTool', 'xtool'),
('Glowforge', 'glowforge'),
('OmTech', 'omtech'),
('Ortur', 'ortur'),
('Atomstack', 'atomstack'),
('Thunder Laser', 'thunder-laser'),
('Boss Laser', 'boss-laser'),
('Epilog', 'epilog'),
('Full Spectrum', 'full-spectrum'),
('Creality', 'creality');

-- Machine Models
INSERT INTO machine_models (brand_id, name, laser_type, wattage, slug) VALUES
-- xTool
(1, 'xTool D1 Pro 10W', 'Diode', 10, 'xtool-d1-pro-10w'),
(1, 'xTool D1 Pro 20W', 'Diode', 20, 'xtool-d1-pro-20w'),
(1, 'xTool S1 40W', 'Diode', 40, 'xtool-s1-40w'),
(1, 'xTool P2 55W', 'CO2', 55, 'xtool-p2-55w'),
-- Glowforge
(2, 'Glowforge Basic', 'CO2', 40, 'glowforge-basic'),
(2, 'Glowforge Plus', 'CO2', 45, 'glowforge-plus'),
(2, 'Glowforge Pro', 'CO2', 45, 'glowforge-pro'),
-- OmTech
(3, 'OmTech 40W', 'CO2', 40, 'omtech-40w'),
(3, 'OmTech 50W', 'CO2', 50, 'omtech-50w'),
(3, 'OmTech 60W', 'CO2', 60, 'omtech-60w'),
(3, 'OmTech 80W', 'CO2', 80, 'omtech-80w'),
-- Ortur
(4, 'Ortur Laser Master 3', 'Diode', 10, 'ortur-laser-master-3'),
(4, 'Ortur Laser Master 3 LE', 'Diode', 5, 'ortur-laser-master-3-le'),
-- Atomstack
(5, 'Atomstack X20 Pro', 'Diode', 20, 'atomstack-x20-pro'),
(5, 'Atomstack X40 Pro', 'Diode', 40, 'atomstack-x40-pro'),
-- Thunder Laser
(6, 'Nova 35', 'CO2', 80, 'thunder-nova-35'),
(6, 'Nova 51', 'CO2', 100, 'thunder-nova-51'),
-- Boss Laser
(7, 'HP2440', 'CO2', 50, 'boss-hp2440'),
(7, 'LS-1420', 'CO2', 60, 'boss-ls-1420'),
-- Epilog
(8, 'Epilog Zing 16', 'CO2', 30, 'epilog-zing-16'),
(8, 'Epilog Fusion Pro 32', 'CO2', 60, 'epilog-fusion-pro-32'),
-- Full Spectrum
(9, 'Muse Core', 'CO2', 40, 'full-spectrum-muse-core'),
-- Creality
(10, 'Falcon2 22W', 'Diode', 22, 'creality-falcon2-22w'),
(10, 'Falcon2 40W', 'Diode', 40, 'creality-falcon2-40w');

-- Material Categories
INSERT INTO material_categories (name) VALUES
('Wood'),
('Acrylic'),
('Leather'),
('Metal'),
('Glass'),
('Paper & Cardboard'),
('Fabric'),
('Stone'),
('Rubber'),
('Food');

-- Materials
INSERT INTO materials (category_id, name, slug) VALUES
-- Wood
(1, '3mm Birch Plywood', '3mm-birch-plywood'),
(1, '6mm Birch Plywood', '6mm-birch-plywood'),
(1, '3mm MDF', '3mm-mdf'),
(1, '6mm MDF', '6mm-mdf'),
(1, '3mm Basswood', '3mm-basswood'),
(1, '6mm Basswood', '6mm-basswood'),
(1, 'Bamboo', 'bamboo'),
(1, 'Cherry Hardwood', 'cherry-hardwood'),
(1, 'Maple Hardwood', 'maple-hardwood'),
(1, 'Walnut Hardwood', 'walnut-hardwood'),
(1, 'Red Oak', 'red-oak'),
(1, 'Pine', 'pine'),
(1, 'Cork Sheet', 'cork-sheet'),
-- Acrylic
(2, '3mm Clear Acrylic', '3mm-clear-acrylic'),
(2, '3mm Black Acrylic', '3mm-black-acrylic'),
(2, '3mm Colored Acrylic', '3mm-colored-acrylic'),
(2, '6mm Clear Acrylic', '6mm-clear-acrylic'),
(2, '6mm Black Acrylic', '6mm-black-acrylic'),
-- Leather
(3, 'Vegetable Tanned Leather (2-3oz)', 'veg-tan-leather-2-3oz'),
(3, 'Vegetable Tanned Leather (4-5oz)', 'veg-tan-leather-4-5oz'),
(3, 'Faux Leather / Leatherette', 'faux-leather'),
-- Metal
(4, 'Anodized Aluminum', 'anodized-aluminum'),
(4, 'Stainless Steel (with marking spray)', 'stainless-steel-marking'),
(4, 'Painted Metal', 'painted-metal'),
-- Glass
(5, 'Clear Glass', 'clear-glass'),
(5, 'Mirror', 'mirror'),
-- Paper & Cardboard
(6, 'Cardstock', 'cardstock'),
(6, 'Corrugated Cardboard', 'corrugated-cardboard'),
(6, 'Kraft Paper', 'kraft-paper'),
-- Fabric
(7, 'Cotton Fabric', 'cotton-fabric'),
(7, 'Denim', 'denim'),
(7, 'Canvas', 'canvas'),
-- Stone
(8, 'Slate', 'slate'),
(8, 'Marble Tile', 'marble-tile'),
-- Rubber
(9, 'Rubber Stamp Sheet', 'rubber-stamp-sheet'),
-- Food
(10, 'Chocolate', 'chocolate'),
(10, 'Bread/Toast', 'bread-toast');

-- Material Aliases
INSERT INTO material_aliases (material_id, alias) VALUES
(1, '1/8 Inch Birch Plywood'),
(1, 'Baltic Birch Plywood 3mm'),
(1, '1/8" Ply'),
(2, '1/4 Inch Birch Plywood'),
(2, 'Baltic Birch 6mm'),
(3, '1/8 Inch MDF'),
(4, '1/4 Inch MDF'),
(5, '1/8 Inch Basswood'),
(5, 'Basswood Sheet 3mm'),
(6, '1/4 Inch Basswood'),
(14, '1/8 Inch Clear Acrylic'),
(14, 'Cast Acrylic 3mm'),
(17, '1/4 Inch Clear Acrylic'),
(19, 'Veg Tan Leather'),
(19, 'Tooling Leather 2-3oz'),
(21, 'Pleather'),
(21, 'Vinyl Leather');

-- Operations
INSERT INTO operations (name) VALUES
('Cut'),
('Engrave'),
('Score'),
('Fill Engrave'),
('Line Engrave');

-- Demo user (password: "demo123" - bcrypt hash)
INSERT INTO users (username, email, password_hash, display_name) VALUES
('demo', 'demo@laserscribe.io', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Demo User');

-- Sample settings
INSERT INTO settings (user_id, machine_model_id, material_id, operation_id, power, speed, passes, dpi, notes) VALUES
-- xTool D1 Pro 10W - Wood cuts/engraves
(1, 1, 1, 1, 100, 3, 2, NULL, 'Clean cut through 3mm birch. Two passes recommended for consistent results.'),
(1, 1, 1, 2, 40, 200, 1, 300, 'Nice dark engrave on birch. 300 DPI gives good detail.'),
(1, 1, 5, 1, 100, 4, 1, NULL, 'Basswood cuts easily in one pass at low speed.'),
(1, 1, 5, 2, 30, 250, 1, 254, 'Light engrave on basswood. Very clean results.'),
-- Glowforge Pro - Various
(1, 7, 1, 1, 100, 150, 1, NULL, 'Proofgrade-equivalent settings for 3mm birch ply.'),
(1, 7, 14, 1, 100, 170, 1, NULL, 'Clean cut through 3mm clear acrylic. Edges come out polished.'),
(1, 7, 14, 2, 50, 300, 1, 340, 'Frost engrave on clear acrylic. Looks great backlit.'),
-- OmTech 60W - CO2
(1, 10, 1, 1, 60, 15, 1, NULL, 'Easy one-pass cut on 3mm birch at 60W CO2.'),
(1, 10, 2, 1, 70, 10, 1, NULL, '6mm birch needs a bit more power. Check focus.'),
(1, 10, 14, 1, 55, 12, 1, NULL, '3mm acrylic cuts cleanly. Flame-polished edges.'),
(1, 10, 19, 2, 20, 250, 1, 300, 'Beautiful engrave on veg tan leather. Low power is key.'),
(1, 10, 25, 2, 15, 200, 1, 300, 'Glass engrave. Cover with wet paper towel for cleaner results.');

-- Sample votes
INSERT INTO votes (user_id, setting_id, value) VALUES
(1, 1, 1),
(1, 2, 1),
(1, 5, 1),
(1, 6, 1),
(1, 8, 1);
