const querystring = require('querystring')
const config = require('config')
const https = require('https')
const http = require('http')
const log = require('debug')('odin:utils')
const fs = require('fs')
const subtitlesManager = require('./subtitles_manager')

const TORRENT_STREAM = 'torrent'
const DISK_STREAM = 'disk'

const findLargestFile = (files) => {
  let max = 0
  let largestFile

  if (!files) return null;

  files.forEach(file => { if (file.length > max) largestFile = file })

  return largestFile
}

const generateHtmlPlayerForTorrent = (torrentManager, url) => {
  return torrentManager.getVideoFileFromTorrent(url)
    .then(({ path }) => generateHtmlPlayer(TORRENT_STREAM, path, url))
}

const generateHtmlPlayerForFile = (path) => {
  return generateHtmlPlayer(DISK_STREAM, path)
}

const generateHtmlPlayer = (streamType, path, url) => {
  return subtitlesManager.fetchSubtitles(path)
    .catch(err => {
      console.log('Couldn\'t download any sub:', err)
      return [];
    })
    .then((subFiles) => {
      const subs = subFiles.map(file => {
        const matches = file.match(/(\S{2})\.srt$/)
        const params = querystring.stringify({ path: file })
        return `<track src="http://${config.api.host}:${config.api.port}/subtitlesStream?${params}" kind="subtitles" srclang="${matches[1]}" />`
      })

      let type;

      if (path.endsWith('.mkv')) {
        type = 'video/webm; codecs="a_ac3, avc, theora, vorbis"'
      } else {
        type = 'video/webm'
      }

      const params = url ? querystring.stringify({ url }) : querystring.stringify({ path })
      const port = streamType === DISK_STREAM ? config.disk_streamer.port : config.torrent_streamer.port

      return `
        <video class="player" crossorigin="anonymous" controls>
          <source src="http://${config.api.host}:${port}/${streamType}Stream?${params}" type='${type}'>
          ${subs.join('')}
        </video>
      `
    })
}

const downloadFile = (url, dest) => new Promise((resolve, reject) => {
  const file = fs.createWriteStream(dest)
  let client = url.startsWith('https') ? https : http

  client.get(url, (response) => {
    response.pipe(file)

    file.on('finish', () => {
      file.close()
      resolve(dest)
    });

    file.on('error', (err) => {
      log(err)
      resolve()
    })
  }).on('error', (err) => { // Handle errors
    log(err)
    resolve()
  });
})


const isVideoFile = file => ['.mp4', '.mkv', '.avi'].some(format => file.endsWith(format))

const findVideoFile = (torrent) => {
  const file = findLargestFile(torrent.files)
  return file && isVideoFile(file.name) ? file : null
}

const isValidTorrentLink = (magnetOrUrl) => magnetOrUrl && (validUrl.isUri(magnetOrUrl) || magnet.decode(magnetOrUrl).infoHash)

module.exports = {
  generateHtmlPlayerForTorrent,
  generateHtmlPlayerForFile,
  downloadFile,
  isVideoFile,
  findVideoFile,
  isValidTorrentLink
}
