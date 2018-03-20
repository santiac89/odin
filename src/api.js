const express = require("express");
const bodyParser = require("body-parser");
const config = require("config");
const fs = require("fs");
const srt2vtt = require("srt-to-vtt");
const path = require("path");
const library = require("./lib/library");
const torrentManager = require("./lib/torrent_manager");
const htmlGenerator = require("./lib/html_generator");
const videoStreamer = require("./lib/video_streamer");
const fileUpload = require('express-fileupload');
const utils = require("./lib/utils")

const tmpPath = path.normalize(`${__dirname}/../tmp`);

const app = express();
/*
*       MIDDLEWARES
*/
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
  next();
});

app.use(express.static(config.public_path));


app.use(function (req, res, next) {
  if (req.headers.origin) {
    const parts = req.headers.origin.split(":");
    req.odin_domain = parts[0] + ":\/\/" + parts[1];
  } else {
    const parts = req.headers.host.split(":");
    req.odin_domain = "http:\/\/" + parts[0];
  }
  next();
});

app.use(fileUpload());

/*
*       API
*/
app.get("/settings", (req, res) => {
  res.json(config);
});

app.get("/library", (req, res) => {
  res.json(library.files());
});

app.get("/subtitles", (req, res) => {
  fs.createReadStream(req.query.path).pipe(srt2vtt()).pipe(res);
});

app.get("/torrents", (req, res) => {
  res.json(torrentManager.downloading());
});

app.put("/download", async (req, res) => {
  try {
    const torrent = await torrentManager.download(req.body.url);
    res.end("OK");
  } catch (err) {
    res.status(500).json(error)
  }
});


app.get("/torrentPlayer", async (req, res) => {
  try {
    const torrent = await torrentManager.downloadTmp(req.query.url);
    const html = await htmlGenerator.generateForTorrent(torrent, req.query.url);
    res.json({ html, path: `${tmpPath}/${torrent.name}` });
  } catch (err) {
     res.status(500).send(err);
  }
});

app.get("/diskPlayer", async (req, res) => {
  try {
    const html = await htmlGenerator.generateForFile(req.query.path);
    res.send(html)
  } catch (err) {
    res.status(500).send(err);
  }
});

/*
  STREAMING
*/
app.get("/torrentStream", async (req, res) => {
  const torrent = await torrentManager.downloadTmp(req.query.url);
  videoStreamer.streamFromTorrent(torrent, req, res);
});

app.get("/diskStream", (req, res) => {
  videoStreamer.streamFromDisk(req.query.path, req, res);
});


app.post("/subtitles", (req, res) => {
  if (!req.body.path) return res.status(400).end();

  const files = fs.readdirSync(req.body.path);
  const videoFile = files.find(file => utils.isVideoFile(file));

  if (videoFile) {
    const fileName = videoFile.replace(/mp4$/, 'cs.srt');
    const stream = fs.createWriteStream(`${req.body.path}/${fileName}`);
    console.log(`${req.body.path}/${fileName}`)
    stream.write(req.files.file.data);
    stream.end();
    res.send('OK');
  } else {
    res.status(400).end();
  }
});

module.exports = app;
