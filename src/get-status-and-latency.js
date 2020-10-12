
const floatingAverageLatencyBucket = [];

module.exports = function getStatusAndLatency(device, floatingAverageLatency) {
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
          floatingAverageLatency =
            floatingAverageLatencyBucket.reduce((a, b) => a + b, 0) /
              floatingAverageLatencyBucket.length /
              2 || 0;
          if (floatingAverageLatencyBucket.length > 100) {
            floatingAverageLatencyBucket.shift();
          }
          resolve(status);
        });
      } catch (err) {
        reject(err);
      }
    });
  }