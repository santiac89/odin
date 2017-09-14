const fs = require('fs')

const streamFromDisk = (path, request, response) => {
  const stats = fs.statSync(path)
  const { start, end } = parsePositions(request.headers.range, stats.size)

  let stream = fs.createReadStream(path, { start, end })

  streamToResponse(stream, start, end, stats.size, response)
}

const streamFromTorrent = (torrentManager, magnetOrTorrent, request, response) => {
  torrentManager.getVideoFileFromTorrent(magnetOrTorrent)
    .then(({ file }) => {
      const { start, end } = parsePositions(request.headers.range, file.length)

      let stream = file.createReadStream({ start, end })

      streamToResponse(stream, start, end, file.length, response)
    })
}

const streamToResponse = (stream, start, end, total, response) => {
  const chunksize = (end - start)

  response.writeHead(206, {
    'Content-Range': `bytes ${start}-${end - 1}/${total}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunksize,
    'Content-Type': 'video/webm'
  })

  stream.once('readable', () => {
    stream.pipe(response)

    response.once('close', () => {
      stream.destroy()
      stream = null;
    })
  })

  stream.on('error', err => response.end(err))
}

const parsePositions = (range, total) => {
  const parts = range.replace(/bytes=/, '').split('-')
  const partialstart = parts[0]
  const partialend = parts[1]

  const start = parseInt(partialstart, 10)
  const end = partialend ? parseInt(partialend, 10) : total

  return { start, end }
}

module.exports = { streamFromTorrent, streamFromDisk }
