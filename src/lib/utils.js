const https = require('https')
const http = require('http')
const log = require('debug')('odin:utils')
const fs = require('fs')
const magnet = require('magnet-uri')
const validUrl = require('valid-url')

const findLargestFile = (files) => {
  let max = 0
  let largestFile

  if (!files) return null;

  files.forEach(file => { if (file.length > max) largestFile = file })

  return largestFile
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
  downloadFile,
  isVideoFile,
  findVideoFile,
  isValidTorrentLink
}
