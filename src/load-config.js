const path = require("path");
const process = require("process");
const fs = require("fs");

const defaultConfig = require("../chromecast-sponsorblock.default.json");

let config;

module.exports = function loadConfig(configPath) {
  if (config) {
    return config;
  }

  if (!configPath) {
    console.log("Default config loaded:");
    config = defaultConfig;
  } else {
    const absConfigPath = path.resolve(process.cwd(), configPath);
    console.log("Custom config loaded (" + absConfigPath + "):");
    try {
      config = JSON.parse(fs.readFileSync(absConfigPath, "utf8"));
    } catch (err) {
      console.log(
        "Error while parsing config " + absConfigPath + ", using default:"
      );
      config = defaultConfig;
    }
  }

  console.log(JSON.stringify(config, null, 4));

  return config;
};
