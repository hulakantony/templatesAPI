import express from 'express';
import bodyParser from 'body-parser';
import mongodb from 'mongodb';
import morgan from 'morgan';
import cors from 'cors' ;
import errorHandler from './middlewares/errorHandler';
import { config } from './config';

const app = express();
let db;
const MongoClient = mongodb.MongoClient;
app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(morgan('dev'));

const SERVER_PORT = 8080;
const ObjectId = mongodb.ObjectId;

app.get('/templates', async (req, res, next) => {
  const isPrivate = req.query.privacy === 'private';
  const skipSize = parseInt(req.query.offset) || 0;
  const filters = (!req.query.filters || req.query.filters === 'undefined') ? [] : req.query.filters.split('_');
  const searchValue = (!req.query.search || req.query.search === 'undefined') ? '' : req.query.search;
  const regex = searchValue ? new RegExp(searchValue, 'ig') : new RegExp('.');
  let templates;
  if (filters.length) {
    try {
      templates = await db.collection('templates')
      .find({ private: isPrivate, nesting: { '$in': filters }, name: regex })
      .sort({ createdAt: -1 })
      .limit(10)
      .skip(skipSize)
    } catch (err) {
      next({
        status: 404,
        message: 'Sorry, some troubls with your request'
      })
    }

  } else {
    try {
      templates = await db.collection('templates')
      .find({ private: isPrivate, name: regex })
      .sort({ createdAt: -1 })
      .limit(10)
      .skip(skipSize)
    } catch (err) {
      next({
        status: 404,
        message: 'Sorry, some troubles with your request'
      })
    }
  }
  templates.toArray(function(err, results) {
    if (err) {
      next( {
        status: 400,
        message: 'Not posible to prepare your query'
      })
    }
    res.json(results);
  })
});

app.post('/templates', (req, res, next) => {
  db.collection('templates').save(req.body, (err, result) => {
    if (err) {
      next({
        status: 404,
        message: 'Problems to save your template'
      });
    }
    res.json('saved');
  })
});

app.delete('/templates/:id', async (req,res,next) => {
  const id = req.params.id;
  try {
    await db.collection('templates').findOneAndDelete({ '_id' : new ObjectId(id) })
  } catch (err) {
    next({
      status: 400,
      message: 'Not posible to delete template'
    });
  }
  res.json('Template successfully deleted');
});

app.put('/templates/:id', async (req, res, next) => {
  const id = new ObjectId(req.params.id);
  try {
    let currentDoc = await db.collection('templates').findOne({ '_id': new ObjectId(id) });
    await db.collection('templates')
    .update(
      { '_id': new ObjectId(id) },
      { $set: { private: !currentDoc.private, createdAt: new Date() } }
    );
  } catch (err) {
    next({
      status: 400,
      message: 'Not posible to update this template'
    });
  }
  res.json('Template successfully updated');
});

app.use(errorHandler);

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
