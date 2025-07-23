const express = require('express');
const { getDbPool } = require('../utils/database');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

router.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Authentication endpoint
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple authentication (replace with real logic)
    if (email === 'admin@test.com' && password === 'password') {
      res.json({
        token: 'jwt-token-here',
        user: {
          email: email,
          name: 'Admin User'
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard data endpoint
router.get('/dashboard', async (req, res) => {
  try {
    // You can fetch real data from database here
    const pool = await getDbPool();
    
    // Example: Get user count from database
    let totalUsers = 1234;
    try {
      const userResult = await pool.query('SELECT COUNT(*) as count FROM users');
      totalUsers = userResult.rows[0]?.count || 1234;
    } catch (dbError) {
      console.log('DB query failed, using default values');
    }
    
    res.json({
      totalUsers: totalUsers,
      activeSessions: 56,
      systemStatus: 'Online',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
