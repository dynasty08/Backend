const express = require('express');
const { getDbPool } = require('../utils/database');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

router.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

router.get('/users', async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.query('SELECT * FROM users LIMIT 10');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
