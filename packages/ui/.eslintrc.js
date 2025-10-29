module.exports = {
  extends: ["@linq/config/eslint"],
  ignorePatterns: ["dist"],
  settings: {
    next: {
      rootDir: [__dirname]
    }
  }
};
