
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 ULTRA-FAST LAUNCHER - ALLOCATING MAXIMUM RESOURCES');
console.log('⚡ RAM: 6GB allocated');
console.log('🔥 CPU: Maximum performance mode');

// Set process priority to high
process.nextTick(() => {
  try {
    process.setpriority(process.pid, -10); // High priority
  } catch (e) {
    console.log('⚠️ Could not set high priority');
  }
});

// Launch with optimized Node.js flags
const nodeArgs = [
  '--max-old-space-size=6144',    // 6GB RAM
  '--optimize-for-size',
  '--max-semi-space-size=128',
  '--initial-heap-size=1024',
  '--max-new-space-size=128',
  '--turbo-fast-api-calls',
  '--turbo-inline-api-calls',
  path.join(__dirname, '..', 'trading', 'ultimateArbitrageEngine.js')
];

console.log('🎯 Starting NITROUS MODE with 2000x leverage...');

const child = spawn('node', nodeArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    UV_THREADPOOL_SIZE: 16,
    NODE_OPTIONS: '--max-old-space-size=6144'
  }
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Trading session completed successfully');
  } else {
    console.log(`❌ Process exited with code ${code}`);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  child.kill('SIGTERM');
  process.exit(0);
});
