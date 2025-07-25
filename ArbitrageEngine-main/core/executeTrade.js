// Trade Execution - Real trade execution with safety checks
const { ethers } = require('ethers');
const { logInfo, logError } = require('./logger');

class TradeExecutor {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.flashLoanContract = null;
    this.isInitialized = false;
  }

  // Initialize the executor
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load flash loan contract
      const contractAddress = process.env.FLASH_LOAN_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('Flash loan contract address not configured');
      }

      const contractABI = [
        'function executeArbitrage(address tokenIn, address tokenOut, uint256 amountIn, address dexA, address dexB, uint24 feeA, uint24 feeB, uint256 minProfitBps) external',
        'function calculatePotentialProfit(address tokenIn, address tokenOut, uint256 amountIn, address dexA, address dexB, uint24 feeA, uint24 feeB) external view returns (uint256)',
        'event ArbitrageExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 profit, address indexed executor)'
      ];

      this.flashLoanContract = new ethers.Contract(contractAddress, contractABI, this.wallet);
      this.isInitialized = true;
      
      logInfo('Trade executor initialized successfully');
    } catch (error) {
      logError('Failed to initialize trade executor:', error.message);
      throw error;
    }
  }

  // Execute real arbitrage trade
  async executeRealTrade(tokenPair, simulation) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Final safety checks
      const safetyCheck = await this.performSafetyChecks(tokenPair, simulation);
      if (!safetyCheck.safe) {
        return {
          success: false,
          error: `Safety check failed: ${safetyCheck.reason}`,
          txHash: null
        };
      }

      // Prepare transaction parameters
      const txParams = await this.prepareTxParams(tokenPair, simulation);
      
      // Execute the transaction
      const tx = await this.executeTransaction(txParams);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      logInfo(`✅ Trade executed successfully: ${receipt.transactionHash}`);
      
      return {
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
        profit: simulation.netProfit
      };

    } catch (error) {
      logError(`❌ Trade execution failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        txHash: null
      };
    }
  }

  // Perform final safety checks before execution
  async performSafetyChecks(tokenPair, simulation) {
    try {
      // Check 1: Verify simulation is still valid
      if (!simulation.isValid || simulation.netProfit.lte(0)) {
        return { safe: false, reason: 'Simulation no longer valid' };
      }

      // Check 2: Verify gas price hasn't spiked
      const currentGasPrice = await this.provider.getGasPrice();
      const maxAcceptableGasPrice = ethers.utils.parseUnits('200', 'gwei');
      
      if (currentGasPrice.gt(maxAcceptableGasPrice)) {
        return { safe: false, reason: 'Gas price too high' };
      }

      // Check 3: Check wallet balance
      const balance = await this.wallet.getBalance();
      const requiredBalance = currentGasPrice.mul(simulation.estimatedGasUsed);
      
      if (balance.lt(requiredBalance)) {
        return { safe: false, reason: 'Insufficient balance for gas' };
      }

      // Check 4: Verify contract is still operational
      const contractCode = await this.provider.getCode(this.flashLoanContract.address);
      if (contractCode === '0x') {
        return { safe: false, reason: 'Flash loan contract not found' };
      }

      // Check 5: Network congestion check
      const pendingTxCount = await this.provider.getTransactionCount(this.wallet.address, 'pending');
      const confirmedTxCount = await this.provider.getTransactionCount(this.wallet.address, 'latest');
      
      if (pendingTxCount - confirmedTxCount > 5) {
        return { safe: false, reason: 'Too many pending transactions' };
      }

      return { safe: true, reason: 'All safety checks passed' };

    } catch (error) {
      return { safe: false, reason: `Safety check error: ${error.message}` };
    }
  }

  // Prepare transaction parameters
  async prepareTxParams(tokenPair, simulation) {
    const [tokenA, tokenB] = tokenPair.split('/');
    
    // Get token addresses
    const tokenInAddress = this.getTokenAddress(tokenA);
    const tokenOutAddress = this.getTokenAddress(tokenB);
    
    // Determine DEX addresses (simplified)
    const dexA = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; // Uniswap V2
    const dexB = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'; // SushiSwap
    
    // Fee tiers for Uniswap V3 (if applicable)
    const feeA = 3000; // 0.3%
    const feeB = 3000; // 0.3%
    
    // Minimum profit in basis points (0.1% = 10 bps)
    const minProfitBps = 10;
    
    // Get current gas price with optimization
    const gasPrice = await this.getOptimizedGasPrice();
    
    return {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      amountIn: simulation.marketData.amount,
      dexA,
      dexB,
      feeA,
      feeB,
      minProfitBps,
      gasPrice,
      gasLimit: simulation.estimatedGasUsed.mul(120).div(100) // 20% buffer
    };
  }

  // Execute the transaction
  async executeTransaction(params) {
    try {
      // Prepare transaction options
      const txOptions = {
        gasPrice: params.gasPrice,
        gasLimit: params.gasLimit,
        value: 0 // No ETH value for flash loan arbitrage
      };

      // Call the flash loan contract
      const tx = await this.flashLoanContract.executeArbitrage(
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        params.dexA,
        params.dexB,
        params.feeA,
        params.feeB,
        params.minProfitBps,
        txOptions
      );

      logInfo(`📤 Transaction submitted: ${tx.hash}`);
      return tx;

    } catch (error) {
      // Handle specific error types
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds for transaction');
      } else if (error.code === 'REPLACEMENT_UNDERPRICED') {
        throw new Error('Gas price too low, transaction replaced');
      } else if (error.message.includes('revert')) {
        throw new Error(`Contract reverted: ${error.message}`);
      } else {
        throw new Error(`Transaction failed: ${error.message}`);
      }
    }
  }

  // Get optimized gas price
  async getOptimizedGasPrice() {
    try {
      const networkGasPrice = await this.provider.getGasPrice();
      
      // Add 10% buffer for faster confirmation
      const optimizedGasPrice = networkGasPrice.mul(110).div(100);
      
      // Cap at maximum acceptable gas price
      const maxGasPrice = ethers.utils.parseUnits('200', 'gwei');
      
      return optimizedGasPrice.gt(maxGasPrice) ? maxGasPrice : optimizedGasPrice;
    } catch (error) {
      logError('Gas price optimization failed:', error.message);
      return ethers.utils.parseUnits('50', 'gwei'); // Fallback
    }
  }

  // Get token address from symbol
  getTokenAddress(symbol) {
    const tokenAddresses = {
      'ETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'USDC': '0xA0b86a33E6417c4c4c4c4c4c4c4c4c4c4c4c4c4c', // Placeholder
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
    };

    return tokenAddresses[symbol.toUpperCase()] || symbol;
  }

  // Monitor transaction status
  async monitorTransaction(txHash, maxWaitTime = 300000) { // 5 minutes max
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const receipt = await this.provider.getTransactionReceipt(txHash);
        
        if (receipt) {
          if (receipt.status === 1) {
            logInfo(`✅ Transaction confirmed: ${txHash}`);
            return { success: true, receipt };
          } else {
            logError(`❌ Transaction failed: ${txHash}`);
            return { success: false, receipt };
          }
        }
        
        // Wait 5 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        logError('Error monitoring transaction:', error.message);
      }
    }
    
    return { success: false, error: 'Transaction timeout' };
  }

  // Estimate gas for arbitrage
  async estimateGas(params) {
    try {
      const gasEstimate = await this.flashLoanContract.estimateGas.executeArbitrage(
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        params.dexA,
        params.dexB,
        params.feeA,
        params.feeB,
        params.minProfitBps
      );

      return gasEstimate;
    } catch (error) {
      logError('Gas estimation failed:', error.message);
      return ethers.BigNumber.from('500000'); // Fallback estimate
    }
  }

  // Check if arbitrage is still profitable on-chain
  async checkOnChainProfitability(params) {
    try {
      const potentialProfit = await this.flashLoanContract.calculatePotentialProfit(
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        params.dexA,
        params.dexB,
        params.feeA,
        params.feeB
      );

      return {
        profitable: potentialProfit.gt(0),
        profit: potentialProfit,
        profitEth: ethers.utils.formatEther(potentialProfit)
      };
    } catch (error) {
      logError('On-chain profitability check failed:', error.message);
      return { profitable: false, profit: ethers.BigNumber.from(0) };
    }
  }

  // Emergency stop function
  async emergencyStop() {
    try {
      // Cancel any pending transactions by sending a 0 ETH transaction with higher gas
      const nonce = await this.wallet.getTransactionCount('pending');
      const gasPrice = await this.provider.getGasPrice();
      
      const cancelTx = await this.wallet.sendTransaction({
        to: this.wallet.address,
        value: 0,
        gasPrice: gasPrice.mul(150).div(100), // 50% higher gas price
        gasLimit: 21000,
        nonce: nonce
      });

      logInfo(`🛑 Emergency stop transaction: ${cancelTx.hash}`);
      return cancelTx;
    } catch (error) {
      logError('Emergency stop failed:', error.message);
      throw error;
    }
  }

  // Get executor statistics
  getStats() {
    return {
      isInitialized: this.isInitialized,
      walletAddress: this.wallet.address,
      contractAddress: this.flashLoanContract?.address,
      networkId: this.provider.network?.chainId
    };
  }
}

// Create singleton instance
const tradeExecutor = new TradeExecutor();

// Export functions for backward compatibility
async function executeRealTrade(tokenPair, simulation) {
  return tradeExecutor.executeRealTrade(tokenPair, simulation);
}

async function initializeExecutor() {
  return tradeExecutor.initialize();
}

module.exports = {
  TradeExecutor,
  tradeExecutor,
  executeRealTrade,
  initializeExecutor
};