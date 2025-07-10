require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');

const privateKey = process.env.PRIVATE_KEY;
const rpcUrl = process.env.RPC_URL;

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

const bytecode = fs.readFileSync('./contract.bin').toString();
const abi = JSON.parse(fs.readFileSync('./contract.abi').toString());

const deploy = async () => {
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log("✅ Contract deployed to:", contract.target);
  console.log("📌 Tx Hash:", contract.deploymentTransaction().hash);
};

deploy().catch(console.error);
