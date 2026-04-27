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
window.electron.onServerReady(() => {
  _serverReady = true;
  showSplash('Сервер готовий!');
  setTimeout(() => {
    // Auto-login if token exists
    if (getToken()) { hideSplash(); showApp(); loadCurrentTab(); }
    else showLogin();
  }, 600);
});
window.electron.onServerError((msg) => {
  showSplash('❌ Помилка сервера: ' + msg);
});
