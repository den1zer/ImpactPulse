// ── Manage Fundraisers Tab ────────────────────────────────
let _fundraisers = [], _editingFundraiser = null, _fundraisersPage = 1;
const FUNDRAISERS_PER_PAGE = 10;

async function loadManageFundraisers() {
  setLoading('manage-fundraisers-content');
  try {
    _fundraisers = await api('GET', '/api/fundraisers/admin/all');
    _editingFundraiser = null;
    _fundraisersPage = 1;
    renderManageFundraisers();
  } catch(e) { setError('manage-fundraisers-content', e.message); }
}

function renderManageFundraisers() {
  if (!_fundraisers.length) { setEmpty('manage-fundraisers-content', 'Зборів не знайдено'); renderPagination('manage-fundraisers-pagination',1,0,()=>{}); return; }

  const page = paginate(_fundraisers, _fundraisersPage, FUNDRAISERS_PER_PAGE);

  document.getElementById('manage-fundraisers-content').innerHTML = `
    <table>
      <thead><tr><th>Назва</th><th>Ціль (₴)</th><th>Зібрано (₴)</th><th>Статус</th><th>Автор</th><th>Дата</th><th>Дії</th></tr></thead>
      <tbody>${page.map(f => {
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
            <option value="reported" ${f.status==='reported'?'selected':''}>Звітовано</option>
          </select>` : fundraiserStatusTag(f.status)}</td>
          <td class="secondary">${f.createdBy?.username || '—'}</td>
          <td class="secondary">${fmtDate(f.createdAt)}</td>
          <td><div class="td-actions">
            ${isEdit
              ? `<button class="btn-icon save"   data-fsave="${f._id}">SAVE</button>
                 <button class="btn-icon cancel" data-fcancel>CANC</button>`
              : `${f.status === 'closed'
                  ? `<button class="btn-icon save" data-freport="${f._id}" title="Додати звіт">REPORT</button>`
                  : f.status === 'reported'
                    ? `<button class="btn-icon" data-fviewreport="${f._id}" title="Переглянути звіт">VIEW</button>`
                    : `<button class="btn-icon edit" data-fedit="${f._id}">EDIT</button>`}
                 <button class="btn-icon reject" data-fdel="${f._id}">DEL</button>`}
          </div></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>`;

  renderPagination('manage-fundraisers-pagination', _fundraisersPage, Math.ceil(_fundraisers.length/FUNDRAISERS_PER_PAGE), p => { _fundraisersPage=p; renderManageFundraisers(); });

  document.querySelectorAll('[data-fedit]').forEach(btn =>
    btn.addEventListener('click', () => { _editingFundraiser = btn.dataset.fedit; renderManageFundraisers(); }));
  document.querySelectorAll('[data-fcancel]').forEach(btn =>
    btn.addEventListener('click', () => { _editingFundraiser = null; renderManageFundraisers(); }));
  document.querySelectorAll('[data-fsave]').forEach(btn =>
    btn.addEventListener('click', () => saveFundraiser(btn.dataset.fsave)));
  document.querySelectorAll('[data-fdel]').forEach(btn =>
    btn.addEventListener('click', () => deleteFundraiser(btn.dataset.fdel)));
  document.querySelectorAll('[data-freport]').forEach(btn =>
    btn.addEventListener('click', () => openReportModal(btn.dataset.freport)));
  document.querySelectorAll('[data-fviewreport]').forEach(btn =>
    btn.addEventListener('click', () => viewReport(btn.dataset.fviewreport)));
}

function fundraiserStatusTag(s) {
  if (s === 'reported') return '<span class="tag tag-green">ЗВІТОВАНО</span>';
  return statusTag(s);
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
  const ok = await confirmModal('Видалити збір?',
    '<p>Цю дію неможливо скасувати.</p>');
  if (!ok) return;
  try {
    await api('DELETE', `/api/fundraisers/${id}/admin`);
    await loadManageFundraisers();
  } catch(e) { alert('Помилка: ' + e.message); }
}

// ── Report Modal ──────────────────────────────────────────
let _reportFiles = [];

async function openReportModal(fundraiserId) {
  _reportFiles = [];
  const f = _fundraisers.find(x => x._id === fundraiserId);
  if (!f) return;

  const modalBody = `
    <div style="margin-bottom:12px">
      <p style="font-size:0.72rem;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.06em;opacity:0.5;margin:0 0 4px">Збір</p>
      <p style="font-weight:700;margin:0">${f.title}</p>
      <p style="font-size:0.75rem;opacity:0.6;margin:4px 0 0">Зібрано: ${f.collectedAmount.toLocaleString()} / ${f.goalAmount.toLocaleString()} ₴</p>
    </div>
    <div class="form-group">
      <label class="form-label">ОПИС ЗВІТУ *</label>
      <textarea id="report-desc" class="form-input" rows="5" placeholder="Опишіть, на що витрачені кошти..."
        style="resize:vertical;min-height:100px;font-family:inherit"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">ФОТО (ДО 5)</label>
      <button class="btn btn-secondary" id="report-pick-files" style="margin-bottom:8px">ВИБРАТИ ФОТО</button>
      <div id="report-files-preview" style="display:flex;gap:6px;flex-wrap:wrap;font-size:0.7rem;font-family:var(--font-mono);opacity:0.6"></div>
    </div>
  `;

  // Render the modal manually so we can attach event listeners before awaiting
  document.getElementById('modal-title').textContent = 'ДОДАТИ ЗВІТ ПО ЗБОРУ';
  document.getElementById('modal-body').innerHTML = modalBody;
  const footer = document.getElementById('modal-footer');
  footer.innerHTML = '';

  const result = await new Promise(resolve => {
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'СКАСУВАТИ';
    cancelBtn.onclick = () => {
      document.getElementById('modal-overlay').classList.add('hidden');
      resolve(null);
    };
    footer.appendChild(cancelBtn);

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'ОПУБЛІКУВАТИ ЗВІТ';
    submitBtn.onclick = () => {
      const desc = document.getElementById('report-desc')?.value;
      document.getElementById('modal-overlay').classList.add('hidden');
      resolve({ description: desc, files: _reportFiles });
    };
    footer.appendChild(submitBtn);

    // Show modal
    document.getElementById('modal-overlay').classList.remove('hidden');

    // Attach file picker listener
    const pickBtn = document.getElementById('report-pick-files');
    if (pickBtn) {
      pickBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = await window.electron.openFilesDialog();
        if (files && files.length > 0) {
          _reportFiles = files.slice(0, 5);
          const preview = document.getElementById('report-files-preview');
          if (preview) {
            preview.innerHTML = _reportFiles.map(fp => {
              const name = fp.split(/[/\\]/).pop();
              return `<span style="padding:4px 8px;border:1px solid var(--border);background:var(--bg)">${name}</span>`;
            }).join('');
          }
        }
      });
    }
  });

  if (!result || !result.description?.trim()) return;

  try {
    await apiMultipartFiles(
      'PUT',
      `/api/fundraisers/${fundraiserId}/report`,
      { reportDescription: result.description },
      result.files,
      'reportImages'
    );
    await loadManageFundraisers();
  } catch(e) {
    alert('Помилка: ' + e.message);
  }
}

async function viewReport(fundraiserId) {
  const f = _fundraisers.find(x => x._id === fundraiserId);
  if (!f || !f.report) return;

  const images = (f.report.images || []).map(img =>
    `<a href="${img}" target="_blank" style="display:inline-block;margin:4px">
      <img src="${img}" style="width:80px;height:80px;object-fit:cover;border:1px solid var(--border)" />
    </a>`
  ).join('');

  await openModal('Звіт по збору: ' + f.title,
    `<div style="margin-bottom:12px">
      <p style="font-size:0.72rem;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.06em;opacity:0.5;margin:0 0 4px">Опис</p>
      <p style="line-height:1.6;margin:0;white-space:pre-line">${f.report.description}</p>
    </div>
    ${images ? `<div style="margin-bottom:12px">
      <p style="font-size:0.72rem;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.06em;opacity:0.5;margin:0 0 8px">Фото</p>
      ${images}
    </div>` : ''}
    <p style="font-size:0.65rem;font-family:var(--font-mono);opacity:0.4;text-transform:uppercase;margin:0">
      Дата звіту: ${fmtDate(f.report.reportedAt)}
    </p>`,
    [{ label: 'Закрити', cls: 'btn-secondary', value: true }]
  );
}
