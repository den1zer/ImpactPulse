// ── Create Fundraiser Form ────────────────────────────────
document.getElementById('create-fundraiser-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;

  const bonuses = [];
  document.querySelectorAll('.bonus-row').forEach(row => {
    bonuses.push({
      minimumAmount: Number(row.querySelector('.b-min').value),
      promoCode: row.querySelector('.b-code').value,
      description: row.querySelector('.b-desc').value
    });
  });

  const body = {
    title: document.getElementById('cf-title').value,
    description: document.getElementById('cf-description').value,
    goalAmount: document.getElementById('cf-goal').value,
    cardName: document.getElementById('cf-card-name').value,
    cardNumber: document.getElementById('cf-card-number').value,
    bonuses
  };
  try {
    await api('POST', '/api/fundraisers', body);
    showMsg('cf-message', '✅ Збір успішно створено!', 'success');
    e.target.reset();
    document.getElementById('cf-bonuses-container').innerHTML = '';
  } catch (err) {
    showMsg('cf-message', '❌ ' + err.message, 'error');
  } finally { btn.disabled = false; }
});

document.getElementById('cf-add-bonus-btn')?.addEventListener('click', () => {
  const container = document.getElementById('cf-bonuses-container');
  const div = document.createElement('div');
  div.className = 'form-row bonus-row';
  div.style.marginBottom = '10px';
  div.style.alignItems = 'flex-end';
  div.innerHTML = `
    <div class="form-group" style="flex:1;"><label class="form-label">Мін. сума</label><input type="number" class="form-input b-min" placeholder="1000" min="1" required></div>
    <div class="form-group" style="flex:1;"><label class="form-label">Промокод</label><input type="text" class="form-input b-code" placeholder="SALE20" required></div>
    <div class="form-group" style="flex:2;"><label class="form-label">Опис</label><input type="text" class="form-input b-desc" placeholder="Знижка 20% на мерч" required></div>
    <button type="button" class="btn-icon reject" onclick="this.parentElement.remove()" style="margin-bottom:8px;">🗑</button>
  `;
  container.appendChild(div);
});

// ── Create Task Form ──────────────────────────────────────
let _ctFilePath = null;

// File picker via Electron dialog
document.getElementById('ct-file-zone').addEventListener('click', async (e) => {
  // Prevent double trigger when clicking hidden input
  if (e.target.id === 'ct-file') return;
  const p = await window.electron.openFileDialog();
  if (p) {
    _ctFilePath = p;
    document.getElementById('ct-file-label').textContent = '📎 ' + p.split('/').pop();
    document.getElementById('ct-file-zone').classList.add('has-file');
  }
});

// Also support native file input (fallback)
document.getElementById('ct-file').addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (f) {
    _ctFilePath = f.path || f.name;
    document.getElementById('ct-file-label').textContent = '📎 ' + f.name;
    document.getElementById('ct-file-zone').classList.add('has-file');
  }
});

document.getElementById('create-task-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  const fields = {
    title: document.getElementById('ct-title').value,
    description: document.getElementById('ct-description').value,
    category: document.getElementById('ct-category').value,
    points: document.getElementById('ct-points').value,
    endDate: document.getElementById('ct-end-date').value || undefined
  };
  try {
    // Tasks require multipart because of optional file, but we use
    // JSON POST when no file is selected for simplicity.
    // The server accepts both (file is optional).
    await api('POST', '/api/tasks', fields);
    showMsg('ct-message', '✅ Завдання успішно створено!', 'success');
    e.target.reset();
    _ctFilePath = null;
    document.getElementById('ct-file-label').textContent = '📁 Натисніть або перетягніть файл';
    document.getElementById('ct-file-zone').classList.remove('has-file');
  } catch (err) {
    showMsg('ct-message', '❌ ' + err.message, 'error');
  } finally { btn.disabled = false; }
});
