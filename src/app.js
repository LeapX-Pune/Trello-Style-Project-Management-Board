let tasks = [
  { id: 1,  title: 'Write PRD document',              description: 'Draft the initial project requirement details',           assignee: 'Ankit Bhalke',   dueDate: '2026-07-10', priority: 'High',     column: 'In Progress' },
  { id: 2,  title: 'Design Landing Page UI',           description: 'Create basic layouts for home page',                     assignee: 'Khushi Shah',    dueDate: '2026-07-15', priority: 'Medium',   column: 'To Do' },
  { id: 3,  title: 'Implement Authentication',         description: 'Setup login/signup flows',                               assignee: 'Rehan Azim',     dueDate: '2026-07-20', priority: 'High',     column: 'To Do' },
  { id: 4,  title: 'New color palette & brand identity', description: 'Define the new brand color palette and identity guidelines', assignee: 'Khushi Shah', dueDate: '2026-07-09', priority: 'Critical', column: 'In Progress' },
  { id: 5,  title: 'Social media asset kit',           description: 'Create assets for social media campaign',                assignee: 'Sumit Tiwari',   dueDate: '2026-07-22', priority: 'Low',      column: 'Backlog' },
  { id: 6,  title: 'Email templates',                  description: 'Design responsive email templates',                      assignee: 'Rehan Azim',     dueDate: '2026-07-18', priority: 'Medium',   column: 'Review' },
  { id: 7,  title: 'Sprint 3 retrospective',           description: 'Document retrospective findings',                        assignee: 'Aditya Vawahal', dueDate: '2026-07-08', priority: 'Medium',   column: 'Done' },
  { id: 8,  title: 'Brand identity guidelines',        description: 'Compile brand guidelines document',                      assignee: 'Khushi Shah',    dueDate: '2026-07-16', priority: 'High',     column: 'Review' },
  { id: 9,  title: 'Logo variations',                  description: 'Create logo variations for different use cases',         assignee: 'Khushi Shah',    dueDate: '2026-07-09', priority: 'Critical', column: 'Done' },
  { id: 10, title: 'Design tokens',                    description: 'Define design token system',                             assignee: 'Sumit Tiwari',   dueDate: '2026-07-25', priority: 'Medium',   column: 'Backlog' }
];

