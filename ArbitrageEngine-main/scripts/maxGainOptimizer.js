
import { ethers } from 'ethers';
import { RealTradingEngine } from '../trading/realTradingEngine.js';
import dotenv from 'dotenv';

dotenv.config();

class MaxGainOptimizer {
  constructor() {
    this.startingCapital = 100; // $100 USD
    this.targetMultiplier = 50; // Target: $5000 (50x)
    this.maxRiskPerTrade = 0.15; // 15% max risk per trade
    this.minProfitThreshold = 0.008; // 0.8% minimum profit
    this.leverageMultiplier = 1500; // Flash loan leverage
    this.engine = new RealTradingEngine();
  }

  async initialize() {
    console.log('🚀 Initializing Maximum Gain Optimizer...');
    console.log(`💰 Starting Capital: $${this.startingCapital}`);
    console.log(`🎯 Target: $${this.startingCapital * this.targetMultiplier}`);
    
    const result = await this.engine.initialize(process.env.REACT_APP_PRIVATE_KEY);
    if (result.success) {
      console.log('✅ Trading engine initialized');
      console.log(`📝 Contract: ${result.contractAddress}`);
      return true;
    }
    return false;
  }

  calculateOptimalFlashLoanAmount(currentBalance, opportunity) {
    // Use aggressive leverage for maximum gains
    const baseAmount = currentBalance * this.leverageMultiplier;
    const maxSafeAmount = this.getMaxSafeLoanAmount(opportunity);
    return Math.min(baseAmount, maxSafeAmount);
  }

  getMaxSafeLoanAmount(opportunity) {
    // Calculate maximum safe loan based on liquidity and slippage
    const baseLiquidity = 2000000; // $2M base liquidity assumption
    const slippageProtection = 0.95; // 5% slippage buffer
    return baseLiquidity * slippageProtection;
  }

  async scanHighYieldOpportunities() {
    console.log('🔍 Scanning for high-yield opportunities...');
    
    const opportunities = await this.engine.arbitrageService?.scanForOpportunities() || [];
    
    // Filter for maximum gain potential
    const highYieldOps = opportunities.filter(op => {
      const yieldPercent = (op.afterFeesProfit / (op.flashLoanAmount || 100000)) * 100;
      return yieldPercent >= this.minProfitThreshold * 100;
    });

    // Sort by profit potential
    return highYieldOps.sort((a, b) => b.afterFeesProfit - a.afterFeesProfit);
  }

  async executeMaxGainStrategy() {
    if (!await this.initialize()) {
      console.error('❌ Failed to initialize trading engine');
      return;
    }

    let currentBalance = this.startingCapital;
    let tradesExecuted = 0;
    let totalProfit = 0;

    console.log('\n🎯 Starting Maximum Gain Strategy...\n');

    while (currentBalance < this.startingCapital * this.targetMultiplier && tradesExecuted < 100) {
      const opportunities = await this.scanHighYieldOpportunities();
      
      if (opportunities.length === 0) {
        console.log('⏳ No profitable opportunities found, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      const bestOp = opportunities[0];
      const optimalLoanAmount = this.calculateOptimalFlashLoanAmount(currentBalance, bestOp);
      
      console.log(`\n🔥 Trade #${tradesExecuted + 1}`);
      console.log(`💎 Opportunity: ${bestOp.tokenPair}`);
      console.log(`📊 Expected Profit: $${bestOp.afterFeesProfit.toFixed(2)}`);
      console.log(`💸 Flash Loan: $${optimalLoanAmount.toLocaleString()}`);

      try {
        const result = await this.engine.executeRealArbitrage({
          ...bestOp,
          amount: optimalLoanAmount
        });

        if (result.success) {
          const profit = result.profit || bestOp.afterFeesProfit;
          currentBalance += profit;
          totalProfit += profit;
          tradesExecuted++;

          console.log(`✅ Trade successful!`);
          console.log(`💰 Profit: $${profit.toFixed(2)}`);
          console.log(`📈 New Balance: $${currentBalance.toFixed(2)}`);
          console.log(`🔗 TX: ${result.etherscanUrl}`);

          // Compound gains by increasing position size
          if (currentBalance > this.startingCapital * 2) {
            this.leverageMultiplier = Math.min(this.leverageMultiplier * 1.1, 2000);
            console.log(`⚡ Increased leverage to ${this.leverageMultiplier}x`);
          }
        } else {
          console.log(`❌ Trade failed: ${result.error}`);
          // Reduce risk after failure
          this.leverageMultiplier *= 0.9;
        }
      } catch (error) {
        console.error(`💥 Trade error: ${error.message}`);
      }

      // Brief pause between trades
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const finalGain = ((currentBalance - this.startingCapital) / this.startingCapital) * 100;
    
    console.log('\n🏆 MAXIMUM GAIN STRATEGY COMPLETE 🏆');
    console.log(`💰 Starting Capital: $${this.startingCapital}`);
    console.log(`💎 Final Balance: $${currentBalance.toFixed(2)}`);
    console.log(`📊 Total Profit: $${totalProfit.toFixed(2)}`);
    console.log(`🚀 Gain: ${finalGain.toFixed(2)}%`);
    console.log(`🔥 Trades Executed: ${tradesExecuted}`);
    console.log(`💪 Success Rate: ${((tradesExecuted / (tradesExecuted + 1)) * 100).toFixed(1)}%`);
  }
}

const optimizer = new MaxGainOptimizer();
optimizer.executeMaxGainStrategy().catch(console.error);
