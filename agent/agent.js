
#!/usr/bin/env node

/**
 * Unified Arbitrage Trading Agent
 * Consolidates all trading components into a single intelligent platform
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import all trading modules
const RealTradingEngine = require('./trading/realTradingEngine.js');
const UltimateArbitrageEngine = require('./trading/ultimateArbitrageEngine.js');
const FlashLoanExecutor = require('./trading/flashLoanExecutor.js');
const PriceOracle = require('./trading/priceOracle.js');
const RiskManager = require('./trading/riskManager.js');
const MultiChainArbitrage = require('./trading/multiChainArbitrage.js');
const TransactionMonitor = require('./monitoring/transactionMonitor.js');

class TradingAgent {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    this.isRunning = false;
    
    // Initialize all trading components
    this.tradingEngine = new RealTradingEngine();
    this.ultimateEngine = new UltimateArbitrageEngine();
    this.flashLoanExecutor = new FlashLoanExecutor();
    this.priceOracle = new PriceOracle();
    this.riskManager = new RiskManager();
    this.multiChain = new MultiChainArbitrage();
    this.monitor = new TransactionMonitor();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeAgent();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('client/dist'));
    this.app.use('/assets', express.static('attached_assets'));
  }

  setupRoutes() {
    // Agent status and control
    this.app.get('/api/agent/status', (req, res) => {
      res.json({
        status: this.isRunning ? 'active' : 'stopped',
        uptime: process.uptime(),
        components: {
          tradingEngine: this.tradingEngine.isActive,
          ultimateEngine: this.ultimateEngine.isActive,
          flashLoan: this.flashLoanExecutor.isReady,
          priceOracle: this.priceOracle.isConnected,
          riskManager: this.riskManager.isEnabled,
          multiChain: this.multiChain.isOperational,
          monitor: this.monitor.isRunning
        }
      });
    });

    // Start/Stop agent
    this.app.post('/api/agent/start', async (req, res) => {
      try {
        await this.startAgent();
        res.json({ success: true, message: 'Agent started successfully' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/agent/stop', async (req, res) => {
      try {
        await this.stopAgent();
        res.json({ success: true, message: 'Agent stopped successfully' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Trading operations
    this.app.post('/api/trading/execute', async (req, res) => {
      try {
        const { strategy, amount, pairs } = req.body;
        const result = await this.executeTrade(strategy, amount, pairs);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Live arbitrage opportunities
    this.app.get('/api/opportunities', async (req, res) => {
      try {
        const opportunities = await this.scanOpportunities();
        res.json(opportunities);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Portfolio and PnL
    this.app.get('/api/portfolio', async (req, res) => {
      try {
        const portfolio = await this.getPortfolioStatus();
        res.json(portfolio);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Serve React frontend
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'client/dist/index.html'));
    });
  }

  async initializeAgent() {
    console.log('🤖 Initializing Trading Agent...');
    
    try {
      // Initialize all components
      await this.priceOracle.initialize();
      await this.riskManager.initialize();
      await this.flashLoanExecutor.initialize();
      await this.tradingEngine.initialize();
      await this.ultimateEngine.initialize();
      await this.multiChain.initialize();
      await this.monitor.initialize();
      
      console.log('✅ All components initialized successfully');
    } catch (error) {
      console.error('❌ Agent initialization failed:', error);
    }
  }

  async startAgent() {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    console.log('🚀 Starting Trading Agent...');
    
    // Start all trading engines
    await this.tradingEngine.start();
    await this.ultimateEngine.start();
    await this.multiChain.start();
    await this.monitor.start();
    
    // Begin continuous opportunity scanning
    this.startOpportunityScanning();
    
    this.isRunning = true;
    console.log('✅ Trading Agent is now LIVE and scanning for opportunities');
  }

  async stopAgent() {
    if (!this.isRunning) {
      throw new Error('Agent is not running');
    }

    console.log('🛑 Stopping Trading Agent...');
    
    // Stop all trading engines
    await this.tradingEngine.stop();
    await this.ultimateEngine.stop();
    await this.multiChain.stop();
    await this.monitor.stop();
    
    // Stop opportunity scanning
    if (this.scanningInterval) {
      clearInterval(this.scanningInterval);
    }
    
    this.isRunning = false;
    console.log('⏹️ Trading Agent stopped');
  }

  startOpportunityScanning() {
    this.scanningInterval = setInterval(async () => {
      try {
        const opportunities = await this.scanOpportunities();
        
        // Auto-execute profitable opportunities
        for (const opportunity of opportunities) {
          if (opportunity.profitability > 0.5 && opportunity.risk < 0.3) {
            await this.autoExecuteOpportunity(opportunity);
          }
        }
      } catch (error) {
        console.error('Error in opportunity scanning:', error);
      }
    }, 5000); // Scan every 5 seconds
  }

  async scanOpportunities() {
    const opportunities = [];
    
    // Scan across all chains and DEXes
    const chains = ['ethereum', 'bsc', 'polygon', 'arbitrum'];
    
    for (const chain of chains) {
      try {
        const chainOpportunities = await this.multiChain.scanChain(chain);
        opportunities.push(...chainOpportunities);
      } catch (error) {
        console.error(`Error scanning ${chain}:`, error);
      }
    }
    
    // Filter and rank opportunities
    return opportunities
      .filter(op => op.profitability > 0.1)
      .sort((a, b) => b.profitability - a.profitability)
      .slice(0, 10);
  }

  async executeTrade(strategy, amount, pairs) {
    // Risk check
    const riskAssessment = await this.riskManager.assessRisk({
      strategy,
      amount,
      pairs
    });
    
    if (riskAssessment.riskLevel > 0.7) {
      throw new Error('Trade rejected: Risk level too high');
    }
    
    // Execute based on strategy
    switch (strategy) {
      case 'flashloan':
        return await this.flashLoanExecutor.execute(amount, pairs);
      case 'ultimate':
        return await this.ultimateEngine.executeMaxGainArbitrage({ amount, pairs });
      case 'multichain':
        return await this.multiChain.executeArbitrage(amount, pairs);
      default:
        return await this.tradingEngine.executeRealArbitrage({ amount, pairs });
    }
  }

  async autoExecuteOpportunity(opportunity) {
    try {
      console.log(`🎯 Auto-executing opportunity: ${opportunity.profit} profit`);
      
      const result = await this.executeTrade(
        opportunity.strategy,
        opportunity.amount,
        opportunity.pairs
      );
      
      if (result.success) {
        console.log(`✅ Auto-trade successful: ${result.profit} profit`);
      }
    } catch (error) {
      console.error('❌ Auto-trade failed:', error);
    }
  }

  async getPortfolioStatus() {
    return {
      totalValue: await this.tradingEngine.getTotalValue(),
      positions: await this.tradingEngine.getPositions(),
      pnl: await this.tradingEngine.getPnL(),
      trades: await this.monitor.getRecentTrades(),
      performance: await this.calculatePerformance()
    };
  }

  async calculatePerformance() {
    const trades = await this.monitor.getAllTrades();
    const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
    const successRate = trades.filter(t => t.profit > 0).length / trades.length;
    
    return {
      totalProfit,
      successRate,
      totalTrades: trades.length,
      avgProfit: totalProfit / trades.length
    };
  }

  start() {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`
🤖 TRADING AGENT PLATFORM ONLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Frontend: http://0.0.0.0:${this.port}
🔧 API: http://0.0.0.0:${this.port}/api
🚀 Status: Ready for trading
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
      
      // Auto-start the agent
      this.startAgent().catch(console.error);
    });
  }
}

// Create and start the unified agent
const agent = new TradingAgent();
agent.start();

module.exports = TradingAgent;
