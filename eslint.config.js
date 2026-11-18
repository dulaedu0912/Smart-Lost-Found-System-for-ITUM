// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Uniwind's CSS entry is resolved by Metro, not by the import resolver.
    files: ['src/app/_layout.tsx'],
    rules: { 'import/no-unresolved': 'off' },
  },
]);
