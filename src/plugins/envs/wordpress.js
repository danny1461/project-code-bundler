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
			let theme = destFile.match(/wp-content[\/\\]themes[\/\\]([a-zA-Z0-9_-]+)[\/\\]/);
			theme = path.join(cwd, 'wp-content/themes', theme[1], '/')

			let resourceFiles = [
				path.join(theme, 'inc/functions/resources.inc.php'),
				path.join(theme, 'functions.php')
			];

			return new Promise((resolve) => {
				let resolvedResourcePath = null;
				for (let resourceFile of resourceFiles) {
					try {
						fs.accessSync(resourceFile, fs.constants.F_OK);
						resolvedResourcePath = resourceFile;
					}
					catch(e) {
						continue;
					}
					
					break;
				}

				if (resolvedResourcePath) {
					fs.readFile(resolvedResourcePath, 'UTF-8', (err, contents) => {
						let regexReadyFile = destFile.substr(theme.length).replace(/[.*+?^${}()|[\]\\]/g, m => {
							if (m == '/' || m == '\\') {
								return '[\\/\\\\]';
							}

							return '\\' + m;
						});
						let regex = new RegExp('(\\/\\*\\s*' + regexReadyFile + ' version\\s*\\*\\/\\s*)([\'"])?([0-9.]+)\\2'),
							match = contents.match(regex);
		
						if (match) {
							let patchNdx = match[3].lastIndexOf('.'),
								version = parseInt(match[3].substr(patchNdx + 1));

							if (isNaN(version)) {
								return resolve();
							}

							version = match[3].substr(0, patchNdx + 1) + (version + 1);

							contents = contents.substr(0, match.index) + match[1] + match[2] + version + match[2] + contents.substr(match.index + match[0].length);

							fs.writeFile(resolvedResourcePath, contents, 'UTF-8', (err) => {
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
	}
};
