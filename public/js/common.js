// Shared helpers used by all pages
const $ = (sel, root = document) => root.querySelector(sel);

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const formatINR = (n) => inr.format(n || 0);
const formatINRShort = (n) => inr0.format(Math.round(n || 0));

// Local calendar date as YYYY-MM-DD (not UTC, so "today" is right for the user)
const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const todayStr = () => toDateStr(new Date());

// Add days to a YYYY-MM-DD string without timezone drift
const addDays = (str, n) => {
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
};

const prettyDate = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  });
};
const shortDate = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', timeZone: 'UTC'
  });
};

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
