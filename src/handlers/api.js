const express = require('express');
const serverless = require('serverless-http');
const routes = require('../routes');

const app = express();
app.use(express.json());
app.use('/api', routes);

module.exports.handler = serverless(app);
