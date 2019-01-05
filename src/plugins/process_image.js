const fs = require('fs');
const path = require('path');
const promisify = require('micro-promisify');
const loadTaskDeps = require('../utils/loadTaskDeps');
const log = require('../utils/log');
const stopWatch = require('../utils/stopWatch');

module.exports = function(watcher) {
	watcher.registerExt('jpg jpeg png');

	const expiration = {};

	async function doWork(file, plugin, imagemin) {
		if (expiration[file]) {
			return;
		}

		log(`Compressing image file:`);
		log(`{{cyan:${file}}}`);

		stopWatch.start('image_file');

		let buffer = await promisify(fs.readFile)(file),
			dataLen = buffer.length;
		buffer = await imagemin.buffer(buffer, {
			plugins: [plugin]
		});

		if (buffer.length < dataLen) {
			await promisify(fs.writeFile)(file, buffer);

			expiration[file] = true;
			setTimeout(() => {
				delete expiration[file];
			}, 500);
		}

		log(`{{magenta:Task completed in ${stopWatch.end('image_file')}ms}}`);
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