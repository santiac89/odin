const config = require("config");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const log = require("debug")("odin:dropbox_watcher");
const dropbox = require("../clients/dropbox");
const torrentManager = require("./torrent_manager");

const folder = path.normalize(`${__dirname}/../../watch`);

if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder);
}

const start = () => {
  if (!config.dropbox.token || !config.dropbox.torrentsPath) return;

  setInterval(async () => {
    log('Searching for torrents in DropBox');

    let files = [];

    try {
      files = await dropbox.listFolder(config.dropbox.torrentsPath);
    } catch (err) {
      log(err);
    }

    files
      .filter(file => file.name.endsWith(".torrent"));
      .forEach(async (file) => {
        try {
          log(`Downloading [${file}]`);
          const fullPath = `${config.dropbox.torrentsPath}/${file.name}`;
          const hashName = crypto.createHash("md5").update(file.name).digest("hex");
          await dropbox.downloadFile(fullPath, `${folder}/${hashName}.torrent`);
          await dropbox.deleteFile(fullPath);
        } catch (err) {
          log(err);
        }
      });
  }, config.dropbox.watch_interval);

  fs.watch(folder, (eventType, filename) => {
    if (eventType !== "change" || !filename.endsWith(".torrent")) return;
    torrentManager.download(`${folder}/${filename}`, true);
  });
};

module.exports = { start };
