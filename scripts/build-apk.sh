
#!/bin/bash

echo "🚀 Building APK for Arbitrage Trading Mobile App"
echo "=============================================="

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

# Login to Expo (if not already logged in)
echo "🔐 Checking Expo authentication..."
eas whoami || eas login

# Build the APK
echo "🔨 Building APK..."
eas build --platform android --profile preview --non-interactive

echo "✅ APK build initiated!"
echo ""
echo "📱 Your APK will be available for download once the build completes."
echo "🔗 Check the build status at: https://expo.dev/accounts/[your-account]/projects/arbitrage-trading-mobile/builds"
echo ""
echo "💡 To install the APK on your device:"
echo "   1. Download the APK from the Expo dashboard"
echo "   2. Enable 'Install from Unknown Sources' on your Android device"
echo "   3. Install the APK file"
echo ""
echo "⚠️  Note: This is a development build. For production, use the 'production' profile."
#!/bin/bash

echo "🔨 Building Android APK..."
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Android directory exists
if [ ! -d "android" ]; then
    echo "❌ Error: Android directory not found. Please ensure the Android setup is complete."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate debug keystore if not exists
if [ ! -f "android/app/debug.keystore" ]; then
    echo "🔐 Generating debug keystore..."
    keytool -genkey -v -keystore android/app/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean

# Build the release APK
echo "🏗️  Building release APK..."
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📱 APK Location:"
    echo "   $(pwd)/app/build/outputs/apk/release/app-release.apk"
    echo ""
    echo "📏 APK Size:"
    ls -lh app/build/outputs/apk/release/app-release.apk | awk '{print $5}'
    echo ""
    echo "🎯 To install:"
    echo "   1. Transfer the APK to your Android device"
    echo "   2. Enable 'Install from Unknown Sources' in Settings"
    echo "   3. Tap the APK file to install"
else
    echo ""
    echo "❌ Build failed!"
    echo "Check the error messages above for details."
    exit 1
fi
