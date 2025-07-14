import * as ethers from 'ethers';
import FlashLoanArbitrageABI from './FlashLoanArbitrage.json';

export interface DeploymentResult {
  address: string;
  contract: ethers.Contract;
  deploymentTx: string;
  gasUsed: string;
  deploymentCost: string;
}

export class ContractDeployer {
  private signer: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;

  constructor(signer: ethers.Wallet) {
    this.signer = signer;
    this.provider = signer.provider as ethers.JsonRpcProvider;
  }

  async deployFlashLoanArbitrageContract(): Promise<DeploymentResult> {
    try {
      console.log('🚀 Starting FlashLoanArbitrage contract deployment...');
      console.log('📝 Deployer address:', this.signer.address);
      
      // Check deployer balance
      const balance = await this.signer.getBalance();
      console.log('💰 Deployer balance:', ethers.utils.formatEther(balance), 'ETH');
      
      if (balance.lt(ethers.utils.parseEther('0.1'))) {
        throw new Error('Insufficient balance for deployment. Need at least 0.1 ETH');
      }

      // Create contract factory
      const factory = new ethers.ContractFactory(
        FlashLoanArbitrageABI.abi,
        FlashLoanArbitrageABI.bytecode,
        this.signer
      );

      // Estimate gas for deployment
      const deploymentData = factory.getDeployTransaction();
      const gasEstimate = await this.provider.estimateGas(deploymentData);
      const gasPrice = await this.provider.getGasPrice();
      const deploymentCost = gasEstimate.mul(gasPrice);
      
      console.log('⛽ Estimated gas:', gasEstimate.toString());
      console.log('💸 Estimated cost:', ethers.utils.formatEther(deploymentCost), 'ETH');

      // Deploy contract
      console.log('📤 Deploying contract...');
      const contract = await factory.deploy({
        gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
        gasPrice: gasPrice
      });

      console.log('⏳ Waiting for deployment transaction...');
      console.log('🔗 Transaction hash:', contract.deployTransaction.hash);
      
      // Wait for deployment
      const receipt = await contract.deployTransaction.wait();
      
      console.log('✅ Contract deployed successfully!');
      console.log('📍 Contract address:', contract.address);
      console.log('🧾 Block number:', receipt.blockNumber);
      console.log('⛽ Gas used:', receipt.gasUsed.toString());
      console.log('🔗 Etherscan:', `https://etherscan.io/address/${contract.address}`);

      // Verify contract is deployed correctly
      const code = await this.provider.getCode(contract.address);
      if (code === '0x') {
        throw new Error('Contract deployment failed - no code at address');
      }

      return {
        address: contract.address,
        contract: contract,
        deploymentTx: contract.deployTransaction.hash,
        gasUsed: receipt.gasUsed.toString(),
        deploymentCost: ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice))
      };

    } catch (error) {
      console.error('❌ Contract deployment failed:', error);
      throw error;
    }
  }

  async verifyContractOnEtherscan(
    contractAddress: string,
    constructorArgs: any[] = []
  ): Promise<void> {
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    if (!etherscanApiKey) {
      console.warn('⚠️  ETHERSCAN_API_KEY not provided, skipping verification');
      return;
    }

    try {
      console.log('🔍 Verifying contract on Etherscan...');
      
      // Implementation would use etherscan API
      // For now, just log the verification URL
      console.log('🔗 Manual verification URL:', 
        `https://etherscan.io/verifyContract?a=${contractAddress}`);
      
    } catch (error) {
      console.error('❌ Contract verification failed:', error);
    }
  }

  async getDeploymentInfo(contractAddress: string) {
    const contract = new ethers.Contract(
      contractAddress,
      FlashLoanArbitrageABI.abi,
      this.signer
    );

    const [owner, balance] = await Promise.all([
      contract.owner(),
      this.provider.getBalance(contractAddress)
    ]);

    return {
      address: contractAddress,
      owner,
      balance: ethers.utils.formatEther(balance),
      isVerified: false // Would check etherscan API
    };
  }
}

// Multi-network deployment configuration
const NETWORKS = {
  ethereum: {
    name: 'Ethereum Mainnet',
    rpc: process.env.ETHEREUM_RPC_URL || process.env.VITE_ETHEREUM_RPC_URL,
    chainId: 1,
    allocation: '40%', // $2000 allocation
    gasPrice: 'auto'
  },
  polygon: {
    name: 'Polygon',
    rpc: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    chainId: 137,
    allocation: '25%', // $1250 allocation
    gasPrice: '30000000000' // 30 gwei
  },
  bsc: {
    name: 'Binance Smart Chain',
    rpc: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    chainId: 56,
    allocation: '20%', // $1000 allocation
    gasPrice: '5000000000' // 5 gwei
  },
  arbitrum: {
    name: 'Arbitrum One',
    rpc: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    allocation: '10%', // $500 allocation
    gasPrice: 'auto'
  },
  optimism: {
    name: 'Optimism',
    rpc: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    chainId: 10,
    allocation: '5%', // $250 allocation
    gasPrice: 'auto'
  }
};

// Multi-network deployment script
export async function deployToAllNetworks() {
  const privateKey = process.env.PRIVATE_KEY || process.env.VITE_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  const deployments = {};
  
  console.log('🚀 Starting multi-network deployment...');
  console.log('💰 Total allocation: $5000 across 5 networks');
  
  for (const [networkName, config] of Object.entries(NETWORKS)) {
    try {
      console.log(`\n📡 Deploying to ${config.name} (${config.allocation})...`);
      
      // Create provider and signer for this network
      const provider = new ethers.providers.JsonRpcProvider(config.rpc);
      const signer = new ethers.Wallet(privateKey, provider);
      
      // Deploy contract
      const deployer = new ContractDeployer(signer);
      const deployment = await deployer.deployFlashLoanArbitrageContract();
      
      deployments[networkName] = {
        ...deployment,
        network: config.name,
        chainId: config.chainId,
        allocation: config.allocation
      };
      
      console.log(`✅ ${config.name} deployment successful!`);
      console.log(`📍 Address: ${deployment.address}`);
      console.log(`💸 Cost: ${deployment.deploymentCost} ETH`);
      
    } catch (error) {
      console.error(`❌ ${config.name} deployment failed:`, error.message);
      deployments[networkName] = { error: error.message };
    }
  }
  
  return deployments;
}

// Single network deployment (original function)
export async function deployContract(networkName = 'ethereum') {
  const privateKey = process.env.PRIVATE_KEY || process.env.VITE_PRIVATE_KEY;
  const network = NETWORKS[networkName];
  
  if (!network) {
    throw new Error(`Unsupported network: ${networkName}`);
  }
  
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  // Create provider and signer
  const provider = new ethers.providers.JsonRpcProvider(network.rpc);
  const signer = new ethers.Wallet(privateKey, provider);

  // Deploy contract
  const deployer = new ContractDeployer(signer);
  const deployment = await deployer.deployFlashLoanArbitrageContract();

  // Optionally verify on Etherscan
  await deployer.verifyContractOnEtherscan(deployment.address);

  return deployment;
}

// If running directly
if (require.main === module) {
  deployContract()
    .then((deployment) => {
      console.log('\n🎉 Deployment completed successfully!');
      console.log('📋 Summary:');
      console.log('  Address:', deployment.address);
      console.log('  TX Hash:', deployment.deploymentTx);
      console.log('  Gas Used:', deployment.gasUsed);
      console.log('  Cost:', deployment.deploymentCost, 'ETH');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Deployment failed:', error.message);
      process.exit(1);
    });
}
