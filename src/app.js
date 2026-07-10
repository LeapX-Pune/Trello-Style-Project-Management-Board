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

let columns = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
let activities = [];
let currentFilters = { searchQuery: '', priority: [], status: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'], assignee: [] };
let editingTaskId = null;
let nextTaskId = 11;
let draggedTaskId = null;
let touchDrag = { active: false, taskId: null };
let aid = 0;
let openDropdown = null;

const app = document.getElementById('app');
const USER = 'Alex Johnson';

const COLUMN_META = {
  'Backlog':     { icon: 'inbox',        iconClass: 'kol-icon--backlog', activeClass: '' },
  'To Do':       { icon: 'circle',       iconClass: 'kol-icon--todo',    activeClass: '' },
  'In Progress': { icon: 'arrow-repeat', iconClass: 'kol-icon--prog',   activeClass: ' kol--active' },
  'Review':      { icon: 'eye',          iconClass: 'kol-icon--review',  activeClass: '' },
  'Done':        { icon: 'check2-all',   iconClass: 'kol-icon--done',    activeClass: ' kol--done' }
};

const MEMBER_COLORS = {
  'Alex Johnson': '2563EB', 'Sara Lee': '8B5CF6', 'Marcus Chen': '059669',
  'Priya Kapoor': 'F59E0B', 'Tom Rivera': 'EF4444'
};

const LABEL_MAP = {
  'Critical': ['Design','Branding','Goal'],
  'High': ['Design','Dev'],
  'Medium': ['Dev','Content'],
  'Low': ['Research']
};

function getPriorityClass(p) { return { 'Critical':'crit', 'High':'high', 'Medium':'med', 'Low':'low' }[p] || 'med'; }
function getPriorityIcon(p) { return { 'Critical':'fire', 'High':'arrow-up', 'Medium':'dash', 'Low':'arrow-down' }[p] || 'dash'; }

function getDefaultIcon() { return 'columns'; }

function getDeadlineStatus(dueDate) {
  if (!dueDate) return { cls: 'due--normal', icon: 'calendar3', text: 'No date' };
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.ceil((due - today) / (1000*60*60*24));
  if (diff < 0) return { cls: 'due--overdue', icon: 'exclamation-circle', text: 'Overdue' };
  if (diff <= 2) return { cls: 'due--approaching', icon: 'clock', text: diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
  return { cls: 'due--far', icon: 'check-circle', text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
}

function getLabels(p) { return LABEL_MAP[p] || ['Design']; }
function getLabelClass(l) { return 'lbl lbl--' + l.toLowerCase().replace(/\s+/g, ''); }

function filterTasks(tasks, criteria) {
  const { searchQuery, priority, status, assignee } = criteria;
  return tasks.filter(task => {
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      if (!task.title.toLowerCase().includes(q) && !(task.description || '').toLowerCase().includes(q)) return false;
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

function addActivity(action, taskName, details) {
  activities.unshift({ id: ++aid, user: USER, action, taskName, details: details || '', timestamp: new Date() });
  renderActivityLog();
}

function getTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
  if (diff < 86400) return Math.floor(diff / 3600) + ' hr ago';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function getGroupLabel(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === yesterday.getTime()) return 'Yesterday';
  return 'Earlier';
}

function renderActivityLog() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  const groups = {};
  activities.forEach(a => {
    const label = getGroupLabel(a.timestamp);
    if (!groups[label]) groups[label] = [];
    groups[label].push(a);
  });
  const order = ['Today', 'Yesterday', 'Earlier'];
  let html = '';
  order.forEach(label => {
    if (!groups[label]) return;
    html += `<div class="rs-group"><div class="rs-group-lbl">${label}</div>`;
    groups[label].forEach(a => {
      const ac = MEMBER_COLORS[a.user] || '64748B';
      const actionText = a.action === 'moved' ? `moved <span class="rs-task">"${a.taskName}"</span> ${a.details}` :
        a.action === 'created' ? `created <span class="rs-task">"${a.taskName}"</span>` :
        a.action === 'edited' ? `updated <span class="rs-task">"${a.taskName}"</span>` :
        a.action === 'deleted' ? `deleted <span class="rs-task">"${a.taskName}"</span>` :
        `${a.action} <span class="rs-task">"${a.taskName}"</span>`;
      html += `<div class="rs-item"><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(a.user)}&background=${ac}&color=fff&size=28" alt="${a.user}" class="rs-av" /><div class="rs-content"><p class="rs-text"><strong>${a.user}</strong> ${actionText}</p><time class="rs-time">${getTimeAgo(a.timestamp)}</time></div></div>`;
    });
    html += `</div>`;
  });
  if (!html) html = '<div class="rs-group"><div class="rs-group-lbl" style="color:var(--c-muted);padding:8px 0;">No activity yet</div></div>';
  feed.innerHTML = html;
}

function handleDragStart(e) {
  draggedTaskId = parseInt(e.target.closest('.card-task').dataset.id);
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedTaskId);
  setTimeout(() => e.target.closest('.card-task').classList.add('dragging'), 0);
}

function handleDragEnd() {
  document.querySelectorAll('.card-task').forEach(c => c.classList.remove('dragging'));
  document.querySelectorAll('.kol').forEach(c => c.classList.remove('drag-over'));
  draggedTaskId = null;
}

function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }

function handleDragEnter(e) {
  const col = e.target.closest('.kol');
  if (col) col.classList.add('drag-over');
}

function handleDragLeave(e) {
  const col = e.target.closest('.kol');
  if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  const col = e.target.closest('.kol');
  if (!col) return;
  const colName = col.querySelector('.kol-title').textContent;
  if (!draggedTaskId) return;
  const task = tasks.find(t => t.id === draggedTaskId);
  if (task && task.column !== colName) {
    const oldCol = task.column;
    task.column = colName;
    addActivity('moved', task.title, `from ${oldCol} to ${colName}`);
    render();
  }
  document.querySelectorAll('.kol').forEach(c => c.classList.remove('drag-over'));
  draggedTaskId = null;
}

function handleTouchStart(e) {
  const card = e.target.closest('.card-task');
  if (!card) return;
  if (e.target.closest('.edit-task-btn, .delete-task-btn, .ct-menu')) return;
  touchDrag = { active: true, taskId: parseInt(card.dataset.id) };
}

function handleTouchMove(e) {
  if (!touchDrag.active) return;
  e.preventDefault();
  const touch = e.touches[0];
  document.querySelectorAll('.kol').forEach(c => c.classList.remove('drag-over'));
  const col = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.kol');
  if (col) col.classList.add('drag-over');
}

function handleTouchEnd() {
  if (!touchDrag.active) return;
  touchDrag.active = false;
  const col = document.querySelector('.kol.drag-over');
  if (col) {
    const colName = col.querySelector('.kol-title').textContent;
    const task = tasks.find(t => t.id === touchDrag.taskId);
    if (task && task.column !== colName) {
      const oldCol = task.column;
      task.column = colName;
      addActivity('moved', task.title, `from ${oldCol} to ${colName}`);
      render();
    }
  }
  document.querySelectorAll('.kol').forEach(c => c.classList.remove('drag-over'));
  touchDrag.taskId = null;
}

function render() {
  const filteredTasks = filterTasks(tasks, currentFilters);
  const columnTasks = {};
  columns.forEach(c => columnTasks[c] = []);
  filteredTasks.forEach(task => {
    if (columnTasks[task.column]) columnTasks[task.column].push(task);
    else columnTasks[columns[1]].push(task);
  });

  let html = '';
  columns.forEach((name, idx) => {
    const meta = COLUMN_META[name] || { icon: getDefaultIcon(), iconClass: 'kol-icon--todo', activeClass: '' };
    const colTasks = columnTasks[name] || [];
    const cardsHtml = colTasks.map(task => {
      const priClass = getPriorityClass(task.priority);
      const priIcon = getPriorityIcon(task.priority);
      const due = getDeadlineStatus(task.dueDate);
      const labels = getLabels(task.priority);
      const an = task.assignee || 'Unassigned';
      const ac = MEMBER_COLORS[an] || '64748B';
      return `<article class="card-task${task.column === 'Done' ? ' card-task--done' : ''}" draggable="true" role="listitem" data-id="${task.id}">
  <div class="ct-top">
    <span class="pri pri--${priClass}"><i class="bi bi-${priIcon}"></i>${task.priority}</span>
    ${task.column === 'Done' ? '<span class="ct-done-dot" aria-label="Completed"></span>' : '<button class="ct-menu" aria-label="Card options"><i class="bi bi-three-dots"></i></button>'}
  </div>
  <h3 class="ct-title${task.column === 'Done' ? ' ct-title--done' : ''}">${task.title}</h3>
  <p class="ct-desc">${task.description || ''}</p>
  <div class="ct-labels">${labels.map(l => `<span class="${getLabelClass(l)}">${l}</span>`).join('')}</div>
  <div class="ct-foot">
    <span class="due ${due.cls}"><i class="bi bi-${due.icon}"></i>${due.text}</span>
    <div class="ct-meta">
      <button class="edit-task-btn" data-id="${task.id}" aria-label="Edit task" style="background:none;border:none;color:var(--c-primary);cursor:pointer;padding:0 4px;font-size:13px;"><i class="bi bi-pencil"></i></button>
      <button class="delete-task-btn" data-id="${task.id}" aria-label="Delete task" style="background:none;border:none;color:var(--c-danger);cursor:pointer;padding:0 4px;font-size:13px;"><i class="bi bi-trash"></i></button>
      <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(an)}&background=${ac}&color=fff&size=22" alt="${an}" class="ct-av" title="${an}" />
    </div>
  </div>
</article>`;
    }).join('');
    html += `<div class="kol${meta.activeClass}" aria-label="${name} column" data-column="${name}">
  <div class="kol-head">
    <div class="kol-head-l">
      <div class="kol-icon ${meta.iconClass}"><i class="bi bi-${meta.icon}"></i></div>
      <span class="kol-title">${name}</span>
      <span class="kol-count">${colTasks.length}</span>
    </div>
    <button class="kol-menu" data-col="${idx}" aria-label="${name} options"><i class="bi bi-three-dots"></i></button>
  </div>
  <div class="kol-cards" role="list">
    ${cardsHtml || '<p style="color:var(--c-muted);font-size:13px;padding:16px;text-align:center;">No tasks</p>'}
  </div>
  <button class="kol-add add-task-btn" data-column="${name}" aria-label="Add task to ${name}"><i class="bi bi-plus-lg"></i>Add Task</button>
</div>`;
  });
  html += '<div class="kol-add-col" id="addColumnBtn" role="button" tabindex="0" aria-label="Add new column"><i class="bi bi-plus-circle"></i><span>Add Column</span></div>';
  app.innerHTML = html;
  updateStats();
  attachListeners();
}

function updateStats() {
  const $ = id => document.getElementById(id);
  const s = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  s('statTotal', tasks.length);
  const done = tasks.filter(t => t.column === 'Done').length;
  s('statCompleted', done);
  s('statPending', tasks.filter(t => t.column !== 'Done').length);
  const today = new Date(); today.setHours(0,0,0,0);
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate+'T00:00:00') < today && t.column !== 'Done').length;
  s('statOverdue', overdue);
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
  s('sprintPct', pct + '%');
  const fill = document.getElementById('sprintFill');
  if (fill) { fill.style.width = pct + '%'; fill.style.animation = 'none'; fill.offsetHeight; fill.style.animation = ''; }
  const track = fill?.parentElement;
  if (track) { track.setAttribute('aria-valuenow', pct); track.setAttribute('aria-label', 'Sprint progress ' + pct + '%'); }
  s('notifBadge', overdue > 0 ? overdue : '');
}

