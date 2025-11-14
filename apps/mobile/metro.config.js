const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const {
  composePlugins,
  withIconTransformer,
  withTurborepo,
} = require("@zenncore/mobile/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const withZenncore = composePlugins(
  (config) => withTurborepo(config, __dirname),
  (config) => withIconTransformer(config),
  (config) => {
    return withNativeWind(config, {
      input: "./src/globals.css",
    });
  },
);

module.exports = withZenncore(config);
