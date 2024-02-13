/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['./src/**'],
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {
      lines: 90,
    },
  },
};
