'use strict';

const ytdl = require('ytdl-core');
const { LRUMap } = require('lru_map');
const config = require('./config')();
const wait = require('./utils/wait');

module.exports = async function getYoutubeData(contentId) {
	if (!contentId) {
		throw new Error('Youtube Data no content ID');
	}
	if (youtubeDataByContentId.has(contentId)) {
		return youtubeDataByContentId.get(contentId);
	}
	while (
		requestStarted.has(contentId) &&
		!youtubeDataByContentId.has(contentId)
	) {
		await wait(100);
	}
	if (youtubeDataByContentId.has(contentId)) {
		return youtubeDataByContentId.get(contentId);
	}
	requestStarted.set(contentId, true);
	setTimeout(() => {
		requestStarted.delete(contentId);
	}, 5000);
	const data = await getData(contentId);
	youtubeDataByContentId.set(contentId, data);
	return data;
};

async function getData(contentId) {
	let raw;
	try {
		raw = await ytdl.getBasicInfo(
			'https://www.youtube.com/watch?v=' + contentId
		);
	} catch (err) {
		await wait(200);
		try {
			raw = await ytdl.getBasicInfo(
				'https://www.youtube.com/watch?v=' + contentId
			);
		} catch (err) {
			await wait(200);
			try {
				raw = await ytdl.getBasicInfo(
					'https://www.youtube.com/watch?v=' + contentId
				);
			} catch (err) {
				if (config.flags.debug) {
					console.error(err);
				}
				return {
					id: 'Error loading data',
					name: 'Error loading data'
				};
			}
		}
	}

	return {
		id: raw.videoDetails.author.id,
		name: raw.videoDetails.author.name
	};
}
