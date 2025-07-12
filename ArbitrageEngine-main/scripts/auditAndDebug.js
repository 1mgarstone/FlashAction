
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class SystemAuditor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'error': '❌ ERROR',
      'warning': '⚠️  WARNING',
      'success': '✅ SUCCESS',
      'info': 'ℹ️  INFO',
      'fix': '🔧 FIX'
    }[type] || 'ℹ️  INFO';
    
    console.log(`[${timestamp}] ${prefix}: ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'fix') this.fixes.push(message);
  }

  async checkNodeEnvironment() {
    this.log('=== CHECKING NODE ENVIRONMENT ===');
    
    try {
      const { stdout: nodeVersion } = await execAsync('node --version');
      this.log(`Node.js version: ${nodeVersion.trim()}`, 'success');
    } catch (error) {
      this.log('Node.js not found or not working', 'error');
      return false;
    }

    try {
      const { stdout: npmVersion } = await execAsync('npm --version');
      this.log(`NPM version: ${npmVersion.trim()}`, 'success');
    } catch (error) {
      this.log('NPM not found or not working', 'error');
      return false;
    }

    return true;
  }

  async checkPackageJson() {
    this.log('=== CHECKING PACKAGE.JSON ===');
    
    const packageJsonPath = './package.json';
    if (!fs.existsSync(packageJsonPath)) {
      this.log('package.json not found', 'error');
      return false;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      this.log('package.json is valid JSON', 'success');
      
      // Check required scripts
      const requiredScripts = ['start', 'dev', 'build'];
      requiredScripts.forEach(script => {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.log(`Script "${script}" found`, 'success');
        } else {
          this.log(`Script "${script}" missing`, 'warning');
        }
      });

      // Check dependencies
      const criticalDeps = ['ethers', 'express', 'react', 'dotenv'];
      criticalDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.log(`Dependency "${dep}" found`, 'success');
        } else {
          this.log(`Critical dependency "${dep}" missing`, 'error');
        }
      });

      return true;
    } catch (error) {
      this.log(`package.json parse error: ${error.message}`, 'error');
      return false;
    }
  }

  async checkEnvironmentFiles() {
    this.log('=== CHECKING ENVIRONMENT FILES ===');
    
    const envFiles = ['.env', '.env.example'];
    let envExists = false;

    envFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.log(`${file} exists`, 'success');
        envExists = true;
        
        // Check if it's not empty
        const content = fs.readFileSync(file, 'utf8').trim();
        if (content.length === 0) {
          this.log(`${file} is empty`, 'warning');
        } else {
          const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
          this.log(`${file} has ${lines.length} configuration lines`, 'info');
        }
      } else {
        this.log(`${file} not found`, file === '.env' ? 'error' : 'warning');
      }
    });

    return envExists;
  }

  async checkDirectoryStructure() {
    this.log('=== CHECKING DIRECTORY STRUCTURE ===');
    
    const requiredDirs = [
      'client/src',
      'server',
      'contracts',
      'trading',
      'scripts',
      'components'
    ];

    let allDirsExist = true;

    requiredDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.log(`Directory "${dir}" exists`, 'success');
      } else {
        this.log(`Directory "${dir}" missing`, 'error');
        allDirsExist = false;
      }
    });

    return allDirsExist;
  }

  async checkCriticalFiles() {
    this.log('=== CHECKING CRITICAL FILES ===');
    
    const criticalFiles = [
      'server/index.ts',
      'client/src/main.tsx',
      'trading/realTradingEngine.js',
      'contracts/FlashLoanArbitrage.sol'
    ];

    let allFilesExist = true;

    criticalFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.log(`File "${file}" exists`, 'success');
        
        // Check if file has content
        const stats = fs.statSync(file);
        if (stats.size === 0) {
          this.log(`File "${file}" is empty`, 'warning');
        }
      } else {
        this.log(`Critical file "${file}" missing`, 'error');
        allFilesExist = false;
      }
    });

    return allFilesExist;
  }

  async checkDependencies() {
    this.log('=== CHECKING DEPENDENCIES ===');
    
    try {
      if (!fs.existsSync('node_modules')) {
        this.log('node_modules directory not found', 'error');
        return false;
      }

      this.log('node_modules directory exists', 'success');
      
      // Check if package-lock.json exists
      if (fs.existsSync('package-lock.json')) {
        this.log('package-lock.json exists', 'success');
      } else {
        this.log('package-lock.json missing', 'warning');
      }

      return true;
    } catch (error) {
      this.log(`Dependency check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async autoFix() {
    this.log('=== AUTO-FIXING ISSUES ===');
    
    // Fix 1: Ensure .env file exists
    if (!fs.existsSync('.env')) {
      this.log('Creating .env file from template', 'fix');
      const envTemplate = `# Flash Loan Arbitrage Configuration
REACT_APP_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
REACT_APP_POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
REACT_APP_ARBITRUM_RPC_URL=https://arbitrum-mainnet.infura.io/v3/YOUR_PROJECT_ID
REACT_APP_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
REACT_APP_CONTRACT_ADDRESS=
REACT_APP_INFURA_PROJECT_ID=your_infura_id_here
REACT_APP_ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Maximum Gain Settings
MAX_LEVERAGE_MULTIPLIER=1500
MIN_PROFIT_THRESHOLD=0.008
AUTO_COMPOUND_ENABLED=true
AGGRESSIVE_MODE=true
TARGET_MULTIPLIER=50

# Production Settings
NODE_ENV=production
PORT=5000
WS_PORT=5001`;

      fs.writeFileSync('.env', envTemplate);
    }

    // Fix 2: Create missing directories
    const requiredDirs = ['dist', 'logs', 'backup'];
    requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        this.log(`Creating directory: ${dir}`, 'fix');
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Fix 3: Fix package.json scripts if needed
    const packageJsonPath = './package.json';
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      // Ensure critical scripts exist
      const criticalScripts = {
        'audit': 'node scripts/auditAndDebug.js',
        'fix': 'npm run audit && npm install',
        'health': 'node scripts/healthCheck.js'
      };

      let scriptsAdded = false;
      Object.entries(criticalScripts).forEach(([script, command]) => {
        if (!packageJson.scripts[script]) {
          packageJson.scripts[script] = command;
          scriptsAdded = true;
          this.log(`Added script: ${script}`, 'fix');
        }
      });

      if (scriptsAdded) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }
    }
  }

  async runFullAudit() {
    this.log('🚀 STARTING COMPREHENSIVE SYSTEM AUDIT', 'info');
    this.log('===============================================', 'info');

    const checks = [
      this.checkNodeEnvironment(),
      this.checkPackageJson(),
      this.checkEnvironmentFiles(),
      this.checkDirectoryStructure(),
      this.checkCriticalFiles(),
      this.checkDependencies()
    ];

    const results = await Promise.all(checks);
    const allPassed = results.every(result => result);

    this.log('===============================================', 'info');
    this.log('🔍 AUDIT SUMMARY', 'info');
    this.log(`Errors: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'success');
    this.log(`Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'warning' : 'success');

    if (this.errors.length > 0) {
      this.log('ERRORS FOUND:', 'error');
      this.errors.forEach(error => this.log(`  - ${error}`, 'error'));
    }

    if (this.warnings.length > 0) {
      this.log('WARNINGS:', 'warning');
      this.warnings.forEach(warning => this.log(`  - ${warning}`, 'warning'));
    }

    // Run auto-fix
    await this.autoFix();

    this.log('===============================================', 'info');
    this.log(`FIXES APPLIED: ${this.fixes.length}`, 'fix');
    this.fixes.forEach(fix => this.log(`  - ${fix}`, 'fix'));

    this.log('===============================================', 'info');
    this.log(allPassed ? '✅ SYSTEM STATUS: HEALTHY' : '⚠️  SYSTEM STATUS: NEEDS ATTENTION', 
             allPassed ? 'success' : 'warning');

    return {
      passed: allPassed,
      errors: this.errors.length,
      warnings: this.warnings.length,
      fixes: this.fixes.length
    };
  }
}

// Run the audit
const auditor = new SystemAuditor();
auditor.runFullAudit().then(result => {
  process.exit(result.errors > 0 ? 1 : 0);
}).catch(error => {
  console.error('❌ AUDIT FAILED:', error.message);
  process.exit(1);
});
