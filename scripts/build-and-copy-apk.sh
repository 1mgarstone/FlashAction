
#!/bin/bash

echo "🚀 Building APK for Arbitrage Trading Mobile App"
echo "=============================================="

# Set variables
PROJECT_ROOT="$(pwd)"
KEYSTORE_PATH="$PROJECT_ROOT/android/app/my-release-key.keystore"
KEYSTORE_ALIAS="my-key-alias"
KEYSTORE_PASSWORD="123456"
APK_NAME="arbitrage-trading-mobile.apk"

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed"
        return 1
    fi
    echo "✅ $1 is available"
    return 0
}

# Check required tools
echo "🔍 Checking required tools..."
check_command java || { echo "Java is required but not found"; exit 1; }
check_command keytool || { echo "Keytool is required but not found"; exit 1; }

# Create keystore if it doesn't exist
echo "🔑 Creating keystore..."
mkdir -p "$(dirname "$KEYSTORE_PATH")"
if [ ! -f "$KEYSTORE_PATH" ]; then
    keytool -genkeypair -v -storetype PKCS12 -keystore "$KEYSTORE_PATH" -alias "$KEYSTORE_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 -storepass "$KEYSTORE_PASSWORD" -keypass "$KEYSTORE_PASSWORD" -dname "CN=Arbitrage Trading, OU=Mobile, O=ArbitrageTrading, L=City, ST=State, C=US"
    echo "✅ Keystore created"
else
    echo "✅ Keystore exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create complete Android project structure
echo "📁 Creating complete Android build structure..."
mkdir -p android/app/src/main/java/com/arbitragetrading/mobile
mkdir -p android/app/src/main/res/{values,mipmap-hdpi,mipmap-mdpi,mipmap-xhdpi,mipmap-xxhdpi,mipmap-xxxhdpi}
mkdir -p android/gradle/wrapper

# Create proper gradle wrapper
echo "📄 Creating Gradle wrapper..."
cat > android/gradlew << 'EOF'
#!/bin/sh

# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME"
    fi
else
    JAVACMD="java"
    which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH."
fi

# Increase the maximum file descriptors if we can.
if [ "$cygwin" = "false" -a "$darwin" = "false" -a "$nonstop" = "false" ] ; then
    MAX_FD_LIMIT=`ulimit -H -n`
    if [ $? -eq 0 ] ; then
        if [ "$MAX_FD" = "maximum" -o "$MAX_FD" = "max" ] ; then
            MAX_FD="$MAX_FD_LIMIT"
        fi
        ulimit -n $MAX_FD
    fi
fi

# Escape application args
save () {
    for i do printf %s\\n "$i" | sed "s/'/'\\\\''/g;1s/^/'/;\$s/\$/' \\\\/" ; done
    echo " "
}
APP_ARGS=`save "$@"`

# Use the maximum available, or set MAX_FD != -1 to use that value.
MAX_FD="maximum"

warn () {
    echo "$*"
} >&2

die () {
    echo
    echo "$*"
    echo
    exit 1
} >&2

# OS specific support (must be 'true' or 'false').
cygwin=false
msys=false
darwin=false
nonstop=false
case "`uname`" in
  CYGWIN* )
    cygwin=true
    ;;
  Darwin* )
    darwin=true
    ;;
  MSYS* | MINGW* )
    msys=true
    ;;
  NONSTOP* )
    nonstop=true
    ;;
esac

# Attempt to set APP_HOME
# Resolve links: $0 may be a link
PRG="$0"
# Need this for relative symlinks.
while [ -h "$PRG" ] ; do
    ls=`ls -ld "$PRG"`
    link=`expr "$ls" : '.*-> \(.*\)$'`
    if expr "$link" : '/.*' > /dev/null; then
        PRG="$link"
    else
        PRG=`dirname "$PRG"`"/$link"
    fi
done
SAVED="`pwd`"
cd "`dirname \"$PRG\"`/" >/dev/null
APP_HOME="`pwd -P`"
cd "$SAVED" >/dev/null

APP_NAME="Gradle"
APP_BASE_NAME=`basename "$0"`

# Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

# Use the maximum available, or set MAX_FD != -1 to use that value.
MAX_FD="maximum"

warn () {
    echo "$*"
} >&2

die () {
    echo
    echo "$*"
    echo
    exit 1
} >&2

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME"
    fi
else
    JAVACMD="java"
    which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH."
fi

exec "$JAVACMD" $DEFAULT_JVM_OPTS $JAVA_OPTS $GRADLE_OPTS "\"-Dorg.gradle.appname=$APP_BASE_NAME\"" -classpath "\"$CLASSPATH\"" org.gradle.wrapper.GradleWrapperMain "$@"
EOF

