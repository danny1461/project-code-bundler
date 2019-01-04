const fs = require('fs');
const path = require('path');
const log = require('../../utils/log');

module.exports = function(watcher) {
	// Check if this is a Drupal Directory
	if (fs.existsSync(path.join(cwd, '/misc/druplicon.png'))) {
	
		log('{{cyan:Drupal Detected}}');
		watcher.on('before_change', ({file}, shouldHandle) => {
			if (!file.match(/[\/\\]sites[\/\\]all[\/\\]themes[\/\\][a-zA-Z0-9_-]+[\/\\]/)) {
				shouldHandle = false;
			}
	
			return shouldHandle;
		});
	
	}
};