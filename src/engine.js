'use strict';

const ChromecastAPI = require('chromecast-api');
const Device = require('./device');

const config = require('./config')();

module.exports = class Engine {
	constructor() {
		this.lastDeviceId = -1;
		this.started = false;
		this.interval = null;
		this.client = null;
		this.devices = {};
	}
	start() {
		if (this.started) {
			throw new Error('Engine already started');
		}
		const loopBody = async () => {
			try {
				this.getClient();
				this.client.update();
				this.findDevices();

			} catch (err) {
				if (config.flags.debug) {
					console.error(err);
				}
			}
		};
		this.interval = setInterval(loopBody, config.intervals.lookForDevices);
		loopBody();
		this.started = true;
	}
	getClient() {
		if (!this.client) {
			this.client = new ChromecastAPI();
		}
	}
	findDevices() {
		console.log(this.client.devices)
		for (const device of this.client.devices) {
			if (!this.devices[device.host]) {
				this.devices[device.host] = new Device(device);
				//this.devices[device.host].start();
			}
		}
	}
};
