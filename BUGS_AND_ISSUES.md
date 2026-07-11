# ProjectFlow — Bugs & Issues Report

## Project Overview

A frontend-only Kanban board (Trello-style) built with vanilla HTML, CSS, and JavaScript. Uses `localStorage` for persistence. Run via `python3 -m http.server 3000`.

---

## Critical / High Severity Bugs

### 1. Description field is required in JS but optional in UI

- **File:** `src/app.js:224-228`
- **Issue:** `saveTask()` validates that description is non-empty, but the HTML form in `dashboard.html` has no `required` attribute on the description field and no visual indicator (asterisk). Users filling the form naturally will hit an unexpected validation error.
- **Fix:** Either remove the validation in JS or add `required` + asterisk in the HTML.

### 2. Random comment/attachment counts change on every render

- **File:** `src/app.js:110-111`
- **Issue:** Task cards display `Math.floor(Math.random() * 10)` for comments and `Math.floor(Math.random() * 5)` for attachments. These values regenerate on every `render()` call (after drag-and-drop, filter changes, etc.), making numbers appear to change randomly — confusing UX.
- **Fix:** Store stable counts on each task object instead of generating them at render time.

---

## Medium Severity Bugs

### 3. "Branding" label has no matching CSS class

- **File:** `src/app.js:63`, `css/style.css`
- **Issue:** `LABEL_MAP` for 'Critical' priority produces `['Design','Branding','Goal']`. `getLabelClass('Branding')` returns `lbl--branding`, but the stylesheet only defines `.lbl--brand`. This label renders without any styling.
- **Fix:** Add `.lbl--branding` CSS class or change the label string to 'Brand'.

### 4. Dead code branch in login.js

- **File:** `login.js:193`
- **Issue:** `const sessionUser = match || { name: 'User', email: match.email }` — the `||` fallback is unreachable because the code already returned early with an error alert on line 180 if `!match` was falsy.
- **Fix:** Remove the unreachable fallback, just use `match` directly.

### 5. Reset filters default diverges from HTML initial state

- **File:** `src/app.js:283-284`, `dashboard.html:373-378`
- **Issue:** `resetFilters()` sets the "Ankit Bhalke" assignee checkbox as checked programmatically, but the initial HTML has **all** assignee checkboxes unchecked. On reset, the filter state doesn't match the visual default.
- **Fix:** Sync the JS default state with the HTML initial state.

### 6. Unnecessary `.focus()` call loses cursor position

- **File:** `src/app.js:327`
- **Issue:** After calling `render()` in the search input `oninput` handler, `e.target.focus()` is called. The input already has focus (the event fired from it), and this call resets the cursor position to the end of the input.
- **Fix:** Remove `e.target.focus()`.

---

## Low Severity Bugs

### 7. Task ID collision risk

- **File:** `src/app.js:246`
- **Issue:** New tasks get `id: editingTaskId || Date.now()`. If two tasks are created within the same millisecond, they share the same ID. Rare but possible.
- **Fix:** Append a counter or use `crypto.randomUUID()`.

### 8. Deadline threshold inconsistency

- **File:** `src/features/deadline_tracking.js:28` vs `src/app.js`
- **Issue:** `deadline_tracking.js` defines "Approaching" as `diffDays <= 2` (3-day window), while `app.js`'s `getDueInfo()` only highlights today (`diff === 0`) and tomorrow (`diff === 1`).
- **Fix:** Align both implementations to use the same threshold.

### 9. Plain text passwords in localStorage (✅ Fixed)

- **File:** `login.js`
- **Issue:** User passwords were stored and compared as plain text in `localStorage` under key `pf_users`. No hashing whatsoever.
- **Fix:** SHA-256 hashing via SubtleCrypto API added. Login handler also migrates legacy plain-text passwords automatically.

---

## Code Quality & Design Issues

### 10. Dead / unused feature files

