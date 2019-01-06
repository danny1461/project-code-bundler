const fs = require('fs');
const path = require('path');
const glob = require('glob');
const promisify = require('micro-promisify');
const loadTaskDeps = require('../utils/loadTaskDeps');
const log = require('../utils/log');
const stopWatch = require('../utils/stopWatch');
const notify = require('../utils/notify');

const plugin = {
	watcher: null,

	install: function(watcher) {
		plugin.watcher = watcher;

		watcher.registerShouldWatchHandler((ext) => {
			if (ext == 'sass' || ext == 'scss') {
				return true;
			}
		});
	
		// Primary work
		watcher.on('add_sass add_scss change_sass change_scss', ({file, ext}) => {
			return plugin.boilerPlate(file, ext, ['node-sass@^4.11.0'], async (libs, destFile) => {
				let result = libs.nodeSass.renderSync({
					file,
					outputStyle: 'compressed',
					outFile: path.basename(destFile),
					sourceMap: path.basename(destFile) + '.map'
				});

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
				}; */
			});
		});
	},

	recurseProject: async function(dir, fileGlob) {
		let lastDir = null;

		while (dir != lastDir && dir.length >= cwd.length) {
			let globStr = path.join(dir, fileGlob),
				files = await promisify(glob)(globStr, {ignore: `**/_${fileGlob}`, nonull: false});
			
			if (files.length) {
				files.forEach((file) => {
					plugin.watcher.watchQueue('change', file);
				});
				break;
			}

			lastDir = dir;
			dir = path.dirname(dir);
		}
	},

	boilerPlate: function(file, ext, deps, cb) {
		let basename = path.basename(file);
	
		if (basename[0] == '_') {
			return plugin.recurseProject(path.dirname(file), `*.${ext}`)
		}
		else {
			return loadTaskDeps(deps).then(async (libs) => {
				stopWatch.start(`${ext}_file`);

				let fileStem = path.basename(file, `.${ext}`);

				let destFile = path.resolve(file, `../${fileStem}.min.css`);
				destFile = (await plugin.watcher.trigger('dest_css_file', destFile, destFile)).success;

				log('');
				log(`${ext.toUpperCase()} File Processing:`);
				log(`{{cyan:${file}}}`);
				log('   |');
				log('   v');
				log(`{{green:${destFile}}}`);

				let resp = cb(libs, destFile);
				if (typeof resp == 'object' && typeof resp.then == 'function') {
					resp = await resp;
				}
				if (resp === false) {
					log(`{{magenta:Task completed in ${stopWatch.end(`${ext}_file`)}ms}}`);
					return;
				}
				else if (typeof resp == 'object') {
					if (!libs.cleanCss) {
						log('{{red:Bad plugin response because clean-css is needed}}');
						return;
					}

					if (resp.map instanceof Buffer) {
						resp.map = resp.map.toString();
					}
					if (typeof resp.map == 'string') {
						resp.map = JSON.parse(resp.map);
					}

					resp = new libs.cleanCss({
						sourceMap: true,
						level: {
							2: {
								all: true
							}
						}
					}).minify(resp.css, resp.map);

					if (resp.errors.length) {
						log('{{red:Errors were raised during optimization}}');
						console.log(resp.errors);
						return;
					}

					await promisify(fs.writeFile)(destFile, resp.styles, {encoding: 'UTF-8'});
					await promisify(fs.writeFile)(destFile + '.map', resp.sourceMap, {encoding: 'UTF-8'});
				}

				await plugin.watcher.trigger(`after_${ext}`, file);

				log(`{{magenta:Task completed in ${stopWatch.end(`${ext}_file`)}ms}}`);
				if (!plugin.watcher.options.noNotify) {
					notify(`Compiled ${path.basename(file)} to ${path.basename(destFile)}`, `${ext}.png`);
				}
			});
		}
	}
};

module.exports = plugin;