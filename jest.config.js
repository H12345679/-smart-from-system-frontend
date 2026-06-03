module.exports = {
  preset: "@vue/cli-plugin-unit-jest",
  testMatch: ["**/tests/unit/**/*.spec.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.js$": "babel-jest",
    "^.+\\.vue$": "@vue/vue2-jest",
  },
  transformIgnorePatterns: ["/node_modules/(?!axios)"],
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/tests/unit/setup.js"],
};
