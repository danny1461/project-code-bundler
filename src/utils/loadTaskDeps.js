const path = require('path');
const { spawn } = require('child_process');
const log = require('./log');

const keyCache = {};
function getDepKey(dep) {
	if (keyCache[dep]) {
		return keyCache[dep];
	}

	return keyCache[dep] = dep.replace(/-[a-z]/gi, (str) => {
		return str[1].toUpperCase();
	});
}

module.exports = function(deps) {
	return new Promise((resolve) => {
		let resp = {},
			clean = {},
			missing = [];

		for (let i in deps) {
			let dep = deps[i],
				versionNdx = dep.indexOf('@', 1);

			if (versionNdx >= 0) {
				clean[dep] = dep.substr(0, versionNdx);
			}

			try {
				resp[getDepKey(clean[dep])] = require(clean[dep]);
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
					resp[getDepKey(clean[missing[i]])] = require(clean[missing[i]]);
				}

				resolve(resp);
			});
		}
		else {
			resolve(resp);
		}
	});
}