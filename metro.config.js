
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push(
  'bin',
  'txt',
  'jpg',
  'png',
  'json',
  'mp4',
  'mov',
  'mp3',
  'wav'
);

config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'cjs', 'mjs');

// Enable web support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
