// System Launcher - Main entry point for the enhanced arbitrage system
const EnhancedArbitrageEngine = require('./arbitrageEngine');
const { PredictiveWatchlist } = require('./predictiveWatchlist');
const ProjectIntegrityChecker = require('./projectIntegrityCheck');
const GasOracle = require('./gasOracle');
const { logInfo, logError, logSystem } = require('./logger');

class SystemLauncher {
  constructor() {
    this.arbitrageEngine = new EnhancedArbitrageEngine();
    this.predictiveWatchlist = new PredictiveWatchlist();
    this.integrityChecker = new ProjectIntegrityChecker();
    this.gasOracle = new GasOracle();
    
    this.isRunning = false;
    this.startTime = null;
    
    // Default token pairs to monitor
    this.tokenPairs = [
      'ETH/USDT',
      'ETH/USDC', 
      'ETH/DAI',
      'WBTC/ETH',
      'WBTC/USDT',
      'DAI/USDC',
      'USDT/USDC'
    ];

    // System configuration
    this.config = {
      integrityCheckOnStart: true,
      enablePredictiveWatchlist: true,
      gasMonitoring: true,
      maxConcurrentTrades: 3,
      emergencyStopOnErrors: 5,
      healthCheckInterval: 60000 // 1 minute
    };

    this.errorCount = 0;
    this.stats = {
      totalTrades: 0,
      successfulTrades: 0,
      totalProfit: 0,
      uptime: 0
    };
  }

  // Main system initialization and launch
  async launch() {
    try {
      logSystem('🚀 Starting Enhanced Flash Loan Arbitrage System...');
      
      // Phase 1: System Integrity Check
      if (this.config.integrityCheckOnStart) {
        await this.runIntegrityCheck();
      }

      // Phase 2: Initialize Components
      await this.initializeComponents();

      // Phase 3: Start Monitoring Systems
      await this.startMonitoringSystems();

      // Phase 4: Start Main Arbitrage Engine
      await this.startArbitrageEngine();

      // Phase 5: Start Health Monitoring
      this.startHealthMonitoring();

      this.isRunning = true;
      this.startTime = Date.now();
      
      logSystem('✅ System launched successfully and operational');
      this.printSystemStatus();

    } catch (error) {
      logError('❌ System launch failed:', error.message);
      await this.emergencyShutdown();
      throw error;
    }
  }

  // Run system integrity check
  async runIntegrityCheck() {
    logSystem('🔍 Running system integrity check...');
    
    const report = await this.integrityChecker.runIntegrityCheck();
    
    if (report.status === 'CRITICAL_FAIL') {
      throw new Error('System integrity check failed with critical violations. Cannot proceed.');
    }
    
    if (report.status === 'WARNING') {
      logSystem('⚠️  System integrity check passed with warnings. Proceeding with caution.');
    } else {
      logSystem('✅ System integrity check passed');
    }
  }

  // Initialize all system components
  async initializeComponents() {
    logSystem('🔧 Initializing system components...');

    try {
      // Initialize gas oracle
      logSystem('Initializing gas oracle...');
      // Gas oracle is ready to use

      // Initialize arbitrage engine
      logSystem('Initializing arbitrage engine...');
      // Engine is ready

      // Initialize predictive watchlist
      if (this.config.enablePredictiveWatchlist) {
        logSystem('Initializing predictive watchlist...');
        for (const pair of this.tokenPairs) {
          this.predictiveWatchlist.addPair(pair);
        }
      }

      logSystem('✅ All components initialized successfully');
    } catch (error) {
      throw new Error(`Component initialization failed: ${error.message}`);
    }
  }

  // Start monitoring systems
  async startMonitoringSystems() {
    logSystem('📡 Starting monitoring systems...');

    try {
      // Start predictive watchlist monitoring
      if (this.config.enablePredictiveWatchlist) {
        logSystem('Starting predictive watchlist monitoring...');
        this.predictiveWatchlist.startMonitoring();
      }

      // Start gas price monitoring
      if (this.config.gasMonitoring) {
        logSystem('Starting gas price monitoring...');
        this.gasOracle.startGasMonitoring((gasData) => {
          if (Math.abs(gasData.changePercent) > 20) {
            logSystem(`⛽ Significant gas price change: ${gasData.changePercent.toFixed(1)}%`);
          }
        });
      }

      logSystem('✅ Monitoring systems started');
    } catch (error) {
      throw new Error(`Monitoring system startup failed: ${error.message}`);
    }
  }

