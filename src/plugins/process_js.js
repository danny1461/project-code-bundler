const loadTaskDeps = require('../utils/loadTaskDeps');

module.exports = function(watcher) {
	watcher.registerExt('js');

	// Was this an includes folder
	watcher.on('unlink_', (dir) => {
		console.log('folder deleted: ' + dir);
	});

	// Primary work
	watcher.on('add_js change_js', ({file}) => {
		return loadTaskDeps(['babel-core', 'babel-preset-es2015', 'uglify-js']).then((libs) => {
			console.log('Process JS File: ' + file);

			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('done');
					resolve();
				}, 5000);
			});
		});
	});
};