require('dotenv').config();
const { ethers } = require('ethers');

const privateKey = process.env.PRIVATE_KEY;
const rpcUrl = process.env.RPC_URL;
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// Replace these placeholders with real values from your deployed contract
const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
const CONTRACT_ABI = []; // Place your contract ABI here

const executeArbitrage = async () => {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  const tx = await contract.executeArbitrage();
  console.log("🚀 Arbitrage executed, waiting confirmation...");
  const receipt = await tx.wait();

  console.log("✅ Transaction confirmed:");
  console.log("📌 Tx Hash:", receipt.hash);
  console.log("🔗 View on Etherscan:", `https://etherscan.io/tx/${receipt.hash}`);
};

executeArbitrage().catch(console.error);