function updateFilterStatusOptions() {
  const chips = document.getElementById('filterStatus');
  if (!chips) return;
  chips.innerHTML = columns.map(c => {
    const checked = currentFilters.status.includes(c) ? ' checked' : '';
    const on = checked ? ' fchip--on' : '';
    return `<label class="fchip${on}" tabindex="0"><input type="checkbox" class="visually-hidden" value="${c}"${checked} /><span>${c}</span></label>`;
  }).join('');
}

function closeAllDropdowns() {
  if (openDropdown) { openDropdown.remove(); openDropdown = null; }
}

function attachListeners() {
  document.querySelectorAll('.card-task').forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('touchstart', handleTouchStart, { passive: true });
    card.addEventListener('touchmove', handleTouchMove, { passive: false });
    card.addEventListener('touchend', handleTouchEnd);
  });
  document.querySelectorAll('.kol').forEach(col => {
    col.addEventListener('dragover', handleDragOver);
    col.addEventListener('dragenter', handleDragEnter);
    col.addEventListener('dragleave', handleDragLeave);
    col.addEventListener('drop', handleDrop);
  });

  document.querySelectorAll('.edit-task-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openEditModal(parseInt(btn.dataset.id)); });
  });

  document.querySelectorAll('.delete-task-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const task = tasks.find(t => t.id === id);
      if (confirm('Delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        if (task) addActivity('deleted', task.title);
        if (editingTaskId === id) editingTaskId = null;
        render();
      }
    });
  });

  document.querySelectorAll('.add-task-btn').forEach(btn => {
    btn.addEventListener('click', () => { editingTaskId = null; openModal(btn.dataset.column); });
  });

  document.getElementById('addColumnBtn')?.addEventListener('click', () => {
    const name = prompt('Enter column name:');
    if (name && name.trim()) {
      const n = name.trim();
      columns.push(n);
      COLUMN_META[n] = { icon: getDefaultIcon(), iconClass: 'kol-icon--todo', activeClass: '' };
      if (!currentFilters.status.includes(n)) currentFilters.status.push(n);
      updateFilterStatusOptions();
      render();
    }
  });

  document.querySelectorAll('.kol-menu').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      closeAllDropdowns();
      const idx = parseInt(btn.dataset.col);
      const colName = columns[idx];
      const rect = btn.getBoundingClientRect();
      const dd = document.createElement('div');
      dd.className = 'kol-context-menu';

      function posMenu() {
        const r = btn.getBoundingClientRect();
        Object.assign(dd.style, {
          position: 'fixed', background: '#fff', border: '1.5px solid var(--c-border)',
          borderRadius: 'var(--r-sm)', boxShadow: 'var(--sh-md)', zIndex: '999',
          minWidth: '140px', overflow: 'hidden',
          left: Math.min(r.left, window.innerWidth - 160) + 'px',
          top: r.bottom + 4 + 'px'
        });
      }

      posMenu();
      const scrollArea = document.querySelector('.brd-scroll-area');
      const onScroll = () => { if (dd.isConnected) { posMenu(); } else { scrollArea?.removeEventListener('scroll', onScroll); } };
      scrollArea?.addEventListener('scroll', onScroll, { passive: true });

      if (idx > 0) {
        const rb = document.createElement('button');
        rb.innerHTML = '<i class="bi bi-pencil me-2"></i>Rename';
        Object.assign(rb.style, { display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', fontSize: '13px', cursor: 'pointer' });
        rb.addEventListener('mouseenter', () => rb.style.background = 'var(--c-surface)');
        rb.addEventListener('mouseleave', () => rb.style.background = 'transparent');
        rb.addEventListener('click', () => {
          dd.remove(); openDropdown = null;
          const newName = prompt('Rename column:', colName);
          if (newName && newName.trim() && newName !== colName) {
            const n = newName.trim();
            columns[idx] = n;
            tasks.forEach(t => { if (t.column === colName) t.column = n; });
            COLUMN_META[n] = COLUMN_META[colName] || { icon: getDefaultIcon(), iconClass: 'kol-icon--todo', activeClass: '' };
            delete COLUMN_META[colName];
            const si = currentFilters.status.indexOf(colName);
            if (si > -1) currentFilters.status[si] = n;
            updateFilterStatusOptions();
            render();
          }
        });
        dd.appendChild(rb);

        const db = document.createElement('button');
        db.innerHTML = '<i class="bi bi-trash me-2"></i>Delete';
        Object.assign(db.style, { display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', fontSize: '13px', cursor: 'pointer', color: 'var(--c-red)' });
        db.addEventListener('mouseenter', () => db.style.background = '#FFF1F2');
        db.addEventListener('mouseleave', () => db.style.background = 'transparent');
        db.addEventListener('click', () => {
          dd.remove(); openDropdown = null;
          if (confirm(`Delete "${colName}" column and all its tasks?`)) {
            tasks = tasks.filter(t => t.column !== colName);
            columns.splice(idx, 1);
            delete COLUMN_META[colName];
            currentFilters.status = currentFilters.status.filter(s => s !== colName);
            updateFilterStatusOptions();
            render();
          }
        });
        dd.appendChild(db);
      } else {
        const msg = document.createElement('div');
        msg.textContent = 'Cannot remove default column';
        Object.assign(msg.style, { padding: '8px 12px', fontSize: '12px', color: 'var(--c-muted)' });
        dd.appendChild(msg);
      }

      document.body.appendChild(dd);
      openDropdown = dd;
    });
  });
}

