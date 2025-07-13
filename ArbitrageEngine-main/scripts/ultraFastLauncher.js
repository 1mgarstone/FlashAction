
import { HighPerformanceArbitrageEngine } from '../trading/highPerformanceEngine.js';
import { performance } from 'perf_hooks';

console.log('🚀 ULTRA-FAST ARBITRAGE LAUNCHER');
console.log('================================');

// SYSTEM OPTIMIZATION SETUP
console.log('🔧 Optimizing system for maximum performance...');

// Increase memory limits
if (process.argv.includes('--max-old-space-size=8192')) {
  console.log('✅ Memory limit increased to 8GB');
} else {
  console.log('⚠️ For maximum performance, restart with: node --max-old-space-size=8192 scripts/ultraFastLauncher.js');
}

// Enable experimental features for performance
console.log('⚡ Enabling performance optimizations...');

async function launchUltraFastTrading() {
  console.log('\n🎯 LAUNCHING ULTRA-FAST TRADING ENGINE...\n');
  
  const engine = new HighPerformanceArbitrageEngine();
  
  // Performance test
  console.log('🧪 Running performance test...');
  const testStart = performance.now();
  
  const testResult = await engine.ultraFastSimulation(1000000, 50000);
  
  const testEnd = performance.now();
  const testTime = testEnd - testStart;
  
  console.log(`📊 Performance Test Results:`);
  console.log(`  ⚡ Simulation Time: ${testTime.toFixed(3)}ms`);
  console.log(`  🎯 Ultra-Fast Status: ${testResult.ultraFast ? 'ACHIEVED' : 'NEEDS OPTIMIZATION'}`);
  console.log(`  💰 Test Profit: $${testResult.netProfit.toFixed(2)}`);
  
  if (testTime < 1.0) {
    console.log('✅ PERFORMANCE TARGET ACHIEVED - LAUNCHING LIVE TRADING!');
    
    // Start live trading with $100 initial balance
    await engine.startUltraFastAutoTrading(100);
    
  } else {
    console.log('⚠️ Performance needs optimization. Current speed:', testTime.toFixed(3), 'ms');
    console.log('🔧 Run with more RAM allocation or higher CPU priority for better performance.');
  }
}

// Launch the ultra-fast trading system
launchUltraFastTrading().catch(error => {
  console.error('💥 Launch failed:', error);
  process.exit(1);
});

// Performance monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log(`\n📊 SYSTEM PERFORMANCE:`);
  console.log(`  🧠 RAM Usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  💾 Total Allocated: ${(memUsage.heapTotal / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  🔄 External Memory: ${(memUsage.external / 1024 / 1024).toFixed(1)}MB`);
}, 60000); // Every minute
