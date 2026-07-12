/**
 * ActivityLog.js — ProjectFlow Activity Log Module
 * ─────────────────────────────────────────────────
 * A fully self-contained, production-quality Activity Log.
 *
 * Responsibilities:
 *  • Store up to 100 activities, newest first
 *  • Persist to localStorage so data survives page reloads
 *  • Render grouped sections: Today / Yesterday / Earlier
 *  • Format relative timestamps automatically
 *  • Animate new activities sliding in at the top
 *  • Show a clean empty state when no activities exist
 *  • Expose helper methods for future search/filter integration
 *
 * Public API (attached to window.ActivityLog):
 *  addActivity(entry)      — record a new activity and refresh UI
 *  clearActivities()       — wipe all activities from state + storage
 *  filterActivities(fn)    — returns a filtered copy of the log
 *  getActivities()         — returns the raw activities array (read-only copy)
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     CONSTANTS
     ══════════════════════════════════════════════════════════ */

  /** LocalStorage key used to persist the activity list. */
  const STORAGE_KEY = 'pf_activity_log';

  /** Maximum number of activities to keep in memory and storage. */
  const MAX_ACTIVITIES = 100;

  /* ══════════════════════════════════════════════════════════
     ACTIVITY TYPE CONFIG
     Each activity type defines the icon and colour class
     shown in the feed. Colour classes map to the existing
     design system (.notif-icon--blue, etc.) so no new
     colours are introduced.
     ══════════════════════════════════════════════════════════ */

  const ACTIVITY_CONFIG = {
    'task-created':       { icon: 'plus-circle-fill',     colorClass: 'al-icon--blue',   label: 'created'          },
    'task-edited':        { icon: 'pencil-fill',           colorClass: 'al-icon--yellow', label: 'edited'           },
    'task-deleted':       { icon: 'trash-fill',            colorClass: 'al-icon--red',    label: 'deleted'          },
    'task-assigned':      { icon: 'person-check-fill',     colorClass: 'al-icon--green',  label: 'assigned'         },
    'task-unassigned':    { icon: 'person-dash-fill',      colorClass: 'al-icon--gray',   label: 'unassigned'       },
    'task-moved':         { icon: 'arrow-right-circle-fill', colorClass: 'al-icon--blue', label: 'moved'            },
    'priority-changed':   { icon: 'fire',                  colorClass: 'al-icon--orange', label: 'changed priority' },
    'deadline-updated':   { icon: 'calendar-check-fill',   colorClass: 'al-icon--purple', label: 'updated deadline' },
    'comment-added':      { icon: 'chat-dots-fill',        colorClass: 'al-icon--green',  label: 'commented on'     },
    'checklist-updated':  { icon: 'check2-square',         colorClass: 'al-icon--teal',   label: 'updated checklist on' },
    'column-created':     { icon: 'layout-three-columns',  colorClass: 'al-icon--blue',   label: 'created column'   },
    'column-deleted':     { icon: 'x-square-fill',         colorClass: 'al-icon--red',    label: 'deleted column'   },
    'column-renamed':     { icon: 'input-cursor-text',     colorClass: 'al-icon--yellow', label: 'renamed column'   },
    'sprint-started':     { icon: 'play-circle-fill',      colorClass: 'al-icon--green',  label: 'started sprint'   },
    'sprint-completed':   { icon: 'trophy-fill',           colorClass: 'al-icon--purple', label: 'completed sprint' },
  };

  /** Fallback config for unknown activity types. */
  const FALLBACK_CONFIG = { icon: 'activity', colorClass: 'al-icon--gray', label: 'updated' };

  /* ══════════════════════════════════════════════════════════
     MEMBER AVATAR COLOURS
     Must match MEMBER_COLORS in app.js so avatars look
     consistent across the whole board.
     ══════════════════════════════════════════════════════════ */

  const MEMBER_COLORS = {
    'Ankit Bhalke':   '2563EB',
    'Khushi Shah':    '8B5CF6',
    'Rehan Azim':     '059669',
    'Sumit Tiwari':   'F59E0B',
    'Aditya Vawahal': 'EF4444',
  };

  /** Default colour for members not in the map above. */
  const DEFAULT_AVATAR_COLOR = '64748B';

  /* ══════════════════════════════════════════════════════════
     STATE
     ══════════════════════════════════════════════════════════ */

  /**
   * In-memory list of activities.
   * Each entry is an object shaped like:
   *  {
   *    id:        string   — unique id (Date.now + random suffix)
   *    type:      string   — one of the keys in ACTIVITY_CONFIG
   *    user:      string   — display name of who performed the action
   *    taskName:  string   — task or column name involved (can be '')
   *    detail:    string   — optional extra context (e.g. column destination)
   *    timestamp: number   — Unix ms when the activity happened
   *  }
   */
  let activities = [];

  /* ══════════════════════════════════════════════════════════
     PERSISTENCE — localStorage helpers
     ══════════════════════════════════════════════════════════ */

  /**
   * Load persisted activities from localStorage.
   * On any parse error we silently start fresh (no crashes).
   */
  function loadActivities() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Validate that we got a proper array before trusting it
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Corrupted storage — start clean
      return [];
    }
  }

  /**
   * Persist the current activities array to localStorage.
   * Silently fails in environments where storage is unavailable
   * (e.g. private browsing with strict settings).
   */
  function saveActivities() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch {
      // Storage quota or access error — carry on without persisting
    }
  }

  /* ══════════════════════════════════════════════════════════
     TIMESTAMP FORMATTING
     ══════════════════════════════════════════════════════════ */

  /**
   * Convert a Unix timestamp (ms) into a human-friendly relative string.
   *
   * Rules:
   *  < 60 seconds  → "Just now"
   *  < 60 minutes  → "X min ago"
   *  < 24 hours    → "X hr ago"
   *  yesterday     → "Yesterday"
   *  same year     → "Jul 10"
   *  older         → "Jul 10, 2024"
   *
   * @param {number} timestamp — Unix ms
   * @returns {string}
   */
  function formatRelativeTime(timestamp) {
    const now     = Date.now();
    const diffMs  = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr  = Math.floor(diffMin / 60);

    if (diffSec < 60)  return 'Just now';
    if (diffMin < 60)  return diffMin === 1 ? '1 min ago' : `${diffMin} min ago`;
    if (diffHr  < 24)  return diffHr  === 1 ? '1 hr ago'  : `${diffHr} hr ago`;

    // Check if the activity was "yesterday"
    const actDate   = new Date(timestamp);
    const today     = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth()    === b.getMonth()    &&
      a.getDate()     === b.getDate();

    if (sameDay(actDate, yesterday)) return 'Yesterday';

    // Older — show "Mon DD" or "Mon DD, YYYY"
    const opts = actDate.getFullYear() === today.getFullYear()
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };

    return actDate.toLocaleDateString('en-US', opts);
  }

  /* ══════════════════════════════════════════════════════════
     GROUPING
     ══════════════════════════════════════════════════════════ */

  /**
   * Group an array of activities into three buckets:
   *  Today, Yesterday, Earlier
   *
   * Returns an array of group objects, each with:
   *  { label: string, items: Activity[] }
   *
   * Empty groups are omitted so the feed stays tidy.
   *
   * @param {object[]} list — activities sorted newest-first
   * @returns {{ label: string, items: object[] }[]}
   */
  function groupActivities(list) {
    const today     = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (ts, ref) => {
      const d = new Date(ts);
      return d.getFullYear() === ref.getFullYear() &&
             d.getMonth()    === ref.getMonth()    &&
             d.getDate()     === ref.getDate();
    };

    const groups = {
      Today:     [],
      Yesterday: [],
      Earlier:   [],
    };

    list.forEach(item => {
      if      (sameDay(item.timestamp, today))     groups.Today.push(item);
      else if (sameDay(item.timestamp, yesterday)) groups.Yesterday.push(item);
      else                                         groups.Earlier.push(item);
    });

    // Return only non-empty groups, preserving the natural order
    return Object.entries(groups)
      .filter(([, items]) => items.length > 0)
      .map(([label, items]) => ({ label, items }));
  }

  /* ══════════════════════════════════════════════════════════
     AVATAR HELPER
     ══════════════════════════════════════════════════════════ */

  /**
   * Build the ui-avatars.com URL for a given user name.
   * Uses the same colour palette as the rest of the board.
   *
   * @param {string} name
   * @returns {string} — image src URL
   */
  function avatarUrl(name) {
    const color   = MEMBER_COLORS[name] || DEFAULT_AVATAR_COLOR;
    const encoded = encodeURIComponent(name || 'Unknown');
    return `https://ui-avatars.com/api/?name=${encoded}&background=${color}&color=fff&size=28`;
  }

  /* ══════════════════════════════════════════════════════════
     RENDERING — individual activity item
     ══════════════════════════════════════════════════════════ */

  /**
   * Build the DOM element for one activity entry.
   * Using DOM methods (not innerHTML) keeps XSS risk minimal
   * when user-controlled strings like task names are inserted.
   *
   * @param {object}  entry   — activity object from the activities array
   * @param {boolean} isNew   — true for freshly added entries (triggers slide animation)
   * @returns {HTMLElement}
   */
  function renderActivity(entry, isNew = false) {
    const config = ACTIVITY_CONFIG[entry.type] || FALLBACK_CONFIG;

    // ── Outer wrapper ────────────────────────────────────────
    const item = document.createElement('div');
    item.className = 'al-item' + (isNew ? ' al-item--new' : '');
    item.dataset.id = entry.id;

    // ── Left: icon badge ─────────────────────────────────────
    const iconWrap = document.createElement('div');
    iconWrap.className = `al-icon-wrap ${config.colorClass}`;
    iconWrap.setAttribute('aria-hidden', 'true');

    const icon = document.createElement('i');
    icon.className = `bi bi-${config.icon}`;
    iconWrap.appendChild(icon);

    // ── Right: text content ──────────────────────────────────
    const content = document.createElement('div');
    content.className = 'al-content';

    // Avatar
    const avatar = document.createElement('img');
    avatar.src       = avatarUrl(entry.user);
    avatar.alt       = entry.user;
    avatar.className = 'al-av';
    avatar.title     = entry.user;

    // Text paragraph — built with text nodes to stay XSS-safe
    const text = document.createElement('p');
    text.className = 'al-text';

    const strong = document.createElement('strong');
    strong.textContent = entry.user || 'Someone';
    text.appendChild(strong);

    // Action verb
    text.appendChild(document.createTextNode(' ' + config.label + ' '));

    // Task name (highlighted in blue)
    if (entry.taskName) {
      const taskSpan = document.createElement('span');
      taskSpan.className   = 'al-task-name';
      taskSpan.textContent = `"${entry.taskName}"`;
      text.appendChild(taskSpan);
    }

    // Optional detail (e.g. "to Review", "from High to Critical")
    if (entry.detail) {
      text.appendChild(document.createTextNode(' ' + entry.detail));
    }

    // Timestamp
    const timeEl = document.createElement('time');
    timeEl.className   = 'al-time';
    timeEl.dateTime    = new Date(entry.timestamp).toISOString();
    timeEl.textContent = formatRelativeTime(entry.timestamp);

    // Assembly
    content.appendChild(avatar);
    content.appendChild(text);
    content.appendChild(timeEl);

    item.appendChild(iconWrap);
    item.appendChild(content);

    return item;
  }

  /* ══════════════════════════════════════════════════════════
     RENDERING — group header
     ══════════════════════════════════════════════════════════ */

  /**
   * Build the DOM node for a date-group label (e.g. "Today").
   *
   * @param {string} label
   * @returns {HTMLElement}
   */
  function renderGroup(label) {
    const div = document.createElement('div');
    div.className = 'al-group';

    const lbl = document.createElement('span');
    lbl.className   = 'al-group-lbl';
    lbl.textContent = label;

    div.appendChild(lbl);
    return div;
  }

  /* ══════════════════════════════════════════════════════════
     RENDERING — empty state
     ══════════════════════════════════════════════════════════ */

  /**
   * Build the empty-state placeholder shown when there are
   * no activities recorded yet.
   *
   * @returns {HTMLElement}
   */
  function renderEmptyState() {
    const wrap = document.createElement('div');
    wrap.className = 'al-empty';

    wrap.innerHTML = `
      <div class="al-empty-icon"><i class="bi bi-clock-history"></i></div>
      <p class="al-empty-title">No activity yet</p>
      <p class="al-empty-sub">Task updates will appear here.</p>
    `;

    return wrap;
  }

  /* ══════════════════════════════════════════════════════════
     FULL RE-RENDER
     ══════════════════════════════════════════════════════════ */

  /**
   * Completely re-render the feed container.
   * Clears existing content and writes grouped activity items.
   * Called on initial load and after clearActivities().
   */
  function renderAll() {
    const feed = document.getElementById('alFeed');
    if (!feed) return;

    // Clear the feed before rebuilding
    feed.innerHTML = '';

    if (activities.length === 0) {
      feed.appendChild(renderEmptyState());
      return;
    }

    const grouped = groupActivities(activities);

    grouped.forEach(group => {
      // Group header
      feed.appendChild(renderGroup(group.label));

      // Activity items within this group
      group.items.forEach(entry => {
        feed.appendChild(renderActivity(entry, false));
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     PREPEND A SINGLE ACTIVITY (live update)
     ══════════════════════════════════════════════════════════ */

  /**
   * Insert a newly added activity at the correct position in
   * the feed without a full re-render.
   *
   * Strategy:
   *  1. If the feed currently shows an empty state, replace it with
   *     a full re-render (handles the first-ever activity).
   *  2. If a "Today" group header already exists, insert the new
   *     item right after it.
   *  3. If no "Today" group exists yet (activity log currently only
   *     shows Yesterday/Earlier), do a full re-render to add the
   *     group header cleanly.
   *
   * @param {object} entry — the newly added activity
   */
  function prependActivity(entry) {
    const feed = document.getElementById('alFeed');
    if (!feed) return;

    // Case 1: feed is empty — do full render
    if (feed.querySelector('.al-empty')) {
      renderAll();
      // Animate the first item after render
      const first = feed.querySelector('.al-item');
      if (first) first.classList.add('al-item--new');
      return;
    }

    // Case 2: a "Today" group already exists — insert after its label
    const todayLabels = feed.querySelectorAll('.al-group-lbl');
    let todayGroup = null;
    todayLabels.forEach(lbl => {
      if (lbl.textContent.trim() === 'Today') todayGroup = lbl.parentNode;
    });

    if (todayGroup) {
      // Insert after the group header div
      const newItem = renderActivity(entry, true);
      todayGroup.insertAdjacentElement('afterend', newItem);

      // Remove the animation class once the transition completes
      // so repeat entries still animate if the user adds more
      newItem.addEventListener('animationend', () => {
        newItem.classList.remove('al-item--new');
      }, { once: true });
      return;
    }

    // Case 3: no Today group — full re-render
    renderAll();
    const first = feed.querySelector('.al-item');
    if (first) first.classList.add('al-item--new');
  }

  /* ══════════════════════════════════════════════════════════
     TIMESTAMPS REFRESH
     Timestamps like "2 min ago" age over time. We update them
     every 60 seconds so the displayed times stay accurate.
     ══════════════════════════════════════════════════════════ */

  /**
   * Walk every visible timestamp element and refresh its text
   * based on the stored datetime attribute.
   */
  function refreshTimestamps() {
    const feed = document.getElementById('alFeed');
    if (!feed) return;

    feed.querySelectorAll('time.al-time[datetime]').forEach(el => {
      const ts = new Date(el.getAttribute('datetime')).getTime();
      if (!isNaN(ts)) el.textContent = formatRelativeTime(ts);
    });
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — addActivity
     ══════════════════════════════════════════════════════════ */

  /**
   * Record a new activity and update the UI immediately.
   *
   * @param {object} opts
   * @param {string} opts.type      — activity type key (see ACTIVITY_CONFIG)
   * @param {string} opts.user      — name of the user who acted
   * @param {string} [opts.taskName] — name of the task involved
   * @param {string} [opts.detail]   — extra context string
   */
  function addActivity({ type, user, taskName = '', detail = '' }) {
    // Build the entry object
    const entry = {
      id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      user,
      taskName,
      detail,
      timestamp: Date.now(),
    };

    // Prepend — newest activity is always index 0
    activities.unshift(entry);

    // Trim old entries if we've exceeded the limit
    if (activities.length > MAX_ACTIVITIES) {
      activities = activities.slice(0, MAX_ACTIVITIES);
    }

    // Persist the updated list
    saveActivities();

    // Inject into the DOM without a full page re-render
    prependActivity(entry);
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — clearActivities
     ══════════════════════════════════════════════════════════ */

  /**
   * Remove all activities from memory and localStorage,
   * then show the empty state in the feed.
   */
  function clearActivities() {
    activities = [];
    saveActivities();
    renderAll();
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — filterActivities
     Search/filter helper for future integration.
     Pass a predicate function — returns a filtered copy.
     ══════════════════════════════════════════════════════════ */

  /**
   * Return a filtered copy of the activities array.
   * Does NOT mutate the internal state.
   *
   * Example usage (future search feature):
   *  ActivityLog.filterActivities(a => a.user === 'Khushi Shah')
   *  ActivityLog.filterActivities(a => a.taskName.includes('Logo'))
   *
   * @param {Function} predicate — function(activity) → boolean
   * @returns {object[]}
   */
  function filterActivities(predicate) {
    if (typeof predicate !== 'function') return [...activities];
    return activities.filter(predicate);
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — getActivities
     ══════════════════════════════════════════════════════════ */

  /**
   * Return a read-only (shallow) copy of the activities array.
   * Useful for external search UI or analytics.
   *
   * @returns {object[]}
   */
  function getActivities() {
    return [...activities];
  }

  /* ══════════════════════════════════════════════════════════
     CLEAR BUTTON HANDLER
     ══════════════════════════════════════════════════════════ */

  /**
   * Wire up the "Clear" button inside the activity sidebar.
   * The button is optional — if it doesn't exist the function
   * does nothing, so the module stays robust against HTML changes.
   */
  function bindClearButton() {
    const btn = document.getElementById('alClearBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      // Small UX guard: only ask if there's something to clear
      if (activities.length === 0) return;
      if (confirm('Clear all activity history?')) clearActivities();
    });
  }

  /* ══════════════════════════════════════════════════════════
     INITIALISE
     Called once on DOMContentLoaded. Loads persisted data and
     performs the first render.
     ══════════════════════════════════════════════════════════ */

  function init() {
    // Load persisted activities from localStorage
    activities = loadActivities();

    // Initial render of the feed
    renderAll();

    // Wire up control buttons
    bindClearButton();

    // Refresh relative timestamps every 60 seconds automatically
    setInterval(refreshTimestamps, 60 * 1000);
  }

  /* ══════════════════════════════════════════════════════════
     EXPOSE PUBLIC API
     Attach to window so app.js and dragdrop.js can call
     ActivityLog.addActivity(...) after any state change.
     ══════════════════════════════════════════════════════════ */

  window.ActivityLog = {
    addActivity,
    clearActivities,
    filterActivities,
    getActivities,
    // Expose low-level helpers for testing / future search UI
    formatRelativeTime,
    groupActivities,
  };

  /* ══════════════════════════════════════════════════════════
     BOOT
     We use DOMContentLoaded so the sidebar is in the DOM
     before we try to query it.
     ══════════════════════════════════════════════════════════ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already parsed (script loaded with defer or after body)
    init();
  }

})();