- **Files:** `src/features/search_filtering.js`, `src/features/create_edit_tasks.js`, `src/features/deadline_tracking.js`
- **Issue:** All three files use ES module `export` syntax but are **never imported** anywhere in the codebase. They are completely unreachable dead code.

### 11. Duplicated logic

- **Issue:** `src/features/search_filtering.js` contains a `filterTasks()` function that is an exact duplicate of the one in `src/app.js`. If changes are made to one, the other becomes stale.

### 12. Developer notes in production code

- **Files:** `src/features/create_edit_tasks.js`, `src/features/deadline_tracking.js`
- **Issue:** Both files contain the comment `// This code is written for rehan azim` — a personal note that should have been removed before production.

### 13. Incomplete modular architecture

- **Files (8 empty stubs):**
  - `src/store/state.js`
  - `src/services/storage.js`
  - `src/assets/styles.css`
  - `src/components/activity/ActivityLog.js`
  - `src/components/board/Column.js`
  - `src/components/board/TaskCard.js`
  - `src/components/board/Board.js`
  - `src/utils/helper.js`
  - `src/utils/dates.js`
- **Issue:** These files exist as 0-byte placeholders suggesting a planned modular refactor that was never implemented.

### 14. Sample data mismatch in feature files

- **File:** `src/features/create_edit_tasks.js`
- **Issue:** `getTaskFormHtml()` generates assignee options (`John`, `Sarah`, `Mike`) that do not match the actual team members used throughout the rest of the app (`Ankit`, `Khushi`, `Rehan`, `Sumit`, `Aditya`).

### 15. Hardcoded sample activity feed

- **File:** `dashboard.html:197-241`
- **Issue:** The activity feed is static hardcoded HTML with no connection to actual user actions. It never updates.

### 16. Event listener rebinding on every render

- **Files:** `src/app.js`, `src/dragdrop.js`
- **Issue:** Every `render()` call destroys and recreates all DOM elements via `innerHTML`, then re-binds event listeners on every card. A delegation-based approach would be more efficient for larger boards.

---

## Test Coverage

**Now has a test suite.** `tests/index.html` with QUnit. Covers filters, sort, priority, labels, due-dates, column management, card rendering, and task CRUD round-trips via localStorage.

---

## Summary Table

| # | Severity | Description | File |
|---|----------|-------------|------|
| 1 | **High** | Description required in JS but optional in UI | `src/app.js` |
| 2 | **High** | Random comment/attachment counts change on re-render | `src/app.js` |
| 3 | **Med** | "Branding" label has no matching CSS class | `src/app.js`, `css/style.css` |
| 4 | **Med** | Dead code branch in login (unreachable fallback) | `login.js` |
| 5 | **Med** | Reset filters default diverges from HTML | `src/app.js`, `dashboard.html` |
| 6 | **Med** | Unnecessary `.focus()` loses cursor position | `src/app.js` |
| 7 | **Low** | Task ID collision risk (same millisecond) | `src/app.js` |
| 8 | **Low** | Deadline threshold mismatch (3-day vs 1-day) | `src/features/deadline_tracking.js` |
| 9 | **Low** | Plain text passwords in localStorage | `login.js` |
| — | **Quality** | 3 unused feature files (dead code) | `src/features/*` |
| — | **Quality** | Duplicated filter logic | `search_filtering.js` vs `app.js` |
| — | **Quality** | Developer notes left in production | `create_edit_tasks.js`, `deadline_tracking.js` |
| — | **Quality** | 8 empty stub placeholder files | `src/components/*`, `src/store/*`, etc. |
| — | **Quality** | Sample data mismatch in feature file | `create_edit_tasks.js` |
| — | **Quality** | Hardcoded activity feed | `dashboard.html` |
| — | **Quality** | Event listeners rebound on every render | `app.js`, `dragdrop.js` |
| — | **Missing** | No tests anywhere | Entire repo |
