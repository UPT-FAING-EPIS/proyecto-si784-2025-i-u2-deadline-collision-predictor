module.exports = {
  mutator: "javascript",
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "jest",
  transpilers: [],
  coverageAnalysis: "off",
  mutate: ["**/*.js", "!**/node_modules/**", "!**/coverage/**"],
  thresholds: {
    high: 80,
    low: 60,
    break: 70
  }
}; 