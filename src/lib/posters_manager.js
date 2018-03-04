const log = require('debug')('odin:posters_manager.js');
const config = require('config');
const googleImages = require('../clients/google_images');
const utils = require('./utils');

const fetchPoster = (movieName, fileName) => {
  if (!movieName) {
    log('Error: movieName empty!');
    return Promise.resolve();
  }

  const sanitizedMovieName = movieName.replace(/\[/g, '-"').replace(/[\(\)]/g, '').replace(/[\]]/g, '"');

  return googleImages
    .search(`${sanitizedMovieName} movie poster`)
    .then(body => {
      const jsonBody = JSON.parse(body);

      if (jsonBody.error) {
        log(jsonBody.error);
        return Promise.resolve();
      }

      if (!jsonBody.items) {
        log('Warning: No poster found');
        return Promise.resolve();
      }

      const image = jsonBody.items.find(image => image.mime == 'image/jpeg');

      if (image) {
        return utils.downloadFile(image.link, `${config.public_path}/images/${fileName}.jpg`);
      } else {
        log('Warning: No poster found');
        return Promise.resolve();
      }
    });
}

module.exports = { fetchPoster };
