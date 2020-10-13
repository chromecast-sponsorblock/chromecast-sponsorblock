const floatingAverageLatencyBucket = [];

module.exports = function getStatusAndLatency(device, latencyByDevice) {
  return new Promise((resolve, reject) => {
    try {
      const begin = Date.now();
      if (!device || !device.getStatus) {
        // failsafe if we go too fast
        return;
      }
      device.getStatus((err, status) => {
        if (err) {
          reject(err);
          return;
        }
        floatingAverageLatencyBucket.push(Date.now() - begin);
        latencyByDevice.set(
          device.host,
          floatingAverageLatencyBucket.reduce((a, b) => a + b, 0) /
            floatingAverageLatencyBucket.length /
            2 || 50
        );
        if (floatingAverageLatencyBucket.length > 100) {
          floatingAverageLatencyBucket.shift();
        }
        resolve(status);
      });
    } catch (err) {
      if (err.message !== "Cannot read property 'getStatus' of undefined") {
        console.error(err);
      } else {
        //console.error(err.message);
      }
      reject(err);
      return;
    }
  });
};
