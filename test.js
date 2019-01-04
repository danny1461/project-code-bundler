const Watcher = require('./');

process.chdir('D:\\Devel\\PHP\\htdocs\\lab\\x');

global.cwd = process.cwd();

let watcher = new Watcher();
watcher.start();