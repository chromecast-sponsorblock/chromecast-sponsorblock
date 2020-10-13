const { LRUMap } = require("lru_map");

const uniqueIntervals = new LRUMap(32);

uniqueIntervals.shift = function () {
  let entry = LRUMap.prototype.shift.call(this);
  try {
    clearTimeout(entry);
  } catch (err) {
    console.error(err);
  }
  return entry;
};

module.exports = function setUniqueInterval(key, callback, ms_function) {
  if (uniqueIntervals.has(key)) {
    return;
  }
  loop();
  function loop() {
    clearTimeout(uniqueIntervals.get(key));
    uniqueIntervals.set(
      key,
      setTimeout(() => {
        loop();
      }, ms_function())
    );
    callback();
  }
};
