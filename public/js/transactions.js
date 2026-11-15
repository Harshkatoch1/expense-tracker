(function () {
  const params = new URLSearchParams(window.location.search);
  let showAll = params.get('view') === 'all';
  let date = params.get('date') || todayStr();

  const listEl = $('#list');
  const picker = $('#date-picker');
  const toggleBtn = $('#toggle-all');

  if (params.get('saved')) {
    $('#banner').innerHTML = '<div class="banner" role="status">Expense saved.</div>';
    // keep the URL clean so a refresh doesn't show the banner again
    params.delete('saved');
    history.replaceState(null, '', `?${params.toString()}`);
  }

  function syncUrl() {
    const p = new URLSearchParams();
    if (showAll) p.set('view', 'all');
    else p.set('date', date);
    history.replaceState(null, '', `?${p.toString()}`);
  }

  function renderGroup(day, items) {
    const total = items.reduce((s, x) => s + x.amount, 0);
    const rows = items
      .map(
        (x) => `
        <li class="txn">
          <div>
            <div class="title">${escapeHtml(x.title)}</div>
            <div class="meta">${escapeHtml(x.category)} · ${escapeHtml(x.paymentMethod)}${x.note ? ' · ' + escapeHtml(x.note) : ''}</div>
          </div>
          <div class="amt">${formatINR(x.amount)}</div>
          <button class="del" data-id="${x._id}" aria-label="Delete ${escapeHtml(x.title)}">Delete</button>
        </li>`
      )
      .join('');
    return `
      <section class="day-group">
        <div class="day-head"><h2>${prettyDate(day)}</h2><span class="day-total">${formatINR(total)}</span></div>
        <ul class="txn-list">${rows}</ul>
      </section>`;
  }

  async function load() {
    listEl.innerHTML = '<p class="empty">Loading…</p>';
    toggleBtn.setAttribute('aria-pressed', String(showAll));
    toggleBtn.textContent = showAll ? 'Show one day' : 'Show all days';
    picker.disabled = showAll;
    $('#prev').disabled = showAll;
    $('#next').disabled = showAll;
    picker.value = date;
    syncUrl();

    try {
      const url = showAll ? '/api/expenses' : `/api/expenses?date=${date}`;
      const items = await api(url);

      $('#heading').textContent = showAll ? 'All transactions' : date === todayStr() ? "Today's transactions" : 'Daily transactions';
      const total = items.reduce((s, x) => s + x.amount, 0);
      $('#subheading').textContent = items.length
        ? `${items.length} ${items.length === 1 ? 'transaction' : 'transactions'} · ${formatINR(total)} spent${showAll ? '' : ' on ' + shortDate(date)}`
        : '';

      if (!items.length) {
        listEl.innerHTML = `<div class="panel empty">${
          showAll ? 'No expenses yet.' : `No expenses on ${shortDate(date)}.`
        } <a href="/index.html">Add one</a></div>`;
        return;
      }

      // Group by day (items are already sorted newest first)
      const groups = new Map();
      items.forEach((x) => {
        const day = x.date.slice(0, 10);
        if (!groups.has(day)) groups.set(day, []);
        groups.get(day).push(x);
      });
      listEl.innerHTML = [...groups].map(([day, xs]) => renderGroup(day, xs)).join('');
    } catch (err) {
      listEl.innerHTML = `<div class="panel empty">Could not load transactions: ${escapeHtml(err.message)}</div>`;
    }
  }

  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.del');
    if (!btn) return;
    if (!confirm('Delete this expense?')) return;
    try {
      await api(`/api/expenses/${btn.dataset.id}`, { method: 'DELETE' });
      toast('Deleted');
      load();
    } catch (err) {
      toast(err.message);
    }
  });

  picker.addEventListener('change', () => { if (picker.value) { date = picker.value; load(); } });
  $('#prev').addEventListener('click', () => { date = addDays(date, -1); load(); });
  $('#next').addEventListener('click', () => { date = addDays(date, 1); load(); });
  $('#today').addEventListener('click', () => { showAll = false; date = todayStr(); load(); });
  toggleBtn.addEventListener('click', () => { showAll = !showAll; load(); });

  load();
})();
