// ── Manage Tasks Tab ──────────────────────────────────────
let _tasks = [], _editingTask = null, _tasksPage = 1;
const TASKS_PER_PAGE = 10;

async function loadManageTasks() {
  setLoading('manage-tasks-content');
  try {
    _tasks = await api('GET', '/api/tasks/admin/all');
    _editingTask = null;
    _tasksPage = 1;
    renderManageTasks();
  } catch(e) { setError('manage-tasks-content', e.message); }
}

function renderManageTasks() {
  if (!_tasks.length) { setEmpty('manage-tasks-content', 'Завдань не знайдено'); renderPagination('manage-tasks-pagination',1,0,()=>{}); return; }
  
  const page = paginate(_tasks, _tasksPage, TASKS_PER_PAGE);
  
  document.getElementById('manage-tasks-content').innerHTML = `
    <table>
      <thead><tr><th>Назва</th><th>Категорія</th><th>Статус</th><th>Бали</th><th>Дата</th><th>Дії</th></tr></thead>
      <tbody>${page.map(t => {
        const isEdit = _editingTask === t._id;
        return `<tr>
          <td>${isEdit ? `<input class="edit-input" id="et-title" value="${t.title}">` : t.title}</td>
          <td>${isEdit ? `<select class="edit-select" id="et-cat">
            <option value="volunteering" ${t.category==='volunteering'?'selected':''}>Волонтерство</option>
            <option value="aid"          ${t.category==='aid'?'selected':''}>Допомога</option>
            <option value="other"        ${t.category==='other'?'selected':''}>Інше</option>
          </select>` : typeTag(t.category)}</td>
          <td>${isEdit ? `<select class="edit-select" id="et-status">
            <option value="open"        ${t.status==='open'?'selected':''}>Відкрите</option>
            <option value="in_progress" ${t.status==='in_progress'?'selected':''}>В роботі</option>
            <option value="completed"   ${t.status==='completed'?'selected':''}>Завершено</option>
          </select>` : statusTag(t.status)}</td>
          <td>${isEdit ? `<input class="edit-input" id="et-pts" type="number" value="${t.points}" style="width:70px">` : t.points}</td>
          <td class="secondary">${fmtDate(t.createdAt)}</td>
          <td><div class="td-actions">
            ${isEdit
              ? `<button class="btn-icon save"   data-save="${t._id}">SAVE</button>
                 <button class="btn-icon cancel" data-cancel>CANC</button>`
              : `<button class="btn-icon edit"   data-edit="${t._id}">EDIT</button>
                 <button class="btn-icon reject" data-del="${t._id}">DEL</button>`}
          </div></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>`;

  renderPagination('manage-tasks-pagination', _tasksPage, Math.ceil(_tasks.length/TASKS_PER_PAGE), p => { _tasksPage=p; renderManageTasks(); });

  document.querySelectorAll('[data-edit]').forEach(btn =>
    btn.addEventListener('click', () => { _editingTask = btn.dataset.edit; renderManageTasks(); }));
  document.querySelectorAll('[data-cancel]').forEach(btn =>
    btn.addEventListener('click', () => { _editingTask = null; renderManageTasks(); }));
  document.querySelectorAll('[data-save]').forEach(btn =>
    btn.addEventListener('click', () => saveTask(btn.dataset.save)));
  document.querySelectorAll('[data-del]').forEach(btn =>
    btn.addEventListener('click', () => deleteTask(btn.dataset.del)));
}

async function saveTask(id) {
  const body = {
    title:    document.getElementById('et-title')?.value,
    category: document.getElementById('et-cat')?.value,
    status:   document.getElementById('et-status')?.value,
    points:   document.getElementById('et-pts')?.value
  };
  try {
    await api('PUT', `/api/tasks/${id}/admin`, body);
    _editingTask = null;
    await loadManageTasks();
  } catch(e) { alert('Помилка: ' + e.message); }
}

async function deleteTask(id) {
  const ok = await confirmModal('Видалити завдання?',
    '<p>Цю дію неможливо скасувати.</p>');
  if (!ok) return;
  try {
    await api('DELETE', `/api/tasks/${id}/admin`);
    await loadManageTasks();
  } catch(e) { alert('Помилка: ' + e.message); }
}
