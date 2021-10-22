const configPlugins = require("@expo/config-plugins");
const {
  mergeContents,
} = require("@expo/config-plugins/build/utils/generateCode");
const fs = require("fs-extra");
const path = require("path");

// Why? Fixes this issue: https://github.com/dotintent/react-native-ble-plx/issues/899#issue-1004346295

const withBluetoothDependencyFix = (config) => {
  return configPlugins.withDangerousMod(config, [
    "ios",
    async (config) => {
      const filePath = path.join(
        config.modRequest.projectRoot,
        "ios",
        "Podfile"
      );
      let contents = await fs.readFile(filePath, "utf-8");

      contents = mergeContents({
        src: contents,
        newSrc: `pod 'MultiplatformBleAdapter', :git => 'https://github.com/below/MultiPlatformBleAdapter', :tag => '0.1.9'`,
        tag: "fix-rn-ble-plx-dependency",
        comment: "#",
        anchor: /.*\buse_react_native!.*/,
        offset: 0,
      }).contents;

      await fs.writeFile(filePath, contents);

      return config;
    },
  ]);
};

exports.default = withBluetoothDependencyFix;
