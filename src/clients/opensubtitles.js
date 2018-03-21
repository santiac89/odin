const log = require("debug")("odin:opensubtitles.js");
const https = require("https");
const fs = require("fs");
const path = require("path");
const OS = require("opensubtitles-api");
const config = require("config");
const { downloadFile } = require("../lib/utils");

const downloadSubtitles = async (moviePath) => {
  const OpenSubtitles = new OS({
    useragent: config.opensubtitles.useragent,
    username: config.opensubtitles.username,
    password: config.opensubtitles.password,
    ssl: true
  });

  const filename = path.basename(moviePath);

  try {
    await OpenSubtitles.login();

    const subtitles = await OpenSubtitles.search({ filename });

    log(`Subtitles found for [${moviePath}]: %O`, subtitles);

    const langs = Object.keys(subtitles);

    if (!langs.length) {
      log(`No subtitle found for [${moviePath}]`);
      return [];
    }

    const promises = langs
      .filter(lang => config.subtitles.includes(lang))
      .map(lang => downloadFile(subtitles[lang].url, moviePath.replace(/mp4$/, `opensubtitles-${lang}.srt`)));

    return await Promise.all(promises);
  } catch (err) {
    log("Error: %s", err);
    return [];
  }
}

module.exports = { downloadSubtitles };
