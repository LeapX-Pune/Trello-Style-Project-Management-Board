/**
 * dragdrop.js — ProjectFlow Kanban Drag & Drop
 * ─────────────────────────────────────────────
 * Desktop  → HTML5 Drag & Drop API (mouse events)
 * Mobile / Tablet → Pointer Events with setPointerCapture
 *   (bypasses the scroll-intercept problem on overflow containers)
 *
 * Public API (re-called by app.js after every render):
 *   initDragDrop()
 */

/* ─── Module-level drag state ───────────────────────────────── */
const dragState = {
  active:       false,  // true once a drag is confirmed (past threshold)
  taskId:       null,   // id of the task being dragged
  draggingEl:   null,   // original .card-task DOM node
  sourceColumn: null,   // column name where the drag started
  placeholder:  null,   // blue dashed gap showing drop position
  clone:        null,   // fixed-position floating card (touch only)
  overColumn:   null,   // .kol element currently highlighted
  pointerId:    null,   // captured pointer id (touch only)
  startX:       0,
  startY:       0,
  offsetX:      0,      // finger offset from card left edge
  offsetY:      0,      // finger offset from card top edge
};

/* ════════════════════════════════════════════════════════════
   SHARED HELPERS
   ════════════════════════════════════════════════════════════ */

/** Get the column name from a .kol DOM element. */
function getColumnName(kolEl) {
  if (!kolEl) return null;
  const t = kolEl.querySelector('.kol-title');
  return t ? t.textContent.trim() : null;
}

/**
 * Use elementFromPoint to find the .kol element at (x, y).
 * Temporarily hides the touch-clone so it doesn't block the hit test.
 */
function getKolAtPoint(x, y) {
  const clone = dragState.clone;
  if (clone) clone.style.visibility = 'hidden';
  const el = document.elementFromPoint(x, y);
  if (clone) clone.style.visibility = '';
  return el ? el.closest('.kol') : null;
}

/** Create the placeholder that takes the card's place while dragging. */
function makePlaceholder(refCard) {
  const ph = document.createElement('div');
  ph.className = 'dnd-placeholder';
  ph.style.height = refCard.offsetHeight + 'px';
  return ph;
}

/** Safely remove the placeholder from the DOM. */
function removePlaceholder() {
  if (dragState.placeholder && dragState.placeholder.parentNode) {
    dragState.placeholder.parentNode.removeChild(dragState.placeholder);
  }
  dragState.placeholder = null;
}

/** Add blue-glow highlight to a column. */
function highlightKol(kolEl) {
  if (dragState.overColumn === kolEl) return;
  clearHighlights();
  dragState.overColumn = kolEl;
  kolEl.classList.add('kol--drag-over');
}

/** Remove all column highlights. */
function clearHighlights() {
  document.querySelectorAll('.kol--drag-over')
    .forEach(el => el.classList.remove('kol--drag-over'));
  dragState.overColumn = null;
}

/**
 * Move the placeholder into the correct position inside a column.
 * Inserts before `targetCard` (the card whose upper-half the pointer is over),
 * or appends to the end of the column's card list.
 */
function movePlaceholder(kolEl, clientY) {
  const container = kolEl.querySelector('.kol-cards');
  if (!container || !dragState.placeholder) return;

  // Collect visible cards (skip the dragging card and existing placeholder)
  const cards = Array.from(
    container.querySelectorAll('.card-task:not(.card--dragging)')
  );

  let insertBefore = null;
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      insertBefore = card;
      break;
    }
  }

  // Only touch the DOM if the position actually changed
  const currentNext = dragState.placeholder.nextElementSibling;
  if (currentNext !== insertBefore) {
    if (insertBefore) {
      container.insertBefore(dragState.placeholder, insertBefore);
    } else {
      container.appendChild(dragState.placeholder);
    }
  }
}

/**
 * Read the task-id of the card that comes directly after the placeholder.
 * Returns null if the placeholder is last in its column.
 */
function getBeforeTaskId() {
  if (!dragState.placeholder) return null;
  const next = dragState.placeholder.nextElementSibling;
  if (!next) return null;
  const id = parseInt(next.getAttribute('data-id'), 10);
  return isNaN(id) ? null : id;
}

