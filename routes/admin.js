const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../db');
const currency = require('../config/currency.json');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { generateInvoice } = require('../invoice');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// All orders, newest first (shop purchases + custom work)
router.get('/orders', (req, res) => {
  const rows = db
    .prepare(
      `SELECT orders.*,
              COALESCE(products.title, orders.custom_title) AS product_title,
              users.id AS customer_id, users.name AS customer_name, users.email AS customer_email
       FROM orders
       LEFT JOIN products ON products.id = orders.product_id
       JOIN users ON users.id = orders.user_id
       ORDER BY orders.created_at DESC`
    )
    .all();
  res.json(rows);
});

// Create a custom work item for one specific customer (not from the shop list).
// Find the customer by email or by their Customer ID — only shows up in THEIR dashboard.
router.post('/custom-orders', (req, res) => {
  const { customerEmail, customerId, title, description, amountUsd } = req.body;
  if (!title || !amountUsd) return res.status(400).json({ error: 'Title and amount are required.' });

  const user = customerId
    ? db.prepare('SELECT * FROM users WHERE id = ?').get(customerId)
    : db.prepare('SELECT * FROM users WHERE email = ?').get((customerEmail || '').toLowerCase().trim());

  if (!user) return res.status(404).json({ error: 'No customer found with that email or ID. They need to sign up first.' });

  const rate = currency.rates[user.currency] || 1;
  const amountLocal = Number(amountUsd) * rate;

  const info = db
    .prepare(
      `INSERT INTO orders (user_id, product_id, custom_title, custom_description, amount_usd, currency, amount_local, status)
       VALUES (?, NULL, ?, ?, ?, ?, ?, 'pending')`
    )
    .run(user.id, title, description || '', Number(amountUsd), user.currency, amountLocal);

  res.json({ orderId: info.lastInsertRowid, customerId: user.id, customerName: user.name });
});

// Mark an order paid
router.post('/orders/:id/paid', (req, res) => {
  db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Mark an order completed -> auto-generates the invoice PDF
router.post('/orders/:id/complete', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(order.user_id);
  const product = order.product_id
    ? db.prepare('SELECT * FROM products WHERE id = ?').get(order.product_id)
    : { title: order.custom_title, description: order.custom_description };
  const symbol = currency.symbols[order.currency] || '';

  db.prepare("UPDATE orders SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(order.id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
  const invoicePath = generateInvoice({ order: updated, user, product, symbol });
  db.prepare('UPDATE orders SET invoice_path = ? WHERE id = ?').run(invoicePath, order.id);

  res.json({ ok: true, invoicePath });
});

// Revenue dashboard: ?from=YYYY-MM-DD&to=YYYY-MM-DD (defaults to last 365 days)
router.get('/dashboard', (req, res) => {
  const stats = buildStats(req.query.from, req.query.to);
  res.json(stats);
});

// Same stats, as a downloadable PDF report
router.get('/dashboard/pdf', (req, res) => {
  const stats = buildStats(req.query.from, req.query.to);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="revenue-report.pdf"');

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(18).text('Made By Shaswat — Revenue Report');
  doc.fontSize(10).fillColor('#555').text(`${stats.from} to ${stats.to}`);
  doc.moveDown(1.5);

  doc.fillColor('#000').fontSize(14).text(`Total earned: $${stats.totalUsd.toFixed(2)} USD`);
  doc.moveDown(1);

  doc.fontSize(12).text('By product:');
  stats.byProduct.forEach((p) => doc.fontSize(10).text(`  ${p.title}: $${p.totalUsd.toFixed(2)} (${p.count} orders)`));
  doc.moveDown(1);

  doc.fontSize(12).text('By customer:');
  stats.byCustomer.forEach((c) => doc.fontSize(10).text(`  ${c.name} (${c.email}): $${c.totalUsd.toFixed(2)}`));

  doc.end();
});

function buildStats(from, to) {
  const toDate = to || new Date().toISOString().slice(0, 10);
  const fromDate = from || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const rows = db
    .prepare(
      `SELECT orders.*, products.title AS product_title, users.name AS customer_name, users.email AS customer_email
       FROM orders
       JOIN products ON products.id = orders.product_id
       JOIN users ON users.id = orders.user_id
       WHERE orders.status = 'completed'
         AND date(orders.completed_at) BETWEEN date(?) AND date(?)`
    )
    .all(fromDate, toDate);

  const totalUsd = rows.reduce((sum, r) => sum + r.amount_usd, 0);

  const byProductMap = {};
  rows.forEach((r) => {
    byProductMap[r.product_title] = byProductMap[r.product_title] || { title: r.product_title, totalUsd: 0, count: 0 };
    byProductMap[r.product_title].totalUsd += r.amount_usd;
    byProductMap[r.product_title].count += 1;
  });

  const byCustomerMap = {};
  rows.forEach((r) => {
    const key = r.customer_email;
    byCustomerMap[key] = byCustomerMap[key] || { name: r.customer_name, email: r.customer_email, totalUsd: 0 };
    byCustomerMap[key].totalUsd += r.amount_usd;
  });

  return {
    from: fromDate,
    to: toDate,
    totalUsd,
    orderCount: rows.length,
    byProduct: Object.values(byProductMap).sort((a, b) => b.totalUsd - a.totalUsd),
    byCustomer: Object.values(byCustomerMap).sort((a, b) => b.totalUsd - a.totalUsd),
  };
}

module.exports = router;
