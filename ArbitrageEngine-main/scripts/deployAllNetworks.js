
const { deployToAllNetworks } = require('../contracts/deploy.ts');

async function main() {
  console.log('🔥 LullaByte Multi-Network Deployment System');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💰 Budget Allocation:');
  console.log('  • Ethereum (40%): $2,000 - Main liquidity hub');
  console.log('  • Polygon (25%): $1,250 - Fast & cheap trades');
  console.log('  • BSC (20%): $1,000 - High volume opportunities');
  console.log('  • Arbitrum (10%): $500 - L2 efficiency');
  console.log('  • Optimism (5%): $250 - L2 backup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const deployments = await deployToAllNetworks();
    
    console.log('\n🎉 DEPLOYMENT SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let totalCost = 0;
    let successCount = 0;
    
    for (const [network, deployment] of Object.entries(deployments)) {
      if (deployment.error) {
        console.log(`❌ ${network}: FAILED - ${deployment.error}`);
      } else {
        console.log(`✅ ${network}: ${deployment.address}`);
        console.log(`   Cost: ${deployment.deploymentCost} ETH`);
        console.log(`   Allocation: ${deployment.allocation}`);
        totalCost += parseFloat(deployment.deploymentCost);
        successCount++;
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Success Rate: ${successCount}/5 networks`);
    console.log(`💸 Total Cost: ${totalCost.toFixed(6)} ETH`);
    console.log('🚀 Platform ready for multi-chain arbitrage!');
    
    // Save deployment info
    const fs = require('fs');
    fs.writeFileSync(
      'deployment-summary.json', 
      JSON.stringify(deployments, null, 2)
    );
    
    console.log('📄 Deployment details saved to deployment-summary.json');
    
  } catch (error) {
    console.error('💥 Deployment failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
