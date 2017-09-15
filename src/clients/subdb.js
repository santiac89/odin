const log = require('debug')('odin:subdb.js')
const SubDb = require('subdb')

const subdb = new SubDb()

const downloadSubtitle = (hash, lang, subFile) => new Promise((resolve, reject) => {
  return subdb.api.download_subtitle(hash, lang, subFile, (err) => {
    if (err) return resolve()
    resolve(subFile)
  })
})

const downloadSubtitles = (path) => new Promise((resolve, reject) => {
  subdb.computeHash(path, (err, hash) => {
    if (err) {
      log('Error: %s', err)
      return resolve(err)
    }

    subdb.api.search_subtitles(hash, (err, subsByLang) => {
      if (err) {
        log('Error: %s', err)
        return resolve([])
      }

      if (!subsByLang) {
        log('No subtitle found in SubDB')
        return resolve([])
      }

      const promises = subsByLang.map((lang) => {
        const subFile = path.replace(/mp4$/, `${lang}.srt`)
        return downloadSubtitle(hash, lang, subFile)
      })

      return Promise.all(promises)
    })
  })
})


module.exports = { downloadSubtitles }