const express = require('express')
const bodyParser = require('body-parser')
const config = require('config')
const fs = require('fs')
const srt2vtt = require('srt-to-vtt')
const library = require('./lib/library')
const torrentManager = require('./lib/torrent_manager')
const htmlGenerator = require('./lib/html_generator')
const videoStreamer = require('./lib/video_streamer')

const app = express()
/*
*       MIDDLEWARES
*/
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')
  next()
})

app.use(express.static(config.public_path))

app.use(function (req, res, next) {
  if (req.headers.origin) {
    const parts = req.headers.origin.split(':')
    req.odin_domain = parts[0] + ':\/\/' + parts[1]
  } else {
    const parts = req.headers.host.split(':')
    req.odin_domain = 'http:\/\/' + parts[0]
  }

  next()
})

/*
*       API
*/
app.get('/settings', (req, res) => {
  res.json(config)
})

app.get('/library', (req, res) => {
  res.json(library.files())
})

app.get('/subtitlesStream', (req, res) => {
  fs.createReadStream(req.query.path).pipe(srt2vtt()).pipe(res)
})

app.get('/torrents', (req, res) => {
  res.json(torrentManager.downloading())
})

app.put('/download', (req, res) => {
  torrentManager.download(req.body.url)
    .then(() => library.reload())
    .then(() => res.end('OK'))
    .catch(error => res.status(500).json(error))
})

app.get('/torrentStream', (req, res) => {
  torrentManager.downloadTmp(req.query.url)
    .then(torrent => videoStreamer.streamFromTorrent(torrent, req, res))
})

app.get('/torrentPlayer', (req, res) => {
  torrentManager.downloadTmp(req.query.url)
    .then(torrent => htmlGenerator.generateForTorrent(torrent, req.query.url))
    .then(html => res.send(html))
    .catch(err => res.status(500).send(err))
})

app.get('/diskStream', (req, res) => {
  videoStreamer.streamFromDisk(req.query.path, req, res)
})

app.get('/diskPlayer', (req, res) => {
  htmlGenerator.generateForFile(req.query.path)
    .then(html => res.send(html))
    .catch(err => res.status(500).send(err))
})

module.exports = app