function setupAssigneeDropdown() {
  const wrap = document.getElementById('assigneeWrap');
  const trigger = document.getElementById('assigneeTrigger');
  const dropdown = document.getElementById('assigneeDropdown');
  const av = document.getElementById('assigneeAv');
  const display = document.getElementById('assigneeDisplay');
  const hidden = document.getElementById('mfAssignee');
  if (!wrap || !trigger || !dropdown) return;

  const close = () => { wrap.classList.remove('open'); };
  const open = () => { wrap.classList.add('open'); };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    wrap.classList.toggle('open');
  });

  dropdown.querySelectorAll('.assignee-opt').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = opt.dataset.value;
      dropdown.querySelectorAll('.assignee-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      if (val) {
        const ac = MEMBER_COLORS[val] || '64748B';
        av.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(val)}&background=${ac}&color=fff&size=20`;
        av.style.display = 'block';
        display.textContent = val;
        display.className = '';
      } else {
        av.style.display = 'none';
        display.textContent = 'Unassigned';
        display.className = 'assignee-placeholder';
      }
      hidden.value = val;
      close();
    });
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) close();
  });
}

function openModal(defaultStatus) {
  const modal = document.getElementById('modalCreate');
  if (!modal) return;
  editingTaskId = null;
  modal.style.display = 'flex';
  document.getElementById('modalCreateTitle').textContent = 'Create New Task';
  document.getElementById('modalSaveBtn').innerHTML = '<i class="bi bi-plus-lg"></i> Create Task';
  document.getElementById('mfTitle').value = '';
  document.getElementById('mfDesc').value = '';
  document.getElementById('mfPriority').value = 'Medium';
  const statusSelect = document.getElementById('mfStatus');
  statusSelect.innerHTML = columns.map(c => `<option value="${c}"${c === (defaultStatus || 'To Do') ? ' selected' : ''}>${c}</option>`).join('');
  document.getElementById('mfDueDate').value = '';
  const err = document.getElementById('form-error-message');
  if (err) err.style.display = 'none';
  const av = document.getElementById('assigneeAv');
  if (av) { av.style.display = 'none'; }
  const disp = document.getElementById('assigneeDisplay');
  if (disp) { disp.textContent = 'Unassigned'; disp.className = 'assignee-placeholder'; }
  document.getElementById('mfAssignee').value = '';
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
  const statusSelect = document.getElementById('mfStatus');
  statusSelect.innerHTML = columns.map(c => `<option value="${c}"${c === task.column ? ' selected' : ''}>${c}</option>`).join('');
  const av = document.getElementById('assigneeAv');
  const disp = document.getElementById('assigneeDisplay');
  if (task.assignee) {
    const ac = MEMBER_COLORS[task.assignee] || '64748B';
    if (av) { av.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee)}&background=${ac}&color=fff&size=20`; av.style.display = 'block'; }
    if (disp) { disp.textContent = task.assignee; disp.className = ''; }
  } else {
    if (av) av.style.display = 'none';
    if (disp) { disp.textContent = 'Unassigned'; disp.className = 'assignee-placeholder'; }
  }
  document.getElementById('mfAssignee').value = task.assignee || '';
  document.getElementById('mfDueDate').value = task.dueDate || '';
  const err = document.getElementById('form-error-message');
  if (err) err.style.display = 'none';
}

