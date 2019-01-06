const fs = require('fs');
const path = require('path');
const log = require('../../utils/log');

module.exports = function(watcher) {
	// Check if this is a Drupal Directory
	if (fs.existsSync(path.join(cwd, '/misc/druplicon.png'))) {
		log('{{cyan:Drupal Detected}}');

		let regex = /^sites[\/\\]all[\/\\]themes[\/\\][a-zA-Z0-9_-]+[\/\\]/;
		watcher.registerShouldWatchHandler((ext, file) => {
			if (!regex.test(file)) {
				return false;
			}
		});
	}
};