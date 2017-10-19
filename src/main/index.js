#!/usr/bin/env node
const config = require('config')
const { createServer } = require('http')
const { fork } = require('child_process')
const log = require('debug')('odin:main')
const api = require('./api')
const library = require('../lib/library')

library.reload()

fork('./src/torrent_streamer/index.js')
fork('./src/disk_streamer/index.js')

const child = fork('./src/torrent_manager/index.js', [], { stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ] })

let server = createServer(api(child))

server.listen(config.api.port, () => log('odin listening to you on port 3000!'))
