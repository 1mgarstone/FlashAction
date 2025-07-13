
#!/bin/bash

echo "🚀 Termux Auto-Deploy for Arbitrage Trading Mobile"
echo "================================================"

# Set up paths
DOWNLOAD_DIR="/storage/emulated/0/Download"
APK_NAME="arbitrage-trading-mobile.apk"
PROJECT_DIR=$(pwd)

# Check if we're in Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo "❌ This script must be run in Termux"
    exit 1
fi

# Grant storage permissions if needed
echo "📁 Ensuring storage permissions..."
termux-setup-storage

# Install required packages
echo "📦 Installing build dependencies..."
pkg update -y
pkg install -y nodejs openjdk-17 gradle git wget unzip

# Set environment variables
export JAVA_HOME=/data/data/com.termux/files/usr/share/openjdk-17
export ANDROID_HOME=~/android-sdk
export ANDROID_SDK_ROOT=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Setup Android SDK if not exists
if [ ! -d "~/android-sdk" ]; then
    echo "📱 Setting up Android SDK..."
    cd ~
    mkdir -p android-sdk/cmdline-tools
    cd android-sdk/cmdline-tools
    
    wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
    unzip commandlinetools-linux-9477386_latest.zip
    mv cmdline-tools latest
    
    yes | ~/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses
    ~/android-sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
fi

# Return to project directory
cd "$PROJECT_DIR"

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Generate keystore if needed
if [ ! -f "android/app/debug.keystore" ]; then
    echo "🔐 Generating debug keystore..."
    keytool -genkey -v -keystore android/app/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
fi

# Build the APK
echo "🔨 Building APK..."
cd android
./gradlew clean
./gradlew assembleRelease

# Check if build was successful
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ Build successful!"
    
    # Copy to Downloads folder
    echo "📲 Copying APK to Downloads folder..."
    cp app/build/outputs/apk/release/app-release.apk "$DOWNLOAD_DIR/$APK_NAME"
    
    # Make executable
    chmod +x "$DOWNLOAD_DIR/$APK_NAME"
    
    echo "📱 APK copied to: $DOWNLOAD_DIR/$APK_NAME"
    echo ""
    echo "🎯 Installation Instructions:"
    echo "1. Open your file manager"
    echo "2. Navigate to Downloads folder"
    echo "3. Tap on '$APK_NAME'"
    echo "4. Allow installation from unknown sources if prompted"
    echo "5. Tap 'Install'"
    echo ""
    
    # Auto-install if possible
    echo "🔧 Attempting auto-installation..."
    if command -v am &> /dev/null; then
        am start -a android.intent.action.VIEW -d "file://$DOWNLOAD_DIR/$APK_NAME" -t application/vnd.android.package-archive
        echo "✅ Installation dialog should open automatically"
    else
        echo "ℹ️  Manual installation required - check Downloads folder"
    fi
    
else
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi
