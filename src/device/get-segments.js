const got = require("got");
const { LRUMap } = require("lru_map");
const wait = require("./utils/wait");
const config = require("./config")();


module.exports = async function getSegments(contentId) {
  let videoData = null;
  try {
    if (!contentId) {
      throw new Error("Get Segment no content Id");
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
      "?categories=" +
      JSON.stringify(config.categories);
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
    videoData.segments = stupidMerge(videoData.segments).map((x) =>
      Object.assign({}, x.segment, x)
    );
  } catch (err) {
    if (config.flags.debug) {
      //console.error(err);
    }
    videoData = { segments: [] };
  }
  const result = videoData && videoData.segments ? videoData.segments : [];
  segmentsByContentId.set(contentId, result);
  return result;
};

function stupidMerge(data) {
  return data
    .sort(function (a, b) {
      return a[0] - b[0] || a[1] - b[1];
    })
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
