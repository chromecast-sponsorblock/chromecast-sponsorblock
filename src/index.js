"use strict";

// Chromecast SponsorBlock

const meow = require("meow");
const ChromecastAPI = require("chromecast-api");
const { LRUMap } = require("lru_map");

// increase listeners limit to ping more often
require("events").EventEmitter.defaultMaxListeners = 25;

const cli = meow(
  `
    Usage
      $ chromecast-sponsorblock
 
    Options
      --config, -c        Use config file
      --interactive, -i   Interactive use
      --debug, -d         Show every errors and print the config file
 
    Examples
      $ chromecast-sponsorblock
      $ chromecast-sponsorblock -i
      $ chromecast-sponsorblock -c ~/.config/chromecast-sponsorblock.json
      $ chromecast-sponsorblock -d
`,
  {
    flags: {
      config: {
        type: "string",
        alias: "c",
      },
      interactive: {
        type: "boolean",
        alias: "i",
      },
      debug: {
        type: "boolean",
        alias: "d",
      },
    },
  }
);
if (cli.flags.interactive) {
  console.clear();
}
console.log("Chromecast Sponsorblock v0.1 by Simon Lévesque");
const config = require("./load-config")(cli.flags);
if (cli.flags.interactive) {
  console.log('Waiting for chromecasts...');
}

const setUniqueInterval = require("./utils/unique-interval");
const wait = require("./utils/wait");

const getStatusAndLatency = require("./get-status-and-latency");
const getSegments = require("./get-segments");
const getYoutubeData = require("./get-youtube-data");
const generateTimers = require("./generate-timers");
const idByDevice = new LRUMap(64);
const latencyByDevice = new LRUMap(64);
const currentTimeByDevice = new LRUMap(64);
const statusByDevice = new LRUMap(64);
const youtubeDataByDevice = new LRUMap(64);
const segmentsByDevice = new LRUMap(64);
const logByDevice = new LRUMap(64);
const LOOK_FOR_DEVICES_TIMING_FUNCTION = () => 2500;
const PING_DEVICE_TIMING_MULTIPLIFIER = 8;
let client = new ChromecastAPI();

const defaultStatus = {
  playerState: "LOADING_CHROMECAST_DATA",
  currentTime: "Loading current time",
  media: {
    contentId: "Loading content ID",
    metadata: {
      title: "Loading title",
    },
    duration: "Loading duration",
  },
};

const blockedStatus = {
  playerState: "CHROMECAST_BLOCKED_BY_CONFIG",
  currentTime: "Current time unavailable",
  media: {
    contentId: "Content ID unavailable",
    metadata: {
      title: "Title unavailable",
    },
    duration: "Duration unavailable",
  },
};