let currentFilters = { searchQuery: '', priority: [], status: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'], assignee: [] };
let editingTaskId = null;
let currentView = 'kanban'; // 'kanban' | 'list'
let currentSort = 'none';   // sort key | 'timeline'

const app = document.getElementById('app');

function filterTasks(tasks, criteria) {
  const { searchQuery, priority, status, assignee } = criteria;
  return tasks.filter(task => {
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      if (!task.title.toLowerCase().includes(q) && !(task.description || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    if (priority && Array.isArray(priority) && priority.length > 0) {
      if (!priority.includes(task.priority)) return false;
    }
    if (status && Array.isArray(status) && status.length > 0) {
      if (!status.includes(task.column)) return false;
    }
    if (assignee && Array.isArray(assignee) && assignee.length > 0) {
      if (!assignee.includes(task.assignee)) return false;
    }
    return true;
  });
}

function getPriorityClass(p) { return { 'Critical': 'crit', 'High': 'high', 'Medium': 'med', 'Low': 'low' }[p] || 'med'; }
function getPriorityIcon(p) { return { 'Critical': 'fire', 'High': 'arrow-up', 'Medium': 'dash', 'Low': 'arrow-down' }[p] || 'dash'; }

const PRIORITY_ORDER = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

function sortTasks(arr) {
  if (currentSort === 'none') return arr;
  const copy = [...arr];
  switch (currentSort) {
    case 'dueDate-asc':
      return copy.sort((a, b) => (a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1);
    case 'dueDate-desc':
      return copy.sort((a, b) => (a.dueDate || '0000') > (b.dueDate || '0000') ? -1 : 1);
    case 'priority-desc':
      return copy.sort((a, b) => (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0));
    case 'priority-asc':
      return copy.sort((a, b) => (PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0));
    case 'title-asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return copy.sort((a, b) => b.title.localeCompare(a.title));
    default: return copy;
  }
}

function getDueInfo(dueDate) {
  if (!dueDate) return { cls: 'due--normal', icon: 'calendar3', text: 'No date', urgency: '' };
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.ceil((due - today) / (1000*60*60*24));
  if (diff < 0)  return { cls: 'due--overdue',  icon: 'exclamation-circle', text: 'Overdue',              urgency: 'urgency--red' };
  if (diff === 0) return { cls: 'due--today',    icon: 'calendar-check',     text: 'Today',               urgency: 'urgency--yellow' };
  if (diff === 1) return { cls: 'due--tomorrow', icon: 'clock',              text: 'Tomorrow',            urgency: 'urgency--yellow' };
  if (diff <= 3)  return { cls: 'due--soon',     icon: 'calendar-event',     text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgency: 'urgency--yellow' };
  return           { cls: 'due--normal',  icon: 'calendar3',          text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgency: 'urgency--green' };
}

const COLUMN_META = {
  'Backlog':     { icon: 'inbox',        iconClass: 'kol-icon--backlog', activeClass: '' },
  'To Do':       { icon: 'circle',       iconClass: 'kol-icon--todo',    activeClass: '' },
  'In Progress': { icon: 'arrow-repeat', iconClass: 'kol-icon--prog',   activeClass: '' },
  'Review':      { icon: 'eye',          iconClass: 'kol-icon--review',  activeClass: '' },
  'Done':        { icon: 'check2-all',   iconClass: 'kol-icon--done',    activeClass: ' kol--done' }
};

const LABEL_MAP = { 'Critical': ['Design','Branding','Goal'], 'High': ['Design','Dev'], 'Medium': ['Dev','Content'], 'Low': ['Research'] };
function getLabels(p) { return LABEL_MAP[p] || ['Design']; }
function getLabelClass(l) { return 'lbl lbl--' + l.toLowerCase().replace(/\s+/g, ''); }

const MEMBER_COLORS = {
  'Ankit Bhalke':   '2563EB',
  'Khushi Shah':    '8B5CF6',
  'Rehan Azim':     '059669',
  'Sumit Tiwari':   'F59E0B',
  'Aditya Vawahal': 'EF4444',
};

function buildCard(task) {
  const priClass = getPriorityClass(task.priority);
  const priIcon  = getPriorityIcon(task.priority);
  const due      = getDueInfo(task.dueDate);
  const labels   = getLabels(task.priority);
  const an       = task.assignee || 'Unassigned';
  const ac       = MEMBER_COLORS[an] || '64748B';
  return `<article class="card-task${task.column === 'Done' ? ' card-task--done' : ''}${due.urgency ? ' ' + due.urgency : ''}" role="listitem" data-id="${task.id}">
  <div class="ct-top">
    <span class="pri pri--${priClass}"><i class="bi bi-${priIcon}"></i>${task.priority}</span>
    ${task.column === 'Done' ? '<span class="ct-done-dot" aria-label="Completed"></span>' : '<button class="ct-menu" aria-label="Card options"><i class="bi bi-three-dots"></i></button>'}
  </div>
  <h3 class="ct-title${task.column === 'Done' ? ' ct-title--done' : ''}">${task.title}</h3>
  <p class="ct-desc">${task.description || 'Add a short description for this task here.'}</p>
  <div class="ct-labels">${labels.map(l => `<span class="${getLabelClass(l)}">${l}</span>`).join('')}</div>
  <div class="ct-checklist">
    <i class="bi bi-check2-square ct-chk-icon"></i>
    <div class="ct-chk-bar"><div class="ct-chk-fill" style="width:${task.column === 'Done' ? '100' : '0'}%"></div></div>
    <span class="ct-chk-txt">${task.column === 'Done' ? 'Done' : '0 / 0'}</span>
  </div>
  <div class="ct-foot">
    <span class="due ${due.cls}"><i class="bi bi-${due.icon}"></i>${due.text}${due.urgency ? `<span class="due-dot ${due.urgency}-dot" aria-hidden="true"></span>` : ''}</span>
    <div class="ct-meta">
      <span class="ct-stat"><i class="bi bi-chat"></i>0</span>
      <span class="ct-stat"><i class="bi bi-paperclip"></i>0</span>
      <button class="edit-task-btn" data-id="${task.id}" aria-label="Edit task" style="background:none;border:none;color:var(--c-primary);cursor:pointer;padding:0 4px;font-size:13px;"><i class="bi bi-pencil"></i></button>
      <button class="delete-task-btn" data-id="${task.id}" aria-label="Delete task" style="background:none;border:none;color:var(--c-danger);cursor:pointer;padding:0 4px;font-size:13px;"><i class="bi bi-trash"></i></button>
      <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(an)}&background=${ac}&color=fff&size=22" alt="${an}" class="ct-av" title="${an}" />
    </div>
  </div>
</article>`;
}

function render() {
  if (currentView === 'list') return renderList();
  renderKanban();
}

/* ── KANBAN VIEW ───────────────────────────────────────────── */
function renderKanban() {
  const filteredTasks = sortTasks(filterTasks(tasks, currentFilters));
  const columnTasks = {};
  Object.keys(COLUMN_META).forEach(c => columnTasks[c] = []);
  filteredTasks.forEach(task => {
    if (columnTasks[task.column]) columnTasks[task.column].push(task);
    else columnTasks['To Do'].push(task);
  });

  let html = '';
  Object.entries(COLUMN_META).forEach(([name, meta]) => {
    const colTasks = columnTasks[name];
    const cardsHtml = colTasks.map(task => buildCard(task)).join('');
    html += `<div class="kol${meta.activeClass}" aria-label="${name} column">
  <div class="kol-head">
    <div class="kol-head-l">
      <div class="kol-icon ${meta.iconClass}"><i class="bi bi-${meta.icon}"></i></div>
      <span class="kol-title">${name}</span>
      <span class="kol-count">${colTasks.length}</span>
    </div>
    <button class="kol-menu" aria-label="${name} options"><i class="bi bi-three-dots"></i></button>
  </div>
  <div class="kol-cards" role="list">
    ${cardsHtml || '<p style="color:var(--c-muted);font-size:13px;padding:16px;text-align:center;">No tasks</p>'}
  </div>
  <button class="kol-add add-task-btn" data-column="${name}" aria-label="Add task to ${name}"><i class="bi bi-plus-lg"></i>Add Task</button>
</div>`;
  });
  html += '<div class="kol-add-col" role="button" tabindex="0" aria-label="Add new column"><i class="bi bi-plus-circle"></i><span>Add Column</span></div>';
  app.innerHTML = html;
  app.className = 'brd-scroll-area';
  updateStats();
  attachCardListeners();
}

/* ── LIST VIEW ─────────────────────────────────────────────── */
function renderList() {
  const filteredTasks = sortTasks(filterTasks(tasks, currentFilters));

  const rows = filteredTasks.map(task => {
    const priClass = getPriorityClass(task.priority);
    const priIcon  = getPriorityIcon(task.priority);
    const due      = getDueInfo(task.dueDate);
    const an       = task.assignee || 'Unassigned';
    const ac       = MEMBER_COLORS[an] || '64748B';
    const colMeta  = COLUMN_META[task.column] || COLUMN_META['To Do'];
    return `<tr class="lv-row${due.urgency ? ' ' + due.urgency : ''}" data-id="${task.id}">
  <td class="lv-td lv-title">
    <span class="lv-urgency-bar ${due.urgency}"></span>
    <span class="lv-task-title${task.column === 'Done' ? ' ct-title--done' : ''}">${task.title}</span>
    <span class="lv-task-desc">${task.description || ''}</span>
  </td>
  <td class="lv-td"><span class="pri pri--${priClass}"><i class="bi bi-${priIcon}"></i>${task.priority}</span></td>
  <td class="lv-td">
    <span class="lv-status">
      <span class="kol-icon kol-icon--xs ${colMeta.iconClass}"><i class="bi bi-${colMeta.icon}"></i></span>
      ${task.column}
    </span>
  </td>
  <td class="lv-td">
    <span class="due ${due.cls}"><i class="bi bi-${due.icon}"></i>${due.text}${due.urgency ? `<span class="due-dot ${due.urgency}-dot" aria-hidden="true"></span>` : ''}</span>
  </td>
  <td class="lv-td">
    <div class="lv-assignee">
      <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(an)}&background=${ac}&color=fff&size=22" alt="${an}" class="ct-av" title="${an}" />
      <span>${an}</span>
    </div>
  </td>
  <td class="lv-td lv-actions">
    <button class="edit-task-btn lv-btn" data-id="${task.id}" aria-label="Edit task"><i class="bi bi-pencil"></i></button>
    <button class="delete-task-btn lv-btn" data-id="${task.id}" aria-label="Delete task"><i class="bi bi-trash"></i></button>
  </td>
</tr>`;
  }).join('');

  app.className = 'lv-wrap';
  app.innerHTML = `
<table class="lv-table" role="grid" aria-label="Task list">
  <thead>
    <tr class="lv-head">
      <th class="lv-th">Task</th>
      <th class="lv-th">Priority</th>
      <th class="lv-th">Status</th>
      <th class="lv-th">Due Date</th>
      <th class="lv-th">Assignee</th>
      <th class="lv-th"></th>
    </tr>
  </thead>
  <tbody>
    ${rows || '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--c-muted);">No tasks found</td></tr>'}
  </tbody>
</table>`;
  updateStats();
  attachCardListeners();
}

/* ── TIMELINE VIEW ─────────────────────────────────────────── */
function updateStats() {
  const $ = id => document.getElementById(id);
  const s = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  s('statTotal', tasks.length);
  s('statCompleted', tasks.filter(t => t.column === 'Done').length);
  s('statPending', tasks.filter(t => t.column !== 'Done').length);
  const today = new Date(); today.setHours(0,0,0,0);
  s('statOverdue', tasks.filter(t => t.dueDate && new Date(t.dueDate+'T00:00:00') < today && t.column !== 'Done').length);
}

function attachCardListeners() {
  document.querySelectorAll('.edit-task-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openEditModal(parseInt(btn.getAttribute('data-id'))); });
  });
  document.querySelectorAll('.delete-task-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'));
      if (confirm('Delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        if (editingTaskId === id) editingTaskId = null;
        render();
      }
    });
  });
  document.querySelectorAll('.add-task-btn').forEach(btn => {
    btn.addEventListener('click', () => { editingTaskId = null; openModal(btn.getAttribute('data-column')); });
  });

  // Wire up drag & drop after every render
  if (typeof initDragDrop === 'function') initDragDrop();
}

