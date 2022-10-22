/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.test.json');

module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/src/**/?(*.)+(spec|test).[jt]s?(x)'],
  setupFilesAfterEnv: ['./jest-setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/index.ts',
    '!src/**/*.(spec|test).ts',
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 40,
      lines: 60,
      statements: 60,
    },
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/',
    }),
    '^(\\.{1,2}/.*)\\.tsx?$': '$1',
  },
  resolver: 'ts-jest-resolver',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      { tsconfig: './tsconfig.test.json', useESM: true },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!@?lit.*/)'],
};
