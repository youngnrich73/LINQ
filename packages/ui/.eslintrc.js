module.exports = {
  extends: [require.resolve("../config/eslint")],
  ignorePatterns: ["dist"],
  settings: {
    next: {
      rootDir: [__dirname]
    }
  }
};
