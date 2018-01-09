#!/usr/bin/env node
const log = require('debug')('odin:torrent_streamer')
const config = require('config')
const { createServer } = require('http')
const tmpCleaner = require('./tmp_cleaner')
const api = require('./api')

let server = createServer(api)

server.listen(config.torrent_streamer.port, (err) => {
  log('torrent_streamer listening to you on port %s!', config.torrent_streamer.port)
  tmpCleaner.start()
})
