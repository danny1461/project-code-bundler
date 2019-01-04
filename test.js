const Watcher = require('./');

process.chdir('D:\\Devel\\PHP\\htdocs\\lab\\x');

let watcher = new Watcher();
watcher.start();