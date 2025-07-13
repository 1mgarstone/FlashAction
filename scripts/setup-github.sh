
#!/bin/bash

echo "🚀 Setting up GitHub repository for LullaByte Trading System"
echo "=========================================================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Installing..."
    pkg install git -y
fi

# Get user input for GitHub details
read -p "📝 Enter your GitHub username: " GITHUB_USERNAME
read -p "📝 Enter your GitHub repository name (e.g., lullabyte-trading): " REPO_NAME
read -p "📝 Enter your GitHub personal access token: " GITHUB_TOKEN

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo "🔧 Initializing Git repository..."
    git init
fi

# Create .gitignore file
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
*.apk
*.aab

# Logs
*.log
logs/

# Cache
.cache/
.expo/
.next/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Temporary files
tmp/
temp/
*.tmp

# APK files (optional - remove if you want to commit APKs)
*.apk
*.aab

# Private keys and sensitive data
private_key*
*.key
*.pem
EOF

# Add all files to git
echo "📁 Adding files to Git..."
git add .

# Initial commit
echo "💾 Creating initial commit..."
git commit -m "🎯 Initial commit: LullaByte Trading System

✨ Features:
- React Native mobile app with Expo
- Multi-chain arbitrage trading engine
- Flash loan integration (Aave, Balancer)
- Real-time price monitoring
- Discord & Telegram bots
- Advanced trading algorithms
- MEV protection
- Risk management system

🏗️ Architecture:
- Frontend: React Native with TypeScript
- Backend: Node.js with Express
- Smart Contracts: Solidity
- Database: SQLite with Drizzle ORM
- Build System: Expo EAS

🚀 Ready for deployment and trading!"

# Set up remote repository
echo "🌐 Setting up remote repository..."
git branch -M main
git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ SUCCESS! Your project has been pushed to GitHub!"
echo "🔗 Repository URL: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
echo ""
echo "📋 Next steps:"
echo "   1. Visit your GitHub repository"
echo "   2. Add collaborators if needed"
echo "   3. Set up GitHub Actions for CI/CD"
echo "   4. Configure branch protection rules"
echo ""
echo "🎯 Your complete trading system is now on GitHub!"
