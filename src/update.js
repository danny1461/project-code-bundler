const { spawn } = require('child_process');
let cmd = 'npm'
if (process.platform == 'win32') {
	cmd += '.cmd';
}
let repo = require('../package.json').repository;

process.stdout.write('Updating..');
let timer = setInterval(() => {
	process.stdout.write('.');
}, 1000);

let child = spawn(cmd, ['i', '-g', repo]);
child.on('close', () => {
	process.stdout.write(' Done!');
	clearInterval(timer);
	process.exit();
});