function closeModal() {
  document.getElementById('modalCreate').style.display = 'none';
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

  const getVal = id => { const e = document.getElementById(id); return e ? e.value : ''; };
  const dueDate = getVal('mfDueDate');

  if (dueDate) {
    const today = new Date(); today.setHours(0,0,0,0);
    if (new Date(dueDate + 'T00:00:00') < today) {
      const err = document.getElementById('form-error-message');
      if (err) { err.textContent = 'Due date cannot be in the past.'; err.style.display = 'block'; }
      return;
    }
  }

  const task = {
    id: editingTaskId || nextTaskId++,
    title,
    description: getVal('mfDesc'),
    priority: getVal('mfPriority'),
    column: getVal('mfStatus'),
    assignee: getVal('mfAssignee'),
    dueDate
  };

  if (editingTaskId) {
    tasks = tasks.map(t => t.id === editingTaskId ? { ...t, ...task } : t);
    addActivity('edited', task.title);
  } else {
    tasks.push(task);
    addActivity('created', task.title);
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

function openFilterPanel() { document.getElementById('filterPanel').style.display = 'block'; }
function closeFilterPanel() { document.getElementById('filterPanel').style.display = 'none'; }

document.addEventListener('click', closeAllDropdowns, true);

function init() {
  document.getElementById('newTaskBtn')?.addEventListener('click', () => openModal('To Do'));
  document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('modalSaveBtn')?.addEventListener('click', saveTask);
  document.getElementById('modalCreate')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

  document.getElementById('filterToggleBtn')?.addEventListener('click', openFilterPanel);
  document.getElementById('filterCloseBtn')?.addEventListener('click', closeFilterPanel);
  document.getElementById('filterApplyBtn')?.addEventListener('click', applyFilters);
  document.getElementById('filterResetBtn')?.addEventListener('click', resetFilters);
  document.getElementById('filterPanel')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeFilterPanel(); });

  document.querySelector('.hd-search-input')?.addEventListener('input', e => {
    currentFilters.searchQuery = e.target.value;
    render();
  });

  // ── Dark theme toggle ──────────────────────────────────────
  const themeBtn = document.getElementById('themeToggleBtn');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('projectflow-theme');
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-theme');
    themeBtn.innerHTML = '<i class="bi bi-sun"></i>';
  }
  themeBtn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('projectflow-theme', isDark ? 'dark' : 'light');
    themeBtn.innerHTML = isDark ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
  });

  const activityBtn = document.getElementById('activityToggleBtn');
  const activitySidebar = document.getElementById('activitySidebar');
  if (activityBtn && activitySidebar) {
    activityBtn.addEventListener('click', () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const opening = !activitySidebar.classList.contains('is-open');
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
      closeMobileDrawers(false, true);
      sidebarLeft.classList.toggle('is-open', opening);
      mobileMenuBtn.setAttribute('aria-expanded', String(opening));
      setDrawerOverlay(opening);
    });
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', () => closeMobileDrawers(true, true));
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      closeMobileDrawers(true, true);
    }
  });

  setupAssigneeDropdown();
  updateFilterStatusOptions();
  const now = Date.now();
  activities.push({ id: ++aid, user: USER, action: 'moved', taskName: 'Logo variations', details: 'from Review to Done', timestamp: new Date(now - 1000*60*2) });
  activities.push({ id: ++aid, user: USER, action: 'created', taskName: 'Social media asset kit', details: '', timestamp: new Date(now - 1000*60*60) });
  activities.push({ id: ++aid, user: USER, action: 'moved', taskName: 'Email templates', details: 'from In Progress to Review', timestamp: new Date(now - 1000*60*60*2) });
  activities.push({ id: ++aid, user: USER, action: 'edited', taskName: 'Design tokens', details: '', timestamp: new Date(now - 1000*60*60*24) });
  activities.push({ id: ++aid, user: USER, action: 'created', taskName: 'Color palette', details: '', timestamp: new Date(now - 1000*60*60*48) });
  renderActivityLog();

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