function openModal(defaultStatus) {
  const modal = document.getElementById('modalCreate');
  if (!modal) return;
  modal.style.display = 'flex';
  document.getElementById('modalCreateTitle').textContent = 'Create New Task';
  document.getElementById('modalSaveBtn').innerHTML = '<i class="bi bi-plus-lg"></i> Create Task';
  document.getElementById('mfTitle').value = '';
  document.getElementById('mfDesc').value = '';
  document.getElementById('mfPriority').value = 'Medium';
  document.getElementById('mfStatus').value = defaultStatus || 'To Do';
  document.getElementById('mfAssignee').value = '';
  document.getElementById('mfDueDate').value = '';
  
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local time
  const dueDateEl = document.getElementById('mfDueDate');
  if (dueDateEl) dueDateEl.setAttribute('min', todayStr);
  
  const err = document.getElementById('form-error-message');
  if (err) err.style.display = 'none';
  editingTaskId = null;
}

function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingTaskId = id;
  document.getElementById('modalCreate').style.display = 'flex';
  document.getElementById('modalCreateTitle').textContent = 'Edit Task';
  document.getElementById('modalSaveBtn').innerHTML = '<i class="bi bi-check-lg"></i> Save Changes';
  document.getElementById('mfTitle').value = task.title;
  document.getElementById('mfDesc').value = task.description || '';
  document.getElementById('mfPriority').value = task.priority;
  document.getElementById('mfStatus').value = task.column;
  document.getElementById('mfAssignee').value = task.assignee || '';
  document.getElementById('mfDueDate').value = task.dueDate || '';
  
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local time
  const dueDateEl = document.getElementById('mfDueDate');
  if (dueDateEl) dueDateEl.setAttribute('min', todayStr);
  
  const err = document.getElementById('form-error-message');
  if (err) err.style.display = 'none';
}

