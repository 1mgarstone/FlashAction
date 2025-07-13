
#!/bin/bash

echo "🔌 Testing SSH Connection from Termux to Replit"
echo "=============================================="

# Check if we're in Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo "❌ This script must be run in Termux"
    exit 1
fi

# Test SSH key existence
echo "🔑 Checking SSH keys..."
if [ -f ~/.ssh/replit ]; then
    echo "✅ Private key found: ~/.ssh/replit"
else
    echo "❌ Private key not found: ~/.ssh/replit"
    echo "Run: ssh-keygen -t ed25519 -f ~/.ssh/replit -q -N \"\""
fi

if [ -f ~/.ssh/replit.pub ]; then
    echo "✅ Public key found: ~/.ssh/replit.pub"
    echo "📋 Public key content:"
    cat ~/.ssh/replit.pub
else
    echo "❌ Public key not found: ~/.ssh/replit.pub"
fi

# Check SSH config
echo ""
echo "⚙️ Checking SSH config..."
if [ -f ~/.ssh/config ]; then
    echo "✅ SSH config exists"
    if grep -q "*.replit.dev" ~/.ssh/config; then
        echo "✅ Replit config found in SSH config"
    else
        echo "⚠️ Replit config not found in SSH config"
        echo "Add this to ~/.ssh/config:"
        echo "Host *.replit.dev"
        echo "    Port 22"
        echo "    IdentityFile ~/.ssh/replit"
        echo "    StrictHostKeyChecking accept-new"
    fi
else
    echo "❌ SSH config not found"
    echo "Creating SSH config..."
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    cat > ~/.ssh/config << EOF
Host *.replit.dev
    Port 22
    IdentityFile ~/.ssh/replit
    StrictHostKeyChecking accept-new
EOF
    chmod 600 ~/.ssh/config
    echo "✅ SSH config created"
fi

# Check SSH agent
echo ""
echo "🔐 Testing SSH agent..."
if ssh-add -l > /dev/null 2>&1; then
    echo "✅ SSH agent is running"
else
    echo "⚠️ SSH agent not running, starting..."
    eval $(ssh-agent -s)
    if [ -f ~/.ssh/replit ]; then
        ssh-add ~/.ssh/replit
        echo "✅ SSH key added to agent"
    fi
fi

# Test network connectivity
echo ""
echo "🌐 Testing network connectivity..."
if ping -c 1 google.com > /dev/null 2>&1; then
    echo "✅ Internet connectivity working"
else
    echo "❌ No internet connectivity"
    exit 1
fi

# Test DNS resolution for Replit
echo ""
echo "🔍 Testing Replit DNS resolution..."
if nslookup replit.com > /dev/null 2>&1; then
    echo "✅ Can resolve replit.com"
else
    echo "❌ Cannot resolve replit.com"
fi

# Check if openssh is installed
echo ""
echo "📦 Checking SSH client..."
if command -v ssh > /dev/null 2>&1; then
    echo "✅ SSH client installed"
    ssh -V
else
    echo "❌ SSH client not installed"
    echo "Installing openssh..."
    pkg install openssh -y
fi

# Test SSH connection to a sample Replit host
echo ""
echo "🔌 Testing SSH connection format..."
echo "To test actual connection, you need:"
echo "1. Your Repl hostname (from SSH pane in Replit)"
echo "2. Example format: ssh <username>@<hostname>.replit.dev"
echo ""
echo "Example connection test (replace with your actual details):"
echo "ssh -o ConnectTimeout=10 -o BatchMode=yes <your-username>@<your-hostname>.replit.dev 'echo Connection successful'"

# Show connection instructions
echo ""
echo "📋 CONNECTION INSTRUCTIONS:"
echo "=========================="
echo "1. In your Replit project, open the SSH pane"
echo "2. Go to 'Keys' tab and add your public key:"
cat ~/.ssh/replit.pub 2>/dev/null || echo "   (Generate key first: ssh-keygen -t ed25519 -f ~/.ssh/replit -q -N \"\")"
echo ""
echo "3. Go to 'Connect' tab and copy the SSH command"
echo "4. Run the command in Termux"
echo ""
echo "🎯 Quick test when you have the details:"
echo "ssh -o ConnectTimeout=10 <username>@<hostname>.replit.dev"

# Check permissions
echo ""
echo "🔒 Checking file permissions..."
if [ -f ~/.ssh/replit ]; then
    perms=$(stat -c %a ~/.ssh/replit 2>/dev/null || stat -f %A ~/.ssh/replit)
    if [ "$perms" = "600" ]; then
        echo "✅ Private key permissions correct (600)"
    else
        echo "⚠️ Fixing private key permissions..."
        chmod 600 ~/.ssh/replit
        echo "✅ Private key permissions fixed"
    fi
fi

if [ -f ~/.ssh/config ]; then
    perms=$(stat -c %a ~/.ssh/config 2>/dev/null || stat -f %A ~/.ssh/config)
    if [ "$perms" = "600" ]; then
        echo "✅ SSH config permissions correct (600)"
    else
        echo "⚠️ Fixing SSH config permissions..."
        chmod 600 ~/.ssh/config
        echo "✅ SSH config permissions fixed"
    fi
fi

echo ""
echo "✅ SSH connection test completed!"
echo "Copy your public key to Replit and test the connection."
