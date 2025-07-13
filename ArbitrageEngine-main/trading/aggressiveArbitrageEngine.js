
import { ethers } from 'ethers';
import { BlockchainProvider } from '../providers/blockchain.js';
import { FlashLoanExecutor } from './flashLoanExecutor.js';
import { TransactionMonitor } from '../monitoring/transactionMonitor.js';

export class AggressiveArbitrageEngine {
  constructor() {
    this.blockchain = new BlockchainProvider();
    this.isRunning = false;
    this.aggressiveMode = true;
    this.maxConcurrentTrades = 5; // Multiple simultaneous trades
    this.scanInterval = 1000; // Scan every 1 second
    this.maxGasPrice = ethers.utils.parseUnits('200', 'gwei'); // Higher gas for speed
    this.activeTrades = [];
    
    // Supercharged providers with maximum liquidity
    this.providers = {
      balancer: { fee: 0, maxLiquidity: 10000000000 }, // $10B max
      dydx: { fee: 0, maxLiquidity: 5000000000 },     // $5B max
      aave: { fee: 0.0009, maxLiquidity: 20000000000 } // $20B max
    };
    
    // Extended DEX list for maximum opportunities
    this.dexes = [
      { name: 'Uniswap V2', router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' },
      { name: 'Uniswap V3', router: '0xE592427A0AEce92De3Edee1F18E0157C05861564' },
      { name: 'SushiSwap', router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F' },
      { name: 'PancakeSwap', router: '0x10ED43C718714eb63d5aA57B78B54704E256024E' },
      { name: '1inch', router: '0x11111112542D85B3EF69AE05771c2dCCff4fAa26' },
      { name: 'Curve', router: '0x99a58482BD75cbab83b27EC03CA68fF489b5788f' },
      { name: 'Balancer', router: '0xBA12222222228d8Ba445958a75a0704d566BF2C8' }
    ];
    
    // Extended token list for more opportunities
    this.tokens = [
      { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
      { symbol: 'USDC', address: '0xA0b86a33E6417aeb71' },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
      { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
      { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
      { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
      { symbol: 'LINK', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA' },
      { symbol: 'AAVE', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9' }
    ];
  }

  async initialize(privateKey) {
    try {
      const signer = await this.blockchain.connectWallet(privateKey);
      this.signer = signer;
      this.monitor = new TransactionMonitor(this.blockchain.provider);
      
      console.log('🚀⚡ AGGRESSIVE Arbitrage Engine Initialized');
      console.log('💀 SUPERCHARGED MODE: MAXIMUM LEVERAGE & FREQUENCY');
      console.log('💰 Wallet:', signer.address);
      
      return { success: true, address: signer.address };
    } catch (error) {
      console.error('❌ Aggressive initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getMaxFlashLoanAmount(balance) {
    // SUPERCHARGED: Use 95% of balance with 5000x leverage
    const baseAmount = balance * 0.95;
    const leverageMultiplier = 5000; // Extreme leverage
    return baseAmount * leverageMultiplier;
  }

  async scanAggressiveOpportunities() {
    const opportunities = [];
    const maxFlashLoan = await this.getMaxFlashLoanAmount(100); // Assume $100 base

    // Scan EVERY token pair combination
    for (const tokenA of this.tokens) {
      for (const tokenB of this.tokens) {
        if (tokenA.address === tokenB.address) continue;
        
        try {
          const opportunity = await this.findAggressiveOpportunity(tokenA, tokenB, maxFlashLoan);
          if (opportunity && opportunity.profit > 1) { // Any profit over $1
            opportunities.push(opportunity);
          }
        } catch (error) {
          // Silently continue - aggressive mode doesn't stop for errors
        }
      }
    }

    // Return ALL profitable opportunities, sorted by profit
    return opportunities.sort((a, b) => b.profit - a.profit);
  }

  async findAggressiveOpportunity(tokenA, tokenB, maxAmount) {
    try {
      const amount = ethers.utils.parseEther('10'); // Test with 10 ETH equivalent
      const prices = {};

      // Get prices from ALL DEXes simultaneously
      const pricePromises = this.dexes.map(async (dex) => {
        try {
          const price = await this.getPrice(dex, tokenA.address, tokenB.address, amount);
          return { dex: dex.name, price };
        } catch (error) {
          return { dex: dex.name, price: null };
        }
      });

      const priceResults = await Promise.all(pricePromises);
      
      // Filter valid prices
      const validPrices = priceResults.filter(p => p.price !== null);
      if (validPrices.length < 2) return null;

      // Find maximum spread
      const sortedPrices = validPrices.sort((a, b) => a.price - b.price);
      const buyDex = sortedPrices[0];
      const sellDex = sortedPrices[sortedPrices.length - 1];

      const buyPrice = buyDex.price;
      const sellPrice = sellDex.price;
      const priceDiff = sellPrice - buyPrice;
      
      if (priceDiff <= 0) return null;

      // Use FREE flash loan providers (Balancer/dYdX)
      const freeProvider = this.providers.balancer;
      const flashLoanFee = maxAmount * freeProvider.fee; // $0 for Balancer
      
      // Minimal gas costs for aggressive execution
      const gasEstimate = 0.16; // 16 cents as discussed
      
      const grossProfit = (priceDiff / buyPrice) * maxAmount;
      const netProfit = grossProfit - flashLoanFee - gasEstimate;

      return {
        id: `AGG-${tokenA.symbol}-${tokenB.symbol}-${Date.now()}`,
        tokenA,
        tokenB,
        buyDex: buyDex.dex,
        sellDex: sellDex.dex,
        buyPrice,
        sellPrice,
        maxAmount,
        grossProfit,
        profit: netProfit,
        spread: ((priceDiff / buyPrice) * 100).toFixed(4),
        flashLoanProvider: 'balancer',
        gasEstimate,
        timestamp: Date.now(),
        aggressive: true
      };
    } catch (error) {
      return null;
    }
  }

  async getPrice(dex, tokenIn, tokenOut, amountIn) {
    const routerABI = [
      'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
    ];

    const router = new ethers.Contract(dex.router, routerABI, this.signer);
    const path = [tokenIn, tokenOut];
    
    const amounts = await router.getAmountsOut(amountIn, path);
    return parseFloat(ethers.utils.formatEther(amounts[1]));
  }

  async executeAggressiveArbitrage(opportunity) {
    console.log(`⚡💀 AGGRESSIVE EXECUTION: ${opportunity.id}`);
    console.log(`💰 Expected profit: $${opportunity.profit.toFixed(2)}`);
    console.log(`📊 Spread: ${opportunity.spread}%`);
    console.log(`🔥 Flash loan: $${opportunity.maxAmount.toFixed(0)}`);

    try {
      // Execute with MAXIMUM speed - no safety checks
      const flashLoanAmount = ethers.utils.parseEther(opportunity.maxAmount.toString());
      
      const params = this.encodeArbitrageParams({
        tokenIn: opportunity.tokenA.address,
        tokenOut: opportunity.tokenB.address,
        amountIn: flashLoanAmount,
        dexA: this.getDexRouter(opportunity.buyDex),
        dexB: this.getDexRouter(opportunity.sellDex),
        feeA: 3000,
        feeB: 3000,
        minProfitBps: 10 // Only 0.1% minimum profit for aggressive mode
      });

      const executor = new FlashLoanExecutor(null, this.signer);
      const result = await executor.executeArbitrage({
        token: opportunity.tokenA.address,
        amount: flashLoanAmount,
        buyExchange: opportunity.buyDex,
        sellExchange: opportunity.sellDex,
        params
      });

      return result;
    } catch (error) {
      console.error('💀 Aggressive execution failed (continuing anyway):', error.message);
      return { success: false, error: error.message };
    }
  }

  getDexRouter(dexName) {
    const dex = this.dexes.find(d => d.name === dexName);
    return dex ? dex.router : this.dexes[0].router;
  }

  encodeArbitrageParams(params) {
    return ethers.utils.defaultAbiCoder.encode(
      ['address', 'address', 'uint256', 'address', 'address', 'uint24', 'uint24', 'uint256'],
      [
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        params.dexA,
        params.dexB,
        params.feeA,
        params.feeB,
        params.minProfitBps
      ]
    );
  }

  async startAggressiveTrading() {
    this.isRunning = true;
    console.log('💀⚡ STARTING AGGRESSIVE TRADING MODE');
    console.log('🚨 WARNING: MAXIMUM LEVERAGE & FREQUENCY');
    console.log('🔥 SCANNING EVERY 1 SECOND');

    while (this.isRunning) {
      try {
        const opportunities = await this.scanAggressiveOpportunities();
        
        if (opportunities.length > 0) {
          console.log(`🎯 Found ${opportunities.length} aggressive opportunities`);
          
          // Execute TOP 3 opportunities simultaneously
          const topOpportunities = opportunities.slice(0, 3);
          const executionPromises = topOpportunities.map(opp => 
            this.executeAggressiveArbitrage(opp)
          );
          
          await Promise.allSettled(executionPromises);
        }

        // Ultra-fast scanning - only 1 second delay
        await new Promise(resolve => setTimeout(resolve, this.scanInterval));
      } catch (error) {
        console.error('💀 Aggressive trading error (continuing):', error.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  stopAggressiveTrading() {
    this.isRunning = false;
    console.log('🛑 Aggressive trading stopped');
  }

  getAggressiveStats() {
    return {
      mode: 'SUPERCHARGED_AGGRESSIVE',
      maxLeverage: '5000x',
      scanInterval: '1 second',
      maxConcurrentTrades: this.maxConcurrentTrades,
      activeTrades: this.activeTrades.length,
      providers: Object.keys(this.providers),
      dexes: this.dexes.length,
      tokens: this.tokens.length,
      totalOpportunities: this.tokens.length * (this.tokens.length - 1) * this.dexes.length
    };
  }
}
