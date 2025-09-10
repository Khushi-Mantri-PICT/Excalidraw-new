#!/bin/bash

echo "🚀 Setting up development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd packages/db
pnpm run generate
cd ../..

# Reset and migrate database
echo "🗄️ Setting up database..."
cd packages/db
pnpm run migrate:reset
pnpm run migrate
cd ../..

echo "✅ Development setup complete!"
echo "🎯 You can now run: pnpm dev"