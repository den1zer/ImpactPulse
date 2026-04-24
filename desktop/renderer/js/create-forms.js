// ── Create Fundraiser Form ────────────────────────────────
document.getElementById('create-fundraiser-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  const body = {
    title: document.getElementById('cf-title').value,
    description: document.getElementById('cf-description').value,
    goalAmount: document.getElementById('cf-goal').value,
    cardName: document.getElementById('cf-card-name').value,
    cardNumber: document.getElementById('cf-card-number').value
  };
  try {
    await api('POST', '/api/fundraisers', body);
    showMsg('cf-message', '✅ Збір успішно створено!', 'success');
    e.target.reset();
  } catch (err) {
    showMsg('cf-message', '❌ ' + err.message, 'error');
  } finally { btn.disabled = false; }
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
