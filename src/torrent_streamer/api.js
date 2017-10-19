const express = require('express')
const bodyParser = require('body-parser')
const torrentManager = require('./stream_torrent')
const videoStreamer = require('../lib/video_streamer')
const htmlGenerator = require('../lib/html_generator')

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

/*
*       API
*/
app.get('/torrentStream', (req, res) => {
  torrentManager
    .download(req.query.url)
    .then(torrent => videoStreamer.streamFromTorrent(torrent, req, res))
})

app.get('/torrentPlayer', (req, res) => {
  torrentManager
    .download(req.query.url)
    .then(torrent => htmlGenerator.generateForTorrent(torrent, req.query.url))
    .then(html => res.send(html))
    .catch(err => res.status(500).send(err))
})

module.exports = app
