
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
