/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/helpers/env.setup.ts'],
  globalSetup: '<rootDir>/tests/helpers/globalSetup.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/jest.setup.ts'],
  clearMocks: true,
  testTimeout: 20000,
  maxWorkers: 1,
};
