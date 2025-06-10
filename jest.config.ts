/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';

const config: Config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ['**/*.ts'],

  // The directory where Jest should output its coverage files
  coverageDirectory: '../coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    'node_modules',
    '.*\\.module\\.ts$',
    'main.ts$',
    '.*\\.spec\\.ts$',
    '.*\\.entity\\.ts$',
    '.*\\.dto\\.ts$',
    '.*\\.types\\.ts$',
    '.*\\.config\\.ts$',
    '.*\\.strategy\\.ts$',
    'app.*.ts$',
    'index.d.ts$',
    'validation.ts$',
    'log-execution-time.handler.ts$',
    'log-execution-time.decorator.ts$',
    'create-multi-stream.ts$',
    'global-config.service.ts$',
  ],

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'ts', 'json'],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // The root directory that Jest should scan for tests and modules within
  rootDir: 'src',

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The regexp pattern or array of patterns that Jest uses to detect test files
  testRegex: '.*\\.spec\\.ts$',

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};

export default config;
