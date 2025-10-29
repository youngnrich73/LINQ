module.exports = {
  extends: [require.resolve("../config/eslint")],
  settings: {
    next: {
      rootDir: [__dirname]
    }
  }
};
