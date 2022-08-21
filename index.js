
// Load Node modules
var express = require('express');
const stream = require('youtube-audio-stream')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

// Initialise Express
var app = express();

// Render static files
app.use(express.static('public'));
// Set the view engine to ejs
app.set('view engine', 'ejs');

var port = process.env.PORT || 8080;
app.listen(port);


// *** GET Routes - display pages ***

// gets the audio stream
app.get('/youtube/:link', async function (req, res) {
  console.log("fetching audio of " + req.params.link)
  try {
    for await (const chunk of stream(req.params.link)) {
      res.write(chunk)
    }
    res.end()
  } catch (err) {
    console.error(err)
    if (!res.headersSent) {
      res.writeHead(500)
      res.end('internal system error')
    }
  }
});

app.get('/youtube', async function (req, res) {
  var link = req.query.link;
  console.log("fetching audio of " + link + " (found by query)")
  try {
    for await (const chunk of stream(link)) {
      res.write(chunk)
    }
    res.end()
  } catch (err) {
    console.error(err)
    if (!res.headersSent) {
      res.writeHead(500)
      res.end('internal system error')
    }
  }
});


// Root Route
app.get('/', function (req, res) {
  console.clear();
  res.render('index', {
    // output: audioFormats
  });
}); 