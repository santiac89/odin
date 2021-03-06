const fs = require("fs");
const config = require("config");
const log = require("debug")("odin:library");
const { isVideoFile } = require("./utils");

let movies = [];

const buildMovieObject = (path, name, posterFile) => ({ path, name, poster: `/images/${posterFile}.jpg` });

const reload = () => {
  log(`Reloading library at [${config.webtorrent.download_path}] ...`);

  movies = [];
  const folders = fs.readdirSync(config.webtorrent.download_path);
  folders.forEach((folder) => {
    const fullPath = `${config.webtorrent.download_path}/${folder}`;
    const fileStats = fs.lstatSync(fullPath);

    if (!fileStats.isDirectory() && isVideoFile(fullPath)) {
      movies.push(buildMovieObject(fullPath, folder, folder));
    } else if (fileStats.isDirectory()) {
      const files = fs.readdirSync(fullPath);
      const videoFile = files.find(file => isVideoFile(file));

      if (videoFile) {
        movies.push(buildMovieObject(`${fullPath}/${videoFile}`, folder, videoFile));
      }
    }
  });

  return movies;
}

const files = () => movies;

module.exports = { reload, files };
