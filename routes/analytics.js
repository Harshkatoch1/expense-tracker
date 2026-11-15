const express = require('express');
const Expense = require('../models/Expense');

const router = express.Router();
const DAY = 86400000;

const parseDay = (s) =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00.000Z`) : null;
const fmt = (d) => d.toISOString().slice(0, 10);

// GET /api/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD  (both optional)
router.get('/summary', async (req, res) => {
  try {
    const match = {};
    const from = parseDay(req.query.from);
    const to = parseDay(req.query.to);
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = from;
      if (to) match.date.$lte = to;
    }

    const [out] = await Expense.aggregate([
      { $match: match },
      {
        $facet: {
          totals: [
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 }, largest: { $max: '$amount' } } }
          ],
          byCategory: [
            { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
          ],
          byPayment: [
            { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
          ],
          byDay: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          byWeekday: [
            { $group: { _id: { $dayOfWeek: '$date' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ],
          top: [{ $sort: { amount: -1 } }, { $limit: 5 }]
        }
      }
    ]);

    const totals = out.totals[0] || { total: 0, count: 0, largest: 0 };

    // Effective range, used for the daily average and for filling empty days in charts
    const rangeFrom = from ? fmt(from) : out.byDay.length ? out.byDay[0]._id : null;
    const rangeTo = to ? fmt(to) : out.byDay.length ? out.byDay[out.byDay.length - 1]._id : null;
    let days = 0;
    if (rangeFrom && rangeTo) {
      days = Math.round((parseDay(rangeTo) - parseDay(rangeFrom)) / DAY) + 1;
    }

    res.json({
      range: { from: rangeFrom, to: rangeTo, days },
      total: totals.total,
      count: totals.count,
      largest: totals.largest,
      dailyAverage: days ? totals.total / days : 0,
      byCategory: out.byCategory.map((r) => ({ category: r._id, total: r.total, count: r.count })),
      byPayment: out.byPayment.map((r) => ({ method: r._id, total: r.total, count: r.count })),
      byDay: out.byDay.map((r) => ({ date: r._id, total: r.total, count: r.count })),
      byWeekday: out.byWeekday.map((r) => ({ weekday: r._id, total: r.total, count: r.count })),
      top: out.top
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
