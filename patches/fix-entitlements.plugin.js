const { withEntitlementsPlist } = require("@expo/config-plugins");

// Expo for some reason keeps adding Push Notification entitlement
// this plugin removes it.
exports.default = (config) => {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults["aps-environment"];
    return config;
  });
};
