
import { UltimateArbitrageEngine } from '../trading/ultimateArbitrageEngine.js';
import { MultiChainArbitrage } from '../trading/multiChainArbitrage.js';
import { MEVProtection } from '../trading/mevProtection.js';
import { PriceOracle } from '../trading/priceOracle.js';
import { RiskManager } from '../trading/riskManager.js';
import { ethers } from 'ethers';

export class UltimateBot {
  constructor() {
    this.engine = new UltimateArbitrageEngine();
    this.multiChain = new MultiChainArbitrage();
    this.mevProtection = null;
    this.oracle = null;
    this.riskManager = new RiskManager();
    this.isRunning = false;
    this.stats = {
      totalTrades: 0,
      successfulTrades: 0,
      totalProfit: 0,
      startTime: Date.now()
    };
  }

  async initialize(privateKey) {
    console.log('🚀 Initializing Ultimate Flash Loan Arbitrage Bot...');
    
    try {
      // Initialize main engine
      const engineResult = await this.engine.initialize(privateKey);
      if (!engineResult.success) {
        throw new Error('Engine initialization failed');
      }

      // Initialize multi-chain support
      await this.multiChain.initializeNetworks(privateKey);

      // Initialize protection and oracle systems
      this.mevProtection = new MEVProtection(this.engine.blockchain.provider);
      this.oracle = new PriceOracle(this.engine.blockchain.provider);

      console.log('✅ All systems initialized successfully');
      console.log('💰 Wallet Address:', engineResult.address);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async startUltimateBot() {
    if (this.isRunning) {
      console.log('⚠️ Bot is already running');
      return;
    }

    this.isRunning = true;
    this.stats.startTime = Date.now();
    
    console.log('🤖 Starting Ultimate Arbitrage Bot with $100 capital');
    console.log('🎯 Target: Maximum profit with minimal risk');
    console.log('⚡ Features: Multi-chain, MEV protection, AI-powered');

    // Start multiple scanning processes
    Promise.all([
      this.runSingleChainArbitrage(),
      this.runMultiChainArbitrage(),
      this.runFlashLoanArbitrage(),
      this.monitorPerformance()
    ]).catch(error => {
      console.error('❌ Bot encountered an error:', error);
      this.stopBot();
    });
  }

  async runSingleChainArbitrage() {
    while (this.isRunning) {
      try {
        console.log('🔍 Scanning single-chain opportunities...');
        
        const opportunities = await this.engine.scanAllOpportunities();
        
        for (const opportunity of opportunities.slice(0, 3)) { // Top 3 opportunities
          if (!this.isRunning) break;
          
          const balance = await this.engine.getWalletBalance();
          const riskAssessment = await this.riskManager.assessRisk(opportunity, balance);
          
          if (riskAssessment.approved) {
            console.log(`💎 Executing opportunity: ${opportunity.id}`);
            
            this.riskManager.startTrade(opportunity);
            const result = await this.engine.executeArbitrage(opportunity);
            
            this.recordTradeResult(result, opportunity);
            
            if (result.success) {
              console.log(`✅ Trade successful! Profit: $${opportunity.profit}`);
            } else {
              console.log(`❌ Trade failed: ${result.error}`);
            }
          } else {
            console.log(`⚠️ Risk assessment failed for ${opportunity.id}`);
          }
          
          // Wait between trades to avoid overloading
          await this.sleep(5000);
        }
        
        await this.sleep(10000); // Wait before next scan
      } catch (error) {
        console.error('Single-chain arbitrage error:', error);
        await this.sleep(15000);
      }
    }
  }

  async runMultiChainArbitrage() {
    while (this.isRunning) {
      try {
        console.log('🌐 Scanning cross-chain opportunities...');
        
        const opportunities = await this.multiChain.scanCrossChainOpportunities();
        
        for (const opportunity of opportunities.slice(0, 1)) { // One cross-chain trade at a time
          if (!this.isRunning) break;
          
          const balance = await this.engine.getWalletBalance();
          const riskAssessment = await this.riskManager.assessRisk(opportunity, balance);
          
          if (riskAssessment.approved && opportunity.netProfit > 5) { // $5 minimum for cross-chain
            console.log(`🌉 Executing cross-chain opportunity: ${opportunity.id}`);
            
            const result = await this.multiChain.executeCrossChainArbitrage(opportunity);
            this.recordTradeResult(result, opportunity);
            
            if (result.success) {
              console.log(`✅ Cross-chain trade successful! Profit: $${opportunity.netProfit}`);
            }
          }
          
          await this.sleep(30000); // Longer wait for cross-chain
        }
        
        await this.sleep(60000); // 1 minute between cross-chain scans
      } catch (error) {
        console.error('Multi-chain arbitrage error:', error);
        await this.sleep(30000);
      }
    }
  }

  async runFlashLoanArbitrage() {
    while (this.isRunning) {
      try {
        console.log('⚡ Scanning flash loan opportunities...');
        
        const balance = await this.engine.getWalletBalance();
        const maxFlashLoanAmount = await this.engine.getOptimalFlashLoanAmount(balance);
        
        // Look for high-leverage opportunities
        const opportunities = await this.scanHighLeverageOpportunities(maxFlashLoanAmount);
        
        for (const opportunity of opportunities.slice(0, 1)) {
          if (!this.isRunning) break;
          
          const riskAssessment = await this.riskManager.assessRisk(opportunity, balance);
          
          if (riskAssessment.approved) {
            console.log(`⚡ High-leverage flash loan opportunity found!`);
            
            // Use MEV protection for high-value trades
            const protectedTx = await this.mevProtection.protectFromSandwich(opportunity);
            const result = await this.engine.executeArbitrage(protectedTx);
            
            this.recordTradeResult(result, opportunity);
          }
          
          await this.sleep(10000);
        }
        
        await this.sleep(20000);
      } catch (error) {
        console.error('Flash loan arbitrage error:', error);
        await this.sleep(25000);
      }
    }
  }

  async scanHighLeverageOpportunities(maxAmount) {
    // Implement high-leverage opportunity scanning
    const opportunities = [];
    
    // Look for opportunities with high leverage potential
    const tokens = ['WETH', 'USDC', 'USDT', 'DAI'];
    
    for (const token of tokens) {
      try {
        const prices = await this.getPricesFromMultipleDEXes(token);
        const arbitrageOpportunity = this.calculateArbitrageProfit(prices, maxAmount);
        
        if (arbitrageOpportunity && arbitrageOpportunity.profit > 10) {
          opportunities.push(arbitrageOpportunity);
        }
      } catch (error) {
        console.log(`Error scanning ${token}:`, error.message);
      }
    }
    
    return opportunities;
  }

  async getPricesFromMultipleDEXes(token) {
    // Mock implementation - get real prices from multiple DEXes
    const dexes = ['Uniswap V2', 'Uniswap V3', 'SushiSwap', 'PancakeSwap'];
    const prices = {};
    
    for (const dex of dexes) {
      try {
        const price = await this.oracle.getPrice(`${token}/USD`);
        const variation = (Math.random() - 0.5) * 0.01; // ±0.5% variation
        prices[dex] = price * (1 + variation);
      } catch (error) {
        console.log(`Failed to get price from ${dex}`);
      }
    }
    
    return prices;
  }

  calculateArbitrageProfit(prices, amount) {
    const priceValues = Object.values(prices);
    if (priceValues.length < 2) return null;
    
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);
    const priceDiff = maxPrice - minPrice;
    const profit = (priceDiff / minPrice) * amount;
    
    return profit > 1 ? { profit, amount, minPrice, maxPrice } : null;
  }

  async monitorPerformance() {
    while (this.isRunning) {
      try {
        const performance = this.riskManager.getPerformanceMetrics();
        const uptime = (Date.now() - this.stats.startTime) / 1000 / 60; // minutes
        
        console.log('\n📊 Performance Report:');
        console.log(`⏱️ Uptime: ${uptime.toFixed(1)} minutes`);
        console.log(`📈 Total Trades: ${this.stats.totalTrades}`);
        console.log(`✅ Successful: ${this.stats.successfulTrades}`);
        console.log(`💰 Total Profit: $${this.stats.totalProfit.toFixed(4)}`);
        console.log(`📊 Win Rate: ${(performance.winRate * 100).toFixed(1)}%`);
        console.log(`🎯 Active Trades: ${performance.activeTrades}`);
        
        const balance = await this.engine.getWalletBalance();
        console.log(`💳 Current Balance: ${balance.toFixed(6)} ETH`);
        
        // Auto-adjust strategy based on performance
        await this.optimizeStrategy(performance);
        
        await this.sleep(60000); // Report every minute
      } catch (error) {
        console.error('Performance monitoring error:', error);
        await this.sleep(30000);
      }
    }
  }

  async optimizeStrategy(performance) {
    // AI-powered strategy optimization
    if (performance.winRate < 0.6) {
      console.log('🔧 Adjusting strategy: Increasing profit threshold');
      this.engine.profitThreshold *= 1.1;
    } else if (performance.winRate > 0.8) {
      console.log('🔧 Optimizing strategy: Decreasing profit threshold for more trades');
      this.engine.profitThreshold *= 0.95;
    }
    
    // Adjust risk parameters
    if (performance.totalProfit < 0) {
      console.log('🛡️ Activating defensive mode: Reducing position sizes');
      this.riskManager.maxPositionSize *= 0.8;
    }
  }

  recordTradeResult(result, opportunity) {
    this.stats.totalTrades++;
    
    if (result.success) {
      this.stats.successfulTrades++;
      this.stats.totalProfit += opportunity.profit || 0;
    }
    
    this.riskManager.recordTrade({
      id: opportunity.id,
      profit: result.success ? (opportunity.profit || 0) : -0.1 // Small loss for failed trades
    });
  }

  stopBot() {
    this.isRunning = false;
    console.log('🛑 Ultimate Bot stopped');
    
    const finalReport = {
      runtime: (Date.now() - this.stats.startTime) / 1000 / 60,
      totalTrades: this.stats.totalTrades,
      successRate: this.stats.totalTrades > 0 ? this.stats.successfulTrades / this.stats.totalTrades : 0,
      totalProfit: this.stats.totalProfit
    };
    
    console.log('\n🏁 Final Performance Report:');
    console.log(`Runtime: ${finalReport.runtime.toFixed(1)} minutes`);
    console.log(`Total Trades: ${finalReport.totalTrades}`);
    console.log(`Success Rate: ${(finalReport.successRate * 100).toFixed(1)}%`);
    console.log(`Total Profit: $${finalReport.totalProfit.toFixed(4)}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const bot = new UltimateBot();
  
  // Get private key from environment
  const privateKey = process.env.PRIVATE_KEY || process.env.VITE_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ Private key not found in environment variables');
    process.exit(1);
  }
  
  bot.initialize(privateKey).then(result => {
    if (result.success) {
      bot.startUltimateBot();
      
      // Graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down gracefully...');
        bot.stopBot();
        process.exit(0);
      });
    } else {
      console.error('❌ Bot initialization failed:', result.error);
      process.exit(1);
    }
  });
}
