// Project Integrity Check - Validates system safety and enforces execution rules
const fs = require('fs');
const path = require('path');

class ProjectIntegrityChecker {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.violations = [];
    this.warnings = [];
  }

  // Main integrity check function
  async runIntegrityCheck() {
    console.log('🔍 Starting Project Integrity Check...');
    
    this.violations = [];
    this.warnings = [];

    try {
      await this.scanForQueueBasedExecution();
      await this.scanForForcedOverrides();
      await this.scanForPreApprovals();
      await this.scanForLegacyModules();
      await this.validateSpreadSimulation();
      await this.checkFlashLoanConfiguration();
      await this.validateSafetyMechanisms();

      return this.generateReport();
    } catch (error) {
      console.error('❌ Integrity check failed:', error.message);
      this.violations.push({
        type: 'SYSTEM_ERROR',
        severity: 'CRITICAL',
        message: `Integrity check system error: ${error.message}`,
        file: 'system',
        action: 'HALT_EXECUTION'
      });
      
      return this.generateReport();
    }
  }

  // Scan for queue-based execution systems
  async scanForQueueBasedExecution() {
    const queuePatterns = [
      /queue\.push/gi,
      /executionQueue/gi,
      /pendingTrades/gi,
      /tradeQueue/gi,
      /queuedExecution/gi,
      /\.enqueue\(/gi,
      /\.dequeue\(/gi
    ];

    const files = await this.getAllJSFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      for (const pattern of queuePatterns) {
        const matches = content.match(pattern);
        if (matches) {
          this.violations.push({
            type: 'QUEUE_EXECUTION',
            severity: 'CRITICAL',
            message: `Queue-based execution detected: ${matches[0]}`,
            file: file,
            action: 'REMOVE_QUEUE_SYSTEM'
          });
        }
      }
    }
  }

  // Scan for forced override logic
  async scanForForcedOverrides() {
    const overridePatterns = [
      /forceExecute/gi,
      /bypassSpread/gi,
      /ignoreSpread/gi,
      /overrideCheck/gi,
      /forceOverride/gi,
      /skipValidation/gi,
      /emergencyExecute/gi
    ];

    const files = await this.getAllJSFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      for (const pattern of overridePatterns) {
        const matches = content.match(pattern);
        if (matches) {
          // Check if it's allowed (flashloan fee = 0%)
          const hasZeroFeeCheck = content.includes('flashloan === 0') || 
                                 content.includes('fee === 0') ||
                                 content.includes('flashLoanFee === 0');
          
          if (!hasZeroFeeCheck) {
            this.violations.push({
              type: 'FORCED_OVERRIDE',
              severity: 'CRITICAL',
              message: `Forced override without zero fee check: ${matches[0]}`,
              file: file,
              action: 'ADD_ZERO_FEE_CHECK_OR_REMOVE'
            });
          } else {
            this.warnings.push({
              type: 'CONDITIONAL_OVERRIDE',
              severity: 'WARNING',
              message: `Override logic found but properly gated by zero fee check`,
              file: file,
              action: 'MONITOR'
            });
          }
        }
      }
    }
  }

  // Scan for pre-approval of ERC20 tokens
  async scanForPreApprovals() {
    const approvalPatterns = [
      /\.approve\(/gi,
      /setApprovalForAll/gi,
      /increaseAllowance/gi,
      /preApprove/gi,
      /approveToken/gi,
      /MAX_UINT256/gi,
      /unlimited.*approval/gi
    ];

    const files = await this.getAllJSFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      for (const pattern of approvalPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          // Check if it's within a transaction execution (allowed)
          const isInTransaction = content.includes('executeTransaction') || 
                                 content.includes('flashLoanCallback') ||
                                 content.includes('receiveFlashLoan');
          
          if (!isInTransaction) {
            this.violations.push({
              type: 'PRE_APPROVAL',
              severity: 'CRITICAL',
              message: `Pre-approval of tokens detected outside transaction: ${matches[0]}`,
              file: file,
              action: 'REMOVE_PRE_APPROVAL'
            });
          }
        }
      }
    }
  }

  // Scan for legacy modules that bypass spread simulation
  async scanForLegacyModules() {
    const legacyPatterns = [
      /legacyExecute/gi,
      /oldArbitrage/gi,
      /deprecatedTrade/gi,
      /bypassSimulation/gi,
      /skipSpreadCheck/gi,
      /directExecute/gi,
      /unsafeExecute/gi
    ];

    const files = await this.getAllJSFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      for (const pattern of legacyPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          this.violations.push({
            type: 'LEGACY_MODULE',
            severity: 'HIGH',
            message: `Legacy module that bypasses safety checks: ${matches[0]}`,
            file: file,
            action: 'REMOVE_OR_UPDATE_MODULE'
          });
        }
      }
    }
  }

  // Validate that all trades go through spread simulation
  async validateSpreadSimulation() {
    const files = await this.getAllJSFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Look for trade execution without simulation
      const hasTradeExecution = content.includes('executeRealTrade') || 
                               content.includes('executeTrade') ||
                               content.includes('performArbitrage');
      
      const hasSimulation = content.includes('simulateTrade') ||
                           content.includes('simulate') ||
                           content.includes('checkSpread');
      
      if (hasTradeExecution && !hasSimulation) {
        this.violations.push({
          type: 'NO_SIMULATION',
          severity: 'CRITICAL',
          message: 'Trade execution without prior simulation detected',
          file: file,
          action: 'ADD_SIMULATION_CHECK'
        });
      }
    }
  }

  // Check flash loan configuration
  async checkFlashLoanConfiguration() {
    const configFiles = [
      'config.js',
      'config.json',
      '.env',
      'trading/config.js'
    ];

    for (const configFile of configFiles) {
      const filePath = path.join(this.projectRoot, configFile);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for hardcoded overrides
        if (content.includes('FORCE_EXECUTE=true') || 
            content.includes('BYPASS_CHECKS=true') ||
            content.includes('DISABLE_SAFETY=true')) {
          
          this.violations.push({
            type: 'UNSAFE_CONFIG',
            severity: 'CRITICAL',
            message: 'Unsafe configuration flags detected',
            file: filePath,
            action: 'REMOVE_UNSAFE_FLAGS'
          });
        }
      }
    }
  }

  // Validate safety mechanisms are in place
  async validateSafetyMechanisms() {
    const requiredSafetyFeatures = [
      'spread.*check',
      'gas.*estimation',
      'simulation',
      'safety.*buffer',
      'circuit.*breaker',
      'risk.*management'
    ];

    const files = await this.getAllJSFiles();
    let foundFeatures = 0;
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      for (const feature of requiredSafetyFeatures) {
        const regex = new RegExp(feature, 'gi');
        if (regex.test(content)) {
          foundFeatures++;
          break; // Count each file only once
        }
      }
    }

    if (foundFeatures < requiredSafetyFeatures.length / 2) {
      this.violations.push({
        type: 'INSUFFICIENT_SAFETY',
        severity: 'HIGH',
        message: `Only ${foundFeatures}/${requiredSafetyFeatures.length} safety features detected`,
        file: 'system',
        action: 'IMPLEMENT_MISSING_SAFETY_FEATURES'
      });
    }
  }

  // Get all JavaScript files in the project
  async getAllJSFiles() {
    const files = [];
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (item.endsWith('.js') || item.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(this.projectRoot);
    return files;
  }

  // Generate integrity report
  generateReport() {
    const criticalViolations = this.violations.filter(v => v.severity === 'CRITICAL');
    const highViolations = this.violations.filter(v => v.severity === 'HIGH');
    const totalViolations = this.violations.length;
    
    const report = {
      timestamp: new Date().toISOString(),
      status: totalViolations === 0 ? 'PASS' : criticalViolations.length > 0 ? 'CRITICAL_FAIL' : 'WARNING',
      summary: {
        totalViolations,
        criticalViolations: criticalViolations.length,
        highViolations: highViolations.length,
        warnings: this.warnings.length
      },
      violations: this.violations,
      warnings: this.warnings,
      recommendation: this.getRecommendation()
    };

    this.printReport(report);
    return report;
  }

  // Get recommendation based on findings
  getRecommendation() {
    const criticalCount = this.violations.filter(v => v.severity === 'CRITICAL').length;
    
    if (criticalCount > 0) {
      return 'HALT_EXECUTION - Critical safety violations detected. System must not be deployed until all critical issues are resolved.';
    } else if (this.violations.length > 0) {
      return 'PROCEED_WITH_CAUTION - High priority issues detected. Review and fix before production deployment.';
    } else if (this.warnings.length > 0) {
      return 'MONITOR - System appears safe but has items that should be monitored.';
    } else {
      return 'APPROVED - System passes all integrity checks and is safe for deployment.';
    }
  }

  // Print formatted report
  printReport(report) {
    console.log('\n' + '='.repeat(70));
    console.log('🔒 PROJECT INTEGRITY CHECK REPORT');
    console.log('='.repeat(70));
    
    console.log(`📊 Status: ${report.status}`);
    console.log(`🕐 Timestamp: ${report.timestamp}`);
    console.log(`📈 Summary:`);
    console.log(`   • Total Violations: ${report.summary.totalViolations}`);
    console.log(`   • Critical: ${report.summary.criticalViolations}`);
    console.log(`   • High Priority: ${report.summary.highViolations}`);
    console.log(`   • Warnings: ${report.summary.warnings}`);

    if (report.violations.length > 0) {
      console.log('\n🚨 VIOLATIONS:');
      report.violations.forEach((violation, index) => {
        console.log(`${index + 1}. [${violation.severity}] ${violation.type}`);
        console.log(`   Message: ${violation.message}`);
        console.log(`   File: ${violation.file}`);
        console.log(`   Action: ${violation.action}`);
        console.log('');
      });
    }

    if (report.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      report.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. [${warning.severity}] ${warning.type}`);
        console.log(`   Message: ${warning.message}`);
        console.log(`   File: ${warning.file}`);
        console.log('');
      });
    }

    console.log(`\n💡 RECOMMENDATION: ${report.recommendation}`);
    console.log('='.repeat(70));
  }

  // Save report to file
  saveReport(report, filename = 'integrity-report.json') {
    const reportPath = path.join(this.projectRoot, filename);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
  }
}

// Auto-run integrity check if called directly
if (require.main === module) {
  const checker = new ProjectIntegrityChecker();
  checker.runIntegrityCheck().then(report => {
    if (report.status === 'CRITICAL_FAIL') {
      process.exit(1);
    }
  });
}

module.exports = ProjectIntegrityChecker;