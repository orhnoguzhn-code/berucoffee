module.exports = {
  dependencies: {
    // 3D coffee cup is temporarily removed; keep the package on disk
    // so it can be re-enabled later by removing this block. It cannot
    // build against react-native-worklets (successor of worklets-core),
    // so it is excluded from Android autolinking for now.
    'react-native-filament': { platforms: { android: null } },
  },
};