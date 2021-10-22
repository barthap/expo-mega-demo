// yarn install is stupid and cannot be configured
// not to copy local dependencies into node_modules

// this postinstall step just removes them
const fs = require("fs");
const path = require("path");

const localNativesDir = path.resolve(__dirname, "custom_native_modules");

const localNativeModules = fs
  .readdirSync(localNativesDir, { withFileTypes: true })
  .filter((it) => it.isDirectory())
  .map((it) => it.name);

const nodeModulesNativeDirectories = localNativeModules.map((moduleName) =>
  path.resolve(__dirname, "node_modules", moduleName)
);

nodeModulesNativeDirectories.forEach((dir) => {
  if (!fs.existsSync(dir)) return;

  console.log("Removing duplicated native module:", dir);
  fs.rmSync(dir, { recursive: true, force: true });
});
