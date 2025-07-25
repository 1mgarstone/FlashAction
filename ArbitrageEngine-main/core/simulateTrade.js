// Trade Simulation - Comprehensive simulation before execution
const { ethers } = require('ethers');
const { getSpread } = require('./dexScanner');
const { getCurrentFlashLoanFee } = require('./flashloanAPI');

class TradeSimulator {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.simulationCache = new Map();
    this.cacheDuration = 30000; // 30 seconds
  }

  // Main simulation function
  async simulateTrade(params) {
    const {
      pair,
      amount,
      gasPrice,
      flashLoanFee = 0,
      slippageTolerance = 0.005, // 0.5%
      maxGasLimit = 500000
    } = params;

    const cacheKey = `sim-${pair}-${amount.toString()}-${gasPrice.toString()}`;
    
    // Check cache
    if (this.simulationCache.has(cacheKey)) {
      const cached = this.simulationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.result;
      }
    }

    try {
      const simulation = await this.runFullSimulation(params);
      
      // Cache result
      this.simulationCache.set(cacheKey, {
        result: simulation,
        timestamp: Date.now()
      });

      return simulation;
    } catch (error) {
      console.error('Simulation error:', error.message);
      return {
        isValid: false,
        error: error.message,
        netProfit: ethers.BigNumber.from(0),
        profitAfterFees: 0
      };
    }
  }

  // Run comprehensive simulation
  async runFullSimulation(params) {
    const { pair, amount, gasPrice, flashLoanFee, slippageTolerance, maxGasLimit } = params;
    
    // Step 1: Get current market data
    const marketData = await this.getMarketData(pair, amount);
    if (!marketData.isValid) {
      return {
        isValid: false,
        error: 'Invalid market data',
        netProfit: ethers.BigNumber.from(0),
        profitAfterFees: 0
      };
    }

    // Step 2: Simulate flash loan
    const flashLoanSimulation = await this.simulateFlashLoan(amount, flashLoanFee);
    
    // Step 3: Simulate DEX trades
    const tradeSimulation = await this.simulateDEXTrades(
      pair,
      amount,
      marketData,
      slippageTolerance
    );

    // Step 4: Calculate gas costs
    const gasSimulation = await this.simulateGasCosts(gasPrice, maxGasLimit);

    // Step 5: Calculate net profit
    const profitCalculation = this.calculateNetProfit(
      tradeSimulation,
      flashLoanSimulation,
      gasSimulation
    );

    // Step 6: Risk assessment
    const riskAssessment = await this.assessRisks(params, profitCalculation);

    return {
      isValid: profitCalculation.netProfit.gt(0) && riskAssessment.acceptable,
      netProfit: profitCalculation.netProfit,
      profitAfterFees: parseFloat(ethers.utils.formatEther(profitCalculation.netProfit)),
      grossProfit: profitCalculation.grossProfit,
      flashLoanCost: flashLoanSimulation.cost,
      gasCost: gasSimulation.cost,
      totalCosts: profitCalculation.totalCosts,
      expectedSlippage: tradeSimulation.expectedSlippage,
      priceImpact: tradeSimulation.priceImpact,
      riskScore: riskAssessment.score,
      estimatedGasUsed: gasSimulation.estimatedGas,
      executionTime: this.estimateExecutionTime(),
      marketData,
      breakdown: {
        buyPrice: tradeSimulation.buyPrice,
        sellPrice: tradeSimulation.sellPrice,
        spread: tradeSimulation.spread,
        flashLoanFee: flashLoanFee,
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei') + ' gwei'
      }
    };
  }

  // Get market data for simulation
  async getMarketData(pair, amount) {
    try {
      const spread = await getSpread(pair, amount);
      
      if (spread <= 0) {
        return { isValid: false, error: 'No spread available' };
      }

      // Get individual DEX prices (simplified)
      const [tokenA, tokenB] = pair.split('/');
      
      return {
        isValid: true,
        spread,
        tokenA,
        tokenB,
        amount,
        timestamp: Date.now()
      };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  // Simulate flash loan costs
  async simulateFlashLoan(amount, feeRate) {
    const cost = amount.mul(Math.floor(feeRate * 10000)).div(10000);
    
    return {
      amount,
      feeRate,
      cost,
      costEth: parseFloat(ethers.utils.formatEther(cost))
    };
  }

  // Simulate DEX trades
  async simulateDEXTrades(pair, amount, marketData, slippageTolerance) {
    try {
      // Simulate buying on cheaper DEX
      const buySlippage = Math.random() * slippageTolerance; // Random slippage up to tolerance
      const buyPrice = 1800 - (1800 * buySlippage); // Simplified price calculation
      
      // Simulate selling on expensive DEX
      const sellSlippage = Math.random() * slippageTolerance;
      const sellPrice = 1820 - (1820 * sellSlippage);
      
      const grossProfit = (sellPrice - buyPrice) * parseFloat(ethers.utils.formatEther(amount));
      const priceImpact = (buySlippage + sellSlippage) / 2;
      
      return {
        buyPrice,
        sellPrice,
        grossProfit,
        expectedSlippage: (buySlippage + sellSlippage) / 2,
        priceImpact,
        spread: ((sellPrice - buyPrice) / buyPrice) * 100
      };
    } catch (error) {
      throw new Error(`DEX trade simulation failed: ${error.message}`);
    }
  }

  // Simulate gas costs
  async simulateGasCosts(gasPrice, maxGasLimit) {
    // Estimate gas usage for arbitrage transaction
    const estimatedGas = ethers.BigNumber.from('350000'); // Base estimate
    const actualGas = estimatedGas.gt(maxGasLimit) ? maxGasLimit : estimatedGas;
    const cost = gasPrice.mul(actualGas);
    
    return {
      gasPrice,
      estimatedGas: actualGas,
      cost,
      costEth: parseFloat(ethers.utils.formatEther(cost)),
      withinLimit: estimatedGas.lte(maxGasLimit)
    };
  }

  // Calculate net profit after all costs
  calculateNetProfit(tradeSimulation, flashLoanSimulation, gasSimulation) {
    const grossProfitWei = ethers.utils.parseEther(tradeSimulation.grossProfit.toString());
    const totalCosts = flashLoanSimulation.cost.add(gasSimulation.cost);
    const netProfit = grossProfitWei.sub(totalCosts);
    
    return {
      grossProfit: grossProfitWei,
      totalCosts,
      netProfit,
      profitMargin: grossProfitWei.gt(0) ? 
        netProfit.mul(100).div(grossProfitWei).toNumber() : 0
    };
  }

  // Assess risks of the trade
  async assessRisks(params, profitCalculation) {
    let riskScore = 0;
    const risks = [];

    // Profit margin risk
    const profitMargin = profitCalculation.profitMargin;
    if (profitMargin < 5) {
      riskScore += 30;
      risks.push('Low profit margin');
    }

    // Gas price risk
    const gasPriceGwei = parseFloat(ethers.utils.formatUnits(params.gasPrice, 'gwei'));
    if (gasPriceGwei > 100) {
      riskScore += 25;
      risks.push('High gas price');
    }

    // Amount risk (large trades have higher slippage risk)
    const amountEth = parseFloat(ethers.utils.formatEther(params.amount));
    if (amountEth > 10) {
      riskScore += 20;
      risks.push('Large trade size');
    }

    // Market volatility risk (simplified)
    const volatilityRisk = Math.random() * 20; // Random volatility score
    riskScore += volatilityRisk;

    return {
      score: Math.min(riskScore, 100),
      acceptable: riskScore < 70,
      risks,
      recommendation: riskScore < 30 ? 'LOW_RISK' : 
                     riskScore < 70 ? 'MEDIUM_RISK' : 'HIGH_RISK'
    };
  }

  // Estimate execution time
  estimateExecutionTime() {
    // Base time for flash loan + 2 swaps + repayment
    const baseTime = 15000; // 15 seconds
    const networkDelay = Math.random() * 5000; // 0-5 seconds random delay
    
    return Math.floor(baseTime + networkDelay);
  }

  // Simulate multiple scenarios
  async simulateMultipleScenarios(params, scenarioCount = 5) {
    const scenarios = [];
    
    for (let i = 0; i < scenarioCount; i++) {
      // Vary parameters slightly for each scenario
      const scenarioParams = {
        ...params,
        gasPrice: params.gasPrice.mul(90 + i * 5).div(100), // 90% to 110% of original
        slippageTolerance: params.slippageTolerance * (0.8 + i * 0.1) // 80% to 120%
      };
      
      const result = await this.simulateTrade(scenarioParams);
      scenarios.push({
        scenario: i + 1,
        params: scenarioParams,
        result
      });
    }

    // Calculate statistics
    const validScenarios = scenarios.filter(s => s.result.isValid);
    const avgProfit = validScenarios.length > 0 ?
      validScenarios.reduce((sum, s) => sum + s.result.profitAfterFees, 0) / validScenarios.length : 0;
    
    return {
      scenarios,
      statistics: {
        totalScenarios: scenarioCount,
        validScenarios: validScenarios.length,
        successRate: (validScenarios.length / scenarioCount) * 100,
        averageProfit: avgProfit,
        bestCase: validScenarios.length > 0 ? 
          Math.max(...validScenarios.map(s => s.result.profitAfterFees)) : 0,
        worstCase: validScenarios.length > 0 ?
          Math.min(...validScenarios.map(s => s.result.profitAfterFees)) : 0
      }
    };
  }

  // Validate simulation parameters
  validateParams(params) {
    const errors = [];

    if (!params.pair || !params.pair.includes('/')) {
      errors.push('Invalid token pair format');
    }

    if (!params.amount || params.amount.lte(0)) {
      errors.push('Invalid amount');
    }

    if (!params.gasPrice || params.gasPrice.lte(0)) {
      errors.push('Invalid gas price');
    }

    if (params.slippageTolerance && (params.slippageTolerance < 0 || params.slippageTolerance > 0.1)) {
      errors.push('Slippage tolerance must be between 0 and 10%');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Clear simulation cache
  clearCache() {
    this.simulationCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.simulationCache.size,
      entries: Array.from(this.simulationCache.keys())
    };
  }
}

// Create singleton instance
const tradeSimulator = new TradeSimulator();

// Export functions for backward compatibility
async function simulateTrade(params) {
  return tradeSimulator.simulateTrade(params);
}

async function simulateMultipleScenarios(params, count) {
  return tradeSimulator.simulateMultipleScenarios(params, count);
}

module.exports = {
  TradeSimulator,
  tradeSimulator,
  simulateTrade,
  simulateMultipleScenarios
};