require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_tracker';

app.use(express.json());
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/analytics', require('./routes/analytics'));
app.use(express.static(path.join(__dirname, 'public')));

// Unknown API routes -> JSON 404
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Kharcha running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB. Is it running, and is MONGODB_URI correct?');
    console.error(err.message);
    process.exit(1);
  });
