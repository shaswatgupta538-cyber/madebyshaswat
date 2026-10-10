require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
require('./db'); // ensures DB + admin + products are seeded on boot

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', orderRoutes);
app.use('/api/admin', adminRoutes);

// Serve generated invoice PDFs
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Made By Shaswat app running on http://localhost:${PORT}`));
