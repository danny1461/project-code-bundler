const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const log = require('./utils/log');

class Watcher {
	constructor(options) {
		this.options = options;
		this.shouldWatchHandlers = [];
		this.ignoreFsEventHandlers = [];
		this.events = {};
		this.queue = [];
		this.processQueue = null;

		this._loadPlugins();
	}

	_recurseDir(dir, cb) {
		fs
			.readdirSync(dir)
			.map(file => path.join(dir, file))
			.forEach((file) => {
				if (fs.lstatSync(file).isDirectory()) {
					this._recurseDir(file, cb);
				}
				else {
					cb(file);
				}
			});
	}

	_loadPlugins() {
		let pluginPath = path.join(__dirname, 'plugins');

		this._recurseDir(pluginPath, (pluginFile) => {
			let plugin = require(pluginFile);
			if (typeof plugin == 'function') {
				plugin(this);
			}
			else if (typeof plugin == 'object' && typeof plugin.install == 'function') {
				plugin.install(this);
			}
		});
	}

	watchQueue(evt = false, file = false) {
		if (evt && file) {
			for (let i in this.ignoreFsEventHandlers) {
				if (this.ignoreFsEventHandlers[i](file) === true) {
					return;
				}
			}

			let queueNdx = this.queue.findIndex((obj) => {
				return obj.file == file;
			});

			if (queueNdx >= 0) {
				let evts = [this.queue[queueNdx].evt, evt];

				if (evts.includes('add') && evts.includes('unlink')) {
					this.queue.splice(queueNdx, 1);
				}
			}
			else {
				this.queue.push({evt, file});
			}
		}

		if (this.running || this.queue.length == 0) {
			return;
		}

		if (this.queueTimer) {
			clearTimeout(this.queueTimer);
		}

		this.queueTimer = setTimeout(() => {
			this.processQueue = this.queue;
			this.queueTimer = false;
			this.queue = [];

			this._processQueue();
		}, 150);
	}

	on(evts, cb) {
		evts.split(' ').forEach((evt) => {
			if (!this.events[evt]) {
				this.events[evt] = [];
			}
	
			this.events[evt].push(cb);
		});
	}

	trigger(evts, payload, promiseVal = true) {
		let p = Promise.resolve(promiseVal);

		evts.split(' ').forEach((evt) => {
			let handlers = this.events[evt] || [];
			handlers.forEach((cb) => {
				p = p.then((val) => {
					return new Promise((resolve) => {
						let resp = cb(payload, val);

						if (typeof resp == 'object' && typeof resp.then == 'function') {
							resp.then((newVal) => {
								resolve(newVal === undefined ? val : newVal);
							});
						}
						else {
							resolve(resp === undefined ? val : resp)
						}
					});
				});
			});
		});

		return p
			.then(val => {
				return {success: val};
			})
			.catch(val => {
				return {error: val}
			});
	}

	async _processQueue() {
		this.running = true;

		for (let i = 0; i < this.processQueue.length; i++) {
			let evt = this.processQueue[i].evt,
				file = path.resolve('./', this.processQueue[i].file),
				ext = path.extname(file).substr(1).toLowerCase(),
				isDir = false;
			
			if (evt == 'unlinkDir') {
				isDir = true;
				evt = 'unlink';
				ext = '';
			}
			
			let {success} = await this.trigger(`before_${evt} before_${evt}_${ext}`, {file, ext, isDir});
			if (success) {
				await this.trigger(`${evt} ${evt}_${ext}`, {file, ext, isDir});
			}
		}

		this.running = false;
		this.processQueue = null;
		this.watchQueue();
	}

	registerShouldWatchHandler(cb) {
		this.shouldWatchHandlers.push(cb);
	}

	registerIgnoreFsEventHandlers(cb) {
		this.ignoreFsEventHandlers.push(cb);
	}

	start() {
		let resolve,
			p = new Promise((r) => {
				resolve = r;
			});
		
		// Check for exclusions
		let exclusions = {};
		if (fs.existsSync(path.join(cwd, '.bundler'))) {
			let json = fs.readFileSync(path.join(cwd, '.bundler'));
			json = JSON.parse(json);
			json.forEach((dir) => {
				dir = dir.replace(/[\/\\]/g, path.sep);
				exclusions[dir] = true;
			});
		}

		if (Object.keys(exclusions).length) {
			log('{{yellow:.bundler path exclusions:}}')
			for (let i in exclusions) {
				log(`  {{yellow:${i}}}`);
			}
		}

		log('Starting file system watcher..', false, true);
		let startingTimer = setInterval(() => {
			log('.', false);
		}, 1000);
		let lastDir = null;

		this.chokidar = chokidar.watch([
			'**/*'
		], {
			usePolling: !this.options.fsEvents,
			binaryInterval: 1000,
			persistent: true,
			ignoreInitial: true,
			ignorePermissionErrors: true,
			ignored: (file) => {
				let ext = path.extname(file).substr(1).toLowerCase();

				if (ext == '') {
					lastDir = file;

					if (path.basename(file) == 'node_modules' || exclusions[file]) {
						return true;
					}
					
					return false;
				}
				
				let shouldWatch, resp;
				for (let i in this.shouldWatchHandlers) {
					resp = this.shouldWatchHandlers[i](ext, file);
					if (resp !== undefined) {
						shouldWatch = resp;
						if (shouldWatch === false) {
							return true;
						}
					}
				}

				return !shouldWatch;
			}
		});

		this.chokidar
			.on('ready', () => {
				clearInterval(startingTimer);
				log('', true, false);
				log('{{green:File system watcher is now running}}');

				resolve();
			})
			.on('add', (file) => {
				this.watchQueue('add', path.resolve(cwd, file));
			})
			.on('change', (file) => {
				this.watchQueue('change', path.resolve(cwd, file));
			})
			.on('unlink', (file) => {
				this.watchQueue('unlink', path.resolve(cwd, file));
			})
			.on('unlinkDir', (dir) => {
				this.watchQueue('unlinkDir', path.resolve(cwd, dir));
			})
			.on('error', (err) => log(`{{red:Watcher Error: ${err}}}`));
		
		process.on('SIGINT', () => {
			if (!this.chokidar.closed) {
				this.chokidar.close();
			}
			process.exit();
		});

		process.on('uncaughtException', (e) => {
			if (e.message.indexOf('no parsers registered') >= 0) {
				log('', true, false);
				log('{{red:Error setting up watcher}}', true, false);
				log(`{{red:Error occurred in:}} {{cyan:${lastDir}}}`, true, false);
				log('{{yellow:Consider creating a \'.bundler\' file with a JSON array of directory exclusions}}', true, false);
				log(`{{yellow:relative to:}} {{cyan:${cwd}}}`, true, false);
			}
			else {
				console.log(e);
			}

			process.exit();
		});

		return p;
	}
}

module.exports = Watcher;