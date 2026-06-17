export default {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup/setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
