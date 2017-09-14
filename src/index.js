#!/usr/bin/env node
const config = require('config')
const { createServer } = require('http')
const torrentManager = require('./torrent_manager')
const dropboxWatcher = require('./dropbox_watcher')
const tmpCleaner = require('./tmp_cleaner')
const api = require('./api')
const library = require('./library')
const { fork } = require('child_process')

let server

torrentManager.resume()
  .then(() => {
    library.reload()
    dropboxWatcher.start()
    server = createServer(api)
    server.listen(config.api.port, () => console.log('odin listening to you on port 3000!'))
    fork('./src/torrent_streamer/index.js')
    fork('./src/disk_streamer/index.js')
  })
