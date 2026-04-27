// ── Tab config ────────────────────────────────────────────
const TABS = {
  'contributions':       { title: 'Заявки на перевірку',      sub: 'Розгляньте та схваліть або відхиліть внески',      load: loadContributions },
  'users':               { title: 'Управління користувачами', sub: 'Переглядайте та змінюйте ролі користувачів',        load: loadUsers },
  'tickets':             { title: 'Тікети підтримки',         sub: 'Запитання від користувачів',                        load: loadTickets },
  'feedback':            { title: 'Відгуки',                  sub: 'Оцінки та коментарі користувачів',                  load: loadFeedback },
  'statistics':          { title: 'Статистика',               sub: 'Загальна аналітика платформи',                      load: loadStatistics },
  'manage-tasks':        { title: 'Керування завданнями',     sub: 'Редагуйте та видаляйте завдання',                   load: loadManageTasks },
  'manage-fundraisers':  { title: 'Керування зборами',        sub: 'Редагуйте та видаляйте збори коштів',              load: loadManageFundraisers },
  'create-fundraiser':   { title: 'Новий збір коштів',        sub: 'Створіть новий благодійний збір',                   load: null },
  'create-task':         { title: 'Нове завдання',            sub: 'Створіть нове завдання для волонтерів',             load: null },
};

let _activeTab = 'contributions';

function switchTab(tab) {
  if (!TABS[tab]) return;
  _activeTab = tab;

  // Sidebar active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });

  // Show correct section
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.toggle('active', el.id === `tab-${tab}`);
  });

  // Update header
  const cfg = TABS[tab];
  document.getElementById('page-title').textContent = cfg.title;
  document.getElementById('page-sub').textContent   = cfg.sub;

  // Load data
  if (cfg.load) cfg.load();
}

function loadCurrentTab() {
  switchTab(_activeTab);
}

// ── Sidebar nav ───────────────────────────────────────────
document.querySelectorAll('.nav-item[data-tab]').forEach(btn =>
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
);

// ── Refresh button ────────────────────────────────────────
document.getElementById('refresh-btn').addEventListener('click', () => {
  const cfg = TABS[_activeTab];
  if (cfg?.load) cfg.load();
});

// ── Initial default tab ───────────────────────────────────
// Tabs are switched after login in login.js via loadCurrentTab()

// ── Theme toggle ──────────────────────────────────────────
const themeBtn = document.getElementById('theme-btn');
const rootEl = document.documentElement;

// Load saved theme
if (localStorage.getItem('theme') === 'light') {
  rootEl.classList.add('theme-light');
  if (themeBtn) themeBtn.textContent = '☀️';
}

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    rootEl.classList.toggle('theme-light');
    const isLight = rootEl.classList.contains('theme-light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeBtn.textContent = isLight ? '☀️' : '🌙';
  });
}
