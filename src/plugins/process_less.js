const fs = require('fs');
const path = require('path');
const promisify = require('micro-promisify');
const sassPlugin = require('./process_sass');
const notify = require('../utils/notify');

module.exports = function(watcher) {
	watcher.registerShouldWatchHandler((ext) => {
		if (ext == 'less') {
			return true;
		}
	});

	// Primary work
	watcher.on('add_less change_less', ({file, ext}) => {
		return sassPlugin.boilerPlate(file, ext, ['less@^3.9.0'], async (libs, destFile) => {
			let lessInput = await promisify(fs.readFile)(file, {encoding: 'UTF-8'});

			let result = await libs.less.render(lessInput, {
				sourceMap: {
					sourceMapURL: path.basename(destFile) + '.map'
				}
			}).then(
				function(output) {
					return output;
				},
				function(error) {
					return {error};
				}
			);

			if (result.error) {
				console.log(result.error);
				return false;
			}

			await promisify(fs.writeFile)(destFile, result.css, {encoding: 'UTF-8'});
			await promisify(fs.writeFile)(destFile + '.map', result.map, {encoding: 'UTF-8'});
			return;

			/* return {
				css: result.css,
				map: result.map
			} */
		})
	});
};