"use strict";

const ChromecastAPI = require("chromecast-api");

const config = require("./config")();

module.exports = class Engine {
  constructor() {
    this.lastDeviceId = -1;
    this.interval = null;
    this.client = null;
    this.start();
  }
  start() {
    this.interval = setInterval(async () => {
      try {
        this.getClient();
        this.client.update();
        this.findDevices();
      } catch (err) {
        if (config.flags.debug) {
          console.error(err);
        }
      }
    }, config.intervals.lookForDevices);
  }
  getClient() {
    if (!client) {
      this.client = new ChromecastAPI();
    }
  }
  findDevices() {
    for (const device of client.devices) {
        
    }
  }
};
