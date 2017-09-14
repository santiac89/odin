const express = require('express')
const bodyParser = require('body-parser')
const config = require('config')
const qs = require('querystring')

const torrentManager = require('./torrent_manager')
const library = require('./library')

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
app.get('/settings', (req, res) => res.json(config))

app.get('/torrents', (req, res) => res.json(torrentManager.downloading()))

app.get('/library', (req, res) => res.json(library.files()))

app.put('/download', (req, res) => {
  torrentManager
    .download(req.body.url)
    .then(torrent => res.end('OK'))
    .catch(err => res.status(500).send(err))
})

app.get('/diskPlayer', (req, res) => {
  const path = qs.stringify({ path: req.query.path })
  res.redirect(`${req.odin_domain}:${config.disk_streamer.port}/diskPlayer?${path}`)
})

app.get('/torrentPlayer', (req, res) => {
  const url = qs.stringify({ url: req.query.url })
  res.redirect(`${req.odin_domain}:${config.torrent_streamer.port}/torrentPlayer?${url}`)
})

module.exports = app