function closeModal() {
  const modal = document.getElementById('modalCreate');
  if (modal) modal.style.display = 'none';
}

function saveTask() {
  const titleInput = document.getElementById('mfTitle');
  if (!titleInput) return;
  const title = titleInput.value.trim();
  if (!title) {
    const err = document.getElementById('form-error-message');
    if (err) { err.textContent = 'Task title is required.'; err.style.display = 'block'; }
    return;
  }

  const descInput = document.getElementById('mfDesc');
  const description = descInput ? descInput.value.trim() : '';
  if (!description) {
    const err = document.getElementById('form-error-message');
    if (err) { err.textContent = 'Task description is required.'; err.style.display = 'block'; }
    return;
  }

  const dueDateInput = document.getElementById('mfDueDate');
  const dueDate = dueDateInput ? dueDateInput.value : '';
  if (dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dueDate + 'T00:00:00');
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      const err = document.getElementById('form-error-message');
      if (err) { err.textContent = 'Due date cannot be in the past.'; err.style.display = 'block'; }
      return;
    }
  }

  const getVal = id => { const e = document.getElementById(id); return e ? e.value : ''; };
  const task = {
    id: editingTaskId || Date.now(),
    title,
    description,
    priority: getVal('mfPriority'),
    column: getVal('mfStatus'),
    assignee: getVal('mfAssignee'),
    dueDate
  };

  if (editingTaskId) {
    tasks = tasks.map(t => t.id === editingTaskId ? { ...t, ...task } : t);
  } else {
    tasks.push(task);
  }
  closeModal();
  render();
}

