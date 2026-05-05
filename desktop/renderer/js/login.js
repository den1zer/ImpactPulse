// ── Login screen ─────────────────────────────────────────
let _serverReady = false;

function showSplash(msg) {
  document.getElementById('splash-status').textContent = msg;
}
function hideSplash() {
  const s = document.getElementById('splash');
  s.classList.add('fade-out');
  setTimeout(() => s.classList.add('hidden'), 520);
}
function showLogin() {
  hideSplash();
  document.getElementById('login-screen').classList.remove('hidden');
}
function showApp(email) {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  const u = email || localStorage.getItem('adminEmail') || 'Admin';
  document.getElementById('sidebar-username').textContent = u;
  document.getElementById('sidebar-avatar').textContent = u[0].toUpperCase();
}
function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideLoginError() {
  document.getElementById('login-error').classList.add('hidden');
}

// ── Called once the server is known to be reachable ────────
function onServerReadyHandler() {
  if (_serverReady) return;   // guard against double-call
  _serverReady = true;
  showSplash('Сервер готовий!');
  setTimeout(() => {
    if (getToken()) { hideSplash(); showApp(); loadCurrentTab(); }
    else showLogin();
  }, 600);
}

// Login action
async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  hideLoginError();
  if (!email || !password) { showLoginError('Введіть email та пароль'); return; }
  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.textContent = 'Входимо...';
  try {
    const data = await api('POST', '/api/auth/login', { email, password });
    if (data.role !== 'admin') { showLoginError('Доступ тільки для адміністраторів'); return; }
    setToken(data.token);
    localStorage.setItem('adminEmail', email);
    showApp(email);
    loadCurrentTab();
  } catch (err) {
    showLoginError(err.message || 'Помилка входу');
  } finally {
    btn.disabled = false; btn.textContent = 'Увійти';
  }
}

// Bind login form
document.getElementById('login-btn').addEventListener('click', doLogin);
document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});
document.getElementById('eye-btn').addEventListener('click', () => {
  const inp = document.getElementById('login-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  clearAuth();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
});

// Server events from main process
// NOTE: there is a race condition — 'server-ready' may fire from main before
// this script registers the listener (IPC events are NOT buffered/replayed).
// We register the listener first, then set a safety fallback timeout so the
// splash never blocks the UI indefinitely.
window.electron.onServerReady(onServerReadyHandler);
window.electron.onServerError((msg) => {
  showSplash('❌ Помилка сервера: ' + msg);
});

// Safety fallback: if server-ready was never received within 2 s
// (e.g. event already fired before this script loaded), proceed anyway.
setTimeout(() => {
  if (!_serverReady) {
    console.warn('[login.js] server-ready not received – proceeding anyway');
    onServerReadyHandler();
  }
}, 2000);
