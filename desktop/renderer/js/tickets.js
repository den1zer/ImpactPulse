// ── Tickets Tab ───────────────────────────────────────────
let _tickets = [], _ticketsPage = 1;

async function loadTickets() {
  setLoading('tickets-list');
  document.getElementById('tickets-pagination').innerHTML = '';
  try {
    _tickets = await api('GET', '/api/support/tickets');
    const badge = document.getElementById('badge-tickets');
    if (_tickets.length) { badge.textContent = _tickets.length; badge.classList.add('show'); }
    else badge.classList.remove('show');
    _ticketsPage = 1;
    renderTickets();
  } catch(e) { setError('tickets-list', e.message); }
}

function getFilteredTickets() {
  const search = document.getElementById('tickets-search').value.toLowerCase();
  const sort   = document.getElementById('tickets-sort').value;
  let arr = _tickets.filter(t =>
    search === '' ||
    t.name.toLowerCase().includes(search) ||
    t.email.toLowerCase().includes(search) ||
    t.question.toLowerCase().includes(search)
  );
  if (sort === 'newest') arr.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  if (sort === 'oldest') arr.sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt));
  if (sort === 'name')   arr.sort((a,b) => a.name.localeCompare(b.name));
  return arr;
}

function renderTickets() {
  const filtered = getFilteredTickets();
  const page = paginate(filtered, _ticketsPage);
  if (!filtered.length) { setEmpty('tickets-list', 'Тікетів не знайдено'); renderPagination('tickets-pagination',1,0,()=>{}); return; }
  document.getElementById('tickets-list').innerHTML = `
    <table>
      <thead><tr><th>Ім'я</th><th>Email</th><th>Телефон</th><th>Питання</th><th>Дата</th></tr></thead>
      <tbody>${page.map(t => `
        <tr>
          <td>${t.name}</td>
          <td><a class="proof-link" href="mailto:${t.email}">${t.email}</a></td>
          <td class="secondary">${t.phone || '—'}</td>
          <td>${t.question}</td>
          <td class="secondary">${fmtDate(t.createdAt)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  renderPagination('tickets-pagination', _ticketsPage, Math.ceil(filtered.length/10), p => { _ticketsPage=p; renderTickets(); });
}

['tickets-sort'].forEach(id =>
  document.getElementById(id).addEventListener('change', () => { _ticketsPage=1; renderTickets(); }));
document.getElementById('tickets-search').addEventListener('input', () => { _ticketsPage=1; renderTickets(); });
