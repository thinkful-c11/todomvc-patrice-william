const chai = require('chai');
const chaiHttp = require('chai-http');
const { app, runServer, closeServer } = require('../server');
const { DATABASE } = require('../config');
const knex = require('knex')(DATABASE);

chai.should();
chai.use(chaiHttp);

describe('TodoMVC API:', () => {
  // before runs once at the beginning of the test suite
  before(() => runServer());

  // afterEach runs once at the *end* of each test
  afterEach(() => {
    return knex('items')
      .del()
      .catch((err) => {
        console.error('ERROR', err.message);
      });
  });

  // after runs at the end of the tests 
  after(() => {
    return knex.destroy()
      .then(closeServer);
  });

  /** Core endpoints
   * Create skeleton endpoints for GET and POST
   */
  describe('GET and POST endpoint skeleton:', function () {
    /**
     * This test requires you to create a skeleton GET endpoint which responds with an array
     * and it requires you to create express middleware to set CORS headers
     * Hint: https://enable-cors.org/server_expressjs.html
     *  (The hint is not the complete solution, you will need to expand on it)
     */
    it('should respond to GET with status 200 and an array', function () {
      return chai.request(app)
        .get('/api/items')
        .set('origin', 'http://chai-http.test')
        .then(function (result) {
          result.should.have.status(200);
          result.should.be.json;
          result.body.should.be.a('array');
          result.body.should.be.empty;
          result.should.have.header('Access-Control-Allow-Origin', 'http://chai-http.test');
          result.should.have.header('Access-Control-Allow-Headers', 'Content-Type');
          result.should.have.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
          result.should.have.header('Access-Control-Max-Age', '86400');
        })
        .catch((err) => {
          throw (err);
        });
    });
    /**
     * This test requires you to create a skeleton POST endpoint which responds with status 201,
     * along with the item POSTed and a location header
     * 
     * NOTE: the location head value can be blank or placeholder text, for now
     * 
     * HINT: http://www.restpatterns.org/HTTP_Status_Codes/204_-_No_Content
     */
    it('should respond to POST with status 201 and the item title which was POSTed to it', function () {
      const newItem = { title: 'Walk the dog' };
      return chai.request(app)
        .post('/api/items')
        .send(newItem)
        .then(function (result) {
          result.should.have.status(201);
          result.should.be.json;
          result.body.should.be.a('object');
          result.body.should.have.property('title', newItem.title);
          result.should.have.header('location');
        })
        .catch((err) => {
          throw (err);
        });
    });

  });

  /** Create a database and wire-up endpoints
   * PLEASE NOTE: 
   * - You will need to decipher the database name, table name and column names from the 
   * config.js, starter server.js and the tests
   * - And previously working tests may fail as the database is wired-up
   */
  describe('GET endpoints:', function () {
    /**
     * This requires you to wire-up the GET /api/items endpoint to knex and postgres
     */
    it('should respond with the items in the database', function () {
      const newItem = { title: 'Buy soy milk' };
      let itemId;
      return knex('items')
        .insert(newItem)
        .returning(['id'])
        .then(function (result) {
          itemId = result[0].id;
          return chai.request(app).get('/api/items/').send();
        })
        .then(function (result) {
          result.should.have.status(200);
          result.body.should.be.a('array');
          result.body[0].should.have.property('id', itemId);

        })
        .catch((err) => {
          throw (err);
        });
    });

    /**
     * This requires you to create a GET /api/items/:id endpoint and 
     * wire it up to knex and postgres
     */
    it('should respond with the items in the database', function () {
      const newItem = { title: 'Buy soy milk' };
      let itemId;
      return knex('items')
        .insert(newItem)
        .returning(['id'])
        .then(function (result) {
          itemId = result[0].id;
          return chai.request(app).get(`/api/items/${itemId}`).send();
        })
        .then(function (result) {
          result.should.have.status(200);
          result.body.should.have.property('id', itemId);

        })
        .catch((err) => {
          throw (err);
        });
    });
  });

  describe('POST endpoint', function () {
    /**
     * This test requires you to check the incoming post body to make sure it contains
     * valid data before saving to the database
     */
    it('should respond to an improper POST with status 400', function () {
      const newItem = { foo: 'bar' };
      return chai.request(app)
        .post('/api/items')
        .send(newItem)
        .catch((err) => {
          err.should.have.status(400);
        });
    });

    /**
     * This test requires you to wire-up the POST /api/items endpoint to the database
     */
    it('should persist the data and respond with new item id', function () {
      const newItem = { title: 'Walk the dog' };
      return chai.request(app)
        .post('/api/items')
        .send(newItem)
        .then(function (result) {
          result.should.have.status(201);
          return knex
            .select('title')
            .from('items')
            .where('id', result.body.id);
        })
        .then(function (result) {
          result.should.have.length(1);
          result[0].should.have.property('title', newItem.title);
        })
        .catch((err) => {
          throw (err);
        });
    });

    /**
     * This test requires you to add a URL to the response which has the location of the new item. 
     */
    it('should respond with a URL which can be used to retrieve the new item', function () {
      const newItem = { title: 'Buy milk' };
      return chai.request(app)
        .post('/api/items')
        .send(newItem)
        .then(function (result) {
          const url = result.body.url;
          const split = url.lastIndexOf('/');
          const root = url.slice(0, split);
          const path = url.substr(split);
          return chai.request(root).get(path);
        })
        .then(function (result) {
          result.body.should.have.property('title', newItem.title);
        })
        .catch((err) => {
          throw (err);
        });
    });

    /**
     * This test requires you to add a `completed` column to the database which defaults to false
     */
    it('should respond with a `completed` property is set to false', function () {
      const newItem = { title: 'Mow the lawn' };
      return chai.request(app)
        .post('/api/items')
        .send(newItem)
        .then(function (result) {
          result.body.should.have.property('completed', false);
          return knex
            .select('completed')
            .from('items')
            .where('id', result.body.id);
        })
        .then(function (result) {
          result.should.have.length(1);
          result[0].should.have.property('completed', false);
        })
        .catch((err) => {
          throw (err);
        });
    });

    /** 
     * This test requires you to add a `location` header with the URL of the item 
     * 
     * HINT: 
     * - http://stackoverflow.com/a/10185427
     * - https://expressjs.com/en/api.html#req.protocol
     */
    it('should respond with a valid location header', function () {
      const newItem = { title: 'Buy milk' };
      return chai.request(app)
        .post('/api/items')
        .send(newItem)
        .then(function (result) {
          result.should.have.header('location');
          result.body.should.have.property('url').is.a('string');

          const url = result.get('location');
          const split = url.lastIndexOf('/');
          const root = url.slice(0, split);
          const path = url.substr(split);

          return chai.request(root).get(path);
        })
        .then(function (result) {
          result.body.should.have.property('title', newItem.title);
        })
        .catch((err) => {
          throw (err);
        });
    });


  });

  describe('PUT endpoint', function () {
    /**
     * This test requires you to wireup the database to the PUT endpoint so the title can be changed
     */
    it('should change a todo title by PUTing', function () {
      const newItem = { title: 'Buy soy milk' };
      const putItem = { title: 'Buy real milk' };
      let itemId;
      return knex('items')
        .insert(newItem)
        .returning(['id'])
        .then(function (result) {
          itemId = result[0].id;
          return chai.request(app).put(`/api/items/${itemId}`).send(putItem);
        })
        .then(function (result) {
          result.body.should.have.property('title', putItem.title);
          return knex
            .select('title')
            .from('items')
            .where('id', itemId);
        })
        .then(function (result) {
          result[0].should.have.property('title', putItem.title);
        })
        .catch((err) => {
          throw (err);
        });
    });
    /**
     * This test requires you to wireup the database to the PUT endpoint so the completed status can be changed
     */
    it('should PUT a change to the `completed` field of an item', function () {
      const newItem = { title: 'Buy soy milk' };
      const putItem = { completed: true };
      let itemId;
      return knex('items')
        .insert(newItem)
        .returning(['id'])
        .then(function (result) {
          itemId = result[0].id;
          return chai.request(app).put(`/api/items/${itemId}`).send(putItem);
        })
        .then(function (result) {
          result.body.should.have.property('completed', true);
          return knex
            .select('completed')
            .from('items')
            .where('id', itemId);
        })
        .then(function (result) {
          result[0].should.have.property('completed', true);
        })
        .catch((err) => {
          throw (err);
        });
    });
  });

  describe('DELETE endpoint', function () {
    /**
     * This test requires you to wire-up the delete endpoint so items can be deleted.
     */
    it('should DELETE an item', function () {
      const newItem = { title: 'Buy soy milk' };
      let itemId;
      return knex('items')
        .insert(newItem)
        .returning(['id'])
        .then(function (result) {
          itemId = result[0].id;
          return chai.request(app).delete(`/api/items/${itemId}`).send();
        })
        .then(function () {
          return knex
            .select('title')
            .from('items')
            .where('id', itemId);
        })
        .then(function (result) {
          result.should.be.empty;
        })
        .catch((err) => {
          throw (err);
        });
    });

  });

});
