#!/bin/bash
set -e

# Database setup script for fresh deployment
# This will DROP and recreate the laserscribe database

DB_PASSWORD="${1:-}"

if [ -z "$DB_PASSWORD" ]; then
    echo "Usage: $0 <mysql-root-password>"
    exit 1
fi

echo "WARNING: This will DROP the existing laserscribe database!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo "Dropping existing database..."
sudo mysql -u root -p"$DB_PASSWORD" << 'EOF'
DROP DATABASE IF EXISTS laserscribe;
EOF

echo "Creating fresh database from schema..."
sudo mysql -u root -p"$DB_PASSWORD" < schema.sql

echo "Database setup complete!"
echo "Verifying tables..."
sudo mysql -u root -p"$DB_PASSWORD" -e "USE laserscribe; SHOW TABLES;"
