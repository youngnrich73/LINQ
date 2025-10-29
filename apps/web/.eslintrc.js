module.exports = {
  extends: [require.resolve("../../packages/config/eslint")],
  settings: {
    next: {
      rootDir: [__dirname]
    }
  }
};
