const express = require('express');
const db = require('../db');
const currency = require('../config/currency.json');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Public: list products
router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products').all();
  res.json(products);
});

// Auth: place an order (status starts 'pending' — paid manually via WhatsApp/QR for now)
router.post('/orders', requireAuth, (req, res) => {
  const { productId } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const rate = currency.rates[user.currency] || 1;
  const amountLocal = product.price_usd * rate;

  const info = db
    .prepare(
      'INSERT INTO orders (user_id, product_id, amount_usd, currency, amount_local) VALUES (?,?,?,?,?)'
    )
    .run(user.id, product.id, product.price_usd, user.currency, amountLocal);

  res.json({ orderId: info.lastInsertRowid, status: 'pending' });
});

// Auth: a customer's own orders
router.get('/orders/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT orders.*,
              COALESCE(products.title, orders.custom_title) AS product_title,
              COALESCE(products.tag, 'Custom work') AS product_tag
       FROM orders LEFT JOIN products ON products.id = orders.product_id
       WHERE orders.user_id = ? ORDER BY orders.created_at DESC`
    )
    .all(req.user.id);
  // Each order already stored its own currency at purchase time — look up the right symbol per row
  // (a customer could in theory change country/currency later; this keeps old orders showing correctly).
  res.json(rows.map((r) => ({ ...r, symbol: currency.symbols[r.currency] || '' })));
});

// Auth: download your own invoice (ownership checked)
router.get('/orders/:id/invoice', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.user_id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Not your order.' });
  }
  if (!order.invoice_path) return res.status(404).json({ error: 'Invoice not generated yet.' });
  res.redirect(order.invoice_path);
});

module.exports = router;
