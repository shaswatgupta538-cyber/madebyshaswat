const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = new Database(path.join(__dirname, 'data', 'app.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  currency TEXT DEFAULT 'INR',
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  price_usd REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER,
  custom_title TEXT,
  custom_description TEXT,
  amount_usd REAL NOT NULL,
  currency TEXT NOT NULL,
  amount_local REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  invoice_path TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);
`);

// Seed products if empty
const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (productCount === 0) {
  const insert = db.prepare('INSERT INTO products (title, description, tag, price_usd) VALUES (?,?,?,?)');
  insert.run('AI UGC Prompt Pack', '50+ tested prompts for scroll-stopping UGC ads.', 'Prompt Pack', 29);
  insert.run('Hypermotion LUT & Preset Pack', 'Color grading presets used in every hypermotion reel.', 'Preset Pack', 39);
  insert.run('AI Character Sheet Template', 'A reusable character-reference template.', 'Template', 19);
}

// Seed admin user if missing
const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
const adminPassword = process.env.ADMIN_PASSWORD || '';
if (adminEmail && adminPassword) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existing) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare('INSERT INTO users (name, email, password_hash, is_admin) VALUES (?,?,?,1)')
      .run('Shaswat Gupta', adminEmail, hash);
    console.log('Admin account created for', adminEmail);
  }
}

module.exports = db;
