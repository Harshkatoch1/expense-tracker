const mongoose = require('mongoose');

const CATEGORIES = [
  'Food', 'Groceries', 'Transport', 'Shopping', 'Bills',
  'Rent', 'Health', 'Education', 'Entertainment', 'Other'
];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Net banking'];

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, enum: CATEGORIES },
    paymentMethod: { type: String, required: true, enum: PAYMENT_METHODS, default: 'UPI' },
    // Stored as UTC midnight of the chosen calendar day
    date: { type: Date, required: true, index: true },
    note: { type: String, trim: true, maxlength: 300, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
