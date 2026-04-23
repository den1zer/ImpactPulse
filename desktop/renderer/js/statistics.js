// ── Statistics Tab ────────────────────────────────────────
async function loadStatistics() {
  const el = document.getElementById('stats-content');
  el.innerHTML = '<div class="loading-state">⏳ Завантаження статистики...</div>';
  try {
    const s = await api('GET', '/api/users/stats');
    el.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>👥 Загальна статистика</h3>
          <div class="stat-row"><span class="stat-key">Користувачів</span><span class="stat-val accent">${s.totalUsers}</span></div>
          <div class="stat-row"><span class="stat-key">Адмінів</span><span class="stat-val">${s.totalAdmins}</span></div>
          <div class="stat-row"><span class="stat-key">Середні бали</span><span class="stat-val green">${s.averagePoints}</span></div>
        </div>
        <div class="stat-card">
          <h3>📊 Розподіл балів</h3>
          <div class="stat-row"><span class="stat-key">0–100</span><span class="stat-val">${s.pointsDistribution['0-100']}</span></div>
          <div class="stat-row"><span class="stat-key">101–500</span><span class="stat-val">${s.pointsDistribution['101-500']}</span></div>
          <div class="stat-row"><span class="stat-key">501–1000</span><span class="stat-val">${s.pointsDistribution['501-1000']}</span></div>
          <div class="stat-row"><span class="stat-key">1001+</span><span class="stat-val accent">${s.pointsDistribution['1001+']}</span></div>
        </div>
        <div class="stat-card">
          <h3>🏆 Топ контриб'юторів</h3>
          ${s.topContributors.map((u,i) => `
            <div class="stat-row">
              <span class="stat-key">${i+1}. ${u.username}</span>
              <span class="stat-val green">${u.points} балів</span>
            </div>`).join('')}
        </div>
        <div class="stat-card">
          <h3>💰 Загальні внески</h3>
          <div class="stat-row"><span class="stat-key">💸 Донати</span><span class="stat-val">${s.totalDonations}</span></div>
          <div class="stat-row"><span class="stat-key">🤝 Волонтерство</span><span class="stat-val">${s.totalVolunteering}</span></div>
          <div class="stat-row"><span class="stat-key">📦 Допомога</span><span class="stat-val">${s.totalAid}</span></div>
          <div class="stat-row"><span class="stat-key">📍 Геолокації</span><span class="stat-val">${s.totalGeo}</span></div>
        </div>
        <div class="stat-card">
          <h3>⭐ Досягнення</h3>
          <div class="stat-row"><span class="stat-key">High Rollers</span><span class="stat-val accent">${s.highRollers}</span></div>
          <div class="stat-row"><span class="stat-key">Повні профілі</span><span class="stat-val green">${s.profileCompletes}</span></div>
        </div>
        <div class="stat-card">
          <h3>🆕 Останні реєстрації</h3>
          ${s.recentRegistrations.map(u => `
            <div class="stat-row">
              <span class="stat-key">${u.username}</span>
              <span class="stat-val secondary" style="font-size:12px;font-weight:400">${fmtDate(u.createdAt)}</span>
            </div>`).join('')}
        </div>
      </div>`;
  } catch(e) {
    el.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⚠️</span>${e.message}</div>`;
  }
}