function collectFilters() {
  const getChecked = (sel) => { const vals = []; document.querySelectorAll(sel).forEach(cb => { if (cb.checked) vals.push(cb.value); }); return vals; };
  return {
    priority: getChecked('#filterPriority input[type="checkbox"]'),
    status: getChecked('#filterStatus input[type="checkbox"]'),
    assignee: getChecked('#filterAssignee input[type="checkbox"]')
  };
}

function applyFilters() {
  currentFilters = { ...currentFilters, ...collectFilters() };
  closeFilterPanel();
  render();
}

function resetFilters() {
  document.querySelectorAll('#filterPriority input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#filterStatus input[type="checkbox"]').forEach(cb => cb.checked = true);
  document.querySelectorAll('#filterAssignee input[type="checkbox"]').forEach(cb => cb.checked = false);
  applyFilters();
}

function openFilterPanel() { const p = document.getElementById('filterPanel'); if (p) p.style.display = 'block'; }
function closeFilterPanel() { const p = document.getElementById('filterPanel'); if (p) p.style.display = 'none'; }

function init() {
  const newTaskBtn = document.getElementById('newTaskBtn');
  if (newTaskBtn) newTaskBtn.addEventListener('click', () => openModal('To Do'));

  const modalClose = document.getElementById('modalCloseBtn');
  if (modalClose) modalClose.addEventListener('click', closeModal);

  const modalCancel = document.getElementById('modalCancelBtn');
  if (modalCancel) modalCancel.addEventListener('click', closeModal);

  const modalSave = document.getElementById('modalSaveBtn');
  if (modalSave) modalSave.addEventListener('click', saveTask);

  const modalBg = document.getElementById('modalCreate');
  if (modalBg) modalBg.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

  const filterToggle = document.getElementById('filterToggleBtn');
  if (filterToggle) filterToggle.addEventListener('click', openFilterPanel);

  const filterClose = document.getElementById('filterCloseBtn');
  if (filterClose) filterClose.addEventListener('click', closeFilterPanel);

  const filterApply = document.getElementById('filterApplyBtn');
  if (filterApply) filterApply.addEventListener('click', applyFilters);

  const filterReset = document.getElementById('filterResetBtn');
  if (filterReset) filterReset.addEventListener('click', resetFilters);

  const filterBg = document.getElementById('filterPanel');
  if (filterBg) filterBg.addEventListener('click', e => { if (e.target === e.currentTarget) closeFilterPanel(); });

  const searchInput = document.querySelector('.hd-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      currentFilters.searchQuery = e.target.value;
      render();
    });
  }

  // ── Sort panel ───────────────────────────────────────────────
  const sortToggleBtn = document.getElementById('sortToggleBtn');
  const sortPanel     = document.getElementById('sortPanel');
  const sortCloseBtn  = document.getElementById('sortCloseBtn');
  const sortApplyBtn  = document.getElementById('sortApplyBtn');
  const sortResetBtn  = document.getElementById('sortResetBtn');

  if (sortToggleBtn) sortToggleBtn.addEventListener('click', () => {
    sortPanel.style.display = sortPanel.style.display === 'block' ? 'none' : 'block';
    sortToggleBtn.classList.toggle('hd-btn-pill--active', sortPanel.style.display === 'block');
  });
  if (sortCloseBtn)  sortCloseBtn.addEventListener('click',  () => { sortPanel.style.display = 'none'; });
  if (sortApplyBtn)  sortApplyBtn.addEventListener('click',  () => {
    const checked = document.querySelector('input[name="sortBy"]:checked');
    currentSort = checked ? checked.value : 'none';
    sortPanel.style.display = 'none';
    render();
  });
  if (sortResetBtn)  sortResetBtn.addEventListener('click',  () => {
    currentSort = 'none';
    document.querySelector('input[name="sortBy"][value="none"]').checked = true;
    sortPanel.style.display = 'none';
    render();
  });
  if (sortPanel) sortPanel.addEventListener('click', e => { if (e.target === e.currentTarget) sortPanel.style.display = 'none'; });

  // ── Notifications panel ──────────────────────────────────────
  const notifBtn      = document.getElementById('notifBtn');
  const notifPanel    = document.getElementById('notifPanel');
  const notifCloseBtn = document.getElementById('notifCloseBtn');
  const notifBadge    = document.getElementById('notifBadge');
  const markAllBtn    = document.getElementById('markAllReadBtn');

  if (notifBtn) notifBtn.addEventListener('click', () => {
    const open = notifPanel.style.display === 'block';
    notifPanel.style.display = open ? 'none' : 'block';
    notifBtn.classList.toggle('hd-btn-icon--active', !open);
    if (!open && notifBadge) {
      // Clear badge when panel opens
      notifBadge.style.display = 'none';
    }
  });
  if (notifCloseBtn) notifCloseBtn.addEventListener('click', () => {
    notifPanel.style.display = 'none';
    notifBtn.classList.remove('hd-btn-icon--active');
  });
  if (markAllBtn) markAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.notif-item--unread').forEach(el => el.classList.remove('notif-item--unread'));
    document.querySelectorAll('.notif-dot').forEach(el => el.remove());
    if (notifBadge) notifBadge.style.display = 'none';
  });
  if (notifPanel) notifPanel.addEventListener('click', e => { if (e.target === e.currentTarget) { notifPanel.style.display = 'none'; notifBtn.classList.remove('hd-btn-icon--active'); }});

  // ── Settings panel ───────────────────────────────────────────
  const settingsBtn      = document.getElementById('settingsBtn');
  const settingsPanel    = document.getElementById('settingsPanel');
  const settingsCloseBtn = document.getElementById('settingsCloseBtn');
  const clearAccountsBtn = document.getElementById('clearAccountsBtn');
  const settingCompact   = document.getElementById('settingCompact');
  const settingAvatars   = document.getElementById('settingAvatars');

  if (settingsBtn) settingsBtn.addEventListener('click', () => {
    const open = settingsPanel.style.display === 'block';
    settingsPanel.style.display = open ? 'none' : 'block';
    settingsBtn.classList.toggle('hd-btn-icon--active', !open);
  });
  if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
    settingsBtn.classList.remove('hd-btn-icon--active');
  });
  if (clearAccountsBtn) clearAccountsBtn.addEventListener('click', () => {
    if (confirm('Clear all saved accounts? You will be logged out.')) {
      localStorage.removeItem('pf_users');
      localStorage.removeItem('pf_session');
      window.location.href = 'welcome.html';
    }
  });
  if (settingCompact) settingCompact.addEventListener('change', () => {
    document.body.classList.toggle('setting--compact', settingCompact.checked);
  });
  if (settingAvatars) settingAvatars.addEventListener('change', () => {
    document.body.classList.toggle('setting--no-avatars', !settingAvatars.checked);
  });
  if (settingsPanel) settingsPanel.addEventListener('click', e => { if (e.target === e.currentTarget) { settingsPanel.style.display = 'none'; settingsBtn.classList.remove('hd-btn-icon--active'); }});

  // ── View toggle ──────────────────────────────────────────────
  const viewBtns = document.querySelectorAll('.brd-view-btn');
  const viewMap  = ['kanban', 'list'];
  viewBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      currentView = viewMap[i] || 'kanban';
      viewBtns.forEach((b, j) => {
        b.classList.toggle('brd-view-btn--on', j === i);
        b.setAttribute('aria-pressed', String(j === i));
      });
      render();
    });
  });
  const activityBtn     = document.getElementById('activityToggleBtn');
  const activitySidebar = document.getElementById('activitySidebar');
  if (activityBtn && activitySidebar) {
    activityBtn.addEventListener('click', () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const opening = !activitySidebar.classList.contains('is-open');
        // close left drawer if open
        closeMobileDrawers(true, false);
        activitySidebar.classList.toggle('is-open', opening);
        activityBtn.classList.toggle('hd-btn-icon--active', opening);
        setDrawerOverlay(opening);
      } else {
        const shown = activitySidebar.style.display !== 'none';
        activitySidebar.style.display = shown ? 'none' : 'flex';
        activityBtn.classList.toggle('hd-btn-icon--active', !shown);
      }
    });
  }

  // ── Mobile hamburger menu (left sidebar drawer) ─────────────
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebarLeft   = document.querySelector('.sidebar-left');
  const drawerOverlay = document.getElementById('drawerOverlay');

  if (mobileMenuBtn && sidebarLeft) {
    mobileMenuBtn.addEventListener('click', () => {
      const opening = !sidebarLeft.classList.contains('is-open');
      // close right drawer if open
      closeMobileDrawers(false, true);
      sidebarLeft.classList.toggle('is-open', opening);
      mobileMenuBtn.setAttribute('aria-expanded', String(opening));
      setDrawerOverlay(opening);
    });
  }

  // Close drawers when overlay is tapped
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', () => closeMobileDrawers(true, true));
  }

  // Close drawers on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      closeMobileDrawers(true, true);
    }
  });

  render();
}

