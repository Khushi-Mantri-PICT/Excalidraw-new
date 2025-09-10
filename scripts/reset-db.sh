#!/bin/bash

echo "🔄 Resetting database and migrations..."

# Stop any running containers
docker-compose down -v

# Remove any orphaned containers
docker system prune -f

# Remove the problematic migration directory if it exists
rm -rf packages/db/prisma/migrations/20250910134746_init

echo "✅ Database reset complete. You can now run docker-compose up --build"