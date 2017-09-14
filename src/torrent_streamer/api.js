const express = require('express')
const bodyParser = require('body-parser')
const config = require('config')
const fs = require('fs')
const srt2vtt = require('srt-to-vtt')

const torrentManager = require('./stream_torrent')
const videoStreamer = require('../video_streamer')
const utils = require('../utils')

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
app.get('/torrentStream', (req, res) => videoStreamer.streamFromTorrent(torrentManager, req.query.url, req, res))

app.get('/subtitlesStream', (req, res) => fs.createReadStream(req.query.path).pipe(srt2vtt()).pipe(res))

app.get('/torrentPlayer', (req, res) => {
  utils.generateHtmlPlayerForTorrent(torrentManager, req.query.url)
    .then(html => res.send(html))
    .catch(err => res.status(500).send(err))
})

module.exports = app
