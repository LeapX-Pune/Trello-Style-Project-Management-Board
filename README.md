# ProjectFlow — Trello-Style Kanban Board

[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.2-7952B3?logo=bootstrap)](https://getbootstrap.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**ProjectFlow** is a full-featured Kanban project management board built with vanilla JavaScript, HTML5, and CSS3. No frameworks, no bundlers — just clean, modern front-end code that runs entirely in the browser with data persisted to `localStorage`.

## Features

### 📋 Kanban Board
- Five default columns: **Backlog → To Do → In Progress → Review → Done**
- Dynamically add, rename, and delete columns
- Horizontal scroll for overflow columns

### 🖱️ Drag & Drop
- **Desktop**: native HTML5 Drag & Drop API with visual feedback
- **Mobile/Tablet**: Pointer Events with `setPointerCapture`, floating clone, and placeholder highlighting for smooth touch-based reordering

### 👁️ Dual View
- **Board View** — classic Kanban card layout
- **List View** — sortable table with columns for task, priority, status, due date, assignee, and actions

### 🔍 Search & Filter
- Real-time text search across task titles and descriptions
- Filter by **priority** (Critical / High / Medium / Low)
- Filter by **status** / column
- Filter by **assignee**

### 📊 Sort Options
- Due date (earliest / latest)
- Priority (highest / lowest)
- Title (A–Z / Z–A)
- Default order

### ⏰ Deadline Tracking
- Visual urgency indicators:
  - 🔴 **Red** — overdue
  - 🟡 **Yellow** — due today, tomorrow, or soon
  - 🟢 **Green** — comfortably far away
- Left-border color strips on cards + colored priority dots

### 👥 Team Management
- Dedicated team page showing all members with avatars, roles, skill tags, task counts, and online/away/offline status
- Dynamic avatar generation via UI Avatars API

### 📜 Activity Log
- Self-contained module tracking 15+ event types (task created, moved, edited, deleted; column changes; priority changes; deadline updates)
- Icons, color coding, and user avatars per entry
- Grouped by **Today / Yesterday / Earlier**
- Auto-refreshing relative timestamps
- Persisted to `localStorage` (max 100 entries)

### 🔔 Notifications
- Mock notification panel with read/unread states
- "Mark all as read" bulk action

### ⚙️ Settings
- Compact card mode
- Toggle avatar visibility on cards
- Clear saved account data

### 📱 Fully Responsive
Five breakpoints: desktop (≥1280px), laptop (1024–1279px), tablet (768–1023px), mobile (<768px), small mobile (<375px). Includes hamburger menus, sliding drawers, and bottom-sheet modals on mobile.

### ♿ Accessibility
- ARIA labels, roles, and live regions
- Keyboard navigation support
- `:focus-visible` outlines
- `prefers-reduced-motion` and `forced-colors` media query support

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Language** | Vanilla JavaScript (ES6+) |
| **Styling** | CSS3 (custom properties, responsive breakpoints, animations) |
| **Layout** | Bootstrap 5.3.2 (grid/utilities only) |
| **Icons** | Bootstrap Icons 1.11.3 |
| **Typography** | Inter (Google Fonts) |
| **Testing** | QUnit 2.20.1 |
| **Persistence** | Browser `localStorage` |
| **Password Hashing** | Web Crypto API (SHA-256) |
| **No build step** | Zero bundlers, transpilers, or package dependencies |

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3 (for the built-in dev server) — or any static file server

### Installation

```bash
git clone https://github.com/your-username/trello-style-project-management-board.git
cd trello-style-project-management-board
```

### Run

```bash
npm start
```

This starts a Python HTTP server on **port 3000**. Open [http://localhost:3000](http://localhost:3000) in your browser.

> Alternatively, use VS Code **Live Server**, `npx serve`, or any static file server. The app requires no backend.

### Run Tests

Open `tests/index.html` in your browser. Tests use QUnit and cover core application logic.

---

## Project Structure

```
├── index.html                  # Root — redirects to welcome.html
├── welcome.html                # Login / Register page
├── dashboard.html              # Main Kanban board + sidebar + modals
├── team.html                   # Team member listing
├── package.json                # Project metadata & npm start script
├── login.css                   # Login/welcome page styles
├── login.js                    # Login/Register logic
│
├── css/
│   ├── style.css               # Main dashboard styles
│   ├── responsive.css          # Responsive breakpoints & mobile drawers
│   ├── activity.css            # Activity log sidebar styles
│   └── team.css                # Team page styles
│
├── src/
│   ├── app.js                  # Core application logic (893 lines)
│   ├── dragdrop.js             # Drag & drop engine (desktop + mobile)
│   ├── styles.css              # Minimal reset for #app element
│   ├── features/
│   │   ├── create_edit_tasks.js   # Task validation & form generation
│   │   ├── search_filtering.js    # Search & filter logic
│   │   └── deadline_tracking.js   # Deadline status calculator
│   └── components/
│       └── activity/
│           └── ActivityLog.js  # Self-contained activity log module
│
└── tests/
    ├── index.html              # QUnit test runner
    └── core.test.js            # Unit tests
```

> **Note**: Several files under `src/store/`, `src/services/`, `src/utils/`, and `src/components/board/` are empty placeholders intended for future refactoring toward a modular architecture.

---

## Data Model

Tasks are stored in `localStorage` under the key `pf_tasks`:

```javascript
{
  id: Number,              // unique task ID
  title: String,           // task title
  description: String,     // task description
  assignee: String,        // team member name
  dueDate: String,         // YYYY-MM-DD
  priority: String,        // "Critical" | "High" | "Medium" | "Low"
  column: String           // column name (dynamic)
}
```

The app seeds 10 sample tasks for a **"Marketing Rebrand 2026"** sprint on first run.

---

## Team Members (Default Seed Data)

| Name | Role |
|---|---|
| Ankit Bhalke | Frontend Developer |
| Khushi Shah | UI/UX Designer |
| Rehan Azim | Frontend Developer |
| Sumit Tiwari | Frontend Developer |
| Sai Shendge | Docs | 

---

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Bootstrap](https://getbootstrap.com) for the utility grid system
- [Bootstrap Icons](https://icons.getbootstrap.com) for iconography
- [UI Avatars](https://ui-avatars.com) for dynamic avatar generation
- [Inter typeface](https://rsms.me/inter/) by Rasmus Andersson
