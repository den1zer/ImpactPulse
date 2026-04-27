// ── Users Tab ─────────────────────────────────────────────
let _users = [], _usersPage = 1;

async function loadUsers() {
  setLoading('users-list');
  document.getElementById('users-pagination').innerHTML = '';
  try {
    _users = await api('GET', '/api/users');
    _usersPage = 1;
    renderUsers();
  } catch(e) { setError('users-list', e.message); }
}

function getFilteredUsers() {
  const role   = document.getElementById('users-filter-role').value;
  const search = document.getElementById('users-search').value.toLowerCase();
  const sort   = document.getElementById('users-sort').value;
  let arr = _users.filter(u =>
    (role === 'all' || u.role === role) &&
    (search === '' || u.username.toLowerCase().includes(search) || u.email.toLowerCase().includes(search))
  );
  if (sort === 'username') arr.sort((a,b) => a.username.localeCompare(b.username));
  if (sort === 'email')    arr.sort((a,b) => a.email.localeCompare(b.email));
  if (sort === 'role')     arr.sort((a,b) => a.role.localeCompare(b.role));
  return arr;
}

function renderUsers() {
  const filtered = getFilteredUsers();
  const page = paginate(filtered, _usersPage);
  if (!filtered.length) { setEmpty('users-list', 'Користувачів не знайдено'); renderPagination('users-pagination',1,0,()=>{}); return; }
  document.getElementById('users-list').innerHTML = `
    <table>
      <thead><tr><th>Username</th><th>Email</th><th>Роль</th><th>Бали</th><th>Дата реєстрації</th><th>Дії</th></tr></thead>
      <tbody>${page.map(u => `
        <tr>
          <td>${u.username}${u.selectedBadge?.icon ? ' '+u.selectedBadge.icon : ''}</td>
          <td class="secondary">${u.email}</td>
          <td>${roleTag(u.role)}</td>
          <td>${u.points ?? 0}</td>
          <td class="secondary">${fmtDate(u.createdAt)}</td>
          <td><div class="td-actions">
            ${u.role === 'user'
              ? `<button class="btn-icon approve" title="Зробити Адміном" data-id="${u._id}" data-newrole="admin">🛡</button>`
              : `<button class="btn-icon reject"  title="Зробити Юзером"  data-id="${u._id}" data-newrole="user">👤</button>`}
          </div></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  renderPagination('users-pagination', _usersPage, Math.ceil(filtered.length/10), p => { _usersPage=p; renderUsers(); });
  document.querySelectorAll('#users-list [data-newrole]').forEach(btn =>
    btn.addEventListener('click', () => changeRole(btn.dataset.id, btn.dataset.newrole)));
}

async function changeRole(id, newRole) {
  const label = newRole === 'admin' ? 'адміністратора' : 'звичайного користувача';
  const confirmed = await openModal(
    'Змінити роль',
    `<p>Призначити користувача як <strong>${label}</strong>?</p>`,
    [
      { label: 'Скасувати', cls: 'btn-secondary', resolve: () => {} },
      { label: 'Підтвердити', cls: 'btn-primary',  resolve: () => {} }
    ]
  );
  try {
    await api('PUT', `/api/users/role/${id}`, { role: newRole });
    _users = _users.map(u => u._id === id ? {...u, role: newRole} : u);
    renderUsers();
  } catch(e) { alert('Помилка: ' + e.message); }
}

['users-filter-role','users-sort'].forEach(id =>
  document.getElementById(id).addEventListener('change', () => { _usersPage=1; renderUsers(); }));
document.getElementById('users-search').addEventListener('input', () => { _usersPage=1; renderUsers(); });
