'use strict';

module.exports = function wait(ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
};