  // Start main arbitrage engine
  async startArbitrageEngine() {
    logSystem('💰 Starting main arbitrage engine...');

    try {
      // Start the arbitrage engine in background
      this.arbitrageEngine.startMonitoring(this.tokenPairs).catch(error => {
        logError('Arbitrage engine error:', error.message);
        this.handleEngineError(error);
      });

      logSystem('✅ Arbitrage engine started');
    } catch (error) {
      throw new Error(`Arbitrage engine startup failed: ${error.message}`);
    }
  }

  // Start health monitoring
  startHealthMonitoring() {
    logSystem('🏥 Starting health monitoring...');

    const healthCheck = async () => {
      try {
        const health = await this.performHealthCheck();
        
        if (!health.healthy) {
          logSystem(`⚠️  Health check warning: ${health.issues.join(', ')}`);
          
          if (health.critical) {
            logError('Critical health issues detected, initiating emergency shutdown');
            await this.emergencyShutdown();
          }
        }

        // Update uptime
        if (this.startTime) {
          this.stats.uptime = Date.now() - this.startTime;
        }

      } catch (error) {
        logError('Health check failed:', error.message);
        this.errorCount++;
        
        if (this.errorCount >= this.config.emergencyStopOnErrors) {
          logError('Too many errors detected, initiating emergency shutdown');
          await this.emergencyShutdown();
        }
      }
    };

    // Run initial health check
    healthCheck();

    // Schedule periodic health checks
    this.healthCheckInterval = setInterval(healthCheck, this.config.healthCheckInterval);
    
    logSystem('✅ Health monitoring started');
  }

  // Perform comprehensive health check
  async performHealthCheck() {
    const issues = [];
    let critical = false;

    try {
      // Check arbitrage engine
      if (!this.arbitrageEngine.isRunning) {
        issues.push('Arbitrage engine not running');
        critical = true;
      }

      // Check gas prices
      const gasPrice = await this.gasOracle.getLiveGasPrice();
      const gasPriceGwei = parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei'));
      
      if (gasPriceGwei > 200) {
        issues.push(`High gas price: ${gasPriceGwei.toFixed(1)} gwei`);
      }

      // Check predictive watchlist
      if (this.config.enablePredictiveWatchlist && !this.predictiveWatchlist.isRunning) {
        issues.push('Predictive watchlist not running');
      }

      // Check memory usage
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;
      
      if (memUsageMB > 500) { // 500MB threshold
        issues.push(`High memory usage: ${memUsageMB.toFixed(1)}MB`);
      }

      // Check error count
      if (this.errorCount > 3) {
        issues.push(`High error count: ${this.errorCount}`);
      }

      return {
        healthy: issues.length === 0,
        critical,
        issues,
        stats: {
          gasPrice: gasPriceGwei.toFixed(1) + ' gwei',
          memoryUsage: memUsageMB.toFixed(1) + 'MB',
          uptime: this.formatUptime(this.stats.uptime),
          errorCount: this.errorCount
        }
      };

    } catch (error) {
      return {
        healthy: false,
        critical: true,
        issues: [`Health check error: ${error.message}`],
        stats: {}
      };
    }
  }

  // Handle arbitrage engine errors
  handleEngineError(error) {
    this.errorCount++;
    logError(`Engine error #${this.errorCount}:`, error.message);

    // Attempt restart if not too many errors
    if (this.errorCount < this.config.emergencyStopOnErrors) {
      logSystem('Attempting to restart arbitrage engine...');
      
      setTimeout(() => {
        this.arbitrageEngine.startMonitoring(this.tokenPairs).catch(restartError => {
          logError('Engine restart failed:', restartError.message);
          this.handleEngineError(restartError);
        });
      }, 10000); // Wait 10 seconds before restart
    }
  }

  // Emergency shutdown
  async emergencyShutdown() {
    logSystem('🚨 EMERGENCY SHUTDOWN INITIATED');

    try {
      this.isRunning = false;

      // Stop arbitrage engine
      if (this.arbitrageEngine) {
        this.arbitrageEngine.stop();
      }

      // Stop predictive watchlist
      if (this.predictiveWatchlist) {
        this.predictiveWatchlist.stop();
      }

      // Clear health check interval
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      // Save final statistics
      await this.saveStatistics();

      logSystem('🛑 Emergency shutdown completed');
    } catch (error) {
      logError('Error during emergency shutdown:', error.message);
    }
  }

