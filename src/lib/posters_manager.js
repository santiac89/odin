const log = require("debug")("odin:posters_manager");
const config = require("config");
const googleImages = require("../clients/google_images");
const utils = require("./utils");

const fetchPoster = (movieName, fileName) => {
  if (!movieName) {
    log("Error: movieName empty!");
    return Promise.resolve();
  }

  const sanitizedMovieName = movieName.replace(/\[/g, '-"').replace(/[\(\)]/g, '').replace(/[\]]/g, '"');

  log(`Searching posters for [${movieName}] at [${fileName}]`);

  return googleImages
    .search(`${sanitizedMovieName} movie poster`)
    .then(body => {
      const jsonBody = JSON.parse(body);

      if (jsonBody.error) {
        log(`No poster found for [${movieName}] at [${fileName}], error: %O`, jsonBody.error);
        return Promise.resolve();
      }

      if (!jsonBody.items) {
        log(`No poster found for [${movieName}] at [${fileName}]`);
        return Promise.resolve();
      }

      const image = jsonBody.items.find(image => image.mime == "image/jpeg");

      if (image) {
        log(`Poster found for [${movieName}] at [${fileName}]`);
        log(`Downloading ${image.link}...`);
        return utils.downloadFile(image.link, `${config.public_path}/images/${fileName}.jpg`);
      } else {
        log(`No poster found for [${movieName}] at [${fileName}]`);
        return Promise.resolve();
      }
    });
}

module.exports = { fetchPoster };
