#!/bin/bash
# Nova Browser launcher script

cd "$(dirname "$0")" || exit 1

echo "🚀 Nova Browser Launcher"
echo "========================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --prefer-offline --no-audit 2>&1 | tail -5
fi

# Check if .bin directory exists
if [ ! -d "node_modules/.bin" ]; then
    echo "⚠️  .bin directory missing, rebuilding..."
    npm rebuild
fi

# Start in background
echo "🔧 Starting development environment..."
echo ""

# Kill any existing processes on port 5173 and 5173 (Vite)
pkill -f "vite" 2>/dev/null || true
sleep 1

# Try to start with npm run dev, with fallback
if command -v npm &> /dev/null; then
    npm run dev 2>&1
else
    echo "❌ npm not found"
    exit 1
fi
