const pkg = require("./package.json");
const configPlugins = require("@expo/config-plugins");

const MUSIC_LIBRARY_USAGE = "Allow $(PRODUCT_NAME) to access your music";

const withMediaLibrary = (config, { musicLibraryPermission } = {}) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};

  config.ios.infoPlist.NSAppleMusicUsageDescription =
    musicLibraryPermission ||
    config.ios.infoPlist.NSAppleMusicUsageDescription ||
    MUSIC_LIBRARY_USAGE;

  return config;
};
exports.default = configPlugins.createRunOncePlugin(
  withMediaLibrary,
  pkg.name,
  pkg.version
);
