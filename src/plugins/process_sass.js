const loadTaskDeps = require('../utils/loadTaskDeps');

module.exports = function(watcher) {
	watcher.registerExt('sass scss');

	// Primary work
	watcher.on('add_sass add_scss change_sass change_scss', ({file, ext}) => {
		return loadTaskDeps(['node-sass']).then((libs) => {
			console.log(`Process ${ext.toUpperCase()} File: ${file}` + file);

			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('done');
					resolve();
				}, 5000);
			});
		});
	});
};