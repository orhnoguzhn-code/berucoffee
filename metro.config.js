const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: [...getDefaultConfig(__dirname).resolver.assetExts, 'glb'],
  },
};

module.exports = withNativeWind(
  wrapWithReanimatedMetroConfig(mergeConfig(getDefaultConfig(__dirname), config)),
  { input: './global.css' },
);