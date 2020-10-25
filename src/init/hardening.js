'use strict';

const config = require("../config")();
// increase listeners limit to ping more often
require("events").EventEmitter.defaultMaxListeners = 25;

// handle events
process.on("warning", (warn) => {
  if (config.flags.debug) {
    console.warn(warn);
  }
});

process.on("uncaughtException", (err) => {
  if (config.flags.debug) {
    console.error(err);
  }
});

process.on("exit", (code) => {
  client.destroy();
  client = null;
  console.log(`About to exit with code: ${code}`);
});
