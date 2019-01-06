const Watcher = require('./');

process.chdir('D:\\Devel\\PHP\\htdocs\\wordpress');
global.cwd = process.cwd();

function usage() {
	let version = require('./package.json').version;
	console.log(`
Project Code Bundler v${version}

watcher [[-args]]
-fsevents    The watcher will use a native watcher for your file system
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

	arg = arg.replace(/-[a-z]/gi, (str) => {
		return str[1].toUpperCase();
	});

	options[arg] = true;
}

let watcher = new Watcher(options);
watcher.start();