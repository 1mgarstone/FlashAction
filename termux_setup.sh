
#!/bin/bash

echo "🚀 Arbitrage Trading Mobile - Termux Setup Script"
echo "================================================="

# Update package list
echo "📦 Updating package list..."
pkg update -y

# Install required packages
echo "🔧 Installing dependencies..."
pkg install -y nodejs openjdk-17 gradle git wget unzip

# Set JAVA_HOME
export JAVA_HOME=/data/data/com.termux/files/usr/share/openjdk-17
echo "export JAVA_HOME=/data/data/com.termux/files/usr/share/openjdk-17" >> ~/.bashrc

# Install Android SDK command line tools
echo "📱 Setting up Android SDK..."
cd ~
mkdir -p android-sdk/cmdline-tools
cd android-sdk/cmdline-tools

# Download command line tools
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
mv cmdline-tools latest

# Set Android environment variables
export ANDROID_HOME=~/android-sdk
export ANDROID_SDK_ROOT=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Add to bashrc for persistence
echo "export ANDROID_HOME=~/android-sdk" >> ~/.bashrc
echo "export ANDROID_SDK_ROOT=~/android-sdk" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools" >> ~/.bashrc

# Accept licenses and install required SDK components
echo "📋 Accepting Android licenses..."
yes | sdkmanager --licenses

echo "📲 Installing Android SDK components..."
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# Clone the project (if from GitHub) or extract ZIP
echo "📥 Getting project files..."
if [ ! -d "arbitrage-trading-mobile" ]; then
    if [ -f "arbitrage-trading-mobile.zip" ]; then
        echo "📂 Extracting from ZIP file..."
        unzip arbitrage-trading-mobile.zip
        cd arbitrage-trading-mobile
    else
        echo "❌ Error: No source found. Please provide either:"
        echo "   1. arbitrage-trading-mobile.zip file in current directory"
        echo "   2. Or modify this script to clone from your GitHub repository"
        exit 1
    fi
else
    cd arbitrage-trading-mobile
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Generate debug keystore if not exists
echo "🔐 Generating debug keystore..."
if [ ! -f "android/app/debug.keystore" ]; then
    keytool -genkey -v -keystore android/app/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
fi

# Clean and build the project
echo "🔨 Building the project..."
cd android
./gradlew clean
./gradlew assembleRelease

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📱 Your APK files are located at:"
echo "   android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "🎯 To install the APK:"
echo "   1. Copy the APK to your phone's Downloads folder"
echo "   2. Enable 'Install from Unknown Sources' in Android settings"
echo "   3. Tap the APK file to install"
echo ""
echo "🔧 Development commands:"
echo "   npm start                 - Start Metro bundler"
echo "   npm run android          - Build and run on Android device"
echo "   ./gradlew assembleRelease - Build release APK"
echo ""
