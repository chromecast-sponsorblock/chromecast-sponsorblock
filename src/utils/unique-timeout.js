const { LRUMap } = require("lru_map");

const uniqueTimeouts = new LRUMap(32);

uniqueTimeouts.shift = function () {
  let entry = LRUMap.prototype.shift.call(this);
  try {
    clearTimeout(entry);
  } catch (err) {
    console.error(err);
  }
  return entry;
};

module.exports = function setUniqueTimeout(key, callback, ms_function, override = false) {
  if (uniqueTimeouts.has(key)) {
    if (!override) {
      return;
    }
    clearTimeout(uniqueTimeouts.get(key));
  }
  uniqueTimeouts.set(key, setTimeout(callback, ms_function()));
}
