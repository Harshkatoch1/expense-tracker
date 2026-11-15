(function () {
  const PALETTE = ['#0e6b66', '#d9962b', '#3b5b92', '#b8432f', '#7a9e3f', '#8a5a9e', '#2b9bb5', '#c7708c', '#6b7a82', '#a88b5a'];
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // Mongo $dayOfWeek: 1 = Sunday
  const charts = {};
  let range = '30';

  Chart.defaults.font.family = "'Public Sans', 'Segoe UI', sans-serif";
  Chart.defaults.color = '#5b6e77';

  function getRange() {
    const today = todayStr();
    if (range === 'all') return {};
    if (range === 'month') return { from: today.slice(0, 8) + '01', to: today };
    const n = Number(range);
    return { from: addDays(today, -(n - 1)), to: today };
  }

  function draw(id, config) {
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), config);
  }

  const moneyTick = (v) => formatINRShort(v);
  const tooltipMoney = { callbacks: { label: (ctx) => ' ' + formatINR(ctx.parsed.y ?? ctx.parsed) } };

  function render(d) {
    // ---- KPIs
    $('#k-total').textContent = formatINRShort(d.total);
    $('#k-count').textContent = `${d.count} ${d.count === 1 ? 'transaction' : 'transactions'}`;
    $('#k-avg').textContent = formatINRShort(d.dailyAverage);
    $('#k-days').textContent = d.range.days ? `over ${d.range.days} ${d.range.days === 1 ? 'day' : 'days'}` : '';
    const topCat = d.byCategory[0];
    $('#k-cat').textContent = topCat ? topCat.category : '–';
    $('#k-cat-hint').textContent = topCat && d.total ? `${Math.round((topCat.total / d.total) * 100)}% of spending` : '';
    $('#k-max').textContent = d.count ? formatINRShort(d.largest) : '–';
    $('#k-max-hint').textContent = d.top[0] ? d.top[0].title : '';

    $('#range-label').textContent = d.range.from
      ? `${shortDate(d.range.from)} to ${shortDate(d.range.to)}`
      : 'No expenses recorded yet.';

    // ---- Daily spend (fill days with no spending as 0)
    const byDate = new Map(d.byDay.map((r) => [r.date, r.total]));
    const labels = [];
    const values = [];
    if (d.range.from && d.range.to) {
      for (let day = d.range.from; day <= d.range.to; day = addDays(day, 1)) {
        labels.push(shortDate(day));
        values.push(byDate.get(day) || 0);
      }
    }
    draw('c-daily', {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Spent', data: values, backgroundColor: '#0e6b66', borderRadius: 4 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: tooltipMoney },
        scales: { y: { beginAtZero: true, ticks: { callback: moneyTick } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } } }
      }
    });

    // ---- Category doughnut
    draw('c-cat', {
      type: 'doughnut',
      data: {
        labels: d.byCategory.map((r) => r.category),
        datasets: [{ data: d.byCategory.map((r) => r.total), backgroundColor: PALETTE, borderWidth: 2, borderColor: '#fff' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '58%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12 } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${formatINR(ctx.parsed)}` } }
        }
      }
    });

    // ---- Payment methods
    draw('c-pay', {
      type: 'bar',
      data: {
        labels: d.byPayment.map((r) => r.method),
        datasets: [{ data: d.byPayment.map((r) => r.total), backgroundColor: '#d9962b', borderRadius: 4 }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ' ' + formatINR(ctx.parsed.x) } } },
        scales: { x: { beginAtZero: true, ticks: { callback: moneyTick } }, y: { grid: { display: false } } }
      }
    });

    // ---- Weekday totals (Sun..Sat)
    const week = Array(7).fill(0);
    d.byWeekday.forEach((r) => { week[r.weekday - 1] = r.total; });
    draw('c-week', {
      type: 'bar',
      data: { labels: WEEKDAYS, datasets: [{ data: week, backgroundColor: '#3b5b92', borderRadius: 4 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: tooltipMoney },
        scales: { y: { beginAtZero: true, ticks: { callback: moneyTick } }, x: { grid: { display: false } } }
      }
    });

    // ---- Top 5 table
    $('#top-body').innerHTML = d.top.length
      ? d.top
          .map(
            (x) => `<tr><td>${escapeHtml(x.title)}<div class="meta" style="color:var(--muted);font-size:.82rem">${escapeHtml(x.category)}</div></td><td>${shortDate(x.date.slice(0, 10))}</td><td class="num">${formatINR(x.amount)}</td></tr>`
          )
          .join('')
      : '<tr><td colspan="3" style="color:var(--muted)">Nothing here yet. <a href="/index.html">Add an expense</a></td></tr>';
  }

  async function load() {
    const { from, to } = getRange();
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    try {
      render(await api(`/api/analytics/summary?${qs}`));
    } catch (err) {
      $('#range-label').textContent = 'Could not load analysis: ' + err.message;
    }
  }

  document.querySelectorAll('[data-range]').forEach((btn) => {
    btn.addEventListener('click', () => {
      range = btn.dataset.range;
      document.querySelectorAll('[data-range]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      load();
    });
  });

  load();
})();
