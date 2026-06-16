// ── Formatters ───────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uk-UA') : '—';
const stars   = (n) => '■'.repeat(n) + '□'.repeat(5 - n);

function typeTag(type) {
  const map = { donation:'DONATION', volunteering:'VOLUNTEERING', aid:'HUMANITARIAN AID', other:'OTHER' };
  const cls = { donation:'tag-blue', volunteering:'tag-green', aid:'tag-yellow', other:'tag-gray' };
  return `<span class="tag ${cls[type]||'tag-gray'}">${map[type]||type}</span>`;
}
function statusTag(s) {
  const map = { open:'OPEN', closed:'CLOSED', reported:'REPORTED', in_progress:'IN PROGRESS', completed:'COMPLETED', pending:'PENDING', approved:'APPROVED', rejected:'REJECTED' };
  const cls = { open:'tag-green', closed:'tag-gray', reported:'tag-green', in_progress:'tag-blue', completed:'tag-green', pending:'tag-yellow', approved:'tag-green', rejected:'tag-red' };
  return `<span class="tag ${cls[s]||'tag-gray'}">${map[s]||s}</span>`;
}
function roleTag(r) {
  return r === 'admin'
    ? '<span class="tag tag-blue">ADMIN</span>'
    : '<span class="tag tag-gray">USER</span>';
}

// ── Pagination ───────────────────────────────────────────
function renderPagination(containerId, current, total, onPage) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (total <= 1) { el.innerHTML = ''; return; }
  el.innerHTML = Array.from({ length: total }, (_, i) => i + 1)
    .map(p => `<button class="page-btn${p===current?' active':''}" data-p="${p}">${p}</button>`)
    .join('');
  el.querySelectorAll('.page-btn').forEach(btn =>
    btn.addEventListener('click', () => onPage(+btn.dataset.p))
  );
}

// ── Loading / empty states ────────────────────────────────
function setLoading(id)  { document.getElementById(id).innerHTML = '<div class="loading-state">LOADING...</div>'; }
function setEmpty(id, t) { document.getElementById(id).innerHTML = `<div class="empty-state">${t.toUpperCase()}</div>`; }
function setError(id, m) { document.getElementById(id).innerHTML = `<div class="empty-state">SYSTEM ERROR: ${m.toUpperCase()}</div>`; }

// ── Form message ─────────────────────────────────────────
function showMsg(elId, msg, type = 'success') {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg.toUpperCase();
  el.className = `form-message ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

// ── Modal ────────────────────────────────────────────────
let _modalResolve = null;

function openModal(title, bodyHTML, buttons = []) {
  document.getElementById('modal-title').textContent = title.toUpperCase();
  document.getElementById('modal-body').innerHTML = bodyHTML;
  const footer = document.getElementById('modal-footer');
  footer.innerHTML = '';
  return new Promise(res => {
    _modalResolve = res;
    buttons.forEach(({ label, cls, value }) => {
      const btn = document.createElement('button');
      btn.className = `btn ${cls}`;
      btn.textContent = label.toUpperCase();
      btn.onclick = () => {
        const val = typeof value === 'function' ? value() : value;
        document.getElementById('modal-overlay').classList.add('hidden');
        if (_modalResolve) { _modalResolve(val); _modalResolve = null; }
      };
      footer.appendChild(btn);
    });
    document.getElementById('modal-overlay').classList.remove('hidden');
  });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  if (_modalResolve) { _modalResolve(null); _modalResolve = null; }
}

async function promptModal(title, label, defaultVal = '') {
  const id = 'modal-input-' + Date.now();
  const val = await openModal(title,
    `<div class="form-group"><label class="form-label">${label.toUpperCase()}</label><input id="${id}" class="form-input" value="${defaultVal}" /></div>`,
    [
      { label: 'CANCEL', cls: 'btn-secondary', value: null },
      { label: 'OK', cls: 'btn-primary', value: () => document.getElementById(id)?.value ?? null }
    ]
  );
  return val;
}

async function confirmModal(title, bodyHTML) {
  const val = await openModal(title, bodyHTML, [
    { label: 'Скасувати', cls: 'btn-secondary', value: false },
    { label: 'Підтвердити', cls: 'btn-primary', value: true }
  ]);
  return !!val;
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// ── Sorting / filtering helpers ──────────────────────────
function filterAndSort(arr, filterFn, sortFn) {
  return arr.filter(filterFn).sort(sortFn);
}
function paginate(arr, page, perPage = 10) {
  return arr.slice((page - 1) * perPage, page * perPage);
}
