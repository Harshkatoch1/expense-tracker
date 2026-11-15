(async function () {
  const form = $('#expense-form');
  const errorEl = $('#form-error');
  const saveBtn = $('#save-btn');

  $('#date').value = todayStr();

  // Load categories / payment methods from the server so they stay in one place
  try {
    const meta = await api('/api/expenses/meta');
    $('#cats').innerHTML = meta.categories
      .map(
        (c, i) =>
          `<label class="chip"><input type="radio" name="category" value="${escapeHtml(c)}"${i === 0 ? ' checked' : ''}><span>${escapeHtml(c)}</span></label>`
      )
      .join('');
    $('#paymentMethod').innerHTML = meta.paymentMethods
      .map((m) => `<option value="${escapeHtml(m)}"${m === 'UPI' ? ' selected' : ''}>${escapeHtml(m)}</option>`)
      .join('');
  } catch (err) {
    errorEl.textContent = 'Could not load categories. Is the server running?';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const payload = {
      amount: $('#amount').value,
      title: $('#title').value.trim(),
      category: (form.querySelector('input[name="category"]:checked') || {}).value,
      paymentMethod: $('#paymentMethod').value,
      date: $('#date').value,
      note: $('#note').value.trim()
    };

    if (!(Number(payload.amount) > 0)) return (errorEl.textContent = 'Enter an amount greater than 0.');
    if (!payload.title) return (errorEl.textContent = 'Add a short description.');
    if (!payload.date) return (errorEl.textContent = 'Pick a date.');

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      await api('/api/expenses', { method: 'POST', body: JSON.stringify(payload) });
      // Redirect to that day's transactions
      window.location.href = `/transactions.html?date=${encodeURIComponent(payload.date)}&saved=1`;
    } catch (err) {
      errorEl.textContent = err.message;
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save expense';
    }
  });
})();