  // Graceful shutdown
  async shutdown() {
    logSystem('🔄 Initiating graceful shutdown...');

    try {
      this.isRunning = false;

      // Stop components gracefully
      logSystem('Stopping arbitrage engine...');
      this.arbitrageEngine.stop();

      logSystem('Stopping predictive watchlist...');
      this.predictiveWatchlist.stop();

      // Clear intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      // Save final statistics
      await this.saveStatistics();

      // Generate final report
      await this.generateFinalReport();

      logSystem('✅ Graceful shutdown completed');
    } catch (error) {
      logError('Error during graceful shutdown:', error.message);
    }
  }

  // Print system status
  printSystemStatus() {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 ENHANCED FLASH LOAN ARBITRAGE SYSTEM - OPERATIONAL');
    console.log('='.repeat(70));
    console.log(`📊 Monitoring ${this.tokenPairs.length} token pairs`);
    console.log(`⚡ Gas oracle: ACTIVE`);
    console.log(`🔮 Predictive watchlist: ${this.config.enablePredictiveWatchlist ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🛡️  Safety systems: ACTIVE`);
    console.log(`🏥 Health monitoring: ACTIVE`);
    console.log(`📈 Performance tracking: ACTIVE`);
    console.log('='.repeat(70));
    console.log('System is now scanning for arbitrage opportunities...\n');
  }

  // Get system statistics
  getSystemStats() {
    const engineStats = this.arbitrageEngine.getStats();
    const predictiveStats = this.predictiveWatchlist.getSummary();

    return {
      system: {
        isRunning: this.isRunning,
        uptime: this.formatUptime(this.stats.uptime),
        startTime: this.startTime,
        errorCount: this.errorCount
      },
      arbitrage: engineStats,
      predictive: predictiveStats,
      performance: {
        totalTrades: this.stats.totalTrades,
        successfulTrades: this.stats.successfulTrades,
        successRate: this.stats.totalTrades > 0 ? 
          (this.stats.successfulTrades / this.stats.totalTrades * 100).toFixed(2) + '%' : '0%',
        totalProfit: this.stats.totalProfit.toFixed(4) + ' ETH'
      }
    };
  }

  // Format uptime
  formatUptime(ms) {
    if (!ms) return '0s';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Save statistics
  async saveStatistics() {
    try {
      const stats = this.getSystemStats();
      const statsFile = path.join(__dirname, '../logs/system-stats.json');
      
      fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
      logSystem('Statistics saved');
    } catch (error) {
      logError('Failed to save statistics:', error.message);
    }
  }

  // Generate final report
  async generateFinalReport() {
    try {
      const stats = this.getSystemStats();
      const report = {
        timestamp: new Date().toISOString(),
        sessionDuration: this.formatUptime(this.stats.uptime),
        summary: stats,
        recommendations: this.generateRecommendations(stats)
      };

      const reportFile = path.join(__dirname, '../logs/final-report.json');
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      
      logSystem('Final report generated');
    } catch (error) {
      logError('Failed to generate final report:', error.message);
    }
  }

  // Generate recommendations based on performance
  generateRecommendations(stats) {
    const recommendations = [];

    if (parseFloat(stats.performance.successRate) < 80) {
      recommendations.push('Consider adjusting profit thresholds or improving market analysis');
    }

    if (this.errorCount > 5) {
      recommendations.push('Review error logs and improve error handling');
    }

    if (stats.arbitrage.successfulPairs < this.tokenPairs.length / 2) {
      recommendations.push('Consider adding more profitable token pairs');
    }

    return recommendations;
  }
}

// Handle process signals for graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Received SIGINT, initiating graceful shutdown...');
  if (global.systemLauncher) {
    await global.systemLauncher.shutdown();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Received SIGTERM, initiating graceful shutdown...');
  if (global.systemLauncher) {
    await global.systemLauncher.shutdown();
  }
  process.exit(0);
});

// Auto-launch if called directly
if (require.main === module) {
  const launcher = new SystemLauncher();
  global.systemLauncher = launcher;
  
  launcher.launch().catch(error => {
    console.error('❌ System launch failed:', error.message);
    process.exit(1);
  });
}

module.exports = SystemLauncher;