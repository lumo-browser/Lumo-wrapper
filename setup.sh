#!/usr/bin/env bash
# Development Setup Script for Nova Browser

set -e

echo "🚀 Nova Browser Development Setup"
echo "=================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
echo ""
echo "📁 Creating project directories..."
mkdir -p src/{ai,browser,pages,components,hooks,services,store,core,utils,security,database,ui}
mkdir -p tests/{unit,integration,e2e,fixtures}
mkdir -p docs

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "  1. npm run dev          - Start dev server"
echo "  2. npm test             - Run tests"
echo "  3. npm run build        - Build for production"
echo ""
echo "🌐 Browser: http://localhost:5173"
echo "📖 Docs: check docs/ folder"
