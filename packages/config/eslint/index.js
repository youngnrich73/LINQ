module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "next/core-web-vitals",
    "prettier"
  ],
  env: {
    browser: true,
    es2022: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module"
  },
  plugins: ["@typescript-eslint"],
  settings: {
    next: {
      rootDir: ["apps/*/"]
    }
  },
  ignorePatterns: ["*.d.ts"],
  rules: {
    "@typescript-eslint/explicit-module-boundary-types": "off"
  }
};
