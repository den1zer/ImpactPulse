// ── Feedback Tab ──────────────────────────────────────────
let _feedback = [], _feedbackPage = 1;

async function loadFeedback() {
  setLoading('feedback-list');
  document.getElementById('feedback-pagination').innerHTML = '';
  try {
    _feedback = await api('GET', '/api/support/feedback');
    _feedbackPage = 1;
    renderFeedback();
  } catch(e) { setError('feedback-list', e.message); }
}

function getFilteredFeedback() {
  const rating = document.getElementById('feedback-filter-rating').value;
  const search = document.getElementById('feedback-search').value.toLowerCase();
  const sort   = document.getElementById('feedback-sort').value;
  let arr = _feedback.filter(f =>
    (rating === 'all' || f.rating.toString() === rating) &&
    (search === '' ||
      (f.user?.username||'').toLowerCase().includes(search) ||
      (f.comment||'').toLowerCase().includes(search))
  );
  if (sort === 'newest')      arr.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  if (sort === 'oldest')      arr.sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt));
  if (sort === 'rating-high') arr.sort((a,b) => b.rating-a.rating);
  if (sort === 'rating-low')  arr.sort((a,b) => a.rating-b.rating);
  return arr;
}

function renderFeedback() {
  const filtered = getFilteredFeedback();
  const page = paginate(filtered, _feedbackPage);
  if (!filtered.length) { setEmpty('feedback-list', 'Відгуків не знайдено'); renderPagination('feedback-pagination',1,0,()=>{}); return; }
  document.getElementById('feedback-list').innerHTML = `
    <table>
      <thead><tr><th>Користувач</th><th>Рейтинг</th><th>Коментар</th><th>Дата</th></tr></thead>
      <tbody>${page.map(f => `
        <tr>
          <td>${f.user?.username || 'Анонім'}</td>
          <td><span class="stars">${stars(f.rating)}</span></td>
          <td>${f.comment || '—'}</td>
          <td class="secondary">${fmtDate(f.createdAt)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  renderPagination('feedback-pagination', _feedbackPage, Math.ceil(filtered.length/10), p => { _feedbackPage=p; renderFeedback(); });
}

['feedback-filter-rating','feedback-sort'].forEach(id =>
  document.getElementById(id).addEventListener('change', () => { _feedbackPage=1; renderFeedback(); }));
document.getElementById('feedback-search').addEventListener('input', () => { _feedbackPage=1; renderFeedback(); });
