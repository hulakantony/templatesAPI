import express from 'express';
import bodyParser from 'body-parser';
import mongodb from 'mongodb';
import morgan from 'morgan';
import cors from 'cors' ;
import { config } from './config';

const app = express();
let db;
const MongoClient = mongodb.MongoClient;
app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(morgan('dev'));

const SERVER_PORT = 8080;

app.get('/templates', (req, res) => {
  const isPrivate = req.query.privacy === 'private';
  const skipSize = parseInt(req.query.offset) || 0;
  const filters = (!req.query.filters || req.query.filters === 'undefined') ? [] : req.query.filters.split('_');
  const searchValue = (!req.query.search || req.query.search === 'undefined') ? '' : req.query.search;
  const regex = searchValue ? new RegExp(searchValue, 'ig') : new RegExp('.');
  if (filters.length) {
    db.collection('templates')
    .find({ private: isPrivate, nesting: { '$in': filters }, name: regex })
    .sort({ createdAt: -1 })
    .limit(10)
    .skip(skipSize)
    .toArray(function(err, results) {
      res.json(results);
    });
  } else {
    db.collection('templates')
    .find({ private: isPrivate, name: regex })
    .sort({ createdAt: -1 })
    .limit(10)
    .skip(skipSize)
    .toArray(function(err, results) {
      res.json(results);
    });
  }

});

app.post('/templates', (req, res, next) => {
  db.collection('templates').save(req.body, (err, result) => {
    if (err) {
      next(err.message);
    }
    console.log('template saved');
    res.json('saved');
  })
});

MongoClient.connect(config.db, (err, database) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  db = database;
  app.listen(SERVER_PORT, (err) => {
    if (err) console.log(err);
    console.log(`Server is running on http://localhost:${SERVER_PORT}`);
  });
});
