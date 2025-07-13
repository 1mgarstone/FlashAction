
require('dotenv').config();
const { ethers } = require('ethers');

async function deploySmartContract() {
  try {
    console.log('🚀 Starting Smart Contract Deployment...');
    
    // Check environment variables
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.ETHEREUM_RPC_URL || process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID';
    
    if (!privateKey) {
      throw new Error('❌ PRIVATE_KEY not found in environment variables');
    }
    
    if (!rpcUrl || rpcUrl.includes('YOUR_PROJECT_ID')) {
      throw new Error('❌ Please set ETHEREUM_RPC_URL or RPC_URL in your environment variables');
    }
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('📝 Deployer address:', wallet.address);
    
    // Check balance
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');
    
    if (balance < ethers.parseEther('0.01')) {
      console.warn('⚠️  Low balance - you may not have enough ETH for deployment');
    }
    
    // Contract bytecode and ABI (simplified for demo - replace with your compiled contract)
    const contractABI = [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {"internalType": "address[]", "name": "tokens", "type": "address[]"},
          {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"},
          {"internalType": "bytes", "name": "params", "type": "bytes"}
        ],
        "name": "executeArbitrage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "address", "name": "token", "type": "address"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "emergencyWithdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    // Simple bytecode for demo (replace with your compiled contract bytecode)
    const contractBytecode = "0x608060405234801561001057600080fd5b50600080546001600160a01b0319163317905561035f806100326000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063893d20e81461003b578063a6f9dae114610059575b600080fd5b610043610081565b60405161005091906102a0565b60405180910390f35b61007f6100673660046102bb565b600080546001600160a01b0319166001600160a01b0392909216919091179055565b005b6000546001600160a01b031690565b600080546001600160a01b0319166001600160a01b0383161790556040516001600160a01b038216907f04dba622d284ed0014ee4b9a6a68386be1a4c08a4913ae272de89199cc68616390600090a250565b600080546001600160a01b0319166001600160a01b0383161790556040516001600160a01b038216907f04dba622d284ed0014ee4b9a6a68386be1a4c08a4913ae272de89199cc68616390600090a250565b6001600160a01b0381168114610127576000fd5b50565b60006020828403121561013c57600080fd5b813561014781610112565b9392505050565b600060208083528351808285015260005b8181101561017b5785810183015185820160400152820161015f565b506000604082860101526040601f19601f8301168501019250505092915050565b600060208284031215610147576000fd5b50919050565b60006020828403121561013c57600080fd5b8135610147816101a056fea2646970667358221220";
    
    // Create contract factory
    const contractFactory = new ethers.ContractFactory(
      contractABI,
      contractBytecode,
      wallet
    );
    
    console.log('📤 Deploying contract...');
    
    // Deploy with gas estimation
    const gasEstimate = await contractFactory.getDeployTransaction().then(tx => 
      provider.estimateGas(tx)
    );
    
    console.log('⛽ Estimated gas:', gasEstimate.toString());
    
    const contract = await contractFactory.deploy({
      gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
    });
    
    console.log('⏳ Waiting for deployment...');
    console.log('🔗 Transaction hash:', contract.deploymentTransaction().hash);
    
    // Wait for deployment
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log('✅ Contract deployed successfully!');
    console.log('📍 Contract address:', contractAddress);
    console.log('🔗 Etherscan:', `https://etherscan.io/address/${contractAddress}`);
    
    // Save deployment info
    const deploymentInfo = {
      address: contractAddress,
      deploymentTx: contract.deploymentTransaction().hash,
      deployer: wallet.address,
      timestamp: new Date().toISOString(),
      network: await provider.getNetwork().then(n => n.name)
    };
    
    console.log('\n📋 Deployment Summary:');
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    return deploymentInfo;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

// Run deployment if called directly
if (require.main === module) {
  deploySmartContract()
    .then(() => {
      console.log('\n🎉 Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Deployment failed:', error.message);
      process.exit(1);
    });
}

module.exports = { deploySmartContract };
