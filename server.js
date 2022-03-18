require('dotenv').config();
require('mongoose');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const dns = require('dns');
const urlParser = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// First API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


const mongoose = require('mongoose');
/* This is a mongoose function that connects to the database. */
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

 console.log(process.env.MONGO_URI);
let urlSchema = new mongoose.Schema({
  original : {type: String, required: true},
  short : {type: Number}
})

let Url = mongoose.model('Url', urlSchema)

let response = {}
let inputNum = 1;

/* A middleware function that is called everytime a request is made to the server. */
app.post('/api/shorturl', bodyParser.urlencoded({extended: false}), (req, res) => {
  let inputUrl = req.body['url']
  response['original_url'] = inputUrl

/* This is a callback function. It is called when the dns lookup is complete. */
  const look = dns.lookup(urlParser.parse(inputUrl).hostname, (error, address) => {
      if(!address) {
        res.json({error:"Invalid URL"})
      } else {
        const link = new Url({original:inputUrl, short: inputNum})
        Url.findOne({original:inputUrl}, (err,data) => {
            if(!data) {
              link.save( (err, data) => {
                res.json({
                  original_url: data.original,
                  short_url: data.short
              })
              inputNum = inputNum + 1;
              console.log("Created new => " + inputNum)
            })
          } else {
            Url.findOneAndUpdate({original:inputUrl}, 
              {original:inputUrl, short:inputNum}, 
              {new: true},
              (err, data) => {
                if(err) {
                  console.log("Something went wrong!")
                }
              res.json(data)
              inputNum = inputNum + 1;
              console.log("Found and updated => " + inputNum)
            })
          }
        })

      }
  })
});

/* A middleware function that is called everytime a request is made to the server. */
app.get('/api/shorturl/:id', (req,res)=>{
  let id = req.params.id;
  id = parseInt(id);
  
  console.log("id is: " + id + "type:" + typeof id)

  Url.findOne({short:id}, (err, data)=> {
    if(!data || id == NaN) {
      res.json({error:"Invalid URL"})
    } else {
      res.redirect(data.original)
    }
  })
})


/* This is a callback function that is called when the server is listening on the specified port. */
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
  console.log(mongoose.connection.readyState);
});