let logNow = true;
setUniqueInterval(
  "LOOK_FOR_DEVICES",
  async () => {
    try {
      if (!client) {
        client = new ChromecastAPI();
      }
      client.update();
      await wait(200);

      let logOnce = true;
      for (const device of client.devices) {
        // init on new device
        if (typeof idByDevice.get(device.host) === "undefined") {
          idByDevice.set(device.host, idByDevice.size + 0);
        }
        if (typeof statusByDevice.get(device.host) === "undefined") {
          statusByDevice.set(device.host, defaultStatus);
        }
        if (!latencyByDevice.has(device.host)) {
          latencyByDevice.set(device.host, 50n * 1000000n);
        }
        if (!currentTimeByDevice.has(device.host)) {
          currentTimeByDevice.set(device.host, 0);
        }
        const PING_DEVICE_TIMING_FUNCTION = () =>
          Math.ceil(
            Number(latencyByDevice.get(device.host) / 1000000n) *
              PING_DEVICE_TIMING_MULTIPLIFIER
          );

        let blocked = false;
        try {
          if (
            Array.isArray(config.chromecastFriendlyNames) &&
            config.chromecastFriendlyNames.length > 0 &&
            config.chromecastFriendlyNames.indexOf(device.friendlyName) === -1
          ) {
            blocked = true;
            statusByDevice.set(device.host, blockedStatus);
            generateLogData();
            if (!config.flags.interactive) {
              throw new Error("Chromecast blocked");
            } else {
              return;
            }
          }

          setUniqueInterval(
            "PING_DEVICE_" + device.host,
            async () => {
              try {
                const status = await getStatusAndLatency(
                  device,
                  latencyByDevice
                );
                statusByDevice.set(device.host, status);

                if (cli.flags.interactive && logOnce) {
                  logOnce = false;
                  generateLogData();
                }

                if (status.idleReason) {
                  currentTimeByDevice.set(device.host, 9999999999);
                  throw new Error("Idle, no need to poll");
                } else {
                  currentTimeByDevice.set(device.host, status.currentTime);
                }

                const [ytData, segments] = await Promise.all([
                  getYoutubeData(status.media.contentId),
                  getSegments(status.media.contentId),
                ]);

                youtubeDataByDevice.set(device.host, ytData);
                segmentsByDevice.set(device.host, segments);

                if (cli.flags.interactive && logNow) {
                  logNow = false;
                  generateLogData();
                }

                generateTimers(
                  status.media.contentId,
                  segments,
                  currentTimeByDevice,
                  device,
                  latencyByDevice
                );
              } catch (err) {
                if (config.flags.debug) {
                  console.error(err);
                }
              }
            },
            PING_DEVICE_TIMING_FUNCTION
          );
          if (cli.flags.interactive) {
            logNow = true;
          }
        } catch (err) {
          if (config.flags.debug) {
            console.error(err);
          }
        }

        function generateLogData() {
          const status = statusByDevice.get(device.host);
          const latency = latencyByDevice.get(device.host);
          const youtubeData = youtubeDataByDevice.get(device.host);
          const segments = segmentsByDevice.get(device.host);
          logInteractive(
            `* (${idByDevice.get(device.host)}) ${device.friendlyName}
* Name:                  ${device.name}
* Host:                  ${device.host}
* Blocked:               ${blocked}
* Curent latency:        ${
              latency
                ? `${latency} nanoseconds (${Number(latency / 1000000n)} ms)${
                    latency === 50000000n ? " (initial value)" : ""
                  }`
                : `unavailable`
            }
* Curent ping frequency: ${
              latency
                ? `${PING_DEVICE_TIMING_FUNCTION()} ms (${PING_DEVICE_TIMING_MULTIPLIFIER} times the latency)`
                : `unavailable`
            }
* Player state:          ${status.playerState}
* Current video:         ${status.media.metadata.title} (${
              status.media.contentId
            })
* Current channel:       ${
              youtubeData && youtubeData.name ? youtubeData.name : "N/A"
            } (${youtubeData && youtubeData.id ? youtubeData.id : "N/A"})
* Current time:          ${status.currentTime} / ${status.media.duration}
* Segments: ${
              !segments
                ? "Waiting for data"
                : segments.length === 0
                ? "No segments"
                : ""
            }${
  !segments
    ? ""
    : `
    ${segments
        .map(
          (x, i) =>
            "    - #" +
            i +
            " Begin: " +
            x[0] +
            ", End: " +
            x[1] +
            ", Category: " +
            x.category +
            ", Ignored: " +
            x.ignored
        )
        .join("\n")}`
} 
`,
            client.devices,
            device.host
          );
        }
      }
    } catch (err) {
      client.destroy();
      client = null;
      if (config.flags.debug) {
        console.error(err);
      }
    }
  },
  LOOK_FOR_DEVICES_TIMING_FUNCTION
);

function logInteractive(log, devices, host) {
  logByDevice.set(host, log);
  console.clear();
  for (let device of devices) {
    console.log(logByDevice.get(device.host));
  }
}

process.on("warning", (warn) => {
  if (config.flags.debug) {
    console.warn(warn);
  }
});

process.on("uncaughtException", (err) => {
  if (config.flags.debug) {
    console.error(err);
  }
});

process.on("exit", (code) => {
  client.destroy();
  client = null;
  console.log(`About to exit with code: ${code}`);
});
