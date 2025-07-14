
#!/bin/bash

echo "🔨 Building COMPLETE LullaByte Trading APK with ALL components..."
echo "================================================================="

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "❌ app.json not found. Make sure you're in the project root."
    exit 1
fi

# Install all dependencies
echo "📦 Installing all dependencies..."
npm install --legacy-peer-deps

# Install critical native dependencies
echo "🏗️ Installing native dependencies..."
npm install react-native-vector-icons react-native-svg react-native-gesture-handler react-native-sound react-native-device-info --legacy-peer-deps

# Clear any cached builds
echo "🧹 Clearing build cache..."
npx expo r -c
rm -rf .expo/
rm -rf node_modules/.cache/
rm -rf android/app/build/

# Configure Android project
echo "⚙️ Configuring Android project..."
npx expo prebuild --platform android --clean

# Ensure Android permissions
echo "🔐 Setting up Android permissions..."
mkdir -p android/app/src/main/res/xml
cat > android/app/src/main/res/xml/network_security_config.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
EOF

# Build the complete APK
echo "📱 Building complete APK with full trading system..."
cd android

# Make gradlew executable
chmod +x gradlew

# Clean and build
echo "🔄 Cleaning previous builds..."
./gradlew clean

echo "🏗️ Building release APK..."
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Complete APK build successful!"
    echo ""
    echo "📱 APK Location:"
    APK_PATH="$(pwd)/app/build/outputs/apk/release/app-release.apk"
    echo "   $APK_PATH"
    echo ""
    echo "📏 APK Size:"
    ls -lh app/build/outputs/apk/release/app-release.apk | awk '{print $5}'
    echo ""
    echo "🎯 This APK includes:"
    echo "   ✓ Complete arbitrage trading engine"
    echo "   ✓ All native dependencies (vector-icons, svg, gesture-handler)"
    echo "   ✓ Full Android permissions for trading"
    echo "   ✓ Network security configuration"
    echo "   ✓ Biometric authentication support"
    echo ""
    echo "📲 To install:"
    echo "   1. Transfer APK to your Android device"
    echo "   2. Enable 'Install from Unknown Sources'"
    echo "   3. Install the APK"
    echo ""
    echo "🔥 Ready for high-frequency trading!"
else
    echo ""
    echo "❌ Build failed!"
    echo "Check the error messages above for details."
    exit 1
fi
