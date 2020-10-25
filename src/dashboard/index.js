'use strict';

const config = require('../config')();

function generateLogData() {
  const status = statusByDevice.get(device.host);
  const latency = latencyByDevice.get(device.host);
  const youtubeData = youtubeDataByDevice.get(device.host);
  const segments = segmentsByDevice.get(device.host);
  logInteractive(
    `- (${idByDevice.get(device.host)}) ${device.friendlyName}
Name:                  ${device.name}
Host:                  ${device.host}
Blocked:               ${blocked}
Curent latency:        ${
      latency
        ? `${latency} nanoseconds (${Number(latency / 1000000n)} ms)${
            latency === 50000000n ? " (initial value)" : ""
          }`
        : `unavailable`
    }
Curent ping frequency: ${
      latency
        ? `${PING_DEVICE_TIMING_FUNCTION()} ms (${
            PING_DEVICE_TIMING_FUNCTION() / Number(latency / 1000000n)
          } times the latency)`
        : `unavailable`
    }
Player state:          ${status.playerState}
Current video:         ${status.media.metadata.title} (${
      status.media.contentId
    })
Current channel:       ${
      youtubeData && youtubeData.name ? youtubeData.name : "N/A"
    } (${youtubeData && youtubeData.id ? youtubeData.id : "N/A"})
Current time:          ${status.currentTime} / ${status.media.duration}
Segments: ${
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
  console.log(123123);
}

const Hapi = require('@hapi/hapi');

const init = async () => {

    const server = Hapi.server({
        port: 8072,
        host: 'localhost'
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {

            return 'Hello World!';
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};
console.log(12312)

init();
console.log(12312)

setTimeout(main, 1000);

function main(log, devices, host) {
    logByDevice.set(host, log);
    console.clear();
    console.log("Chromecast Sponsorblock v0.1 by Simon Lévesque");
    console.log(
      "Look for device interval: " + LOOK_FOR_DEVICES_TIMING_FUNCTION()
    );
    console.log("Devices:");
    for (let device of devices) {
      console.log(logByDevice.get(device.host));
    }
  }
  