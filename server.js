'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { DATABASE, PORT } = require('./config');

const app = express();

// Add middleware and .get, .post, .put and .delete endpoints

// CORS middleware //
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  next();
});

// Body Parser middleware //
app.use(bodyParser.json());

///// GET and POST endpoint skeleton //////

// should respond to GET with status 200 and an array
app.get('/api/items',(req,res)=>{
  res.json([]).sendStatus(200);
});



app.post('/api/items',(req,res)=>{

  //should respond to POST with an object a status 201 and a location header
  //should respond to POST with the title of item that was POSTed

  res.location('placeholder').status(201).json({title: req.body.title});

});

let server;
let knex;
function runServer(database = DATABASE, port = PORT) {
  return new Promise((resolve, reject) => {
    try {
      knex = require('knex')(database);
      server = app.listen(port, () => {
        console.info(`App listening on port ${server.address().port}`);
        resolve();
      });
    }
    catch (err) {
      console.error(`Can't start server: ${err}`);
      reject(err);
    }
  });
}

function closeServer() {
  return knex.destroy().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing servers');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => {
    console.error(`Can't start server: ${err}`);
    throw err;
  });
}

module.exports = { app, runServer, closeServer };