chmod +x android/gradlew

# Create gradle wrapper properties
cat > android/gradle/wrapper/gradle-wrapper.properties << 'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-7.6-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

# Update main build.gradle
cat > android/build.gradle << 'EOF'
buildscript {
    ext {
        buildToolsVersion = "33.0.0"
        minSdkVersion = 21
        compileSdkVersion = 33
        targetSdkVersion = 33
    }
    dependencies {
        classpath("com.android.tools.build:gradle:7.4.2")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
EOF

# Update app build.gradle
cat > android/app/build.gradle << 'EOF'
apply plugin: 'com.android.application'

android {
    namespace "com.arbitragetrading.mobile"
    compileSdkVersion rootProject.ext.compileSdkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion

    defaultConfig {
        applicationId "com.arbitragetrading.mobile"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
    }

    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword '123456'
            keyAlias 'my-key-alias'
            keyPassword '123456'
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.8.0'
}
EOF

# Create required Android files
echo "📄 Creating Android files..."
cat > android/app/src/main/AndroidManifest.xml << 'EOF'
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="false"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/AppTheme">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# Create MainActivity
mkdir -p android/app/src/main/java/com/arbitragetrading/mobile
cat > android/app/src/main/java/com/arbitragetrading/mobile/MainActivity.java << 'EOF'
package com.arbitragetrading.mobile;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webview);
        webView.setWebViewClient(new WebViewClient());
        webView.getSettings().setJavaScriptEnabled(true);
        webView.loadUrl("file:///android_asset/index.html");
    }
}
EOF

# Create MainApplication
cat > android/app/src/main/java/com/arbitragetrading/mobile/MainApplication.java << 'EOF'
package com.arbitragetrading.mobile;

import android.app.Application;

public class MainApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
    }
}
EOF

# Create layout
mkdir -p android/app/src/main/res/layout
cat > android/app/src/main/res/layout/activity_main.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</LinearLayout>
EOF

# Create strings.xml
cat > android/app/src/main/res/values/strings.xml << 'EOF'
<resources>
    <string name="app_name">Arbitrage Trading</string>
</resources>
EOF

# Create styles.xml
cat > android/app/src/main/res/values/styles.xml << 'EOF'
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">#6200EE</item>
        <item name="colorPrimaryDark">#3700B3</item>
        <item name="colorAccent">#03DAC5</item>
    </style>
</resources>
EOF

# Create basic launcher icons
echo "🎨 Creating launcher icons..."
for size in hdpi mdpi xhdpi xxhdpi xxxhdpi; do
    mkdir -p "android/app/src/main/res/mipmap-$size"
    # Create a simple colored square as placeholder icon
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > "android/app/src/main/res/mipmap-$size/ic_launcher.png"
done

# Copy web assets to Android assets
mkdir -p android/app/src/main/assets
if [ -f "web-dashboard.html" ]; then
    cp web-dashboard.html android/app/src/main/assets/index.html
else
    echo "<html><body><h1>Arbitrage Trading Mobile</h1><p>Welcome to the mobile app!</p></body></html>" > android/app/src/main/assets/index.html
fi

# Build the APK
echo "🔨 Building APK..."
cd android

# Clean and build
echo "🧹 Cleaning previous builds..."
./gradlew clean 2>&1 | tee ../build-clean.log

echo "🏗️ Building release APK..."
./gradlew assembleRelease 2>&1 | tee ../build-release.log

# Check build results
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ APK built successfully!"
    
    # Copy APK to root directory
    echo "📱 Copying APK to root directory..."
    cp "app/build/outputs/apk/release/app-release.apk" "$PROJECT_ROOT/$APK_NAME"
    
    # Make it accessible
    chmod 644 "$PROJECT_ROOT/$APK_NAME"
    
    echo "📱 APK location: $PROJECT_ROOT/$APK_NAME"
    echo "📊 APK size: $(ls -lh "$PROJECT_ROOT/$APK_NAME" | awk '{print $5}')"
    echo "🎉 Build complete! You can now download: $APK_NAME"
    
    # List final file
    ls -la "$PROJECT_ROOT/$APK_NAME"
    
else
    echo "❌ APK build failed!"
    echo "📋 Checking build logs..."
    
    if [ -f "../build-release.log" ]; then
        echo "🔍 Last 20 lines of build log:"
        tail -20 ../build-release.log
    fi
    
    echo "📂 Checking output directory..."
    find app/build -name "*.apk" 2>/dev/null || echo "No APK files found"
    
    exit 1
fi
