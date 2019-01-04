const loadTaskDeps = require('../utils/loadTaskDeps');

module.exports = function(watcher) {
	watcher.registerExt('jpg jpeg png');

	function doWork(file, ext) {
		console.log(`Process ${ext.toUpperCase()} File: ${file}` + file);

		return new Promise((resolve) => {
			setTimeout(() => {
				console.log('done');
				resolve();
			}, 5000);
		});
	}

	// Primary work
	watcher.on('add_jpg add_jpeg change_jpg change_jpeg', ({file, ext}) => {
		return loadTaskDeps(['imagemin', 'imagemin-jpegtran']).then((libs) => {
			return doWork(file, ext);
		});
	});

	watcher.on('add_png change_png', ({file, ext}) => {
		return loadTaskDeps(['imagemin', 'imagemin-pngquant']).then((libs) => {
			return doWork(file, ext);
		});
	});
};