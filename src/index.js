#!/usr/bin/env node
const config = require('config')
const { createServer } = require('http')
const { fork } = require('child_process')
const log = require('debug')('odin:main')
const api = require('./api')
const dropboxWatcher = require('./lib/dropbox_watcher')

let server = createServer(api)

server.listen(config.api.port, () => log('odin listening to you on port 3000!'))

dropboxWatcher.start();
