/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
const defaultConfig = require('./jest.config.cjs');

module.exports = {
  ...defaultConfig,
  testEnvironment: 'node',
  testMatch: ['**/test/**/?(*.)+(spec|test).[jt]s?(x)'],
  setupFilesAfterEnv: [],
  collectCoverage: false,
};
