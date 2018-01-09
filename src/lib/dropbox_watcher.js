const config = require('config')
const crypto = require('crypto')
const dropbox = require('../clients/dropbox')
const subtitlesManager = require('./subtitles_manager')
const postersManager = require('./posters_manager')

const fs = require('fs')
const path = require('path')

const folder = path.normalize(`${__dirname}/../watch`)

if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder)
}

const start = (torrentManager) => {
  if (!config.dropbox.token || !config.dropbox.torrentsPath) return;

  setInterval(() => {
    dropbox.listFolder(config.dropbox.torrentsPath).then(files => {
      const torrentFiles = files.filter(file => file.name.endsWith('.torrent'))

      torrentFiles.forEach((file) => {
        const fullPath = `${config.dropbox.torrentsPath}/${file.name}`
        const hashName = crypto.createHash('md5').update(file.name).digest('hex')

        dropbox
          .downloadFile(fullPath, `${folder}/${hashName}.torrent`)
          .then(() => dropbox.deleteFile(fullPath))
      })
    })
  }, config.dropbox.watch_interval)

  fs.watch(folder, (eventType, filename) => {
    if (eventType !== 'change' || !filename.endsWith('.torrent')) return;
    torrentManager.download(`${folder}/${filename}`, true)
  })
}

module.exports = { start }
