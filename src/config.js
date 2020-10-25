const path = require("path");
const process = require("process");
const fs = require("fs");

const defaultConfig = require("../cast-sponsorblock.default.json");

let config;

module.exports = function loadConfig(flags) {
  if (config) {
    return config;
  }

  const configPath = flags.config;
  let _config;
  let absConfigPath;
  let errorLoading = false;

  if (!configPath) {
    _config = defaultConfig;
  } else {
    absConfigPath = path.resolve(process.cwd(), configPath);
    try {
      _config = JSON.parse(fs.readFileSync(absConfigPath, "utf8"));
    } catch (err) {
      errorLoading = true;
      if (!flags.debug) {
        console.log(
          "Error while parsing config " + absConfigPath + ", using default"
        );
      }
      _config = defaultConfig;
    }
  }

  _config.flags = flags;
  config = _config;

  if (flags.debug) {
    if (!configPath) {
      console.log("Default config loaded:");
    } else if (errorLoading) {
      console.log(
        "Error while parsing config " + absConfigPath + ", using default:"
      );
    } else {
      console.log("Custom config loaded (" + absConfigPath + "):");
    }
    console.log(JSON.stringify(config, null, 4));
  }

  return config;
};
