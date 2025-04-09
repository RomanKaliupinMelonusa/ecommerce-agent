// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // Optional: Setup path aliases if you use them (e.g., '@/')
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    // Optional: Clear mocks between tests
    clearMocks: true,
  };
