var http = require('http')
var express = require('express')
var url = require('url')
var cors = require('cors')
var app = express()

// Only allow this to work from local presentation server, local companion site server, 
// and live companion site server
var CORS_WHITELIST = ['http://localhost:3999', 'http://localhost:4000', 'http://aresluna.org', 'http://www.aresluna.org']

// Those two variables is why this server exists. Those are set by the presentation server (presenter)
// and read by every companion site (audience).
// At the beginning, max slide = first slide
global.slideMax = 1
// At the beginning, we’re not pressed for time
global.skipIfPressedOnTime = false
// Presentation is done (last slide has been shown). Next time you visit the companion site, it will start
// from scratch rather than being stuck on the last slide
global.presentationOver = false

var corsOptions = {
  origin: function(origin, callback) {
    var originIsWhitelisted = CORS_WHITELIST.indexOf(origin) !== -1
    callback(null, originIsWhitelisted)
  }
}

function prepareResults() {
  return {
    slideMax: global.slideMax,
    skipIfPressedOnTime: global.skipIfPressedOnTime,
    presentationOver: global.presentationOver
  }
}

// Enable CORS so that not any random site can use our page
app.use(cors(corsOptions))

// Use /update URL (using POST) to set a new max slide and whether we’re pressed for time
app.use('/update', function (req, res, next) {
  if (req.method == 'POST') {
    console.log('Received updates from the presentation…', req.url)

    var params = url.parse(req.url, true)

    if (params.query.newSlideMax) {
      global.slideMax = params.query.newSlideMax
      if (params.query.skipIfPressedOnTime && params.query.skipIfPressedOnTime == 'true') {
        global.skipIfPressedOnTime = true
      } else {
        global.skipIfPressedOnTime = false
      }

      if (params.query.presentationOver && params.query.presentationOver == 'true') {
        global.presentationOver = true
      } else {
        global.presentationOver = false
      }

      // Ping every connected client via websockets
      io.emit('update-slide-data', prepareResults())

      // Return a proper code and some output (mostly for when testing)
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('POST successful: ' + params.query.newSlideMax + '\n')
    } else {
      // Malformed request!
      res.writeHead(400)
      res.end()
    }
  } else {
    next()
  }
})

// Use / URL (using GET) to retrieve information about the current status.
app.use('/', function (req, res, next) {
  if (req.method == 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(prepareResults()))
  } else {
    next()
  }
})

// If none of the above worked, show a 404 page.
app.use(function(req, res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Page not found/bad request.')
})

// Start a web server for pages.
var server = app.listen(8080)
// Start the websockets part.
var io = require('socket.io').listen(server)

// On every new websocket connection, return back the status immediately.
io.sockets.on('connection', function (socket) {
  socket.emit('update-slide-data', prepareResults())
})