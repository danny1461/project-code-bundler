const path = require('path');
const notifier = require('node-notifier');

module.exports = function(msg, icon) {
	let options = {
		title: 'Project Code Bundler',
		message: msg,
		sound: true,
		wait: true
	};

	if (icon) {
		if (/[\/\\]/.test(icon)) {
			icon = path.resolve(__dirname, '../icons', icon);
		}
		
		options.icon = icon;
	}

	notifier.notify(options);
}