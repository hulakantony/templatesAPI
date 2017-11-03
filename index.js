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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));

const router = express.Router();
const SERVER_PORT = 8080;

app.get('/templates', (req, res) => {
  db.collection('templates').find().toArray(function(err, results) {
    res.json(results);
  });
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
