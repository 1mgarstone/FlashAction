#!/usr/bin/env node

import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class HealthChecker {
  constructor() {
    this.checks = [];
  }

  log(status, message) {
    const symbol = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${symbol} ${message}`);
    this.checks.push({ status, message });
  }

  async checkEnvironment() {
    console.log('🔍 SYSTEM HEALTH CHECK');
    console.log('===================');

    // Check Node.js
    try {
      const { stdout } = await execAsync('node --version');
      this.log('pass', `Node.js version: ${stdout.trim()}`);
    } catch (error) {
      this.log('fail', 'Node.js not found');
    }

    // Check npm
    try {
      const { stdout } = await execAsync('npm --version');
      this.log('pass', `npm version: ${stdout.trim()}`);
    } catch (error) {
      this.log('fail', 'npm not found');
    }

    // Check .env file
    if (existsSync('.env')) {
      this.log('pass', '.env file exists');
    } else {
      this.log('fail', '.env file missing');
    }

    // Check package.json
    if (existsSync('package.json')) {
      this.log('pass', 'package.json exists');
    } else {
      this.log('fail', 'package.json missing');
    }

    // Check dependencies
    try {
      await execAsync('npm list --depth=0');
      this.log('pass', 'Dependencies installed');
    } catch (error) {
      this.log('warn', 'Some dependencies may be missing');
    }

    console.log('\n📊 HEALTH SUMMARY');
    console.log('================');
    const passed = this.checks.filter(c => c.status === 'pass').length;
    const failed = this.checks.filter(c => c.status === 'fail').length;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed === 0) {
      console.log('\n🚀 System is healthy and ready to run!');
    } else {
      console.log('\n⚠️ System needs attention before running.');
    }
  }
}

const checker = new HealthChecker();
checker.checkEnvironment();