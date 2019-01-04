const log = require('./utils/log');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

class Watcher {
	constructor(dir) {
		this.rootDir = dir;

		this.extensions = {};
		this.events = {};

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
			require(pluginFile)(this);
		});
	}

	watchQueue(evt = false, file = false) {
		if (evt && file) {
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
			let queue = this.queue;
			this.queueTimer = false;
			this.queue = [];

			this._processQueue(queue);
		}, 500);
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

	async _processQueue(queue) {
		this.running = true;

		for (let i = 0; i < queue.length; i++) {
			let evt = queue[i].evt,
				file = path.resolve('./', queue[i].file),
				ext = path.extname(file).substr(1),
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
		this.watchQueue();
	}

	registerExt(exts) {
		exts.split(' ').forEach((ext) => {
			this.extensions[ext] = true;
		});
	}

	start() {
		let resolve,
			p = new Promise((r) => {
				resolve = r;
			});

		log('Starting file system watcher..', false, true);
		let startingTimer = setInterval(() => {
			log('.', false);
		}, 1000);

		this.chokidar = chokidar.watch([
			'**/*'
		], {
			persistent: true,
			ignoreInitial: true,
			ignorePermissionErrors: true,
			ignored: (file) => {
				let ext = path.extname(file).substr(1);
				return !(ext == '' || this.extensions[ext]);
			}
		});

		this.queue = [];

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

		return p;
	}
}

module.exports = Watcher;