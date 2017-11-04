const torrentManager = require('./torrent_manager')
const dropboxWatcher = require('./dropbox_watcher')

const cpuProfiler = require('../lib/cpuProfiler')

if (process.argv[2] == '-p') {
  cpuProfiler('./public/profiles', 'torrent_manager')
}

torrentManager
  .resume()
  .then(() => {
    dropboxWatcher.start(torrentManager)

    process.on('message', (event) => {
      if (event.message === 'downloading') {
        process.send({ message: 'downloading', items: torrentManager.downloading() })
      } else if (event.message === 'download') {
        torrentManager
          .download(event.magnetOrUrl)
          .then((torrent) => {
            torrent.once('completed', () => process.send({ message: 'reload_library' }))
            process.send({ message: 'download', result: true })
          })
          .catch((err) => process.send({ message: 'download', result: false, meta: err }))
      }
    })
  })

