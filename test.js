process.chdir('D:\\Devel\\PHP\\htdocs\\grocery-outlet');

global.cwd = process.cwd();

const Watcher = require('./');

let watcher = new Watcher({});
watcher.start();