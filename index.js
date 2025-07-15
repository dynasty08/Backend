require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

module.exports.handler = serverless(app);