/**
 * Update the tasks array and re-render the board.
 * @param {number}      taskId      - id of the moved task
 * @param {string}      newColumn   - destination column name
 * @param {number|null} beforeId    - insert before this task id (null = end)
 */
function commitMove(taskId, newColumn, beforeId) {
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) return;

  const [task] = tasks.splice(idx, 1);
  task.column = newColumn;

  if (beforeId !== null) {
    const bi = tasks.findIndex(t => t.id === beforeId);
    bi !== -1 ? tasks.splice(bi, 0, task) : tasks.push(task);
  } else {
    tasks.push(task);
  }

  render(); // app.js → also calls initDragDrop() again
}

/** Full drag teardown — clears all visual state. */
function resetDragState() {
  if (dragState.clone && dragState.clone.parentNode) {
    dragState.clone.parentNode.removeChild(dragState.clone);
  }
  removePlaceholder();
  clearHighlights();

  if (dragState.draggingEl) {
    dragState.draggingEl.classList.remove('card--dragging');
    // Restore touch-action so normal scrolling works again
    dragState.draggingEl.style.touchAction = '';
  }

  dragState.active       = false;
  dragState.taskId       = null;
  dragState.draggingEl   = null;
  dragState.sourceColumn = null;
  dragState.placeholder  = null;
  dragState.clone        = null;
  dragState.overColumn   = null;
  dragState.pointerId    = null;
}

/* ════════════════════════════════════════════════════════════
   MOUSE — HTML5 Drag & Drop API  (desktop)
   ════════════════════════════════════════════════════════════ */

function bindMouseDrag(card) {
  card.setAttribute('draggable', 'true');

  card.addEventListener('dragstart', function (e) {
    dragState.taskId       = parseInt(this.getAttribute('data-id'), 10);
    dragState.draggingEl   = this;
    dragState.sourceColumn = getColumnName(this.closest('.kol'));
    dragState.placeholder  = makePlaceholder(this);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(dragState.taskId));

    // Defer class addition so the browser captures the un-faded snapshot
    requestAnimationFrame(() => {
      if (dragState.draggingEl) dragState.draggingEl.classList.add('card--dragging');
    });
  });

  card.addEventListener('dragend', function () {
    this.classList.remove('card--dragging');
    removePlaceholder();
    clearHighlights();
    dragState.draggingEl   = null;
    dragState.taskId       = null;
    dragState.sourceColumn = null;
  });
}

function bindMouseDrop(kolEl) {
  kolEl.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    highlightKol(this);
    if (dragState.placeholder) movePlaceholder(this, e.clientY);
  });

  kolEl.addEventListener('dragleave', function (e) {
    if (!this.contains(e.relatedTarget)) {
      this.classList.remove('kol--drag-over');
      if (dragState.overColumn === this) dragState.overColumn = null;
    }
  });

  kolEl.addEventListener('drop', function (e) {
    e.preventDefault();
    const col = getColumnName(this);
    if (!col || dragState.taskId === null) return;
    const beforeId = getBeforeTaskId();
    commitMove(dragState.taskId, col, beforeId);
  });
}

/* ════════════════════════════════════════════════════════════
   TOUCH — Pointer Events  (mobile & tablet)

   Key technique:
   • card.setPointerCapture(pointerId)  → all subsequent pointer
     events are routed to the card element even when the finger
     moves over other DOM nodes.  This completely bypasses the
     browser's native scroll interception on overflow containers.
   • touch-action: none on the card while dragging tells the
     browser "I'm handling this gesture, don't scroll".
   ════════════════════════════════════════════════════════════ */

function bindTouchDrag(card) {
  card.addEventListener('pointerdown', handlePointerDown, { passive: false });
}

