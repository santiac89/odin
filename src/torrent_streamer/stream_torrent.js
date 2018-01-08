const WebTorrent = require('webtorrent')
const config = require('config')
const log = require('debug')('odin:torrent_manager')
const utils = require('../lib/utils')
const fs = require('fs')
const path = require('path')

const folder = path.normalize(`${__dirname}/../../tmp`)

if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder)
}

const webTorrentClient = new WebTorrent({ maxConns: 3 })
const tmpTorrents = {}

const downloadTmp = (magnetOrUrl) => new Promise((resolve, reject) => {
  if (!utils.isValidTorrentLink(magnetOrUrl)) {
    return reject('Invalid torrent URL or magnetURI.')
  }

  tmpTorrents[magnetOrUrl] = true

  webTorrentClient.add(magnetOrUrl, { path: folder }, (torrent) => {
    tmpTorrents[magnetOrUrl] = torrent

    torrent.on('done', () => {
      torrent.emit('completed')
    })

    resolve(torrent)
  })
})

const download = (magnetOrTorrent) => tmpTorrents[magnetOrTorrent] ? Promise.resolve(tmpTorrents[magnetOrTorrent]) : downloadTmp(magnetOrTorrent)

module.exports = { download }
