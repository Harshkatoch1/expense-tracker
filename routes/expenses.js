const express = require('express');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');

const router = express.Router();

const parseDay = (s) =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00.000Z`) : null;

// Meta for the front end (category and payment lists live in one place)
router.get('/meta', (req, res) => {
  res.json({ categories: Expense.CATEGORIES, paymentMethods: Expense.PAYMENT_METHODS });
});

// List: ?date=YYYY-MM-DD  or  ?from=...&to=...  or nothing (all)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    const { date, from, to } = req.query;
    if (date) {
      const d = parseDay(date);
      if (!d) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
      filter.date = d;
    } else if (from || to) {
      filter.date = {};
      if (from) {
        const f = parseDay(from);
        if (!f) return res.status(400).json({ error: 'from must be YYYY-MM-DD' });
        filter.date.$gte = f;
      }
      if (to) {
        const t = parseDay(to);
        if (!t) return res.status(400).json({ error: 'to must be YYYY-MM-DD' });
        filter.date.$lte = t;
      }
    }
    const items = await Expense.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', async (req, res) => {
  try {
    const { title, amount, category, paymentMethod, date, note } = req.body;
    const day = parseDay(date);
    if (!day) return res.status(400).json({ error: 'Pick a valid date.' });
    const saved = await Expense.create({
      title,
      amount: Number(amount),
      category,
      paymentMethod,
      date: day,
      note
    });
    res.status(201).json(saved);
  } catch (err) {
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const removed = await Expense.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Expense not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
