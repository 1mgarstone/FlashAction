#!/bin/bash

echo "🔥 Starting APK build process..."

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "❌ app.json not found. Make sure you're in the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Clear any cached builds
echo "🧹 Clearing build cache..."
npx expo r -c
rm -rf .expo/
rm -rf node_modules/.cache/

# Fix expo-dev-client plugin issue
echo "🔧 Fixing expo-dev-client configuration..."
npm uninstall expo-dev-client
npm install expo-dev-client@latest --legacy-peer-deps

# Prebuild Android with clean slate
echo "🏗️ Prebuild Android project..."
npx expo prebuild --platform android --clean

# Build APK using EAS Build
echo "🚀 Building standalone APK with EAS..."
npx eas build --platform android --profile standalone --local

# Copy APK to accessible location
echo "📂 Copying APK to project root..."
find . -name "*.apk" -exec cp {} ./arbitrage-trading.apk \; 2>/dev/null

if [ -f "./arbitrage-trading.apk" ]; then
    echo "✅ APK build complete!"
    echo "📱 APK saved as: arbitrage-trading.apk"
    ls -la arbitrage-trading.apk
else
    echo "⚠️ APK not found locally, check EAS build status"
    npx eas build:list --limit=1
fi