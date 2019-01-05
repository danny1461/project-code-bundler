const path = require('path');
const { spawn } = require('child_process');
const log = require('./log');

const depCache = {};
function processDep(dep) {
	if (depCache[dep]) {
		return depCache[dep];
	}

	let name = dep,
		versionNdx = dep.indexOf('@', 1);
	if (versionNdx >= 0) {
		name = dep.substr(0, versionNdx);
	}

	let key = clean.replace(/-[a-z]/gi, (str) => {
		return str[1].toUpperCase();
	});

	return depCache[dep] = {name, key};
}

module.exports = function(deps) {
	return new Promise((resolve) => {
		let resp = {},
			clean = {},
			missing = [];

		for (let i in deps) {
			let dep = deps[i];

			try {
				resp[processDep(dep).key] = require(processDep(dep).name);
			}
			catch (e) {
				missing.push(dep);
			}
		}

		if (missing.length) {
			log('Missing required libraries: {{yellow:' + missing.join(' ') + '}}');
			log('Installing..', false, true);

			let timer = setInterval(() => {
				log('.', false);
			}, 1000);

			let cmd = 'npm'
			if (process.platform == 'win32') {
				cmd += '.cmd';
			}

			let installArgs = ['i'].concat(missing, ['--no-bin-links', '--prefix', path.resolve(__dirname, '../../')]),
				child = spawn(cmd, installArgs);

			child.on('close', () => {
				log(' finished', true, false);
				clearInterval(timer);

				for (let i in missing) {
					resp[processDep(dep).key] = require(processDep(dep).name);
				}

				resolve(resp);
			});
		}
		else {
			resolve(resp);
		}
	});
}