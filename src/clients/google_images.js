const config = require('config')
const qs = require('querystring')
const https = require('https')

const search = (string) => {
  return new Promise((resolve, reject) => {
    const result = {
      q: string,
      searchType: 'image',
      cx: config.google_cse.cse_id,
      key: config.google_cse.api_key
    };

    const params = qs.stringify(result)

    const url = `https://www.googleapis.com/customsearch/v1?${params}`

    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(body));
      res.on('error', (error) => reject(error))
    })
  })
}

module.exports = { search }