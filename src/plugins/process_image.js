const fs = require('fs');
const path = require('path');
const promisify = require('micro-promisify');
const loadTaskDeps = require('../utils/loadTaskDeps');
const log = require('../utils/log');
const stopWatch = require('../utils/stopWatch');
const notify = require('../utils/notify');

module.exports = function(watcher) {
	const expirations = {};

	watcher.registerShouldWatchHandler((ext) => {
		if (ext == 'jpg' || ext == 'jpeg' || ext == 'png') {
			return true;
		}
	});

	watcher.registerIgnoreFsEventHandlers((file) => {
		if (expirations[file]) {
			return true;
		}
	});

	async function doWork(file, plugin, imagemin) {
		log(`Compressing image file:`);
		log(`{{cyan:${file}}}`);

		stopWatch.start('image_file');

		let buffer = await promisify(fs.readFile)(file),
			dataLen = buffer.length;
		buffer = await imagemin.buffer(buffer, {
			plugins: [plugin]
		});

		if (buffer.length < dataLen) {
			expirations[file] = true;

			await promisify(fs.writeFile)(file, buffer);

			setTimeout(() => {
				delete expirations[file];
			}, 3000);
		}

		log(`{{magenta:Task completed in ${stopWatch.end('image_file')}ms}}`);
		if (!watcher.options.noNotify) {
			notify(`Optimized ${path.basename(file)}`, file);
		}
	}

	// Primary work
	watcher.on('add_jpg add_jpeg change_jpg change_jpeg', ({file}) => {
		return loadTaskDeps(['imagemin', 'imagemin-jpegtran']).then((libs) => {
			return doWork(file, libs.imageminJpegtran(), libs.imagemin);
		});
	});

	watcher.on('add_png change_png', ({file}) => {
		return loadTaskDeps(['imagemin', 'imagemin-pngquant']).then((libs) => {
			return doWork(file, libs.imageminPngquant(), libs.imagemin);
		});
	});
};