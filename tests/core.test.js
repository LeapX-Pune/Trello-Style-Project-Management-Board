const { module, test } = QUnit;

/* ── Helpers ────────────────────────────────────────── */
function makeTask(overrides = {}) {
  return {
    id: Date.now() + Math.random(),
    title: 'Test task',
    description: '',
    priority: 'Medium',
    column: 'To Do',
    assignee: '',
    dueDate: '',
    ...overrides,
  };
}

/* ── Priority helpers ───────────────────────────────── */
module('Priority helpers', function () {
  test('getPriorityClass returns correct class', function (assert) {
    assert.equal(getPriorityClass('Critical'), 'critical');
    assert.equal(getPriorityClass('High'), 'high');
    assert.equal(getPriorityClass('Medium'), 'medium');
    assert.equal(getPriorityClass('Low'), 'low');
  });

  test('getPriorityIcon returns correct icon', function (assert) {
    assert.equal(getPriorityIcon('Critical'), 'exclamation-triangle');
    assert.equal(getPriorityIcon('High'), 'arrow-up');
    assert.equal(getPriorityIcon('Medium'), 'dash');
    assert.equal(getPriorityIcon('Low'), 'arrow-down');
  });
});

/* ── Label helpers ──────────────────────────────────── */
module('Label helpers', function () {
  test('getLabels returns correct labels per priority', function (assert) {
    assert.deepEqual(getLabels('Critical'), ['Design', 'Branding', 'Goal']);
    assert.deepEqual(getLabels('High'), ['Design', 'Dev']);
    assert.deepEqual(getLabels('Medium'), ['Dev', 'Content']);
    assert.deepEqual(getLabels('Low'), ['Research']);
    assert.deepEqual(getLabels('Unknown'), ['Design']);
  });

  test('getLabelClass formats correctly', function (assert) {
    assert.equal(getLabelClass('Design'), 'lbl lbl--design');
    assert.equal(getLabelClass('Branding'), 'lbl lbl--branding');
    assert.equal(getLabelClass('Content'), 'lbl lbl--content');
  });
});

/* ── Due dates ──────────────────────────────────────── */
module('getDueInfo', function () {
  const todayStr = new Date().toISOString().slice(0, 10);

  test('overdue when date is in the past', function (assert) {
    const r = getDueInfo('2020-01-01');
    assert.equal(r.cls, 'due--overdue');
    assert.equal(r.urgency, 'urgency--red');
    assert.equal(r.text, 'Overdue');
  });

  test('today', function (assert) {
    const r = getDueInfo(todayStr);
    assert.equal(r.cls, 'due--today');
    assert.equal(r.text, 'Today');
    assert.equal(r.urgency, 'urgency--yellow');
  });

  test('no due date', function (assert) {
    const r = getDueInfo(null);
    assert.equal(r.cls, 'due--normal');
    assert.equal(r.text, 'No date');
    assert.equal(r.urgency, '');
  });

  test('far future has green urgency', function (assert) {
    const r = getDueInfo('2030-06-15');
    assert.equal(r.urgency, 'urgency--green');
  });
});

/* ── Filter tasks ───────────────────────────────────── */
module('filterTasks', function () {
  const sample = [
    makeTask({ id: 1, title: 'Alpha', priority: 'Critical', column: 'Backlog', assignee: 'Ankit', dueDate: '2020-01-01' }),
    makeTask({ id: 2, title: 'Beta',  priority: 'Low',     column: 'Done',    assignee: 'Khushi', dueDate: '2030-06-15' }),
    makeTask({ id: 3, title: 'Gamma', priority: 'Medium',  column: 'To Do',   assignee: 'Rehan', dueDate: '' }),
  ];

  test('empty filters returns all tasks', function (assert) {
    const r = filterTasks(sample, { search: '', priority: '', status: '', assignee: '', dueStatus: '' });
    assert.equal(r.length, 3);
  });

  test('filter by priority', function (assert) {
    const r = filterTasks(sample, { search: '', priority: 'Critical', status: '', assignee: '', dueStatus: '' });
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 1);
  });

  test('filter by status column', function (assert) {
    const r = filterTasks(sample, { search: '', priority: '', status: 'Done', assignee: '', dueStatus: '' });
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 2);
  });

  test('filter by assignee', function (assert) {
    const r = filterTasks(sample, { search: '', priority: '', status: '', assignee: 'Ankit', dueStatus: '' });
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 1);
  });

  test('filter by search term (title)', function (assert) {
    const r = filterTasks(sample, { search: 'Beta', priority: '', status: '', assignee: '', dueStatus: '' });
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 2);
  });

  test('combined filters', function (assert) {
    const r = filterTasks(sample, { search: '', priority: 'Medium', status: 'To Do', assignee: 'Rehan', dueStatus: '' });
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 3);
  });
});

