// ── Manage Fundraisers Tab ────────────────────────────────
let _fundraisers = [], _editingFundraiser = null;

async function loadManageFundraisers() {
  setLoading('manage-fundraisers-content');
  try {
    _fundraisers = await api('GET', '/api/fundraisers/admin/all');
    _editingFundraiser = null;
    renderManageFundraisers();
  } catch(e) { setError('manage-fundraisers-content', e.message); }
}

function renderManageFundraisers() {
  if (!_fundraisers.length) { setEmpty('manage-fundraisers-content', 'Зборів не знайдено'); return; }
  document.getElementById('manage-fundraisers-content').innerHTML = `
    <table>
      <thead><tr><th>Назва</th><th>Ціль (₴)</th><th>Зібрано (₴)</th><th>Статус</th><th>Автор</th><th>Дата</th><th>Дії</th></tr></thead>
      <tbody>${_fundraisers.map(f => {
        const isEdit = _editingFundraiser === f._id;
        const pct = f.goalAmount ? Math.min(100, Math.round(f.collectedAmount/f.goalAmount*100)) : 0;
        return `<tr>
          <td>${isEdit ? `<input class="edit-input" id="ef-title" value="${f.title}">` : f.title}</td>
          <td>${isEdit ? `<input class="edit-input" id="ef-goal"  type="number" value="${f.goalAmount}" style="width:90px">` : f.goalAmount.toLocaleString()}</td>
          <td>
            ${f.collectedAmount.toLocaleString()}
            <div style="margin-top:4px;height:3px;background:var(--border);border-radius:2px;width:80px">
              <div style="height:100%;width:${pct}%;background:var(--green);border-radius:2px"></div>
            </div>
          </td>
          <td>${isEdit ? `<select class="edit-select" id="ef-status">
            <option value="open"   ${f.status==='open'?'selected':''}>Відкритий</option>
            <option value="closed" ${f.status==='closed'?'selected':''}>Закритий</option>
          </select>` : statusTag(f.status)}</td>
          <td class="secondary">${f.createdBy?.username || '—'}</td>
          <td class="secondary">${fmtDate(f.createdAt)}</td>
          <td><div class="td-actions">
            ${isEdit
              ? `<button class="btn-icon save"   data-fsave="${f._id}">💾</button>
                 <button class="btn-icon cancel" data-fcancel>✕</button>`
              : `<button class="btn-icon edit"   data-fedit="${f._id}">✏️</button>
                 <button class="btn-icon reject" data-fdel="${f._id}">🗑</button>`}
          </div></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>`;

  document.querySelectorAll('[data-fedit]').forEach(btn =>
    btn.addEventListener('click', () => { _editingFundraiser = btn.dataset.fedit; renderManageFundraisers(); }));
  document.querySelectorAll('[data-fcancel]').forEach(btn =>
    btn.addEventListener('click', () => { _editingFundraiser = null; renderManageFundraisers(); }));
  document.querySelectorAll('[data-fsave]').forEach(btn =>
    btn.addEventListener('click', () => saveFundraiser(btn.dataset.fsave)));
  document.querySelectorAll('[data-fdel]').forEach(btn =>
    btn.addEventListener('click', () => deleteFundraiser(btn.dataset.fdel)));
}

async function saveFundraiser(id) {
  const body = {
    title:      document.getElementById('ef-title')?.value,
    goalAmount: document.getElementById('ef-goal')?.value,
    status:     document.getElementById('ef-status')?.value
  };
  try {
    await api('PUT', `/api/fundraisers/${id}/admin`, body);
    _editingFundraiser = null;
    await loadManageFundraisers();
  } catch(e) { alert('Помилка: ' + e.message); }
}

async function deleteFundraiser(id) {
  await openModal('Видалити збір?',
    '<p>Цю дію неможливо скасувати.</p>',
    [{ label:'Скасувати',cls:'btn-secondary',resolve:()=>{}},
     { label:'Видалити', cls:'btn-primary',  resolve:()=>{}}]);
  try {
    await api('DELETE', `/api/fundraisers/${id}/admin`);
    await loadManageFundraisers();
  } catch(e) { alert('Помилка: ' + e.message); }
}
