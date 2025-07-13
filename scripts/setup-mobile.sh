
#!/bin/bash

echo "🎯 Setting up React Native Mobile Environment"
echo "============================================"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Expo CLI globally if not present
if ! command -v expo &> /dev/null; then
    echo "📱 Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Install EAS CLI for building
if ! command -v eas &> /dev/null; then
    echo "🔧 Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Create assets directory if it doesn't exist
mkdir -p assets

# Create placeholder assets if they don't exist
if [ ! -f "assets/icon.png" ]; then
    echo "🎨 Creating placeholder assets..."
    # You would typically copy actual asset files here
    touch assets/icon.png
    touch assets/adaptive-icon.png
    touch assets/splash.png
    touch assets/favicon.png
fi

# Initialize EAS if eas.json doesn't exist
if [ ! -f "eas.json" ]; then
    echo "⚙️  Initializing EAS..."
    eas build:configure
fi

echo ""
echo "✅ Mobile environment setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Replace placeholder assets in ./assets/ with your actual app icons"
echo "   2. Update app.json with your app details (name, package name, etc.)"
echo "   3. Configure your .env file with API keys"
echo "   4. Run 'npm start' to start the development server"
echo "   5. Run 'npm run build:apk' to build an APK"
echo ""
echo "📱 Development commands:"
echo "   npm start          - Start Expo development server"
echo "   npm run android    - Start on Android device/emulator"
echo "   npm run build:apk  - Build APK for distribution"
echo ""
