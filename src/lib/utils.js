const https = require("https");
const http = require("http");
const log = require("debug")("odin:utils");
const fs = require("fs");
const mv = require("mv");

const findLargestFile = (files) => {
  let max = 0;
  let largestFile;

  if (!files) return null;

  files.forEach(file => {
    if (file.length > max) {
      max = file.length;
      largestFile = file;
    }
  });

  return largestFile;
}

const downloadFile = (url, dest) => new Promise((resolve, reject) => {
  const file = fs.createWriteStream(dest);
  let client = url.startsWith("https") ? https : http;

  client.get(url, (response) => {
    response.pipe(file);

    file.on("finish", () => {
      file.close();
      resolve(dest);
    });

    file.on("error", (err) => {
      log(err);
      resolve();
    });
  }).on("error", (err) => { // Handle errors
    log(err);
    resolve();
  });
});

const isVideoFile = file => [".mp4", ".avi"].some(format => file.endsWith(format));

const findVideoFile = (torrent) => {
  const file = findLargestFile(torrent.files);
  return file && isVideoFile(file.name) ? file : null;
}

const moveFile = (src, dst) => new Promise((resolve, reject) => {
  log(`Moving file: ${src} -> ${dst}`);
  mv(src, dst, (err) => {
    if (err) return reject(err);
    resolve();
  });
});

module.exports = {
  downloadFile,
  isVideoFile,
  findVideoFile,
  moveFile
};
