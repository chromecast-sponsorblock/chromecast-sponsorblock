'use strict';

const meow = require('meow');

const cli = meow(
	`
      Usage
        $ cast-sponsorblock
   
      Options
        --config, -c        Use config file
        --interactive, -i   Interactive use
        --debug, -d         Show every errors and print the config file
   
      Examples
        $ cast-sponsorblock
        $ cast-sponsorblock -i
        $ cast-sponsorblock -c ~/.config/cast-sponsorblock.json
        $ cast-sponsorblock -d
  `,
	{
		flags: {
			config: {
				type: 'string',
				alias: 'c'
			},
			debug: {
				type: 'boolean',
				alias: 'd'
			}
		}
	}
);

require('../config')(cli.flags);

console.log('Chromecast Sponsorblock v0.1 by Simon Lévesque');
