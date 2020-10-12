const ChromecastAPI = require("chromecast-api");
const got = require("got");
const { LRUMap } = require("lru_map");

const client = new ChromecastAPI();
const sponsorDataByContentId = new LRUMap(16);
const uniqueIntervals = new LRUMap(64);
const uniqueTimeouts = new LRUMap(32);
const LOOK_FOR_DEVICES_INTERVAL = 2500;
const DEVICE_PING_INTERVAL = 250;
const floatingAverageLatencyBucket = [];
let floatingAverageLatency = 50; // initial high value

setUniqueInterval(
  "LOOK_FOR_DEVICES",
  async () => {
    client.update();
    await wait(floatingAverageLatency);
    for (const device of client.devices) {
      setUniqueInterval(
        "PING_DEVICE_" + device.friendlyName,
        async () => {
          const status = await getStatusCalculateRoundTrip(device);
          await getNewSponsorBlockData(status.media.contentId);
          generateFutureTimers(status.media.contentId, status.currentTime, device);
        },
        DEVICE_PING_INTERVAL
      );
    }
  },
  LOOK_FOR_DEVICES_INTERVAL
);

function generateFutureTimers(contentId, currentTime, device) {
    const sponsorDataSegments = sponsorDataByContentId.get(contentId);
    if (!sponsorDataSegments) {
        return;
    }
    let i = 0;
    for (const s of sponsorDataSegments) {

        i = i + 1;
        // we are after segment
        if (s.segment[1] < currentTime) {
            continue;
        }
        // we are in the segment
        else if (s.segment[0] < currentTime && currentTime < s.segment[1]) {
            // future quick skip
            continue;
        }
        // segment coming up
        else {
         const timeout = ((s.segment[0] - currentTime) * 1000) - floatingAverageLatency;
         console.log(timeout)
         setUniqueTimeout(contentId + '_SEG_' + i, () => {
            device.seekTo(s.segment[1]);
         }, timeout, true);
        }
    }
}

async function getNewSponsorBlockData(contentId) {
  if (
    !contentId
  ) {
    return;
  }
  if (
    typeof sponsorDataByContentId.get(contentId) !== "undefined"
  ) {
    return;
  }
  try {
    const hash = require("crypto")
      .createHash("sha256")
      .update(contentId)
      .digest("hex");
    const url = "https://sponsor.ajay.app/api/skipSegments/" + hash.slice(0, 6);
    const response = await got(url).json();
    sponsorDataByContentId.set();
    const videoData = response.find(x => x.videoID === contentId)
    if (!videoData) {
        sponsorDataByContentId.set(contentId, null);
        return;
    }

    const videoSegmentsData = videoData.segments;
    if (videoSegmentsData.length === 0) {
        sponsorDataByContentId.set(contentId, null);
        return;
    }
    sponsorDataByContentId.set(contentId, videoSegmentsData);
  } catch (error) {
    sponsorDataByContentId.set(contentId, null);
  }
}

function getStatusCalculateRoundTrip(device) {
  return new Promise((resolve, reject) => {
    try {
      const begin = Date.now();
      device.getStatus((err, status) => {
        if (err) {
          reject(err);
          return;
        }
        floatingAverageLatencyBucket.push(Date.now() - begin);
        floatingAverageLatency =
          floatingAverageLatencyBucket.reduce((a, b) => a + b, 0) /
            floatingAverageLatencyBucket.length / 2 || 0;
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

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function setUniqueInterval(key, callback, ms, override = false) {
  if (uniqueIntervals.get(key)) {
    if (!override) {
      return;
    }
    clearInterval(uniqueIntervals.get(key));
    return;
  }
  callback();
  uniqueIntervals.set(key, setInterval(callback, ms));
}
function setUniqueTimeout(key, callback, ms, override = false) {
    if (uniqueTimeouts.get(key)) {
      if (!override) {
        return;
      }
      clearTimeout(uniqueTimeouts.get(key));
    }
    uniqueTimeouts.set(key, setTimeout(callback, ms));
  }
