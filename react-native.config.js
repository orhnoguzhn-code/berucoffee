module.exports = {
  dependencies: {
    // 3D coffee cup is temporarily removed; keep the package on disk
    // so it can be re-enabled later by removing this block. It cannot
    // build against the current worklets stack, so it is excluded from
    // native autolinking on both Android and iOS for now.
    'react-native-filament': { platforms: { android: null, ios: null } },
  },
};