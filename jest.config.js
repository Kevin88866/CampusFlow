module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: ['node_modules/(?!(react-native|@react-native|@react-navigation/native|@react-native-google-signin/google-signin|@react-native/js-polyfills)/)'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).js?(x)',
    '**/?(*.)(test|spec).js?(x)'
  ],
};
