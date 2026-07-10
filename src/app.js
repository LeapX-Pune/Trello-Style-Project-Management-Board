let tasks = [
  { id: 1, title: 'Write PRD document', description: 'Draft the initial project requirement details', assignee: 'Alex Johnson', dueDate: '2026-07-10', priority: 'High', column: 'In Progress' },
  { id: 2, title: 'Design Landing Page UI', description: 'Create basic layouts for home page', assignee: 'Sara Lee', dueDate: '2026-07-15', priority: 'Medium', column: 'To Do' },
  { id: 3, title: 'Implement Authentication', description: 'Setup login/signup flows', assignee: 'Marcus Chen', dueDate: '2026-07-20', priority: 'High', column: 'To Do' },
  { id: 4, title: 'New color palette & brand identity', description: 'Define the new brand color palette and identity guidelines', assignee: 'Sara Lee', dueDate: '2026-07-09', priority: 'Critical', column: 'In Progress' },
  { id: 5, title: 'Social media asset kit', description: 'Create assets for social media campaign', assignee: 'Priya Kapoor', dueDate: '2026-07-22', priority: 'Low', column: 'Backlog' },
  { id: 6, title: 'Email templates', description: 'Design responsive email templates', assignee: 'Marcus Chen', dueDate: '2026-07-18', priority: 'Medium', column: 'Review' },
  { id: 7, title: 'Sprint 3 retrospective', description: 'Document retrospective findings', assignee: 'Tom Rivera', dueDate: '2026-07-08', priority: 'Medium', column: 'Done' },
  { id: 8, title: 'Brand identity guidelines', description: 'Compile brand guidelines document', assignee: 'Sara Lee', dueDate: '2026-07-16', priority: 'High', column: 'Review' },
  { id: 9, title: 'Logo variations', description: 'Create logo variations for different use cases', assignee: 'Sara Lee', dueDate: '2026-07-09', priority: 'Critical', column: 'Done' },
  { id: 10, title: 'Design tokens', description: 'Define design token system', assignee: 'Priya Kapoor', dueDate: '2026-07-25', priority: 'Medium', column: 'Backlog' }
];

let currentFilters = { searchQuery: '', priority: [], status: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'], assignee: [] };
let editingTaskId = null;

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

function getDueInfo(dueDate) {
  if (!dueDate) return { cls: 'due--normal', icon: 'calendar3', text: 'No date' };
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.ceil((due - today) / (1000*60*60*24));
  if (diff < 0) return { cls: 'due--overdue', icon: 'exclamation-circle', text: 'Overdue' };
  if (diff === 0) return { cls: 'due--today', icon: 'calendar-check', text: 'Today' };
  if (diff === 1) return { cls: 'due--tomorrow', icon: 'clock', text: 'Tomorrow' };
  return { cls: 'due--normal', icon: 'calendar3', text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
}

const COLUMN_META = {
  'Backlog':     { icon: 'inbox',        iconClass: 'kol-icon--backlog', activeClass: '' },
  'To Do':       { icon: 'circle',       iconClass: 'kol-icon--todo',    activeClass: '' },
  'In Progress': { icon: 'arrow-repeat', iconClass: 'kol-icon--prog',   activeClass: ' kol--active' },
  'Review':      { icon: 'eye',          iconClass: 'kol-icon--review',  activeClass: '' },
  'Done':        { icon: 'check2-all',   iconClass: 'kol-icon--done',    activeClass: ' kol--done' }
};

const LABEL_MAP = { 'Critical': ['Design','Branding','Goal'], 'High': ['Design','Dev'], 'Medium': ['Dev','Content'], 'Low': ['Research'] };
function getLabels(p) { return LABEL_MAP[p] || ['Design']; }
function getLabelClass(l) { return 'lbl lbl--' + l.toLowerCase().replace(/\s+/g, ''); }

function render() {
  const filteredTasks = filterTasks(tasks, currentFilters);
  const columnTasks = {};
  Object.keys(COLUMN_META).forEach(c => columnTasks[c] = []);
  filteredTasks.forEach(task => {
    if (columnTasks[task.column]) columnTasks[task.column].push(task);
    else columnTasks['To Do'].push(task);
  });

  let html = '';
  Object.entries(COLUMN_META).forEach(([name, meta]) => {
    const colTasks = columnTasks[name];
    const cardsHtml = colTasks.map(task => {
      const priClass = getPriorityClass(task.priority);
      const priIcon = getPriorityIcon(task.priority);
      const due = getDueInfo(task.dueDate);
      const labels = getLabels(task.priority);
      const an = task.assignee || 'Unassigned';
      const ac = ['2563EB','8B5CF6','059669','F59E0B','EF4444'][Math.abs(task.id) % 5];
      return `<article class="card-task${task.column === 'Done' ? ' card-task--done' : ''}" role="listitem" data-id="${task.id}">
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
    <span class="due ${due.cls}"><i class="bi bi-${due.icon}"></i>${due.text}</span>
    <div class="ct-meta">
      <span class="ct-stat"><i class="bi bi-chat"></i>${Math.floor(Math.random() * 10)}</span>
      <span class="ct-stat"><i class="bi bi-paperclip"></i>${Math.floor(Math.random() * 5)}</span>
      <button class="edit-task-btn" data-id="${task.id}" aria-label="Edit task" style="background:none;border:none;color:var(--c-primary);cursor:pointer;padding:0 4px;font-size:13px;"><i class="bi bi-pencil"></i></button>
      <button class="delete-task-btn" data-id="${task.id}" aria-label="Delete task" style="background:none;border:none;color:var(--c-danger);cursor:pointer;padding:0 4px;font-size:13px;"><i class="bi bi-trash"></i></button>
      <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(an)}&background=${ac}&color=fff&size=22" alt="${an}" class="ct-av" title="${an}" />
    </div>
  </div>
</article>`;
    }).join('');
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
  updateStats();
  attachCardListeners();
}

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
  const alexCb = document.querySelector('#filterAssignee input[value="Alex Johnson"]');
  if (alexCb) alexCb.checked = true;
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
      e.target.focus();
    });
  }

  const activityBtn = document.getElementById('activityToggleBtn');
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
