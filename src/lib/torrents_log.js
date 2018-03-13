const log = require("debug")("odin:torrents_log");
const fs = require("fs");

const torrents = {};
const folder = `${__dirname}/../../inprogress`;

if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder);
}

const getAll = () => torrents;

const get = (magnetOrUrl) => torrents[magnetOrUrl];

const exists = (magnetOrUrl) => torrents[magnetOrUrl] != undefined;

const touch = (magnetOrUrl) => torrents[magnetOrUrl] = true;

const add = (torrent, magnetOrUrl) => new Promise((resolve, reject) => {
  fs.writeFile(`${folder}/${torrent.infoHash}`, magnetOrUrl, (err) => {
    if (err) {
      log(err);
      return reject(err);;
    }
    torrents[magnetOrUrl] = torrent;
    resolve();
  });
});

const load = () => new Promise((resolve, reject) => {
  fs.readdir(folder, (err, files) => {
    if (!files) return resolve([]);

    const torrentsPromises = files.map(file => {
      return new Promise((res, rej) => {
        fs.readFile(`${folder}/${file}`, "utf-8", (err, magnetOrUrl) => {
          if (err) return res("");
          res(magnetOrUrl);
        });
      });
    });

    Promise.all(torrentsPromises)
      .then(torrents => torrents.filter(torrent => torrent))
      .then(torrents => resolve(torrents));
  });
});

const remove = (magnetOrUrl) => new Promise((resolve, reject) => {
  fs.unlink(`${folder}/${torrents[magnetOrUrl].infoHash}`, (err) => {
    if (err) return reject(err);
    delete torrents[magnetOrUrl];
    resolve();
  });
});

module.exports = { add, load, remove, get, touch, getAll, exists };
