module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/backend/**/*.test.js'],
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  collectCoverage: true,
  collectCoverageFrom: [
    'server.js',
    'routes/**/*.js',
    'services/**/*.js',
    '!**/__tests__/**'
  ],
  coverageReporters: ['text', 'lcov', 'cobertura'],
  coverageThreshold: {
    global: { lines: 70, functions: 70, branches: 60 },
    './server.js': { lines: 85 }
  }
}