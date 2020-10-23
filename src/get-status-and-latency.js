"use strict";

const process = require("process");

const config = require("./load-config")();

const floatingAverageLatencyBucket = [];

module.exports = function getStatusAndLatency(device, latencyByDevice) {
  return new Promise((resolve, reject) => {
    try {
      const begin = process.hrtime.bigint();
      device.getStatus((err, status) => {
        const end = process.hrtime.bigint();
        if (err) {
          reject(err);
          return;
        }
        floatingAverageLatencyBucket.push(end - begin);
        latencyByDevice.set(
          device.host,
          floatingAverageLatencyBucket.reduce((a, b) => a + b, 0n) /
            BigInt(floatingAverageLatencyBucket.length) /
            2n
        );
        if (floatingAverageLatencyBucket.length > 256) {
          floatingAverageLatencyBucket.shift();
        }
        resolve(status);
      });
    } catch (err) {
      if (err.message === "Cannot read property 'getStatus' of undefined") {
        if (config.flags.debug) {
          console.error(err);
        }
        return;
      }
      reject(err);
      return;
    }
  });
};
