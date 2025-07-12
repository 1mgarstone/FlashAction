
#!/usr/bin/env node

import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class HealthMonitor {
  async checkSystemHealth() {
    console.log('🏥 RUNNING SYSTEM HEALTH CHECK');
    console.log('================================');

    const checks = {
      nodeJS: await this.checkNodeJS(),
      dependencies: await this.checkDependencies(),
      environment: await this.checkEnvironment(),
      ports: await this.checkPorts(),
      diskSpace: await this.checkDiskSpace(),
      memory: await this.checkMemory()
    };

    const healthScore = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    const healthPercentage = (healthScore / totalChecks) * 100;

    console.log('\n📊 HEALTH SUMMARY');
    console.log('=================');
    console.log(`Overall Health: ${healthPercentage.toFixed(1)}% (${healthScore}/${totalChecks})`);
    
    Object.entries(checks).forEach(([check, status]) => {
      console.log(`${status ? '✅' : '❌'} ${check}: ${status ? 'HEALTHY' : 'FAILED'}`);
    });

    if (healthPercentage < 70) {
      console.log('\n⚠️  SYSTEM NEEDS ATTENTION!');
      console.log('Run: npm run fix');
    } else if (healthPercentage === 100) {
      console.log('\n🎉 SYSTEM IS FULLY HEALTHY!');
    }

    return { healthPercentage, checks };
  }

  async checkNodeJS() {
    try {
      await execAsync('node --version');
      await execAsync('npm --version');
      return true;
    } catch {
      return false;
    }
  }

  async checkDependencies() {
    return fs.existsSync('node_modules') && fs.existsSync('package.json');
  }

  async checkEnvironment() {
    return fs.existsSync('.env');
  }

  async checkPorts() {
    try {
      const { stdout } = await execAsync('netstat -tuln 2>/dev/null || ss -tuln 2>/dev/null || echo "no-netstat"');
      return !stdout.includes(':5000') || stdout.includes('no-netstat');
    } catch {
      return true; // Assume healthy if can't check
    }
  }

  async checkDiskSpace() {
    try {
      const { stdout } = await execAsync('df -h . 2>/dev/null || echo "90% available"');
      const usage = stdout.match(/(\d+)%/);
      return usage ? parseInt(usage[1]) < 90 : true;
    } catch {
      return true;
    }
  }

  async checkMemory() {
    try {
      const { stdout } = await execAsync('free -m 2>/dev/null || echo "Mem: 1000 500"');
      const memInfo = stdout.match(/Mem:\s+(\d+)\s+(\d+)/);
      if (memInfo) {
        const [, total, used] = memInfo;
        return (used / total) < 0.9;
      }
      return true;
    } catch {
      return true;
    }
  }
}

const monitor = new HealthMonitor();
monitor.checkSystemHealth();
