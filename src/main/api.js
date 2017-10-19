const express = require('express')
const bodyParser = require('body-parser')
const config = require('config')
const qs = require('querystring')
const fs = require('fs')
const srt2vtt = require('srt-to-vtt')

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

app.get('/library', (req, res) => res.json(library.files()))

app.get('/subtitlesStream', (req, res) => fs.createReadStream(req.query.path).pipe(srt2vtt()).pipe(res))

app.get('/diskPlayer', (req, res) => {
  const path = qs.stringify({ path: req.query.path })
  res.redirect(`${req.odin_domain}:${config.disk_streamer.port}/diskPlayer?${path}`)
})

app.get('/torrentPlayer', (req, res) => {
  const url = qs.stringify({ url: req.query.url })
  res.redirect(`${req.odin_domain}:${config.torrent_streamer.port}/torrentPlayer?${url}`)
})

const build = (child) => {
  app.get('/torrents', (req, res) => {
    child.send({ message: 'downloading' }, undefined, {}, (err) => {
      if (err) return res.status(500).send(err)

      child.once('message', (message) => {
        res.json(message.items)
      })
    })
  })

  app.put('/download', (req, res) => {
    child.send({ message: 'download', magnetOrUrl: req.body.url }, undefined, {}, (err) => {
      if (err) return res.status(500).send(err)

      child.once('message', (message) => {
        if (message.result) {
          res.end('OK')
        } else {
          res.status(500).json(message.meta)
        }
      })
    })
  })

  return app;
}

module.exports = build
