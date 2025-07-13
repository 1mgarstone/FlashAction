
#!/bin/bash

echo "🚀 Deploying APK to Termux via SSH"
echo "=================================="

# Check if SSH connection details are provided
if [ -z "$1" ]; then
    echo "❌ Usage: $0 <ssh-connection-string>"
    echo "Example: $0 username@hostname.replit.dev"
    exit 1
fi

SSH_HOST="$1"
APK_FILE="app-release.apk"

# Check if APK exists
if [ ! -f "$APK_FILE" ]; then
    echo "⚠️ APK not found, building first..."
    cd android
    ./gradlew assembleRelease
    cd ..
    
    # Find the generated APK
    if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
        cp "android/app/build/outputs/apk/release/app-release.apk" "$APK_FILE"
        echo "✅ APK built and copied"
    else
        echo "❌ APK build failed"
        exit 1
    fi
fi

echo "📱 APK file: $APK_FILE"
echo "🔗 SSH target: $SSH_HOST"

# Test SSH connection
echo "🔌 Testing SSH connection..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes "$SSH_HOST" 'echo "Connection successful"'; then
    echo "✅ SSH connection working"
else
    echo "❌ SSH connection failed"
    echo "Make sure to:"
    echo "1. Add your public key to Replit SSH keys"
    echo "2. Use the correct SSH command from Replit"
    exit 1
fi

# Copy APK to Termux
echo "📤 Copying APK to Termux..."
if scp -o ConnectTimeout=30 "$APK_FILE" "$SSH_HOST:/storage/emulated/0/Download/"; then
    echo "✅ APK copied to /storage/emulated/0/Download/"
else
    echo "❌ Failed to copy APK"
    exit 1
fi

# Install APK in Termux
echo "📲 Installing APK..."
ssh "$SSH_HOST" 'cd /storage/emulated/0/Download/ && ls -la *.apk && echo "APK is ready for installation"'

echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo "========================"
echo "✅ APK copied to Termux Downloads folder"
echo "📱 Location: /storage/emulated/0/Download/$APK_FILE"
echo ""
echo "📋 Manual Installation Steps:"
echo "1. Open file manager on your Android device"
echo "2. Navigate to Downloads folder"
echo "3. Tap on $APK_FILE"
echo "4. Allow installation from unknown sources if prompted"
echo "5. Install the app"
echo ""
echo "🔧 Or install via ADB if available:"
echo "adb install /storage/emulated/0/Download/$APK_FILE"
