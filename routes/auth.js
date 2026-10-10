const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const currency = require('../config/currency.json');
require('dotenv').config();

const router = express.Router();

function sign(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, isAdmin: !!user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

router.post('/signup', (req, res) => {
  const { name, email, password, country } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  const cleanEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const curr = currency.countryToCurrency[country] || 'USD';
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, country, currency) VALUES (?,?,?,?,?)')
    .run(name, cleanEmail, hash, country || 'India', curr);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, isAdmin: false } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').toLowerCase().trim();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  res.json({
    token: sign(user),
    user: { id: user.id, name: user.name, email: user.email, isAdmin: !!user.is_admin },
  });
});

module.exports = router;
