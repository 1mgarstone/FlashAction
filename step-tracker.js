
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class StepTracker {
  constructor() {
    this.progressFile = 'progress.json';
    this.loadProgress();
  }

  loadProgress() {
    try {
      if (fs.existsSync(this.progressFile)) {
        this.progress = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
      } else {
        this.progress = {
          phase: 1,
          step: 1,
          substep: 1,
          completed: [],
          failed: [],
          notes: []
        };
      }
    } catch (error) {
      console.log('Creating new progress file...');
      this.progress = {
        phase: 1,
        step: 1,
        substep: 1,
        completed: [],
        failed: [],
        notes: []
      };
    }
  }

  saveProgress() {
    fs.writeFileSync(this.progressFile, JSON.stringify(this.progress, null, 2));
  }

  markComplete(stepId, notes = '') {
    this.progress.completed.push({
      id: stepId,
      timestamp: new Date().toISOString(),
      notes: notes
    });
    this.saveProgress();
    console.log(`✅ Step ${stepId} completed!`);
  }

  markFailed(stepId, error) {
    this.progress.failed.push({
      id: stepId,
      timestamp: new Date().toISOString(),
      error: error
    });
    this.saveProgress();
    console.log(`❌ Step ${stepId} failed: ${error}`);
  }

  getCurrentStep() {
    return `Phase ${this.progress.phase}, Step ${this.progress.step}.${this.progress.substep}`;
  }

  nextStep() {
    this.progress.substep++;
    if (this.progress.substep > 3) {
      this.progress.substep = 1;
      this.progress.step++;
      if (this.progress.step > 3) {
        this.progress.step = 1;
        this.progress.phase++;
      }
    }
    this.saveProgress();
  }

  showStatus() {
    console.log('\n🎯 LULLABYTE PROGRESS TRACKER');
    console.log('=====================================');
    console.log(`Current: ${this.getCurrentStep()}`);
    console.log(`Completed: ${this.progress.completed.length} steps`);
    console.log(`Failed: ${this.progress.failed.length} steps`);
    
    if (this.progress.completed.length > 0) {
      console.log('\n✅ Recently Completed:');
      this.progress.completed.slice(-3).forEach(item => {
        console.log(`   ${item.id} - ${item.timestamp.split('T')[0]}`);
      });
    }

    if (this.progress.failed.length > 0) {
      console.log('\n❌ Failed Steps (need fixing):');
      this.progress.failed.forEach(item => {
        console.log(`   ${item.id} - ${item.error}`);
      });
    }

    console.log('\n📋 Next Actions:');
    this.getNextActions().forEach(action => {
      console.log(`   • ${action}`);
    });
  }

  getNextActions() {
    const { phase, step, substep } = this.progress;
    
    const actions = {
      '1.1.1': ['Test simple server connection', 'Run: node simple-server.js', 'Check port 5000 responds'],
      '1.1.2': ['Verify port accessibility', 'Test health endpoint', 'Confirm no errors in console'],
      '1.2.1': ['Install MetaMask if needed', 'Test wallet connection', 'Display wallet address'],
      '1.2.2': ['Show ETH balance', 'Test connect/disconnect', 'Handle connection errors'],
      '1.3.1': ['Check .env file exists', 'Validate RPC URLs', 'Test private key format'],
      '2.1.1': ['Connect to Uniswap V2', 'Fetch basic price data', 'Test price endpoints'],
      '2.1.2': ['Add SushiSwap integration', 'Compare prices', 'Implement price comparison logic']
    };

    const key = `${phase}.${step}.${substep}`;
    return actions[key] || ['Check implementation checklist for current phase'];
  }

  testCurrentStep() {
    const { phase, step, substep } = this.progress;
    console.log(`\n🧪 Testing ${this.getCurrentStep()}...`);
    
    // Add automated tests based on current step
    if (phase === 1 && step === 1 && substep === 1) {
      this.testBasicServer();
    } else if (phase === 1 && step === 2) {
      this.testWalletConnection();
    }
  }

  testBasicServer() {
    try {
      const express = require('express');
      console.log('✅ Express is available');
      
      // Check if simple-server.js exists and can be parsed
      if (fs.existsSync('simple-server.js')) {
        console.log('✅ simple-server.js exists');
        this.markComplete('1.1.1', 'Basic server files ready');
      } else {
        this.markFailed('1.1.1', 'simple-server.js not found');
      }
    } catch (error) {
      this.markFailed('1.1.1', `Express not available: ${error.message}`);
    }
  }

  testWalletConnection() {
    console.log('📝 Wallet connection test requires manual verification');
    console.log('   1. Open browser to localhost:5000');
    console.log('   2. Click connect wallet button');
    console.log('   3. Verify wallet address displays');
  }
}

// CLI Interface
const command = process.argv[2];
const tracker = new StepTracker();

switch (command) {
  case 'status':
    tracker.showStatus();
    break;
  case 'complete':
    const stepId = process.argv[3];
    const notes = process.argv[4] || '';
    if (stepId) {
      tracker.markComplete(stepId, notes);
      tracker.nextStep();
    } else {
      console.log('Usage: node step-tracker.js complete <step-id> [notes]');
    }
    break;
  case 'fail':
    const failStepId = process.argv[3];
    const error = process.argv[4] || 'Unknown error';
    if (failStepId) {
      tracker.markFailed(failStepId, error);
    } else {
      console.log('Usage: node step-tracker.js fail <step-id> <error>');
    }
    break;
  case 'test':
    tracker.testCurrentStep();
    break;
  case 'reset':
    if (fs.existsSync('progress.json')) {
      fs.unlinkSync('progress.json');
      console.log('🔄 Progress reset to beginning');
    }
    break;
  default:
    console.log('\n🎯 LullaByte Step Tracker');
    console.log('Usage:');
    console.log('  node step-tracker.js status     - Show current progress');
    console.log('  node step-tracker.js complete <step-id> [notes] - Mark step complete');
    console.log('  node step-tracker.js fail <step-id> <error>     - Mark step failed');
    console.log('  node step-tracker.js test       - Test current step');
    console.log('  node step-tracker.js reset      - Reset progress');
    tracker.showStatus();
}
