USE laserscribe;

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
('Food'),
('Plastic');

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
(4, 'Stainless Steel', 'stainless-steel'),
(4, 'Brass', 'brass'),
(4, 'Red Copper', 'red-copper'),
(4, 'Aluminum Sheet', 'aluminum-sheet'),
(4, 'Silver', 'silver'),
(4, 'Gold-plated Material', 'gold-plated-material'),
(4, 'Titanium', 'titanium'),
(4, 'Painted Metal', 'painted-metal'),
(4, 'Black Aluminum Cards', 'black-aluminum-cards'),
-- Glass
(5, 'Clear Glass', 'clear-glass'),
(5, 'Mirror', 'mirror'),
-- Paper & Cardboard
(6, 'Cardstock', 'cardstock'),
(6, 'Corrugated Cardboard', 'corrugated-cardboard'),
(6, 'Kraft Paper', 'kraft-paper'),
(6, 'Black-coated Paper', 'black-coated-paper'),
-- Fabric
(7, 'Cotton Fabric', 'cotton-fabric'),
(7, 'Denim', 'denim'),
(7, 'Canvas', 'canvas'),
-- Stone
(8, 'Slate', 'slate'),
(8, 'Marble Tile', 'marble-tile'),
(8, 'Slate Coasters', 'slate-coasters'),
-- Rubber
(9, 'Rubber Stamp Sheet', 'rubber-stamp-sheet'),
-- Food
(10, 'Chocolate', 'chocolate'),
(10, 'Bread/Toast', 'bread-toast'),
-- Plastic
(11, 'ABS', 'abs'),
(11, 'Black Acrylic', 'black-acrylic');

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
(21, 'Vinyl Leather'),
(23, 'Stainless'),
(23, 'SS'),
(41, 'Slate Tile');

-- Demo user (password: "demo123" - bcrypt hash)
INSERT INTO users (username, email, password_hash, display_name) VALUES
('demo', 'demo@laserscribe.io', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Demo User');

-- Sample settings: xTool D1 Pro 10W (Diode)
INSERT INTO settings (user_id, material_id, laser_type, wattage, operation_type, max_power, speed, num_passes, notes) VALUES
(1, 1, 'Diode', 10, 'Cut', 100, 3, 2, 'Clean cut through 3mm birch. Two passes recommended for consistent results.'),
(1, 1, 'Diode', 10, 'Scan', 40, 200, 1, 'Nice dark engrave on birch. 300 DPI gives good detail.'),
(1, 5, 'Diode', 10, 'Cut', 100, 4, 1, 'Basswood cuts easily in one pass at low speed.'),
(1, 5, 'Diode', 10, 'Scan', 30, 250, 1, 'Light engrave on basswood. Very clean results.');

-- Sample settings: Glowforge Pro (CO2 45W)
INSERT INTO settings (user_id, material_id, laser_type, wattage, operation_type, max_power, speed, num_passes, notes) VALUES
(1, 1, 'CO2', 45, 'Cut', 100, 150, 1, 'Proofgrade-equivalent settings for 3mm birch ply.'),
(1, 14, 'CO2', 45, 'Cut', 100, 170, 1, 'Clean cut through 3mm clear acrylic. Edges come out polished.'),
(1, 14, 'CO2', 45, 'Scan', 50, 300, 1, 'Frost engrave on clear acrylic. Looks great backlit.');

-- Sample settings: OmTech 60W (CO2)
INSERT INTO settings (user_id, material_id, laser_type, wattage, operation_type, max_power, speed, num_passes, notes) VALUES
(1, 1, 'CO2', 60, 'Cut', 60, 15, 1, 'Easy one-pass cut on 3mm birch at 60W CO2.'),
(1, 2, 'CO2', 60, 'Cut', 70, 10, 1, '6mm birch needs a bit more power. Check focus.'),
(1, 14, 'CO2', 60, 'Cut', 55, 12, 1, '3mm acrylic cuts cleanly. Flame-polished edges.'),
(1, 19, 'CO2', 60, 'Scan', 20, 250, 1, 'Beautiful engrave on veg tan leather. Low power is key.'),
(1, 32, 'CO2', 60, 'Scan', 15, 200, 1, 'Glass engrave. Cover with wet paper towel for cleaner results.');

-- Sample settings: Gweike G2 20W (Fiber) — from Gweike default library
INSERT INTO settings (user_id, material_id, laser_type, wattage, operation_type, max_power, speed, frequency, scan_interval, cross_hatch, angle, angle_per_pass, notes) VALUES
(1, 23, 'Fiber', 20, 'Cut', 70, 1000, 50000, NULL, FALSE, NULL, NULL, 'Gweike 20W default - Stainless Steel line'),
(1, 23, 'Fiber', 20, 'Scan', 75, 1000, 50000, 0.03, TRUE, 25, 15, 'Gweike 20W default - Stainless Steel fill'),
(1, 24, 'Fiber', 20, 'Cut', 90, 1000, 50000, NULL, FALSE, NULL, NULL, 'Gweike 20W default - Brass line'),
(1, 24, 'Fiber', 20, 'Scan', 90, 800, 50000, 0.03, TRUE, 25, 15, 'Gweike 20W default - Brass fill'),
(1, 26, 'Fiber', 20, 'Cut', 90, 800, 50000, NULL, FALSE, NULL, NULL, 'Gweike 20W default - Aluminum Sheet line'),
(1, 26, 'Fiber', 20, 'Scan', 75, 1000, 50000, 0.03, TRUE, 25, 15, 'Gweike 20W default - Aluminum Sheet fill');

-- Sample votes
INSERT INTO votes (user_id, setting_id, value) VALUES
(1, 1, 1),
(1, 2, 1),
(1, 5, 1),
(1, 6, 1),
(1, 8, 1);
