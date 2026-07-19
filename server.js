import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'mc_leaderboard_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 } // 24 hours
  })
);

// REST API ROUTES

// 1. Get Top Approved Servers
app.get('/api/servers', (req, res) => {
  const category = req.query.category;
  const search = req.query.search;

  let query = 'SELECT * FROM servers WHERE approved = 1';
  let params = [];

  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY votes_count DESC LIMIT 50';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 2. Submit New Server
app.post('/api/servers', (req, res) => {
  const { name, ip, category, description, website_url, discord_url } = req.body;

  if (!name || !ip || !category) {
    return res.status(400).json({ error: 'Name, IP, and Category are required.' });
  }

  const query = `
    INSERT INTO servers (name, ip, category, description, website_url, discord_url, approved)
    VALUES (?, ?, ?, ?, ?, ?, 1) -- Auto-approving for demo purposes
  `;

  db.run(query, [name, ip, category, description, website_url, discord_url], function (err) {
    if (err) return res.status(400).json({ error: 'Server IP already exists or invalid data.' });
    res.json({ message: 'Server submitted successfully!', serverId: this.lastID });
  });
});

// 3. Vote for a Server
app.post('/api/servers/:id/vote', (req, res) => {
  const serverId = req.params.id;

  // Increment vote count
  db.run('UPDATE servers SET votes_count = votes_count + 1 WHERE id = ?', [serverId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Vote added successfully!' });
  });
});

// Serve Frontend SPA Entry Point
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