function handlePointerDown(e) {
  // Only handle touch/stylus; mouse is covered by HTML5 DnD above
  if (e.pointerType === 'mouse') return;
  // Let button/link taps pass through unchanged
  if (e.target.closest('button, a')) return;

  e.preventDefault(); // prevent text selection

  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();

  dragState.taskId       = parseInt(card.getAttribute('data-id'), 10);
  dragState.draggingEl   = card;
  dragState.sourceColumn = getColumnName(card.closest('.kol'));
  dragState.startX       = e.clientX;
  dragState.startY       = e.clientY;
  dragState.offsetX      = e.clientX - rect.left;
  dragState.offsetY      = e.clientY - rect.top;
  dragState.pointerId    = e.pointerId;
  dragState.active       = false;

  // Capture the pointer → all pointermove/up events come to this card
  // regardless of which element the finger is over.
  card.setPointerCapture(e.pointerId);

  card.addEventListener('pointermove',   handlePointerMove,   { passive: false });
  card.addEventListener('pointerup',     handlePointerUp);
  card.addEventListener('pointercancel', handlePointerCancel);
}

function handlePointerMove(e) {
  e.preventDefault();

  const card = dragState.draggingEl;
  if (!card) return;

  const dx = Math.abs(e.clientX - dragState.startX);
  const dy = Math.abs(e.clientY - dragState.startY);

  // ── Threshold: commit to drag after 8px movement ──
  if (!dragState.active) {
    if (dx < 8 && dy < 8) return; // still a tap — do nothing

    // Lock: prevent the page from scrolling during this drag
    card.style.touchAction = 'none';
    dragState.active = true;

    // Build the floating clone
    const clone = card.cloneNode(true);
    clone.className   = 'card--touch-clone'; // uses fixed positioning
    clone.style.width  = card.offsetWidth + 'px';
    clone.style.left   = (e.clientX - dragState.offsetX) + 'px';
    clone.style.top    = (e.clientY - dragState.offsetY + window.scrollY) + 'px';
    document.body.appendChild(clone);
    dragState.clone = clone;

    // Insert placeholder in the card's original slot
    dragState.placeholder = makePlaceholder(card);
    card.parentNode.insertBefore(dragState.placeholder, card);

    // Fade the original
    card.classList.add('card--dragging');
  }

  // ── Move the floating clone ──
  if (dragState.clone) {
    dragState.clone.style.left = (e.clientX - dragState.offsetX) + 'px';
    dragState.clone.style.top  = (e.clientY - dragState.offsetY + window.scrollY) + 'px';
  }

  // ── Highlight column & reposition placeholder ──
  const kolEl = getKolAtPoint(e.clientX, e.clientY);
  if (kolEl) {
    highlightKol(kolEl);
    movePlaceholder(kolEl, e.clientY);
  } else {
    clearHighlights();
  }
}

function handlePointerUp(e) {
  const card = dragState.draggingEl;
  if (!card) return;

  // Remove the per-card listeners
  card.removeEventListener('pointermove',   handlePointerMove);
  card.removeEventListener('pointerup',     handlePointerUp);
  card.removeEventListener('pointercancel', handlePointerCancel);

  if (!dragState.active) {
    // Was just a tap — clean up minimal state
    dragState.draggingEl   = null;
    dragState.taskId       = null;
    dragState.sourceColumn = null;
    dragState.active       = false;
    return;
  }

  // Determine the drop target from the placeholder's current location
  const ph = dragState.placeholder;
  let newColumn = dragState.sourceColumn; // fallback: same column
  if (ph && ph.parentNode) {
    const kolEl = ph.parentNode.closest('.kol');
    if (kolEl) newColumn = getColumnName(kolEl);
  }

  const beforeId = getBeforeTaskId();
  const movedId  = dragState.taskId;

  resetDragState();

  if (movedId !== null && newColumn) {
    commitMove(movedId, newColumn, beforeId);
  }
}

function handlePointerCancel() {
  const card = dragState.draggingEl;
  if (card) {
    card.removeEventListener('pointermove',   handlePointerMove);
    card.removeEventListener('pointerup',     handlePointerUp);
    card.removeEventListener('pointercancel', handlePointerCancel);
  }
  resetDragState();
}

/* ════════════════════════════════════════════════════════════
   PUBLIC INIT
   Called by app.js → attachCardListeners() after every render()
   ════════════════════════════════════════════════════════════ */
function initDragDrop() {
  document.querySelectorAll('.card-task').forEach(card => {
    bindMouseDrag(card);
    bindTouchDrag(card);
  });

  document.querySelectorAll('.kol').forEach(bindMouseDrop);
}
