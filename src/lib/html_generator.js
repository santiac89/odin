const querystring = require("querystring");
const config = require("config");
const log = require("debug")("odin:utils");
const subtitlesManager = require("./subtitles_manager");
const utils = require("./utils");

const TORRENT_STREAM = "torrent";
const DISK_STREAM = "disk";

const generateForTorrent = (torrent, url) => {
  const file = utils.findVideoFile(torrent);

  if (!file) return `<div class="error">Sorry. Can't play this torrent :(</div>`;

  return generateHtmlPlayer(TORRENT_STREAM, `${torrent.path}/${file.path}`, url);
}

const generateForFile = (path) => {
  return generateHtmlPlayer(DISK_STREAM, path);
}

const generateHtmlPlayer = (streamType, path, url) => {
  return subtitlesManager.fetchSubtitles(path)
    .catch(err => {
      log("Couldn't download any sub:", err)
      return [];
    })
    .then((subFiles) => {

      const params = url ? querystring.stringify({ url }) : querystring.stringify({ path });

      const subs = subFiles.map(file => {
        const lang = file.match(/(\S{2})\.srt$/)[1];
        const params = querystring.stringify({ path: file });
        return `<track src="http://${config.api.host}:${config.api.port}/subtitles?${params}" kind="subtitles" srclang="${lang}" />`;
      })

      let type = path.endsWith(".mkv") ? 'video/webm; codecs="a_ac3, avc, theora, vorbis"' : "video/webm";

      return `
        <video class="player" crossorigin="anonymous" controls>
          <source src="http://${config.api.host}:${config.api.port}/${streamType}Stream?${params}" type="${type}">
          ${subs.join("")}
        </video>
      `;
    });
}

module.exports = { generateForTorrent, generateForFile };
