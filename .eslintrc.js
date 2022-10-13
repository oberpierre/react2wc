module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.test.json',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: [
    'node_modules',
    'coverage',
    'dist',
    '.eslintrc.js',
    'jest.config.js',
    'jest-setup.js',
  ],
  plugins: ['@typescript-eslint'],
  rules: {},
};
