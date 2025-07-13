
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createProjectZip() {
  console.log('Creating arbitrage-trading-mobile.zip...');
  
  const output = fs.createWriteStream('arbitrage-trading-mobile.zip');
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  output.on('close', function() {
    console.log(`✅ ZIP created successfully!`);
    console.log(`📦 Total size: ${archive.pointer()} bytes`);
    console.log('');
    console.log('🔽 Download Instructions:');
    console.log('1. Look for "arbitrage-trading-mobile.zip" in the file explorer');
    console.log('2. Right-click the file and select "Download"');
    console.log('3. Or click the three dots next to the file and select "Download"');
  });

  archive.on('error', function(err) {
    console.error('❌ Error creating ZIP:', err);
    throw err;
  });

  archive.pipe(output);

  // Add essential React Native files
  const filesToAdd = [
    'package.json',
    'index.js',
    'metro.config.js',
    'babel.config.js',
    'app.json',
    'eas.json',
    'tsconfig.json',
    '.env.example',
    'README.txt',
    'termux_setup.sh'
  ];

  // Add files that exist
  for (const file of filesToAdd) {
    if (fs.existsSync(file)) {
      archive.file(file, { name: file });
    }
  }

  // Add directories
  const dirsToAdd = [
    'src',
    'android',
    'assets',
    'scripts'
  ];

  for (const dir of dirsToAdd) {
    if (fs.existsSync(dir)) {
      archive.directory(dir, dir);
    }
  }

  await archive.finalize();
}

createProjectZip().catch(console.error);
