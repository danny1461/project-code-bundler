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
			let baseName = path.basename(destFile);
			
			['style', 'editor-styles'].forEach((file) => {
				if (baseName == `${file}.min.css`) {
					let theme = destFile.match(/wp-content[\/\\]themes[\/\\]([a-zA-Z0-9_-]+)[\/\\]/);
					destFile = path.join(cwd, 'wp-content/themes', theme[1], `${file}.css`);
				}
			});

			return destFile;
		});

		watcher.on('after_js after_css', ({file, destFile}) => {
			let theme = destFile.match(/wp-content[\/\\]themes[\/\\]([a-zA-Z0-9_-]+)[\/\\]/),
				resourceFile = path.join(cwd, 'wp-content/themes', theme[1], 'inc/functions/resources.inc.php');

			return new Promise((resolve) => {
				fs.exists(resourceFile, (exists) => {
					if (exists) {
						fs.readFile(resourceFile, 'UTF-8', (err, contents) => {
							let regexReadyFile = path.basename(destFile).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
								regex = new RegExp('(' + regexReadyFile + '[\'"]\\s*,(?:\\s|.)*?,\\s*)([\'"])?([0-9.]+)\\2(\\s*(?:,\\s*(?:true|false)\\s*)?\\)\\s*;)'),
								match = contents.match(regex);
			
							if (match) {
								let patchNdx = match[3].lastIndexOf('.'),
									version = parseInt(match[3].substr(patchNdx + 1));

								if (isNaN(version)) {
									return resolve();
								}

								version = match[3].substr(0, patchNdx + 1) + (version + 1);

								contents = contents.substr(0, match.index) + match[1] + "'" + version + "'" + match[4] + contents.substr(match.index + match[0].length);

								fs.writeFile(resourceFile, contents, 'UTF-8', (err) => {
									log(`{{yellow:Version bumped to: ${version}}}`);
									resolve();
								});
							}
							else {
								resolve();
							}
						});
					}
					else {
						resolve();
					}
				});
			});
		});
	}
};
