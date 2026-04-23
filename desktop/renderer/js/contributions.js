// ── Contributions Tab ─────────────────────────────────────
let _contribs = [], _contribPage = 1;
const PER_PAGE = 10;

async function loadContributions() {
  setLoading('contrib-list');
  document.getElementById('contrib-pagination').innerHTML = '';
  try {
    _contribs = await api('GET', '/api/contributions/pending');
    const badge = document.getElementById('badge-contributions');
    if (_contribs.length) { badge.textContent = _contribs.length; badge.classList.add('show'); }
    else badge.classList.remove('show');
    _contribPage = 1;
    renderContribs();
  } catch (e) { setError('contrib-list', e.message); }
}

function getFilteredContribs() {
  const type   = document.getElementById('contrib-filter-type').value;
  const search = document.getElementById('contrib-search').value.toLowerCase();
  const sort   = document.getElementById('contrib-sort').value;
  let arr = _contribs.filter(c =>
    (type === 'all' || c.type === type) &&
    (search === '' ||
      c.user?.username?.toLowerCase().includes(search) ||
      c.user?.email?.toLowerCase().includes(search) ||
      c.title?.toLowerCase().includes(search))
  );
  if (sort === 'newest')   arr.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  if (sort === 'oldest')   arr.sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt));
  if (sort === 'username') arr.sort((a,b) => (a.user?.username||'').localeCompare(b.user?.username||''));
  return arr;
}

function renderContribs() {
  const filtered = getFilteredContribs();
  const page = paginate(filtered, _contribPage, PER_PAGE);
  if (!filtered.length) { setEmpty('contrib-list', 'Заявок не знайдено'); renderPagination('contrib-pagination',1,0,()=>{}); return; }
  document.getElementById('contrib-list').innerHTML = `
    <table>
      <thead><tr><th>Користувач</th><th>Тип</th><th>Заголовок</th><th>Дата</th><th>Файл</th><th>Дії</th></tr></thead>
      <tbody>${page.map(c => `
        <tr>
          <td>${c.user ? `${c.user.username} <span class="secondary">(${c.user.email})</span>` : '—'}</td>
          <td>${typeTag(c.type)}</td>
          <td>${c.title}</td>
          <td class="secondary">${fmtDate(c.createdAt)}</td>
          <td><a class="proof-link" href="http://localhost:5000/${c.filePath}" target="_blank">👁 Переглянути</a></td>
          <td><div class="td-actions">
            <button class="btn-icon approve" title="Схвалити" data-id="${c._id}">✓</button>
            <button class="btn-icon reject"  title="Відхилити" data-id="${c._id}" data-reject>✕</button>
          </div></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  renderPagination('contrib-pagination', _contribPage, Math.ceil(filtered.length/PER_PAGE), p => { _contribPage=p; renderContribs(); });
  // Bind action buttons
  document.querySelectorAll('#contrib-list .btn-icon.approve').forEach(btn =>
    btn.addEventListener('click', () => approveContrib(btn.dataset.id)));
  document.querySelectorAll('#contrib-list .btn-icon.reject').forEach(btn =>
    btn.addEventListener('click', () => rejectContrib(btn.dataset.id)));
}

async function approveContrib(id) {
  const pts = await promptModal('Схвалити заявку', 'Скільки балів нарахувати?', '100');
  if (pts === null) return;
  try {
    await api('PUT', `/api/contributions/approve/${id}`, { points: parseInt(pts)||100 });
    _contribs = _contribs.filter(c => c._id !== id);
    renderContribs();
  } catch(e) { alert('Помилка: ' + e.message); }
}

async function rejectContrib(id) {
  const comment = await promptModal('Відхилити заявку', 'Причина відхилення:');
  if (comment === null || comment.trim() === '') { alert("Причина є обов'язковою"); return; }
  try {
    await api('PUT', `/api/contributions/reject/${id}`, { comment });
    _contribs = _contribs.filter(c => c._id !== id);
    renderContribs();
  } catch(e) { alert('Помилка: ' + e.message); }
}

// Filters re-render
['contrib-filter-type','contrib-sort'].forEach(id =>
  document.getElementById(id).addEventListener('change', () => { _contribPage=1; renderContribs(); }));
document.getElementById('contrib-search').addEventListener('input', () => { _contribPage=1; renderContribs(); });
