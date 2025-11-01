module.exports = {
  extends: [require.resolve("../../packages/config/eslint/index.js")],
  settings: {
    next: {
      rootDir: [__dirname]
    }
  }
};
