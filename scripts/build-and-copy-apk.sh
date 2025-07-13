
#!/bin/bash

echo "🚀 Building APK and copying to root directory"
echo "============================================="

# Set variables
PROJECT_ROOT=$(pwd)
APK_NAME="arbitrage-trading-mobile.apk"

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Android directory exists
if [ ! -d "android" ]; then
    echo "❌ Error: Android directory not found"
    exit 1
fi

# Navigate to Android directory
cd android

# Generate release keystore if not exists
if [ ! -f "app/release.keystore" ]; then
    echo "🔐 Creating release keystore..."
    keytool -genkey -v -keystore app/release.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000 -storepass "Kx9mP2vN8qL5wE3rT7yU4iO6" -keypass "Kx9mP2vN8qL5wE3rT7yU4iO6" -dname "CN=MGProduct, OU=Development, O=Arbitrage Trading, L=San Francisco, S=CA, C=US"
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build the APK
echo "🔨 Building signed APK..."
./gradlew assembleRelease

# Check if build was successful
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ Build successful!"
    
    # Copy APK to root directory
    echo "📱 Copying APK to root directory..."
    cp app/build/outputs/apk/release/app-release.apk "$PROJECT_ROOT/$APK_NAME"
    
    # Make executable
    chmod +x "$PROJECT_ROOT/$APK_NAME"
    
    echo "📱 APK copied to: $PROJECT_ROOT/$APK_NAME"
    echo ""
    echo "🎯 APK is now available in the root directory!"
    echo "File: $APK_NAME"
    echo "Size: $(du -h "$PROJECT_ROOT/$APK_NAME" | cut -f1)"
    echo ""
    echo "📲 To install on your device:"
    echo "1. Download the APK file from the root directory"
    echo "2. Enable 'Install from Unknown Sources' on your Android device"
    echo "3. Install the APK file"
    
else
    echo "❌ Build failed! Check the logs above for errors."
    exit 1
fi

echo ""
echo "✅ Process completed successfully!"
