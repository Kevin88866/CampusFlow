require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({connectionString: process.env.DATABASE_URL || 'postgresql://localhost/campusflow_poc'});

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, coins, created_at',[username, hashed]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  try {
    const result = await pool.query('SELECT id, username, password_hash, coins FROM users WHERE username = $1',[username]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ id: user.id, username: user.username, coins: user.coins });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Survey
app.post('/survey', async (req, res) => {
  const { user_id, latitude, longitude, occupancy_level } = req.body;
  const validLevels = ['Very Crowded (>75%)', 'Crowded (>50%)', 'Moderate (>25%)','Sparse (>0%)'];
  if (!user_id || latitude == null || longitude == null || !occupancy_level || !validLevels.includes(occupancy_level)) {
    return res.status(400).json({ error: 'Missing or invalid survey data' });
  }
  try {
    await pool.query('INSERT INTO surveys (user_id, latitude, longitude, occupancy_level) VALUES ($1, $2, $3, $4)',[user_id, latitude, longitude, occupancy_level]);
    const updateResult = await pool.query('UPDATE users SET coins = coins + 1 WHERE id = $1 RETURNING coins',[user_id]);
    const newCoins = updateResult.rows[0].coins;
    res.json({ success: true, newCoins });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
