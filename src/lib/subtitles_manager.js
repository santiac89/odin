const config = require('config');
const path = require('path');
const log = require('debug')('odin:subtitles_manager');
const fs = require('fs');
const subdb = require('../clients/subdb');
const opensubtitles = require('../clients/opensubtitles');

const getSubtitlesFromDisk = (moviePath) => new Promise((resolve, reject) => {
  const dirname = path.dirname(moviePath);

  fs.readdir(dirname, (err, files) => {
    if (err) {
      log('Error: %s', err);
      return resolve([]);
    }

    const subs = files.filter(file => file.endsWith('.srt')).map(file => `${dirname}/${file}`);

    if (subs.length > 0) {
      log(`Subtitles found for [${moviePath}] %O`, subs);
      return resolve(subs);
    } else {
      log(`Subtitles not found for [${moviePath}] %O`, subs);
      return resolve([]);
    }

  });
});

const fetchSubtitles = async (moviePath) => {
  try {
    let subs = await getSubtitlesFromDisk(moviePath);

    if (subs.length) {
      return subs;
    }

    if (config.opensubtitles.username && config.opensubtitles.password && config.opensubtitles.useragent) {
      const openSubs = await opensubtitles.downloadSubtitles(moviePath);
      subs = subs.concat(openSubs);
    }

    const subDbs = await subdb.downloadSubtitles(moviePath);
    subs = subs.concat(subDbs);

    return subs;
  } catch (err) {
    log(err);
    return [];
  }
};

module.exports = { fetchSubtitles };
