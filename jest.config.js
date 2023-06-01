const path = require('path');
const TESTS_GLOBALS = {
  POSTGRES_USER: 'rsl',
  POSTGRES_PASSWORD: 'rsl',
  POSTGRES_DB: 'rsl_test',
  SEED_CATALOG_BASE_URI: 'http://localhost:18080',
  SEED_WORKER_SYNC: 'TRUE',
  SEED_CATALOG_PORT: 18080,
};

module.exports = {
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  clearMocks: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  verbose: true,
  globalSetup: path.join(__dirname, 'src/tests/tests-setup.js'),
  globalTeardown: path.join(__dirname, 'src/tests/tests-teardown.js'),
  globals: TESTS_GLOBALS,
};
