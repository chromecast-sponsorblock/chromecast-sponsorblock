const meow = require("meow");
const ChromecastAPI = require("chromecast-api");

const setUniqueInterval = require("./utils/unique-interval");
const wait = require("./utils/wait");

const getStatusAndLatency = require("./get-status-and-latency");
const getSegments = require("./get-segments");
const getYoutubeData = require("./get-youtube-data");
const generateTimers = require("./generate-timers");
const { LRUMap } = require("lru_map");
const idByDevice = new LRUMap(64);
const latencyByDevice = new LRUMap(64);
const currentTimeByDevice = new LRUMap(64);
const statusByDevice = new LRUMap(64);
const youtubeDataByDevice = new LRUMap(64);
const segmentsByDevice = new LRUMap(64);
const logByDevice = new LRUMap(64);
const LOOK_FOR_DEVICES_TIMING_FUNCTION = () => 2500;
let client = new ChromecastAPI();

const cli = meow(
  `
    Usage
      $ chromecast-sponsorblock
 
    Options
      --config, -c      Use config file
      --interactive, -i Interactive use
 
    Examples
      $ chromecast-sponsorblock
      $ chromecast-sponsorblock -i
      $ chromecast-sponsorblock -c ~/.config/chromecast-sponsorblock.json
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
    },
  }
);

console.log("Chromecast Sponsorblock v0.1 by Simon Lévesque");
const config = require("./load-config")(cli.flags.config);
setUniqueInterval(
  "LOOK_FOR_DEVICES",
  async () => {
    try {
      if (!client) {
        client = new ChromecastAPI();
      }
      client.update();
      await wait(200);
      for (const device of client.devices) {
        idByDevice.set(device.host, idByDevice.size + 0);
        let blocked = false,
          latency = 0;
        try {
          if (
            Array.isArray(config.chromecastFriendlyNames) &&
            config.chromecastFriendlyNames.length > 0 &&
            config.chromecastFriendlyNames.indexOf(device.friendlyName) === -1
          ) {
            blocked = true;
            throw new Error("Chromecast blocked");
          }
          if (!latencyByDevice.has(device.host)) {
            latencyByDevice.set(device.host, 50);
          }
          if (!currentTimeByDevice.has(device.host)) {
            currentTimeByDevice.set(device.host, 0);
          }
          const PING_DEVICE_TIMING_FUNCTION = () =>
            latencyByDevice.get(device.host) * 4;

          latency = latencyByDevice.get(device.host);
          setUniqueInterval(
            "PING_DEVICE_" + device.friendlyName,
            async () => {
              try {
                const status = await getStatusAndLatency(
                  device,
                  latencyByDevice
                );
                statusByDevice.set(device.host, status);

                if (status.idleReason) {
                  currentTimeByDevice.set(device.host, 9999999999);
                  throw new Error("Idle, no need to poll");
                } else {
                  currentTimeByDevice.set(device.host, status.currentTime);
                }

                youtubeDataByDevice.set(
                  device.host,
                  await getYoutubeData(status.media.contentId)
                );
                const segments = 
                await getSegments(status.media.contentId);
                segmentsByDevice.set(
                  device.host,
                  segments
                );

                generateTimers(
                  status.media.contentId,
                  segments,
                  currentTimeByDevice,
                  device,
                  latencyByDevice
                );
              } catch (err) {
                if (err.message === "no session started") {
                  // waiting for youtube
                  return;
                }

                console.error(err);
              }
            },
            PING_DEVICE_TIMING_FUNCTION
          );
          if (cli.flags.interactive) {
            const status = statusByDevice.get(device.host);
            const youtubeData = youtubeDataByDevice.get(device.host);
            const segments = segmentsByDevice.get(device.host);
            logInteractive(
              `* (${idByDevice.get(device.host)}) ${device.friendlyName}
  * Name: ${device.name}
  * Host: ${device.host}
  * Blocked: ${blocked}
  * Curent latency: ${latency}
  * Player state: ${status.playerState}
  * Current video: ${status.media.metadata.title} (${status.media.contentId})
  * Current channel: ${youtubeData ? youtubeData.name : "N/A"} (${
                youtubeData ? youtubeData.id : "N/A"
              })
  * Current time: ${status.currentTime}
  * Segments:
${segments.map((x, i) => '    * (' + i + ') Begin: ' + x[0] + ', End: ' + x[1] + ', Category: ' + x.category + ', Ignored: ' + x.ignored).join('\n')} 
  `,
              client.devices,
              device.host
            );
          }
        } catch (err) {}
      }
    } catch (err) {
      client.destroy();
      delete client;
      console.error(err);
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
