const got = require("got");
const { LRUMap } = require("lru_map");
const wait = require("./utils/wait");

const requestStarted = new LRUMap(128);
const segmentsByContentId = new LRUMap(128);
module.exports = async function getNewSponsorBlockData(contentId) {
  let videoData = null;
  try {
    if (!contentId) {
      return;
    }
    if (segmentsByContentId.has(contentId)) {
      return segmentsByContentId.get(contentId);
    }
    const hash = require("crypto")
      .createHash("sha256")
      .update(contentId)
      .digest("hex");
    const url =
      "https://sponsor.ajay.app/api/skipSegments/" +
      hash.slice(0, 6) +
      '?categories=["sponsor","intro","outro","interaction","selfpromo","music_offtopic"]';
    while (requestStarted.has(url) && !segmentsByContentId.has(contentId)) {
      await wait(100);
    }
    if (segmentsByContentId.has(contentId)) {
      return segmentsByContentId.get(contentId);
    }
    requestStarted.set(url, true);
    setTimeout(() => {
      requestStarted.delete(url);
    }, 5000);
    const response = await got(url).json();
    videoData = response.find((x) => x.videoID === contentId) || {
      segments: [],
    };
    // merge overlapping segments
    videoData.segments = stupidMerge(videoData.segments.map(x => x.segment));
  } catch (err) {
    console.error(err);
  }
  const result = videoData.segments || [];
  segmentsByContentId.set(contentId, result);
  return result;
};

function stupidMerge (data) {
  return data
        .sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; })
        .reduce(function (r, a) {
            var last = r[r.length - 1] || [];
            if (last[0] <= a[0] && a[0] <= last[1]) {
                if (last[1] < a[1]) {
                    last[1] = a[1];
                }
                return r;
            }
            r.push(a);
            return r;
        }, []);
}