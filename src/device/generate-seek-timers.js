const setUniqueTimeout = require('../utils/unique-timeout');

let preventConflictSeek = false;

// consider out of segment before the end to prevent seeking twice;
const END_BUFFER = 0.1;

module.exports = function generateTimers(
	contentId,
	segments,
	currentTimeByDevice,
	device,
	latencyByDevice
) {
	try {
		let i = 0;
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const position = getPosition(segment);
			// we are after segment
			if (position === 'after') {
				continue;
			} else if (position === 'in') {
				seekToOnce();
				continue;
			} else if (position === 'before') {
				const timeout =
					(segment[0] - currentTimeByDevice.get(device.host)) * 1000 -
					Number((latencyByDevice.get(device.host) * 2n) / 1000000n);
				setUniqueTimeout(
					device.host + '_' + contentId + '_SEG_' + i,
					() => {
						seekToOnce();
					},
					() => timeout,
					true
				);
			}

			function seekToOnce() {
				if (preventConflictSeek) {
					return;
				}
				const position = getPosition(segment);
				if (position === 'after') {
					return;
				}
				preventConflictSeek = true;
				device.seekTo(segment[1]);
				setTimeout(() => {
					preventConflictSeek = false;
				}, 5000);
			}
		}
	} catch (err) {
		if (config.flags.debug) {
			console.error(err);
		}
	}

	function getPosition(seg) {
		const begin = seg[0];
		const end = seg[1] - END_BUFFER;
		const now = currentTimeByDevice.get(device.host);
		if (end < now) {
			return 'after';
		} else if (begin < now && now < end) {
			return 'in';
		} else {
			return 'before';
		}
	}
};
