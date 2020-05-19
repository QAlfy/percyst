module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  transform: {
    ".(ts|tsx)": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  coverageDirectory: "coverage",
};
