const configPlugins = require("@expo/config-plugins");
const fs = require("fs-extra");
const path = require("path");

const withCustomNativeModules = (config) => {
  return configPlugins.withDangerousMod(config, [
    "ios",
    async (config) => {
      const filePath = path.join(
        config.modRequest.projectRoot,
        "ios",
        "Podfile"
      );
      let contents = await fs.readFile(filePath, "utf-8");
      // https://regex101.com/r/Jw92Yn/1/
      contents = contents.replace(
        /.*\buse_expo_modules!.*/m,
        `use_expo_modules!(modules_paths: ['../node_modules', '../custom_native_modules'])`
      );
      await fs.writeFile(filePath, contents);

      return config;
    },
  ]);
};

exports.default = withCustomNativeModules;
