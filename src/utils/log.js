const colors = require('colors/safe');

function log(msgs, newLine, prefix) {
	if (typeof msgs == 'string') {
		msgs = [msgs];
	}

	if (newLine === undefined) {
		newLine = true;
	}

	if (prefix === undefined) {
		prefix = newLine;
	}

	if (prefix) {
		let d = new Date(),
			hours = ('0' + d.getHours()).substr(-2),
			minutes = ('0' + d.getMinutes()).substr(-2),
			seconds = ('0' + d.getSeconds()).substr(-2);
		prefix = `[{{gray:${hours}:${minutes}:${seconds}}}] `;
	}
	
	if (prefix) {
		msgs = msgs.map((str) => {
			return prefix + str;
		});
	}

	msgs.forEach((str) => {
		let match;
		while (match = str.match(/\{\{([a-z]+):((?:\s|.)*?)\}\}/)) {
			str = str.substr(0, match.index) + colors[match[1]](match[2]) + str.substr(match.index + match[0].length);
		}

		if (newLine) {
			console.log(str);
		}
		else {
			process.stdout.write(str);
		}
	});
}

module.exports = log;