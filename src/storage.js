'use strict';

const { LRUMap } = require("lru_map");

module.exports = {
    idDb: new LRUMap(64),
    latencyDb: new LRUMap(64),
    receiverStatusDb: new LRUMap(64),
    playerStatusDb: new LRUMap(64),
    youtubeDataDb: new LRUMap(64),
    segmentsDb: new LRUMap(64),
    requestStartedDb: new LRUMap(128),
    segmentsByContentIdDb: new LRUMap(128)
};
