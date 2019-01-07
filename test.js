process.chdir('D:\\Devel\\PHP\\htdocs\\wordpress');

global.cwd = process.cwd();

const Watcher = require('./');

let watcher = new Watcher(options);
watcher.start();