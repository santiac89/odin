const WebTorrent = require('webtorrent')
const config = require('config')
const path = require('path')
const fs = require('fs')
const log = require('debug')('odin:torrent_manager')
const subtitlesManager = require('../lib/subtitles_manager')
const postersManager = require('../lib/posters_manager')
const library = require('../lib/library')
const utils = require('../lib/utils')
const torrentsLog = require('./torrents_log')

const folder = path.normalize(`${__dirname}/../../incomplete`)

const webTorrentClient = new WebTorrent()
const tmpTorrents = {}

if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder)
}

const download = (magnetOrUrl, isFile) => new Promise(async (resolve, reject) => {
  if (torrentsLog.get(magnetOrUrl)) {
    log('Error: Torrent already downloading.')
    return reject()
  }

  if (tmpTorrents[magnetOrUrl]) {
    await removeTmpTorrent(magnetOrUrl, tmpTorrents[magnetOrUrl].infoHash)
  }

  if (!utils.isValidTorrentLink(magnetOrUrl) && !isFile) {
    log('Error: Invalid torrent URL or magnetURI.')
    return reject()
  }

  torrentsLog.touch(magnetOrUrl)

  webTorrentClient.add(magnetOrUrl, { path: folder }, (torrent) => {
      torrentsLog.add(torrent, magnetOrUrl)
        .then(() => {
          torrent.on('done', () => {
            const file = utils.findVideoFile(torrent)

            torrentsLog
              .remove(magnetOrUrl)
              .then(() => { if (isFile) fs.unlinkSync(magnetOrUrl); return true }) // Remove .torrent file if is a file
              .then(() => subtitlesManager.fetchSubtitles(torrent.path + '/' + file.name))
              .then(() => postersManager.fetchPoster(torrent.name, file.name))
              .then(() => fs.renameSync(torrent.path, `${config.webtorrent.download_path}/${torrent.name}`)) // Move to final download folder
              .then(() => library.reload())
              .then(() => webTorrentClient.remove(magnetOrUrl))
              .then(() => torrent.emit('completed'))
          })

          if (torrent.progress === 1) {
            torrent.emit('done')
          }

          resolve(torrent)
        })
    })
})

const resume = () => {
  webTorrentClient.on('error', (err) => console.log(err))

  return torrentsLog
    .load()
    .then(magnetsOrUrls => magnetsOrUrls.map(magnetOrUrl => download(magnetOrUrl, magnetOrUrl.startsWith('/'))))
    .then(promises => Promise.all(promises))
}

const downloading = () => Object.values(torrentsLog.getAll()).map(torrent => ({
  hash: torrent.infoHash,
  magnetURI: torrent.magnetURI,
  name: torrent.info ? torrent.info.name.toString('UTF-8') : 'undefined',
  timeRemaining: torrent.timeRemaining,
  received: torrent.received,
  downloaded: torrent.downloaded,
  uploaded: torrent.uploaded,
  downloadSpeed: torrent.downloadSpeed,
  uploadSpeed: torrent.uploadSpeed,
  progress: torrent.progress,
  ratio: torrent.ratio,
  numPeers: torrent.numPeers,
  path: torrent.path
}))

module.exports = { resume, download, downloading }
