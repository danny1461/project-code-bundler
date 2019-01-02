#!/usr/bin/env node

const { spawn } = require('child_process');

const cwd = process.cwd();
const globPath = cwd + '\\node_modules\\glob';

function check() {
	try {
		let glob = require(globPath);
		console.log('glob found');
		return true;
	}
	catch (e) {
		console.log('No glob found');
		setTimeout(check, 1000);
		return false;
	}
}

if (!check()) {
	let child = spawn('npm.cmd', ['i', 'glob']);

	child.on('close', () => {
		console.log('npm install finished');
		setTimeout(function() {
			console.log('quitting');
			process.exit();
		}, 3000);
	});
}