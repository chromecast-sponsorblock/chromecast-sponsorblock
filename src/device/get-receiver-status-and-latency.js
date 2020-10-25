"use strict";

const process = require("process");

const floatingAverageLatencyBucket = [];

const playerNotYoutubeStatus = {
  enabled: false,
  playerState: "NOT_YOUTUBE",
  currentTime: "Current time unavailable",
  media: {
    contentId: "Content ID unavailable",
    metadata: {
      title: "Title unavailable",
    },
    duration: "Duration unavailable",
  },
};

module.exports = function getStatusAndLatency(device, latencyByDevice) {
  return new Promise((resolve, reject) => {
    try {
      const begin = process.hrtime.bigint();
      device.getReceiverStatus((err, res) => {
        if (err) {
          reject(err);
          return;
        }
        const end = process.hrtime.bigint();
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

        if (res.applications.every(a => !a.statusText.toLowerCase().includes('youtube'))) {
          resolve(playerNotYoutubeStatus);
          return;
        }

        try {
          // nasty function, always throws without calling the callback
          device.getStatus((err, responseStatus) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(responseStatus);
          });
        }
        catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};
