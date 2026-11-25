const { getDefaultConfig } = require("expo/metro-config");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

module.exports = withUniwindConfig(
  wrapWithReanimatedMetroConfig(getDefaultConfig(__dirname)),
  { cssEntryFile: "./global.css", dtsFile: "./src/uniwind.d.ts" },
);
