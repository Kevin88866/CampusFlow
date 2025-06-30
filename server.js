require('dotenv').config();
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { OAuth2Client } = require('google-auth-library');
const { Server } = require('socket.io');
const WEB_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const ANDROID_CLIENT_ID = '878044548983-o8efftfgd3vkuokkjcn2v50s38h4kgcf.apps.googleusercontent.com';
const client = new OAuth2Client(WEB_CLIENT_ID);
const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(bodyParser.json());

// Socket.IO, use in chat. 
const io = new Server(server, { cors: { origin: '*' } });
io.on('connection', socket => {
  const { userId: uid } = socket.handshake.query;
  if (!uid) return;
  socket.join(`user_${uid}`);
  socket.on('private_message', async ({ toUserId, content }) => {
    try {
      await pool.query(
        'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1,$2,$3)',
        [uid, toUserId, content]
      );
      io.to(`user_${toUserId}`).emit('private_message', {
        fromUserId: parseInt(uid, 10),
        content,
        sentAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error sending private message:', err);
    }
  });
  socket.on('disconnect', () => { socket.leave(`user_${uid}`); });
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://localhost/campusflow_poc' });
const PORT = process.env.PORT || 3000;

function computeAreaId(lat, lon) { return `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`; }

// registration, insert new user, check for the email and phone haven't been done
app.post('/register', async (req, res) => {
  const { username, password, phone } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, phone) VALUES ($1, $2, $3) RETURNING id, username, coins',
      [username, hash, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Username exists' });
    console.error('Error in /register:', e);
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
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: [WEB_CLIENT_ID, ANDROID_CLIENT_ID],
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
  const valid = ['Very Crowded (>75%)', 'Crowded (>50%)', 'Moderate (>25%)', 'Sparse (>0%)'];
  if (!uid || latitude == null || longitude == null || !valid.includes(occupancy_level))
    return res.status(400).json({ error: 'Invalid data' });
  const area_id = computeAreaId(latitude, longitude);
  const clientDb = await pool.connect();
  try {
    await clientDb.query('BEGIN');
    await clientDb.query(
      'INSERT INTO surveys (user_id, latitude, longitude, occupancy_level) VALUES ($1, $2, $3, $4)',
      [uid, latitude, longitude, occupancy_level]
    );
    await clientDb.query(
      'INSERT INTO user_habits (user_id, area_id) VALUES ($1, $2)',
      [uid, area_id]
    );
    const upd = await clientDb.query(
      'UPDATE users SET coins = coins + 1 WHERE id=$1 RETURNING coins',
      [uid]
    );
    await clientDb.query('COMMIT');
    res.json({ success: true, newCoins: upd.rows[0].coins });
  } catch (e) {
    await clientDb.query('ROLLBACK');
    console.error('Error in /survey:', e);
    res.status(500).json({ error: 'Database error' });
  } finally {
    clientDb.release();
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
    const uid = parseInt(req.params.id,10);
    if (isNaN(uid)) return res.status(400).json({ error: 'Invalid user id' });
    const userRes = await pool.query('SELECT id, username AS name, email, coins, phone FROM users WHERE id=$1',[uid]);
    if(!userRes.rows.length) return res.status(404).json({ error:'User not found' });
    const user=userRes.rows[0];
    const surveysRes=await pool.query("SELECT occupancy_level, to_char(submitted_at,'YYYY-MM-DD HH24:MI') AS timestamp FROM surveys WHERE user_id=$1 ORDER BY submitted_at DESC LIMIT 10",[uid]);
    user.recentSurveys=surveysRes.rows;
    res.json(user);
  } catch(e) {
    console.error('Error in /users/:id',e);
    res.status(500).json({ error:'Database error' });
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
  const { name, email, phone } = req.body;
  if (isNaN(uid)) return res.status(400).json({ error: 'Invalid user id' });
  try {
    const result = await pool.query(
      `UPDATE users
         SET username = $2,
             email    = $3,
             phone    = $4
       WHERE id = $1
       RETURNING id, username AS name, email, phone, coins`,
      [uid, name, email, phone]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in PUT /users/:id', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start server
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
