process.env.JWT_ACCESS_SECRET = "test-secret-32-characters-long!!";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-32-chars!!";
process.env.JWT_ACCESS_EXPIRY = "15m";
process.env.JWT_REFRESH_EXPIRY = "7d";

export default {
  testEnvironment: "node",
  transform: {},
  moduleFileExtensions: ["js"],
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
  testTimeout: 30000,
};
