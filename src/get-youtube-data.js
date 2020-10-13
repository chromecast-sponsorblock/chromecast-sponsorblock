const ytdl = require("ytdl-core");

const got = require("got");
const { LRUMap } = require("lru_map");
const { config } = require("process");
const wait = require("./utils/wait");

const requestStarted = new LRUMap(128);
const youtubeDataByContentId = new LRUMap(128);

module.exports = async function getYoutubeData(contentId) {
  if (!contentId) {
    throw new Error("Youtube Data no content ID");
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
  const raw = await ytdl.getBasicInfo(
    "https://www.youtube.com/watch?v=" + contentId
  );
  return { id: raw.videoDetails.author.id, name: raw.videoDetails.author.name };
}
