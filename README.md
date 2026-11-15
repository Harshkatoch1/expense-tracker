# Kharcha – Daily Expense Tracker

Node.js + Express + MongoDB (Mongoose) with a plain HTML/CSS/JS front end.

## Tabs
1. **Add expense** – amount, description, category, payment method, date, note. Saved to MongoDB, then you are redirected to the Transactions tab for that day.
2. **Transactions** – daily transactions read from MongoDB. Pick a day, step prev/next, or show all days. Delete an entry if needed.
3. **Analysis** – total, daily average, top category, biggest expense, plus charts: spending per day, by category, by payment method, by day of week, and the five biggest expenses. Ranges: last 7 days, last 30 days, this month, all time.

## Run it
1. Install [Node.js](https://nodejs.org) (v18 or newer) and MongoDB (local Community Server, or a free MongoDB Atlas cluster).
2. In this folder:
   ```
   npm install
   cp .env.example .env     # Windows: copy .env.example .env
   npm start
   ```
3. Open http://localhost:3000

Edit `.env` to point `MONGODB_URI` at Atlas or another MongoDB server. The database and `expenses` collection are created automatically on the first save.

## Project layout
```
server.js              Express app + MongoDB connection
models/Expense.js      Mongoose schema (also holds category / payment lists)
routes/expenses.js     POST/GET/DELETE /api/expenses
routes/analytics.js    GET /api/analytics/summary (MongoDB aggregation)
public/                index.html, transactions.html, analysis.html, css/, js/
```

## Customising
Change categories or payment methods in `models/Expense.js`. The form picks them up automatically. The analysis page loads Chart.js from a CDN, so it needs internet access.
