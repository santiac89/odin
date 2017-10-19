const torrentManager = require('./torrent_manager')
const dropboxWatcher = require('./dropbox_watcher')

torrentManager
  .resume()
  .then(() => {
    dropboxWatcher.start(torrentManager)

    process.on('message', (obj) => {
      if (obj.message === 'downloading') {
        process.send({ message: 'downloading', items: torrentManager.downloading() })
      } else if (obj.message === 'download') {
        torrentManager
          .download(obj.magnetOrUrl)
          .then(() => process.send({ message: 'download', result: true }))
          .catch((err) => process.send({ message: 'download', result: false, meta: err }))
      }
    })
  })

