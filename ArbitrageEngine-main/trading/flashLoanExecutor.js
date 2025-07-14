import { ethers } from 'ethers';

export class FlashLoanExecutor {
  constructor(contract, signer) {
    this.contract = contract;
    this.signer = signer;
  }

  async executeArbitrage(opportunity) {
    const { token, amount, buyExchange, sellExchange } = opportunity;

    const params = this.encodeArbitrageParams({
      tokenIn: token,
      tokenOut: 'USDC',
      dexA: buyExchange,
      dexB: sellExchange,
      fee: 3000,
      amountIn: amount
    });

    try {
      const tx = await this.contract.executeFlashLoan(
        token,
        amount,
        params,
        {
          gasLimit: 500000,
          gasPrice: await this.signer.provider.getGasPrice()
        }
      );
      console.log('Transaction submitted:', tx.hash);
      console.log('View on Etherscan:', `https://etherscan.io/tx/${tx.hash}`);
      const receipt = await tx.wait();
      console.log('Transaction confirmed in block:', receipt.blockNumber);
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString()
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runBacktest(startingAmount = 100, minAmount = 10) {
    console.log(`🔍 Starting backtest with $${startingAmount} USD (minimum: $${minAmount} USD)`);
    
    if (startingAmount < minAmount) {
      return {
        success: false,
        error: `Starting amount $${startingAmount} is below minimum $${minAmount} required for profitable flash loan arbitrage`
      };
    }

    const results = {
      startingBalance: startingAmount,
      currentBalance: startingAmount,
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      trades: []
    };

    // Simulate 10 arbitrage opportunities
    for (let i = 0; i < 10; i++) {
      const opportunity = {
        token: 'USDC',
        amount: results.currentBalance * 0.8, // Use 80% of current balance
        buyExchange: 'Uniswap',
        sellExchange: 'Sushiswap',
        expectedProfit: (Math.random() * 0.06 - 0.01) // -1% to +5% profit range
      };

      const gasFeesUSD = 15 + (Math.random() * 10); // $15-25 gas fees
      const flashLoanFee = opportunity.amount * 0.0005; // 0.05% Aave fee
      const totalFees = gasFeesUSD + flashLoanFee;

      const grossProfit = opportunity.amount * opportunity.expectedProfit;
      const netProfit = grossProfit - totalFees;

      results.totalTrades++;
      
      if (netProfit > 0) {
        results.successfulTrades++;
        results.totalProfit += netProfit;
        results.currentBalance += netProfit;
      } else {
        results.failedTrades++;
        results.totalLoss += Math.abs(netProfit);
        results.currentBalance += netProfit; // Subtract loss
      }

      results.trades.push({
        trade: i + 1,
        amount: opportunity.amount,
        gasFeesUSD,
        flashLoanFee,
        grossProfit,
        netProfit,
        balanceAfter: results.currentBalance,
        success: netProfit > 0
      });

      // Stop if balance goes below minimum
      if (results.currentBalance < minAmount) {
        console.log(`💀 Backtest stopped: Balance $${results.currentBalance.toFixed(2)} below minimum $${minAmount}`);
        break;
      }
    }

    const finalResults = {
      ...results,
      netGain: results.currentBalance - results.startingBalance,
      winRate: (results.successfulTrades / results.totalTrades) * 100,
      profitFactor: results.totalProfit / Math.max(results.totalLoss, 1)
    };

    console.log(`📊 Backtest Results:`);
    console.log(`Starting Balance: $${finalResults.startingBalance}`);
    console.log(`Final Balance: $${finalResults.currentBalance.toFixed(2)}`);
    console.log(`Net Gain/Loss: $${finalResults.netGain.toFixed(2)}`);
    console.log(`Win Rate: ${finalResults.winRate.toFixed(1)}%`);
    console.log(`Total Trades: ${finalResults.totalTrades}`);
    console.log(`Successful: ${finalResults.successfulTrades} | Failed: ${finalResults.failedTrades}`);

    return finalResults;
  }

  encodeArbitrageParams(params) {
    return ethers.utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint24', 'uint256'],
      [params.tokenIn, params.tokenOut, params.dexA, params.dexB, params.fee, params.amountIn]
    );
  }
}
