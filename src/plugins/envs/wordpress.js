const fs = require('fs');
const path = require('path');
const log = require('../../utils/log');

module.exports = function(watcher) {
	// Check if this is a WP directory
	if (fs.existsSync(path.join(cwd, 'wp-content/themes'))) {
		log('{{cyan:WordPress Detected}}');

		let regex = /^wp-content[\/\\]themes[\/\\][a-zA-Z0-9_-]+[\/\\]/;
		watcher.registerShouldWatchHandler((ext, file) => {
			if (!regex.test(file)) {
				return false;
			}
		});

		watcher.on('dest_css_file', (destFile) => {
			if (path.basename(destFile) == 'style.min.css') {
				let theme = destFile.match(/wp-content[\/\\]themes[\/\\]([a-zA-Z0-9_-]+)[\/\\]/);
				destFile = path.join(cwd, 'wp-content/themes', theme[1], 'style.css');
			}

			return destFile;
		});
	}
};