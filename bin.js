#!/usr/bin/env node

global.cwd = process.cwd();

const Watcher = require('./');

let watcher = new Watcher();
watcher.start();