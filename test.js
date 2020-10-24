process.chdir('D:\\Dev\\Source\\php\\htdocs\\lab\\project-code-bundler-test');

global.cwd = process.cwd();

const Watcher = require('./');

let watcher = new Watcher({});
watcher.start();