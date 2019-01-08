# Project Code Bundler
by Daniel Flynn

## Installation
`npm i -g https://github.com/danny1461/project-code-bundler.git`

## Usage
A global script `bundler` will be exposed to your system. Simply navigate to your project directory in a command prompt and run it.

Options
  * -fs-events
    * This package uses chokidar for watching files. Using this options disables usePolling forcing chokidar to use a more performant File System watcher. I have experienced issues with this on Windows however where directories containing watched files cannot be deleted without first deleting the watched files making for a frustrating dev experience. If you are suffering high CPU usage or won't be deleting directories often, use this param to improve performance.
  * -no-notify
    * This package uses node-notifier for os specific toasts. Turning this option on disables those notifications
  * -update
    * Run this command to automatically update this package with the latest release in this github repo.

## Features
  * Javascript
    * Look for a directory named `includes` in the same directory and prepend any js file found within to itself. The files are sorted in natural order
    * Look for a directory named `[FILENAME_WO_EXT]-includes` and prepend any js file found within to itself but **after** any included file from `includes`
    * Use babel to transpile any es2015
    * Write a `[FILENAME_WO_EXT].min.js` and `[FILENAME_WO_EXT].min.js.map` file in the same directory
    * If file is inside a directory name that matches `^(?:([a-z0-9_-]+)-)?includes$`, then it will **not** minify this file and instead look one directory higher for any *.js file that is not *.min.js and process those
  * SCSS/SASS
    * If filename starts with an `_`, it is assumed this is a partial. It will recursively search up the directory tree searching for an un-prefixed with an `_` file of the same extension. It stops searching when it finds files or when it reaches the directory you ran `bundler` from. Any files found when it stops are processed.
  * Less - Same as SCSS/SASS
  * Stylus - Same as SCSS/SASS
  * JPEG/JPG/PNG
    * These files will be optimized **in place**. I do not use an exhaustive list of libraries to do this so it's great but probably not best