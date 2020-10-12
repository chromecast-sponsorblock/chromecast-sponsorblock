const setUniqueTimeout = require("./utils/unique-timeout");

let preventConflictSeek = false;

// consider out of segment before the end to prevent seeking twice;
const END_BUFFER = .1;

module.exports = function generateTimers(
  contentId,
  segments,
  currentTime,
  device,
  floatingAverageLatency
) {
  try {
    let i = 0;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const position = getPosition(segment);
      // we are after segment
      if (position === 'after') {
        continue;
      }
      else if (position === 'in'){
        seekToOnce();
        continue;
      }
      else if (position === 'before') {
        const timeout =
          (segment[0] - currentTime) * 1000 - floatingAverageLatency * 2;
        setUniqueTimeout(
          contentId + "_SEG_" + i,
          () => {
            seekToOnce();
          },
          () => timeout,
          true
        );
      }

      function seekToOnce() {
        console.log('TRYING TO FORCE SEEK')
        if (preventConflictSeek) {
          return;
        }
        const position = getPosition(segment);
        console.log(position);
        console.log(segment);
        if (position === 'after') {
            return;
        }
        preventConflictSeek = true;
        console.log('FORCE SEEK NOW !!!')
        device.seekTo(segment[1]);
        setTimeout(() => {
          preventConflictSeek = false;
        }, 5000);
      }
    }
  } catch (err) {
    console.error(err);
  }

  function getPosition (seg) {
      const begin = seg[0];
      const end = seg[1] - END_BUFFER;
    if (end < currentTime) {
        return 'after';
      }
      else if (begin < currentTime && currentTime < end) {
        return 'in';
      }
      else {
        return 'before';
    }
  }
};