/* ── Sort tasks ─────────────────────────────────────── */
module('sortTasks', function () {
  const sample = [
    makeTask({ id: 1, title: 'Zeta', priority: 'Low' }),
    makeTask({ id: 2, title: 'Alpha', priority: 'Critical' }),
    makeTask({ id: 3, title: 'Beta', priority: 'High' }),
  ];

  test('sort by title ascending', function (assert) {
    const r = sortTasks(sample, 'title-asc');
    assert.equal(r[0].id, 2);
    assert.equal(r[1].id, 3);
    assert.equal(r[2].id, 1);
  });

  test('sort by title descending', function (assert) {
    const r = sortTasks(sample, 'title-desc');
    assert.equal(r[0].id, 1);
    assert.equal(r[1].id, 3);
    assert.equal(r[2].id, 2);
  });

  test('default sort returns copy unchanged', function (assert) {
    const r = sortTasks(sample, 'default');
    assert.equal(r.length, 3);
  });
});

/* ── Column management ──────────────────────────────── */
module('Column management', function () {
  const originalColumns = { ...COLUMN_META };

  test('addColumn adds a new column', function (assert) {
    addColumn('Test Col');
    assert.ok(COLUMN_META['Test Col']);
    assert.equal(Object.keys(COLUMN_META).length, Object.keys(originalColumns).length + 1);
  });

  test('addColumn ignores falsy name', function (assert) {
    const before = Object.keys(COLUMN_META).length;
    addColumn('');
    assert.equal(Object.keys(COLUMN_META).length, before);
  });

  test('renameColumn renames an existing column', function (assert) {
    renameColumn('Test Col', 'Renamed Col');
    assert.ok(COLUMN_META['Renamed Col']);
    assert.notOk(COLUMN_META['Test Col']);
  });

  test('renameColumn does nothing for bad name', function (assert) {
    const before = Object.keys(COLUMN_META).length;
    renameColumn('Nope', 'Whatever');
    assert.equal(Object.keys(COLUMN_META).length, before);
  });

  test('deleteColumn removes a column and reassigns tasks', function (assert) {
    const taskInCol = makeTask({ id: 999, column: 'Renamed Col' });
    tasks.push(taskInCol);
    deleteColumn('Renamed Col');
    assert.notOk(COLUMN_META['Renamed Col']);
    const moved = tasks.find(t => t.id === 999);
    assert.ok(moved);
    assert.notEqual(moved.column, 'Renamed Col');
    tasks = tasks.filter(t => t.id !== 999);
  });

  test('deleteColumn refuses to remove the last column', function (assert) {
    const keys = Object.keys(COLUMN_META);
    while (Object.keys(COLUMN_META).length > 1) {
      deleteColumn(Object.keys(COLUMN_META)[0]);
    }
    const before = Object.keys(COLUMN_META).length;
    deleteColumn(Object.keys(COLUMN_META)[0]);
    assert.equal(Object.keys(COLUMN_META).length, before);
  });

  // Restore original columns
  test('restore original columns', function (assert) {
    COLUMN_META = originalColumns;
    assert.ok(COLUMN_META['Backlog']);
    assert.ok(COLUMN_META['Done']);
  });
});

/* ── buildCard smoke test ────────────────────────────── */
module('buildCard', function () {
  test('buildCard returns non-empty HTML', function (assert) {
    const task = makeTask({ id: 42, title: 'Smoke', priority: 'High', column: 'In Progress', assignee: 'Ankit Bhalke' });
    const html = buildCard(task);
    assert.ok(html);
    assert.ok(html.includes('Smoke'));
    assert.ok(html.includes('data-id="42"'));
    assert.ok(html.includes('Ankit'));
  });
});

/* ── Task CRUD via localStorage ─────────────────────── */
module('Task CRUD', function () {
  test('saveTasks and loadTasks round-trip', function (assert) {
    const before = tasks.length;
    const newTask = makeTask({ id: 777, title: 'Round-trip' });
    tasks.push(newTask);
    saveTasks();
    loadTasks();
    const found = tasks.find(t => t.id === 777);
    assert.ok(found);
    assert.equal(found.title, 'Round-trip');
    tasks = tasks.filter(t => t.id !== 777);
    saveTasks();
  });
});
