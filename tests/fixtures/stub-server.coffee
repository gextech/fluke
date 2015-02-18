express = require('express')
app = express()

app.use (req, res, next) ->
  req.body = ''

  req.on 'data', (chunk) ->
    req.body += chunk

  req.on 'end', ->
    next()

app.all '/fixtures/:any*?', (req, res) ->
  data =
    body: req.body
    query: req.query
    params: req.params
    headers: req.headers

  res.json data

module.exports = app
