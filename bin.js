#!/usr/bin/env node

global.cwd = process.cwd();

function usage() {
	let version = require('./package.json').version;
	console.log(`
Project Code Bundler v${version}

bundler [[-args]]
-update      Update this package to the latest
-fs-events   The watcher will use a native watcher for your file system
-no-notify   The bundlers will not emit OS notifications on success/fail
`);

	process.exit();
}

let options = {};
for (let i = 2; i < process.argv.length; i++) {
	let arg = process.argv[i];
	if (arg[0] != '-' || arg == '-?') {
		usage();
	}

	arg = arg.substr(1).replace(/-[a-z]/gi, (str) => {
		return str[1].toUpperCase();
	});

	options[arg] = true;
}

if (options.update) {
	require('./src/update');
}
else {
	const Watcher = require('./');

	let watcher = new Watcher(options);
	watcher.start();
}