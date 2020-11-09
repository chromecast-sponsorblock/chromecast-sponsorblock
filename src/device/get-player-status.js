'use strict';

const process = require('process');

const playerNotYoutubeStatus = {
	enabled: false,
	playerState: 'NOT_YOUTUBE',
	currentTime: 'Current time unavailable',
	media: {
		contentId: 'Content ID unavailable',
		metadata: {
			title: 'Title unavailable'
		},
		duration: 'Duration unavailable'
	}
};

const notPlayerStatus = {
	enabled: false,
	playerState: 'NOT_PLAYER',
	currentTime: 'Current time unavailable',
	media: {
		contentId: 'Content ID unavailable',
		metadata: {
			title: 'Title unavailable'
		},
		duration: 'Duration unavailable'
	}
};

module.exports = function getPlayerStatus(device, receiverStatus) {
	return new Promise((resolve, reject) => {
		if (
			receiverStatus.applications.every(
				(a) => !a.statusText.toLowerCase().includes('youtube')
			)
		) {
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
		} catch (err) {
			resolve(notPlayerStatus);
		}
	});
};
