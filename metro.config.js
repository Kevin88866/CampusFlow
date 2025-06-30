console.log('[METRO CONFIG] transformer=', require.resolve('metro-react-native-babel-transformer'));
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
    getTransformOptions: async () => ({
      transform: { 
        experimentalImportSupport: false, 
        inlineRequires: true 
      },
    }),
  },
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'ts', 'tsx'],
  },
});