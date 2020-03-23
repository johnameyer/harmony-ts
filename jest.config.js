module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/dist/'],
  collectCoverageFrom: ['**/*.ts', '!**/index.ts']
};