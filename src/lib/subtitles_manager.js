const config = require('config')
const path = require('path')
const log = require('debug')('odin:subtitles_manager.js')
const fs = require('fs')
const subdb = require('../clients/subdb')
const opensubtitles = require('../clients/opensubtitles')

const fetchSubtitles = (moviePath) => new Promise((resolve, reject) => {
  const dirname = path.dirname(moviePath)

  fs.readdir(dirname, (err, files) => {
    if (err) {
      log('Error: %s', err)
      return resolve()
    }

    const subs = files.filter(file => file.endsWith('.srt')).map(file => `${dirname}/${file}`)

    if (subs.length > 0) return resolve(subs)

    if (config.opensubtitles.username && config.opensubtitles.password && config.opensubtitles.useragent) {
      opensubtitles
        .downloadSubtitles(moviePath)
        .then((subs) => subs.length ? subs : subdb.downloadSubtitles(moviePath))
        .then(resolve)
    } else {
      subdb
        .downloadSubtitles(moviePath)
        .then(resolve)
    }
  })
})

module.exports = { fetchSubtitles }
