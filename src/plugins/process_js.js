const fs = require('fs');
const path = require('path');
const glob = require('glob');
const promisify = require('micro-promisify');
const loadTaskDeps = require('../utils/loadTaskDeps');
const alphanumSort = require('../utils/alphanumSort');
const log = require('../utils/log');
const stopWatch = require('../utils/stopWatch');

module.exports = function(watcher) {
	watcher.registerExt('js');

	async function handleParentFiles(file) {
		let basename = path.basename(file),
			match;
		
		if (!(match = basename.match(/^(?:([a-z0-9_-]+)-)?includes$/i))) {
			return;
		}

		if (match[1]) {
			let searchStr = path.resolve(file, `../${match[1]}.js`);
			if (fs.existsSync(searchStr)) {
				watcher.watchQueue('change', searchStr);
			}
		}
		else {
			let searchStr = path.resolve(file, '../*.js');
			let files = await promisify(glob)(searchStr, {ignore: '**/*.min.js', nonull: false});
			files.forEach((parentFile) => {
				watcher.watchQueue('change', parentFile);
			});
		}
	}

	// Delete an includes folder
	watcher.on('unlink_', ({file, isDir}) => {
		if (!isDir) {
			return;
		}

		return handleParentFiles(file);
	});

	// Delete an included file
	watcher.on('unlink_js', ({file}) => {
		return handleParentFiles(path.dirname(file));
	});

	// Primary work
	watcher.on('add_js change_js', ({file}) => {
		return loadTaskDeps(['babel-core@^6.26.3', 'babel-preset-env', 'uglify-js@^1.3.5'])
			.then(async (libs) => {
				if (file.match(/\.min\.js$|[\/\\](?:[a-z0-9_-]+-)?includes[\/\\][a-z0-9_-]+\.js$/i)) {
					return;
				}

				stopWatch.start('js_file');

				let fileStem = path.basename(file, '.js');

				let filePatterns = [
					path.resolve(file, '../includes/*.js'),
					path.resolve(file, `../${fileStem}-includes/*.js`),
					file
				];
		
				let files = {};
				for (let i = 0; i < filePatterns.length; i++) {
					let searchResults = await promisify(glob)(filePatterns[i], {nonull: false});
					alphanumSort(searchResults, true);
					for (let j = 0; j < searchResults.length; j++) {
						files[path.resolve(searchResults[j])] = searchResults[j];
					}
				}

				let destFile = path.resolve(file, `../${fileStem}.min.js`);
				destFile = (await watcher.trigger('dest_js_file', destFile, destFile)).success;
				let sourceMapFile = destFile + '.map';

				log('');
				log('JS Files(s) Processing:');
				Object.keys(files).forEach((subFile) => {
					log(`{{cyan:${subFile}}}`);
				});
				log('   |');
				log('   v');
				log(`{{green:${destFile}}}`);

				for (let i in files) {
					try {
						let code = await promisify(fs.readFile)(files[i], {encoding: 'UTF-8'});
						let result = libs.babelCore.transform(code, {
							presets: [libs.babelPresetEnv]
						});
						files[i] = result.code;
					}
					catch (e) {
						log(`{{red:Error in ${i}}}`);
						log(`{{red:Line ${e.loc.line} Column ${e.loc.column}}}`);
						log(`{{red:${e.message}}}`);
						log(e.codeFrame, true, false);
						return;
					}
				}

				let result = libs.uglifyJs.minify(files, {
					output: {
						comments: 'some'
					},
					sourceMap: {
						filename: path.basename(destFile),
						url: path.basename(sourceMapFile)
					}
				});

				if (result.error) {
					console.log(result.error);
					log(`{{magenta:Task completed in ${stopWatch.end('js_file')}ms}}`);
					return;
				}

				await promisify(fs.writeFile)(destFile, result.code, {encoding: 'UTF-8'});
				await promisify(fs.writeFile)(sourceMapFile, result.map, {encoding: 'UTF-8'});

				await watcher.trigger('after_js', file);

				log(`{{magenta:Task completed in ${stopWatch.end('js_file')}ms}}`);
			})
			.then(() => {
				return handleParentFiles(path.dirname(file));
			});
	});
};