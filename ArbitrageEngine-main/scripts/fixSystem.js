
#!/usr/bin/env node

import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class SystemFixer {
  constructor() {
    this.fixes = [];
  }

  log(message) {
    console.log(`🔧 ${message}`);
    this.fixes.push(message);
  }

  async fixDependencies() {
    this.log('Installing/updating dependencies...');
    try {
      await execAsync('npm install', { cwd: process.cwd() });
      this.log('Dependencies installed successfully');
    } catch (error) {
      this.log(`Dependency installation failed: ${error.message}`);
    }
  }

  async fixEnvironment() {
    if (!fs.existsSync('.env')) {
      this.log('Creating .env file...');
      const envContent = `# Auto-generated environment file
NODE_ENV=development
PORT=5000
REACT_APP_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
REACT_APP_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
MAX_LEVERAGE_MULTIPLIER=1500
TARGET_MULTIPLIER=50
`;
      fs.writeFileSync('.env', envContent);
    }
  }

  async fixDirectories() {
    const dirs = ['dist', 'logs', 'backup', 'tmp'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        this.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async fixPermissions() {
    try {
      await execAsync('chmod +x scripts/*.js');
      await execAsync('chmod +x *.sh');
      this.log('Fixed script permissions');
    } catch (error) {
      this.log(`Permission fix failed: ${error.message}`);
    }
  }

  async runAllFixes() {
    console.log('🚀 STARTING AUTOMATED SYSTEM REPAIR');
    console.log('===================================');

    await this.fixEnvironment();
    await this.fixDirectories();
    await this.fixPermissions();
    await this.fixDependencies();

    console.log('\n✅ REPAIR COMPLETE');
    console.log(`Applied ${this.fixes.length} fixes:`);
    this.fixes.forEach(fix => console.log(`  - ${fix}`));
  }
}

const fixer = new SystemFixer();
fixer.runAllFixes();
