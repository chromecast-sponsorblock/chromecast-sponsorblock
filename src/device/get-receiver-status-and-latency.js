'use strict';

const process = require('process');

const config = require('../config')();

module.exports = function getStatusAndLatency(
	device,
	floatingAverageLatencyBucket
) {
	return new Promise((resolve, reject) => {
		try {
			let begin, end, latency;
			begin = process.hrtime.bigint();
			device.getReceiverStatus((err, receiverStatus) => {
				end = process.hrtime.bigint();
				if (err) {
					reject(err);
					return;
				}
				floatingAverageLatencyBucket.push(end - begin);
				latency =
					floatingAverageLatencyBucket.reduce((a, b) => a + b, 0n) /
					BigInt(floatingAverageLatencyBucket.length) /
					2n;
				if (
					floatingAverageLatencyBucket.length >
					config.averageLatencyWindow
				) {
					floatingAverageLatencyBucket.shift();
				}

				resolve({
					latency,
					floatingAverageLatencyBucket,
					receiverStatus
				});
			});
		} catch (err) {
			reject(err);
		}
	});
};
