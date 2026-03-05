-- Seed data for Laserscribe database
-- This populates material categories with common laser materials

USE laserscribe;

-- Clear existing data (in case we're re-seeding)
DELETE FROM material_aliases;
DELETE FROM materials;
DELETE FROM material_categories;

-- Insert material categories
INSERT INTO material_categories (name) VALUES
    ('Wood'),
    ('Acrylic'),
    ('Metal'),
    ('Leather'),
    ('Fabric'),
    ('Paper'),
    ('Cardboard'),
    ('Rubber'),
    ('Glass'),
    ('Stone'),
    ('Plastic'),
    ('Foam'),
    ('Other');

SELECT 'Material categories seeded successfully!' as status;
SELECT * FROM material_categories;
