#!/usr/bin/env node
const log = require('debug')('odin:torrent_streamer')
const config = require('config')
const { createServer } = require('http')
const tmpCleaner = require('./tmp_cleaner')
const api = require('./api')
const profiler = require('../lib/cpuprofiler')
const heapDump = require('../lib/heapDump')

if (process.argv[2] == '-p') {
  profiler('./public/profiles', 'torrent_streamer')
  heapDump.init('./public/profiles', 'torrent_streamer')
}

let server = createServer(api)

server.listen(config.torrent_streamer.port, (err) => {
  log('torrent_streamer listening to you on port %s!', config.torrent_streamer.port)
  tmpCleaner.start()
})

