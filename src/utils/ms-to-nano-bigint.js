'use strict';
module.exports = function msToNanoBigInt(ms) {
	return BigInt(ms) * 1000000n;
};
