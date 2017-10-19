const express = require('express')
const bodyParser = require('body-parser')
const videoStreamer = require('../lib/video_streamer')
const utils = require('../lib/utils')

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
app.get('/diskStream', (req, res) => videoStreamer.streamFromDisk(req.query.path, req, res))

app.get('/diskPlayer', (req, res) => {
  utils.generateHtmlPlayerForFile(req.query.path)
    .then(html => res.send(html))
    .catch(err => res.status(500).send(err))
})

module.exports = app
