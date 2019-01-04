const fs = require('fs');
const path = require('path');
const log = require('../../utils/log');

module.exports = function(watcher) {
	// Check if this is a WP directory
	if (fs.existsSync(path.join(cwd, 'wp-content/themes'))) {
	
		log('{{cyan:WordPress Detected}}');
		watcher.on('before_change', ({file}, shouldHandle) => {
			if (!file.match(/[\/\\]wp-content[\/\\]themes[\/\\][a-zA-Z0-9_-]+[\/\\]/)) {
				shouldHandle = false;
			}
	
			return shouldHandle;
		});
	
	}
};