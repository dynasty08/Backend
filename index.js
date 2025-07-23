require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const routes = require('./src/routes');

const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Use routes
app.use('/', routes);
app.use('/dev', routes); // Handle stage prefix

module.exports.handler = serverless(app);
