'use strict';

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require("dns");
const app = express();
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to MongoDB successfully");
}).catch((e) => {
  console.log("Error while attempting to connect to MongoDB");
  console.log(e);
})
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true},
  short_url: {type: Number, required: true}
})

const url = mongoose.model("url", urlSchema)

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));




app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


let short_url = 1;
// solutions
app.post('/api/shorturl', bodyParser.urlencoded({ extended: false }), (req, res) => {
  let resObj = {}
  const original_url = req.body['url'];
  if (original_url.length <= 11 || original_url.substr(0, 12) !== "https://www." ) {
    resObj['error'] = "invalid URL";
    res.json(resObj);
    return;
  }
  dns.lookup(original_url.substr(12), (err, address) => {
    if (err) {
      resObj['error'] = "invalid URL";
      res.json(resObj);
    } else {
      resObj['original_url'] = original_url;
      url.findOne({original_url: original_url}, (err, foundUrl) => {
          if (err) throw err;
          if (foundUrl === null) {
            resObj['short_url'] = short_url;
            const saveObj = new url(resObj);
            saveObj.save( (err, data) => {
              if (err) throw err;
            });
            short_url++;
            console.log(resObj);
            res.json(resObj);
          } else {
            resObj['short_url'] = foundUrl['short_url'];
            console.log(resObj);
            res.json(resObj);
          }
        })
    }
  })

})

app.get('/api/shorturl/:shorturl', function(req, res) {
  const shorturl = req.params.shorturl;
  url.findOne({ short_url: shorturl}, (err, data) => {
    if (data === null) {
      res.json({error: 'invalid url' });
    } else {
      res.redirect(data.original_url);
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


