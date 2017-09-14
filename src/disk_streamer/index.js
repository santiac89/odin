#!/usr/bin/env node
const log = require('debug')('odin:disk_streamer')
const config = require('config')
const { createServer } = require('http')
const api = require('./api')

let server = createServer(api)

server.listen(config.disk_streamer.port, () => {
  log('disk_streamer listening to you on port %s!', config.disk_streamer.port)
})

