const ChromecastAPI = require("chromecast-api");

const setUniqueInterval = require("./utils/unique-interval");
const wait = require("./utils/wait");

const getStatusAndLatency = require("./get-status-and-latency");
const getSegmentsBlockData = require("./get-segments");
const generateTimers = require("./generate-timers");

let floatingAverageLatency = 50; // initial high value
let currentTime = 0;
const LOOK_FOR_DEVICES_TIMING_FUNCTION = () => floatingAverageLatency * 15;
const PING_DEVICE_TIMING_FUNCTION = () => floatingAverageLatency * 4;
let client = new ChromecastAPI();

require('./motd');

setUniqueInterval(
  "LOOK_FOR_DEVICES",
  async () => {
    try {
      if (!client) {
        client = new ChromecastAPI();
      }
      client.update();
      await wait(floatingAverageLatency);
      for (const device of client.devices) {
        setUniqueInterval(
          "PING_DEVICE_" + device.friendlyName,
          async () => {
            try {
              const status = await getStatusAndLatency(
                device,
                floatingAverageLatency
              );
              currentTime = status.currentTime;
              if (status.idleReason) {
                currentTime = 9999999999;
                return;
              }
              const segments = await getSegmentsBlockData(
                status.media.contentId
              );
              generateTimers(
                status.media.contentId,
                segments,
                currentTime,
                device,
                floatingAverageLatency
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
      }
    } catch (err) {
      client.destroy();
      delete client;
      console.error(err);
    }
  },
  LOOK_FOR_DEVICES_TIMING_FUNCTION
);
