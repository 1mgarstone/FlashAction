import { ethers } from 'ethers';

export class TransactionMonitor {
  constructor(provider) {
    this.provider = provider;
    this.activeTransactions = new Map();
  }

  async monitorTransaction(txHash) {
    console.log(`Monitoring transaction: ${txHash}`);

    return new Promise((resolve, reject) => {
      const checkTransaction = async () => {
        try {
          const receipt = await this.provider.getTransactionReceipt(txHash);
          if (receipt) {
            const result = {
              txHash: txHash,
              blockNumber: receipt.blockNumber,
              status: receipt.status,
              gasUsed: receipt.gasUsed.toString(),
              etherscanUrl: `https://etherscan.io/tx/${txHash}`
            };
            console.log('Transaction confirmed:', result);
            resolve(result);
          } else {
            setTimeout(checkTransaction, 3000);
          }
        } catch (error) {
          reject(error);
        }
      };

      checkTransaction();
    });
  }

  async getTransactionDetails(txHash) {
    const tx = await this.provider.getTransaction(txHash);
    const receipt = await this.provider.getTransactionReceipt(txHash);

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: ethers.utils.formatEther(tx.value),
      gasPrice: ethers.utils.formatUnits(tx.gasPrice, 'gwei'),
      gasLimit: tx.gasLimit.toString(),
      gasUsed: receipt ? receipt.gasUsed.toString() : 'Pending',
      status: receipt ? (receipt.status === 1 ? 'Success' : 'Failed') : 'Pending',
      blockNumber: receipt ? receipt.blockNumber : 'Pending'
    };
  }
}
export default class TransactionMonitor {
  constructor() {
    this.isRunning = false;
    this.transactions = [];
    this.activeMonitors = new Map();
  }

  async initialize() {
    try {
      console.log('🔍 Initializing Transaction Monitor...');
      
      this.isRunning = true;
      console.log('✅ Transaction Monitor initialized');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Transaction Monitor initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async start() {
    this.isRunning = true;
    console.log('🚀 Transaction Monitor started');
  }

  async stop() {
    this.isRunning = false;
    console.log('⏹️ Transaction Monitor stopped');
  }

  monitorTransaction(txHash) {
    console.log(`📊 Monitoring transaction: ${txHash}`);
    
    // Simulate transaction monitoring
    const monitor = {
      txHash,
      status: 'pending',
      startTime: Date.now()
    };
    
    this.activeMonitors.set(txHash, monitor);
    
    // Simulate confirmation after 30 seconds
    setTimeout(() => {
      monitor.status = 'confirmed';
      monitor.endTime = Date.now();
      this.transactions.push(monitor);
      console.log(`✅ Transaction confirmed: ${txHash}`);
    }, 30000);
    
    return monitor;
  }

  getRecentTrades() {
    return this.transactions.slice(-10); // Last 10 trades
  }

  getAllTrades() {
    return this.transactions;
  }

  getTransactionStatus(txHash) {
    const monitor = this.activeMonitors.get(txHash);
    return monitor ? monitor.status : 'not_found';
  }
}
