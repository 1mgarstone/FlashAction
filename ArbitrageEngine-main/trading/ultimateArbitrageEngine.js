
import { ethers } from 'ethers';
import { BlockchainProvider } from '../providers/blockchain.js';
import { FlashLoanExecutor } from './flashLoanExecutor.js';
import { TransactionMonitor } from '../monitoring/transactionMonitor.js';

export class UltimateArbitrageEngine {
  constructor() {
    this.blockchain = new BlockchainProvider();
    this.isRunning = false;
    this.profitThreshold = 0.5; // Minimum $0.50 profit
    this.maxGasPrice = ethers.utils.parseUnits('50', 'gwei');
    this.providers = {
      aave: { fee: 0.0009, maxLiquidity: 2000000000 },
      balancer: { fee: 0, maxLiquidity: 1000000000 },
      dydx: { fee: 0, maxLiquidity: 500000000 }
    };
    this.dexes = [
      { name: 'Uniswap V2', router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' },
      { name: 'Uniswap V3', router: '0xE592427A0AEce92De3Edee1F18E0157C05861564' },
      { name: 'SushiSwap', router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F' },
      { name: 'PancakeSwap', router: '0x10ED43C718714eb63d5aA57B78B54704E256024E' }
    ];
  }

  async initialize(privateKey) {
    try {
      const signer = await this.blockchain.connectWallet(privateKey);
      this.signer = signer;
      this.monitor = new TransactionMonitor(this.blockchain.provider);
      
      console.log('🚀 Ultimate Arbitrage Engine Initialized');
      console.log('💰 Wallet:', signer.address);
      
      return { success: true, address: signer.address };
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async scanAllOpportunities() {
    const opportunities = [];
    const tokens = [
      { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
      { symbol: 'USDC', address: '0xA0b86a33E6417aeb71' },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
      { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' }
    ];

    for (const tokenA of tokens) {
      for (const tokenB of tokens) {
        if (tokenA.address === tokenB.address) continue;
        
        const opportunity = await this.findArbitrageOpportunity(tokenA, tokenB);
        if (opportunity && opportunity.profit > this.profitThreshold) {
          opportunities.push(opportunity);
        }
      }
    }

    return opportunities.sort((a, b) => b.profit - a.profit);
  }

  async findArbitrageOpportunity(tokenA, tokenB) {
    try {
      const amount = ethers.utils.parseEther('1'); // Test with 1 ETH equivalent
      const prices = {};

      // Get prices from all DEXes
      for (const dex of this.dexes) {
        try {
          const price = await this.getPrice(dex, tokenA.address, tokenB.address, amount);
          prices[dex.name] = price;
        } catch (error) {
          console.log(`⚠️ Failed to get price from ${dex.name}:`, error.message);
        }
      }

      // Find best buy and sell opportunities
      const priceEntries = Object.entries(prices);
      if (priceEntries.length < 2) return null;

      const buyDex = priceEntries.reduce((min, curr) => 
        curr[1] < min[1] ? curr : min
      );
      const sellDex = priceEntries.reduce((max, curr) => 
        curr[1] > max[1] ? curr : max
      );

      if (buyDex[0] === sellDex[0]) return null;

      const buyPrice = buyDex[1];
      const sellPrice = sellDex[1];
      const priceDiff = sellPrice - buyPrice;
      
      if (priceDiff <= 0) return null;

      // Calculate flash loan costs
      const bestProvider = this.getBestFlashLoanProvider(amount);
      const flashLoanFee = amount * bestProvider.fee;
      
      // Estimate gas costs
      const gasEstimate = await this.estimateGasCost();
      
      const profit = priceDiff - flashLoanFee - gasEstimate;

      if (profit > this.profitThreshold) {
        return {
          id: `${tokenA.symbol}-${tokenB.symbol}-${Date.now()}`,
          tokenA,
          tokenB,
          buyDex: buyDex[0],
          sellDex: sellDex[0],
          buyPrice,
          sellPrice,
          profit,
          flashLoanProvider: bestProvider.name,
          timestamp: Date.now()
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding opportunity:', error);
      return null;
    }
  }

  async getPrice(dex, tokenIn, tokenOut, amountIn) {
    const routerABI = [
      'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
    ];

    const router = new ethers.Contract(dex.router, routerABI, this.signer);
    const path = [tokenIn, tokenOut];
    
    try {
      const amounts = await router.getAmountsOut(amountIn, path);
      return parseFloat(ethers.utils.formatEther(amounts[1]));
    } catch (error) {
      throw new Error(`Failed to get price from ${dex.name}: ${error.message}`);
    }
  }

  getBestFlashLoanProvider(amount) {
    return Object.entries(this.providers)
      .filter(([_, provider]) => amount <= provider.maxLiquidity)
      .sort((a, b) => a[1].fee - b[1].fee)[0] || 
      { name: 'balancer', fee: 0, maxLiquidity: 1000000000 };
  }

  async estimateGasCost() {
    const gasPrice = await this.signer.provider.getGasPrice();
    const estimatedGas = 500000; // Conservative estimate for flash loan arbitrage
    const gasCostWei = gasPrice.mul(estimatedGas);
    return parseFloat(ethers.utils.formatEther(gasCostWei));
  }

  async executeArbitrage(opportunity) {
    console.log(`🎯 Executing arbitrage: ${opportunity.id}`);
    console.log(`💰 Expected profit: $${opportunity.profit.toFixed(4)}`);

    try {
      const flashLoanAmount = ethers.utils.parseEther('1');
      
      const params = this.encodeArbitrageParams({
        tokenIn: opportunity.tokenA.address,
        tokenOut: opportunity.tokenB.address,
        amountIn: flashLoanAmount,
        dexA: this.getDexRouter(opportunity.buyDex),
        dexB: this.getDexRouter(opportunity.sellDex),
        feeA: 3000,
        feeB: 3000,
        minProfitBps: 50 // 0.5% minimum profit
      });

      const executor = new FlashLoanExecutor(null, this.signer);
      const result = await executor.executeArbitrage({
        token: opportunity.tokenA.address,
        amount: flashLoanAmount,
        buyExchange: opportunity.buyDex,
        sellExchange: opportunity.sellDex,
        params
      });

      if (result.success) {
        console.log(`✅ Arbitrage executed successfully!`);
        console.log(`📊 TX Hash: ${result.txHash}`);
        console.log(`🔗 Etherscan: https://etherscan.io/tx/${result.txHash}`);
      }

      return result;
    } catch (error) {
      console.error('❌ Arbitrage execution failed:', error);
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

  async startAutoTrading() {
    if (this.isRunning) {
      console.log('⚠️ Auto trading already running');
      return;
    }

    this.isRunning = true;
    console.log('🤖 Starting automatic arbitrage trading...');

    while (this.isRunning) {
      try {
        const opportunities = await this.scanAllOpportunities();
        
        if (opportunities.length > 0) {
          console.log(`🔍 Found ${opportunities.length} opportunities`);
          
          // Execute the most profitable opportunity
          const bestOpportunity = opportunities[0];
          await this.executeArbitrage(bestOpportunity);
        } else {
          console.log('⏳ No profitable opportunities found, scanning again...');
        }

        // Wait 10 seconds before next scan
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error) {
        console.error('❌ Auto trading error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  stopAutoTrading() {
    this.isRunning = false;
    console.log('🛑 Auto trading stopped');
  }

  async getWalletBalance() {
    const balance = await this.signer.getBalance();
    return parseFloat(ethers.utils.formatEther(balance));
  }

  async getOptimalFlashLoanAmount(balance) {
    // Use 80% of balance with 1200x leverage for maximum profit
    const baseAmount = balance * 0.8;
    const leverageMultiplier = 1200;
    return baseAmount * leverageMultiplier;
  }
}
