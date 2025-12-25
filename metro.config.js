const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo SDK 54+ uses ".fx" modules (e.g. expo-notifications DevicePushTokenAutoRegistration.fx)
// Metro must know this extension to resolve them.
config.resolver = config.resolver || {};
config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts || []), 'fx'])
);

module.exports = config;
