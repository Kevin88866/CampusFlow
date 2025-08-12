module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['<rootDir>/__tests__/backend/'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-picker|@react-native-async-storage|@react-native-community|@react-native-google-signin/google-signin)/)'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'screens/**/*.{js,jsx,ts,tsx}',
    '!screens/TermsOfServiceScreen.js',
    '!screens/PrivacyPolicyScreen.js'
  ],
  coverageProvider: 'v8',
  forceCoverageMatch: ['<rootDir>/**/*Screen.{js,jsx,ts,tsx}'],
  coverageDirectory: '<rootDir>/coverage-fe',
  coverageReporters: ['text', 'lcov', 'cobertura'],
  coverageThreshold: {
    global: { lines: 70, functions: 70, branches: 60 },
    'screens/LoginScreen.js': { lines: 85 },
    'screens/SurveyScreen.js': { lines: 85 },
    'screens/MapScreen.js': { lines: 85 },
    'screens/ProfileScreen.js': { lines: 85 },
    'screens/ChatScreen.js': { lines: 85 }
  },
}