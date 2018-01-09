#!/usr/bin/env node
const config = require('config')
const { createServer } = require('http')
const { fork } = require('child_process')
const log = require('debug')('odin:main')
const api = require('./api')
// const cpuProfiler = require('../lib/cpuProfiler')
const tmpCleaner = require('../lib/tmp_cleaner')
const dropboxWatcher = require('../lib/dropbox_watcher')

let args = [];

if (process.argv[2] == '-p') {
  cpuProfiler.init('./public/profiles', 'main')
  args[0] = '-p';
}


// fork('./src/torrent_streamer/index.js',args)
// fork('./src/disk_streamer/index.js',args)

// const child = fork('./src/torrent_manager/index.js', args, { stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ] })

let server = createServer(api)

server.listen(config.api.port, () => log('odin listening to you on port 3000!'))
