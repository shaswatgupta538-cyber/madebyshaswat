# Made By Shaswat — Customer Accounts, Orders & Dashboard

A real, working backend for your agency: customer signup/login, order tracking,
auto-generated invoice PDFs, and a private admin revenue dashboard.

## What this actually is

- **Backend:** Node.js + Express + SQLite (file-based database, no separate server to set up)
- **Frontend:** Plain HTML/CSS/JS (no build step)
- **Auth:** Email + password, sessions via JWT. Passwords are hashed (never stored in plain text).
- **Invoices:** Auto-generated as real PDF files when you mark an order "complete"
- **Currency:** Static, editable rate table at `config/currency.json` — not live rates

## Run it locally (test this first)

1. Install [Node.js](https://nodejs.org) (v18 or newer) if you don't have it.
2. Open a terminal in this folder and run:
   ```
   npm install
   cp .env.example .env
   ```
3. Open `.env` and set:
   - `JWT_SECRET` — any long random string (mash your keyboard)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — this becomes **your** admin login
4. Start it:
   ```
   npm start
   ```
5. Open `http://localhost:4000` in your browser.
   - Sign up as a normal customer to test the buyer flow
   - Log in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD` to see `/admin.html`, your private dashboard

## How the order flow actually works

This does **not** process real payments — nothing here can safely do that without a
licensed payment processor. The flow is:

1. Customer signs up / logs in, clicks "Buy now" → an order is created with status `pending`
2. You send them your UPI/QR code on WhatsApp like you do today
3. Once paid, you open your dashboard and click **"Mark complete & send invoice"**
   → this automatically generates a real PDF invoice and makes it downloadable
   from the customer's "My Orders" page

## Deploying it so it's live on the internet

This needs real hosting (not this chat) since it's a real server with a database.
**Render** is a good free option:

1. Push this folder to a GitHub repository
2. On Render: New → Web Service → connect the repo
3. Build command: `npm install` — Start command: `npm start`
4. Add the same environment variables from `.env` in Render's dashboard (never commit `.env` itself)
5. Render gives you a live URL — that's your real site

## Known limits, honestly

- **No "Log in with Google"** yet — needs you to create a Google Cloud OAuth app first (free, but a separate setup). Happy to wire it in once you have the Client ID/Secret.
- **Currency rates are static** — edit `config/currency.json` any time, or swap in a live exchange-rate API later.
- **The SQLite database is a single file** (`data/app.db`) — back it up regularly once this is live and has real customer data.
- **No email notifications** — customers only find out their order status by visiting the site or you messaging them.

## Folder guide

```
server.js          — starts everything
db.js               — database setup + auto-seeds products & your admin account
routes/auth.js       — signup / login
routes/orders.js     — shop + customer order history
routes/admin.js       — your dashboard + marking orders complete
invoice.js            — generates the invoice PDFs
config/currency.json   — edit exchange rates & country list here
public/                — the actual website (HTML/CSS/JS)
```
