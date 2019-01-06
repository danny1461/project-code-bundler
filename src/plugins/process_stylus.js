const fs = require('fs');
const path = require('path');
const promisify = require('micro-promisify');
const sassPlugin = require('./process_sass');
const notify = require('../utils/notify');

module.exports = function(watcher) {
	watcher.registerShouldWatchHandler((ext) => {
		if (ext == 'styl') {
			return true;
		}
	});

	// Primary work
	watcher.on('add_styl change_styl', ({file, ext}) => {
		return sassPlugin.boilerPlate(file, ext, ['stylus@^0.54.5'], async (libs, destFile) => {
			let stylInput = await promisify(fs.readFile)(file, {encoding: 'UTF-8'});

			let renderer = new libs.stylus(stylInput, {
				sourcemap: true,
				filename: path.basename(destFile)
			});

			let css = renderer.render(),
				map = JSON.stringify(renderer.sourcemap);

			await promisify(fs.writeFile)(destFile, css, {encoding: 'UTF-8'});
			await promisify(fs.writeFile)(destFile + '.map', map, {encoding: 'UTF-8'});
			return;

			/* return {
				css: renderer.render(),
				map: renderer.sourcemap
			}; */
		})
	});
};