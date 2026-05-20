// ── Statistics Tab ────────────────────────────────────────
async function loadStatistics() {
  const el = document.getElementById('stats-content');
  el.innerHTML = '<div class="loading-state">LOADING STATISTICS...</div>';
  try {
    const [s, fundraisers, tasks, pendingContribs] = await Promise.all([
      api('GET', '/api/users/stats'),
      api('GET', '/api/fundraisers/admin/all').catch(() => []),
      api('GET', '/api/tasks/admin/all').catch(() => []),
      api('GET', '/api/contributions/pending').catch(() => [])
    ]);

    const totalFundraisers = fundraisers.length;
    const totalRaised = fundraisers.reduce((sum, f) => sum + (f.collectedAmount || 0), 0);
    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived').length;
    const pendingContribCount = pendingContribs.length;

    el.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>GENERAL STATISTICS</h3>
          <div class="stat-row"><span class="stat-key">Користувачів</span><span class="stat-val accent">${s.totalUsers}</span></div>
          <div class="stat-row"><span class="stat-key">Адмінів</span><span class="stat-val">${s.totalAdmins}</span></div>
          <div class="stat-row"><span class="stat-key">Середні бали</span><span class="stat-val green">${s.averagePoints}</span></div>
        </div>
        <div class="stat-card">
          <h3>PLATFORM</h3>
          <div class="stat-row"><span class="stat-key">Створено зборів</span><span class="stat-val">${totalFundraisers}</span></div>
          <div class="stat-row"><span class="stat-key">Зібрано коштів</span><span class="stat-val green">${totalRaised.toLocaleString()} ₴</span></div>
          <div class="stat-row"><span class="stat-key">Активні завдання</span><span class="stat-val accent">${activeTasks}</span></div>
          <div class="stat-row"><span class="stat-key">Заявки на модерацію</span><span class="stat-val">${pendingContribCount}</span></div>
        </div>
        <div class="stat-card">
          <h3>TOP CONTRIBUTORS</h3>
          ${s.topContributors.map((u,i) => `
            <div class="stat-row">
              <span class="stat-key">${i+1}. ${u.username}</span>
              <span class="stat-val green">${u.points} балів</span>
            </div>`).join('')}
        </div>
        <div class="stat-card">
          <h3>TOTAL CONTRIBUTIONS</h3>
          <div class="stat-row"><span class="stat-key">Донати</span><span class="stat-val">${s.totalDonations}</span></div>
          <div class="stat-row"><span class="stat-key">Волонтерство</span><span class="stat-val">${s.totalVolunteering}</span></div>
          <div class="stat-row"><span class="stat-key">Допомога</span><span class="stat-val">${s.totalAid}</span></div>
          <div class="stat-row"><span class="stat-key">Геолокації</span><span class="stat-val">${s.totalGeo}</span></div>
        </div>
        <div class="stat-card">
          <h3>ACHIEVEMENTS</h3>
          <div class="stat-row"><span class="stat-key">High Rollers</span><span class="stat-val accent">${s.highRollers}</span></div>
          <div class="stat-row"><span class="stat-key">Повні профілі</span><span class="stat-val green">${s.profileCompletes}</span></div>
        </div>
        <div class="stat-card">
          <h3>RECENT REGISTRATIONS</h3>
          ${s.recentRegistrations.map(u => `
            <div class="stat-row">
              <span class="stat-key">${u.username}</span>
              <span class="stat-val secondary" style="font-size:12px;font-weight:400">${fmtDate(u.createdAt)}</span>
            </div>`).join('')}
        </div>
      </div>`;
  } catch(e) {
    el.innerHTML = `<div class="empty-state">SYSTEM ERROR: ${e.message}</div>`;
  }
}
