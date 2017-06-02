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



// app.post('/api/items',(req,res)=>{
//
//   //should respond to POST with an object a status 201 and a location header
//   //should respond to POST with the title of item that was POSTed
//
//   res.location('placeholder').status(201).json({title: req.body.title});
//
// });



app.get('/api/items', (req, res) => {
  knex.select().from('items')
    .then(results => {
      results.forEach(item => {
        item.url = `${req.protocol}://${req.get('host')}/api/items/${item.id}`;
      });
      res.json(results);
    });
});


//should respond with the item corresponding to the item `id` in the route
app.get('/api/items/:id', (req, res) => {
  const { id } = req.params;
  knex.select().from('items').where('id', id)
    .then((results) => {
      const item = results[0];
      res.json(item);
    });
});


// should respond to an improper POST with status 400
// app.post('/api/items', (req, res) => {
//   const requiredValue = 'title';
//   if(!(requiredValue in req.body)){
//     res.status(400).end();
//     //throw new Error ('Can\'t do');
//     //return;
//   }
//   res.status(201).end();
// });

// should persist the data and respond with new item id'
// app.post('/api/items', (req, res) =>{

//   const requiredValue = 'title';
//   if(!(requiredValue in req.body)){
//     res.status(400).end();
//     // throw new Error ('Can\'t do');
//     //return;
//   }

//   knex('items')
//     .returning('id')
//     .insert({title: req.body.title})
//     .then(results => res.status(201).json({id:results[0]}));
// });

//should respond with a URL which can be used to retrieve the new item

app.post('/api/items', (req, res) => {

  const requiredValue = 'title';
  if (!(requiredValue in req.body)) {
    res.status(400).end();
    throw new Error ('Can\'t do');
    //return;
  }


  const protocol = req.protocol;
  const host = req.get('host');
  knex('items')
    .returning(['id', 'title', 'completed'])
    .insert({ title: req.body.title, completed: false })
    .then((r) => {
      let URL = `${protocol}://${host}/api/items/${r[0].id}`;

      knex('items')
        .returning(['id', 'title', 'completed', 'url'])
        .where('id', r[0].id)
        .update({ url: URL })
        .then(r => {
          res.status(201).location(URL).json({ id: r[0].id, title: r[0].title, completed: r[0].completed, url: r[0].url });
        });
    });

});

app.put('/api/items/:id', (req, res) => {
  knex('items')
    .returning(['id', 'title', 'completed'])
    .where('id', req.params.id)
    .update({ title: req.body.title, completed: req.body.completed })
    .then(results => res.json(results[0]));

});

app.delete('/api/items/:id', (req, res) => {
  knex('items')
    .where('id', req.params.id)
    .del()
    .then(() => res.sendStatus(204));
})

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
