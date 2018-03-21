const log = require("debug")("odin:subdb");
const SubDb = require("subdb");
const config = require("config");

const subdb = new SubDb();

const downloadSubtitle = (hash, lang, subFile) => new Promise((resolve, reject) => {
  return subdb.api.download_subtitle(hash, lang, subFile, (err) => {
    if (err) return resolve();
    resolve(subFile);
  });
});

const downloadSubtitles = (path) => new Promise((resolve, reject) => {
  subdb.computeHash(path, (err, hash) => {
    if (err) {
      log("Error: %s", err);
      return resolve(err);
    }

    subdb.api.search_subtitles(hash, (err, subsByLang) => {
      if (err) {
        log("Error: %s", err);
        return resolve([]);
      }

      if (!subsByLang) {
        log(`No subtitle found for [${path}]`);
        return resolve([]);
      }

      log(`Subtitles found for [${path}]: %O`, subsByLang);

      const promises = subsByLang
        .filter(lang => config.subtitles.includes(lang))
        .map(lang => downloadSubtitle(hash, lang, path.replace(/mp4$/, `subdb-${lang}.srt`)));

      return Promise.all(promises);
    });
  });
});

module.exports = { downloadSubtitles };
