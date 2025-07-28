require('dotenv').config();
const PORT = process.env.PORT || 3000;
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { OAuth2Client } = require('google-auth-library');
const { Server } = require('socket.io'); 
const nodemailer = require('nodemailer');
const WEB_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(WEB_CLIENT_ID);
const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(bodyParser.json());
const pool = new Pool({connectionString: process.env.DATABASE_URL || 'postgresql://localhost/campusflow_poc'});
function computeAreaId(lat, lon) { return `${lat.toFixed(2)},${lon.toFixed(2)}`;}

// store OTP
const otpStore = {};
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// send OTP
app.post('/send-register-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const code    = generateOTP();
  const expires = Date.now() + 5 * 60 * 1000;
  otpStore[`register_${email}`] = { code, expires };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your CampusFlow Password Reset Code',
      text: `Your password reset code is ${code}. It will expire in 5 minutes.`,
    });
    res.json({ success: true });
  } catch (e) {
    console.error('Error sending OTP email', e);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// check OTP and register user
app.post('/register', async (req, res) => {
  const { username, password, email, phone, otp, interest } = req.body;
  if (!username || !password || !email) return res.status(400).json({ error: 'Missing fields' });
  const key = `register_${email}`;
  const rec = otpStore[key];
  if (!rec || rec.code !== otp || rec.expires < Date.now()) return res.status(400).json({ error: 'Invalid or expired OTP' });
  delete otpStore[key];
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username,password_hash,email,phone,interest)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, username, coins`,
      [username, hash, email, phone, interest]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Username or email already exists' });
    console.error('Error in /register:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// send reset OTP
app.post('/send-reset-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const userRes = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  if (!userRes.rows.length) return res.status(404).json({ error: 'Email not found' });
  const code = generateOTP();
  const expires = Date.now() + 5 * 60 * 1000;
  otpStore[`reset_${email}`] = { code, expires };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your CampusFlow Password Reset Code',
      text: `Your password reset code is ${code}. It will expire in 5 minutes.`,
    });
    res.json({ success: true });
  } catch (e) {
    console.error('Error sending reset OTP email', e);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// reset password
app.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({ error: 'Missing fields' });

  const key = `reset_${email}`;
  const rec = otpStore[key];
  if (!rec || rec.code !== otp || rec.expires < Date.now()) return res.status(400).json({ error: 'Invalid or expired OTP' });
  delete otpStore[key];

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE email=$2', [hash, email]);
    res.json({ success: true });
  } catch (e) {
    console.error('Error in /reset-password:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Local login, compare with database
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
  try {
    const result = await pool.query(
      'SELECT id, username, password_hash, coins FROM users WHERE username=$1',
      [username]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ id: user.id, username: user.username, coins: user.coins });
  } catch (e) {
    console.error('Error in /login:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Google login
app.post('/google-login', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing ID token' });
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      udience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;
    let result = await pool.query(
      'SELECT id, username, coins FROM users WHERE google_id = $1',
      [googleId]
    );
    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO users (google_id, username, email) VALUES ($1, $2, $3) RETURNING id, username, coins',
        [googleId, name, email]
      );
    }
    const user = result.rows[0];
    res.json({ id: user.id, username: user.username, coins: user.coins });
  } catch (e) {
    console.error('Error in /google-login:', e);
    res.status(401).json({ error: e.message || 'Invalid Google token' });
  }
});

// Conversations list
app.get('/conversations/:user_id', async (req, res) => {
  const uid = parseInt(req.params.user_id, 10);
  if (isNaN(uid)) return res.status(400).json({ error: 'Invalid user id' });
  try {
    const { rows: peers } = await pool.query(`
      SELECT
        CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS peer_id,
        MAX(sent_at) AS last_sent
      FROM messages
      WHERE sender_id = $1 OR receiver_id = $1
      GROUP BY peer_id
      ORDER BY last_sent DESC
    `, [uid]);
    if (peers.length === 0) return res.json([]);
    const pids = peers.map(p => p.peer_id);
    const { rows: users } = await pool.query(
      'SELECT id, username FROM users WHERE id = ANY($1::int[])',
      [pids]
    );
    const nameMap = Object.fromEntries(users.map(u => [u.id, u.username]));
    const conversations = peers.map(p => ({
      peer_id: p.peer_id,
      peerName: nameMap[p.peer_id] || 'Unknown',
      lastSent: p.last_sent
    }));
    res.json(conversations);
  } catch (err) {
    console.error('Error in /conversations/:user_id', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Submit survey
app.post('/survey', async (req, res) => {
  const { user_id: uid, latitude, longitude, occupancy_level } = req.body;
  const validLevels = [
    'Very Crowded (>75%)',
    'Crowded (>50%)',
    'Moderate (>25%)',
    'Sparse (>0%)'
  ];
  if (!uid || latitude == null || longitude == null || !validLevels.includes(occupancy_level)) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  try {
    const lastRes = await pool.query(
      'SELECT submitted_at FROM surveys WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1',
      [uid]
    );
    const lastTime = new Date(lastRes.rows[0].submitted_at).getTime();
    const diff = Date.now() - lastTime;
    console.log('debug lastTime:', lastTime, 'diff(ms):', diff);
    if (lastRes.rows.length > 0) {
      //const lastTime = new Date(lastRes.rows[0].submitted_at).getTime();
      if (Date.now() - lastTime < 30 * 60 * 1000) {
        return res
          .status(429)
          .json({ error: 'You can only submit once every 30 minutes. Please try again later.' });
      }
    }
    const areaId = computeAreaId(latitude, longitude);
    const clientDb = await pool.connect();
    try {
      await clientDb.query('BEGIN');
      await clientDb.query(
        'INSERT INTO surveys (user_id, latitude, longitude, occupancy_level, submitted_at) VALUES ($1, $2, $3, $4, NOW())',
        [uid, latitude, longitude, occupancy_level]
      );
      await clientDb.query(
        'INSERT INTO user_habits (user_id, area_id) VALUES ($1, $2)',
        [uid, areaId]
      );
      const upd = await clientDb.query(
        'UPDATE users SET coins = coins + 1 WHERE id = $1 RETURNING coins',
        [uid]
      );
      await clientDb.query('COMMIT');
      res.json({ success: true, newCoins: upd.rows[0].coins });
    } catch (e) {
      await clientDb.query('ROLLBACK');
      res.status(500).json({ error: 'Database error' });
    } finally {
      clientDb.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Occupancy, can make a survey to make the algorithm more accurate
// use score to calculate the occupancy level, base on time, surveys, users in the region.
app.get('/occupancy', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (isNaN(lat) || isNaN(lon)) return res.status(400).json({ error: 'Invalid coords' });
  const rad = parseFloat(req.query.radius) || 0.01;
  const minLat = lat - rad, maxLat = lat + rad;
  const minLon = lon - rad, maxLon = lon + rad;
  const weights = {
    '0-1': 0.6,
    '1-2': 0.3,
    '2-3': 0.1,
  };
  const scoreMap = {
    'Very Crowded (>75%)': 100,
    'Crowded (>50%)': 66,
    'Moderate (>25%)': 33,
    'Sparse (>0%)': 0,
  };

  try {
    const result = await pool.query(`
      SELECT
        CASE
          WHEN submitted_at >= NOW() - INTERVAL '1 hour' THEN '0-1'
          WHEN submitted_at >= NOW() - INTERVAL '2 hour' THEN '1-2'
          WHEN submitted_at >= NOW() - INTERVAL '3 hour' THEN '2-3'
        END AS bucket,
        occupancy_level,
        COUNT(*) AS cnt
      FROM surveys
      WHERE latitude BETWEEN $1 AND $2
        AND longitude BETWEEN $3 AND $4
        AND submitted_at >= NOW() - INTERVAL '3 hour'
      GROUP BY bucket, occupancy_level`, [minLat, maxLat, minLon, maxLon]);
    let weightedSum = 0, totalWeight = 0;
    for (const row of result.rows) {
      const w = weights[row.bucket] || 0;
      const s = scoreMap[row.occupancy_level] || 0;
      weightedSum += s * row.cnt * w;
      totalWeight += row.cnt * w;
    }
    const avgScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    let level;
    if (avgScore > 75) level = 'Very Crowded';
    else if (avgScore > 50) level = 'Crowded';
    else if (avgScore > 25) level = 'Moderate';
    else level = 'Sparse';
    res.json({ score: avgScore, level });
  } catch (e) {
    console.error('Error in /occupancy weighted:', e);
    res.status(500).json({ error: 'Database error' });
  }
});


// habits, now is base on survey, maybe can be base on the time spent in the area
app.get('/habits', async (req, res) => {
  const uid = parseInt(req.query.user_id, 10);
  if (isNaN(uid)) return res.status(400).json({ error: 'Invalid user_id' });
  try {
    const result = await pool.query(
      'SELECT area_id, COUNT(*) AS visit_count FROM user_habits WHERE user_id=$1 GROUP BY area_id ORDER BY visit_count DESC LIMIT 3',
      [uid]
    );
    res.json({ habits: result.rows });
  } catch (e) {
    console.error('Error in /habits:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Pomodoro complete
app.post('/pomodoro/complete', async (req, res) => {
  const { user_id: uid, duration } = req.body;
  if (!uid || !duration) return res.status(400).json({ error: 'Invalid data' });
  const clientDb = await pool.connect();
  try {
    await clientDb.query('BEGIN');
    await clientDb.query('INSERT INTO pomodoro_logs (user_id, duration) VALUES ($1, $2)', [uid, duration]);
    const upd = await clientDb.query('UPDATE users SET coins = coins + 1 WHERE id=$1 RETURNING coins', [uid]);
    await clientDb.query('COMMIT');
    res.json({ success: true, newCoins: upd.rows[0].coins });
  } catch (e) {
    await clientDb.query('ROLLBACK');
    console.error('Error in /pomodoro/complete:', e);
    res.status(500).json({ error: 'Database error' });
  } finally {
    clientDb.release();
  }
});

// Nearbyusers
app.get('/users/nearby', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat||!lon) return res.status(400).json({ error: 'Missing lat or lon' });
    const areaId = `${parseFloat(lat).toFixed(2)},${parseFloat(lon).toFixed(2)}`;
    const usersRes = await pool.query(
      'SELECT u.id, u.username AS name, u.phone, \'\' AS "avatarUrl", MAX(s.id)::text AS "lastSeen" FROM users u JOIN surveys s ON u.id=s.user_id AND (round(s.latitude::numeric,2)||\',\'||round(s.longitude::numeric,2))=$1 GROUP BY u.id,u.username,u.phone ORDER BY MAX(s.id) DESC LIMIT 50',
      [areaId]
    );
    res.json(usersRes.rows);
  } catch (e) {
    console.error('Error in /users/nearby:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// User profile and recent surveys
app.get('/users/:id', async (req, res) => {
  try {
    const uid = parseInt(req.params.id, 10);
    if (isNaN(uid)) return res.status(400).json({ error: 'Invalid user id' });
    const userRes = await pool.query(
      'SELECT id, username AS name, email, coins, phone, interest FROM users WHERE id=$1',
      [uid]
    );
    if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });
    const user = userRes.rows[0];
    const surveysRes = await pool.query(
      "SELECT occupancy_level, to_char(submitted_at,'YYYY-MM-DD HH24:MI') AS timestamp FROM surveys WHERE user_id=$1 ORDER BY submitted_at DESC LIMIT 10",
      [uid]
    );
    user.recentSurveys = surveysRes.rows;
    res.json(user);
  } catch (e) {
    console.error('Error in /users/:id', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// Messages history
app.get('/messages/:withUserId', async (req, res) => {
  const uid = parseInt(req.query.user_id, 10);
  const wuid = parseInt(req.params.withUserId, 10);
  if (isNaN(uid) || isNaN(wuid)) return res.status(400).json({ error: 'Invalid user ids' });
  try {
    const result = await pool.query(
      'SELECT id, sender_id, receiver_id, content, sent_at FROM messages WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1) ORDER BY sent_at',
      [uid, wuid]
    );
    res.json(result.rows);
  } catch (e) {
    console.error('Error in /messages/:withUserId', e);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/users/:id', async (req, res) => {
  const uid = parseInt(req.params.id, 10);
  const { name, email, phone, interest } = req.body;
  if (isNaN(uid)) return res.status(400).json({ error: 'Invalid user id' });
  try {
    const result = await pool.query(
      `UPDATE users SET
         username = $2,
         email = $3,
         phone = $4,
         interest = $5
       WHERE id = $1
       RETURNING id, username AS name, email, phone, coins, interest`,
      [uid, name, email, phone, interest]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in PUT /users/:id', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/ranking', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, coins FROM users ORDER BY coins DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    console.error('Error in /ranking:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start server
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));