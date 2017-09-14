const WebTorrent = require('webtorrent')
const config = require('config')
const log = require('debug')('odin:torrent_manager')
const utils = require('../utils')

const webTorrentClient = new WebTorrent()
const tmpTorrents = {}

const downloadTmp = (magnetOrUrl) => new Promise((resolve, reject) => {
  const path = config.webtorrent.paths.tmp

  if (!utils.isValidTorrentLink(magnetOrUrl)) {
    return reject('Invalid torrent URL or magnetURI.')
  }

  tmpTorrents[magnetOrUrl] = true

  webTorrentClient.add(magnetOrUrl, { path }, (torrent) => {
    tmpTorrents[magnetOrUrl] = torrent

    torrent.on('done', () => {
      torrent.emit('completed')
    })

    resolve(torrent)
  })
})

const getVideoFileFromTorrent = (magnetOrTorrent) => new Promise((resolve, reject) => {
  const torrent = tmpTorrents[magnetOrTorrent]

  if (torrent) {
    const file = utils.findVideoFile(torrent)
    if (!file) return reject(`Can't play file`)
    return resolve({ file: file, path: `${torrent.path}/${file.path}` });
  }

  downloadTmp(magnetOrTorrent)
    .then(() => getVideoFileFromTorrent(magnetOrTorrent))
    .then(resolve)
})

module.exports = { getVideoFileFromTorrent }