/** Toggle the translucent backdrop overlay. */
function setDrawerOverlay(visible) {
  const overlay = document.getElementById('drawerOverlay');
  if (overlay) overlay.classList.toggle('is-visible', visible);
}

/**
 * Close mobile drawers.
 * @param {boolean} left  - close left sidebar
 * @param {boolean} right - close right sidebar
 */
function closeMobileDrawers(left, right) {
  if (left) {
    const sidebarLeft = document.querySelector('.sidebar-left');
    const menuBtn     = document.getElementById('mobileMenuBtn');
    if (sidebarLeft) sidebarLeft.classList.remove('is-open');
    if (menuBtn)     menuBtn.setAttribute('aria-expanded', 'false');
  }
  if (right) {
    const sidebarRight = document.getElementById('activitySidebar');
    const activityBtn  = document.getElementById('activityToggleBtn');
    if (sidebarRight) sidebarRight.classList.remove('is-open');
    if (activityBtn)  activityBtn.classList.remove('hd-btn-icon--active');
  }
  const anyOpen =
    (left  ? false : document.querySelector('.sidebar-left')?.classList.contains('is-open'))   ||
    (right ? false : document.getElementById('activitySidebar')?.classList.contains('is-open'));
  setDrawerOverlay(!!anyOpen);
}

init();
