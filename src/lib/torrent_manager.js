const WebTorrent = require('webtorrent');
const config = require('config');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const log = require('debug')('odin:torrent_manager');
const magnet = require('magnet-uri');
const validUrl = require('valid-url');
const subtitlesManager = require('./subtitles_manager');
const postersManager = require('./posters_manager');
const utils = require('./utils');
const torrentsLog = require('./torrents_log');
const library = require('./library');

const incompletePath = path.normalize(`${__dirname}/../../incomplete`);
const tmpPath = path.normalize(`${__dirname}/../../tmp`);

const tmpCleanerInterval = 3600000;
const webTorrentClient = new WebTorrent({ maxConns: 3 });
const tmpTorrents = {};

if (!fs.existsSync(incompletePath)) {
  fs.mkdirSync(incompletePath);
}

if (!fs.existsSync(tmpPath)) {
  fs.mkdirSync(tmpPath);
}

const isValidTorrentLink = (magnetOrUrl) => magnetOrUrl && (validUrl.isUri(magnetOrUrl) || magnet.decode(magnetOrUrl).infoHash);

const startTmpCleaner = () => {
  setInterval(() => {
    fs.readdir(tmpPath, (err, files) => {
      if (err) throw err;
      files.forEach(file => {
        fs.stat(path.join(tmpPath, file), (err, stats) => {
          const hrTime = process.hrtime();
          const now = (hrTime[0] * 1000000) + (hrTime[1] / 1000);

          if (now - stats.atime >= config.webtorrent.tmp_ttl) {
            rimraf(file, () => {});
          }
        });
      });
    });
  }, tmpCleanerInterval);
}

const downloadTmp = (magnetOrUrl) => new Promise((resolve, reject) => {
  if (!isValidTorrentLink(magnetOrUrl)) {
    return reject('Invalid torrent URL or magnetURI.');
  }

  if (torrentsLog.exists(magnetOrUrl) || tmpTorrents[magnetOrUrl]) {
    return resolve(torrentsLog.get(magnetOrUrl) || tmpTorrents[magnetOrUrl]);
  }

  tmpTorrents[magnetOrUrl] = true;

  webTorrentClient.add(magnetOrUrl, { path: tmpPath }, (torrent) => {
    tmpTorrents[magnetOrUrl] = torrent;

    torrent.on('done', () => {
      torrent.emit('completed');
    });

    resolve(torrent);
  });
});

const removeTmpTorrent = (magnetOrUrl) => new Promise((resolve, reject) => {
  if (!tmpTorrents[magnetOrUrl]) return resolve();

  webTorrentClient.remove(tmpTorrents[magnetOrUrl].infoHash, (err) => {
    if (err) return reject(err);
    delete tmpTorrents[magnetOrUrl];
    resolve();
  });
});

const download = (magnetOrUrl, isFile) => new Promise(async (resolve, reject) => {
  if (torrentsLog.get(magnetOrUrl)) {
    return reject('Torrent already downloading');
  }

  if (tmpTorrents[magnetOrUrl]) {
    await removeTmpTorrent(magnetOrUrl);
  }

  if (!isValidTorrentLink(magnetOrUrl) && !isFile) {
    return reject('Invalid torrent URL or magnetURI');
  }

  torrentsLog.touch(magnetOrUrl);

  webTorrentClient.add(magnetOrUrl, { path: incompletePath }, (torrent) => {
      torrentsLog.add(torrent, magnetOrUrl)
        .then(() => {
          torrent.on('done', () => {
            const file = utils.findVideoFile(torrent);

            torrentsLog
              .remove(magnetOrUrl)
              .then(() => { if (isFile) fs.unlinkSync(magnetOrUrl); return true }) // Remove .torrent file if is a file
              .then(() => utils.moveFile(`${torrent.path}/${torrent.name}`, `${config.webtorrent.download_path}/${torrent.name}`))
              .then(() => subtitlesManager.fetchSubtitles(`${config.webtorrent.download_path}/${file.path}`)) // Maybe remove this 2 lines
              .then(() => postersManager.fetchPoster(torrent.name, file.name))
              .then(() => library.reload())
              .then(() => webTorrentClient.remove(torrent.infoHash))
              .then(() => torrent.emit('completed'));
          });

          if (torrent.progress === 1) {
            torrent.emit('done');
          }

          resolve(torrent);
        });
    });
});

const resume = () => {
  webTorrentClient.on('error', (err) => console.log(err));

  return torrentsLog.load()
    .then(magnetsOrUrls => magnetsOrUrls.map(magnetOrUrl => download(magnetOrUrl, magnetOrUrl.startsWith('/'))))
    .then(promises => Promise.all(promises))
    .then(() => startTmpCleaner());
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
}));

module.exports = { resume, download, downloading, downloadTmp };
