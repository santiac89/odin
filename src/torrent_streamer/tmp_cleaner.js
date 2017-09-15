const config = require('config')
const rimraf = require('rimraf')
const fs = require('fs')

const folder = `${__dirname}/tmp`

if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder)
}


const tmpCleanerInterval = 3600000

const start = () => {
  setInterval(() => {
    fs.readdir(folder, (err, files) => {
      if (err) throw err
      files.forEach(file => {
        fs.stat(path.join(folder, file), (err, stats) => {
          const hrTime = process.hrtime()
          const now = (hrTime[0] * 1000000) + (hrTime[1] / 1000)

          if (now - stats.atime >= config.webtorrent.tmp_ttl) {
            rimraf(file, () => {})
          }
        })
      })
    })
  }, tmpCleanerInterval)
}

module.exports = { start }