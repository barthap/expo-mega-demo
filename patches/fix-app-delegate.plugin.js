const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs-extra");
const path = require("path");

// Expo for some reason keeps adding Push Notification entitlement
// this plugin removes it.
exports.default = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const srcPath = path.join(
        config.modRequest.projectRoot,
        "patches",
        "AppDelegate.m"
      );

      const destPath = path.join(
        config.modRequest.projectRoot,
        "ios",
        "expomegademo",
        "AppDelegate.m"
      );

      await fs.copyFile(srcPath, destPath);

      return config;
    },
  ]);
};
