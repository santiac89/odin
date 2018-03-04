const fs = require('fs');
const utils = require('./utils');

const streamFromDisk = (path, request, response) => {
  fs.stat(path, (stats) => {
    const { start, end } = parsePositions(request.headers.range, stats.size);
    let stream = fs.createReadStream(path, { start, end });
    streamToResponse(stream, start, end, stats.size, response);
  });
}

const streamFromTorrent = (torrent, request, response) => {
  const file = utils.findVideoFile(torrent);
  if (!file) return response.status(500).json({ message: "Can't play file" });
  const { start, end } = parsePositions(request.headers.range, file.length);
  let stream = file.createReadStream({ start, end });
  streamToResponse(stream, start, end, file.length, response);
}

const streamToResponse = (stream, start, end, total, response) => {
  response.writeHead(206, {
    'Content-Range': `bytes ${start}-${end - 1}/${total}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': (end - start),
    'Content-Type': 'video/webm'
  });

  stream.once('readable', () => {
    stream.pipe(response);

    response.once('close', () => {
      stream.destroy();
      stream = null;
    });
  });

  stream.on('error', err => response.end(err));
}

const parsePositions = (range, total) => {
  const [partialstart, partialend] = range.replace(/bytes=/, '').split('-');
  const start = parseInt(partialstart, 10);
  const end = partialend ? parseInt(partialend, 10) : total;
  return { start, end };
}

module.exports = { streamFromTorrent, streamFromDisk }
