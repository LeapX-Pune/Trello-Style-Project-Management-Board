// This code is written for rehan azim

import { getTaskFormHtml, validateTaskInput } from './features/create_edit_tasks.js';
import { getDeadlineBadgeHtml } from './features/deadline_tracking.js';
import { filterTasks, getFilterControlsHtml } from './features/search_filtering.js';

// Initial dummy task data
let tasks = [
    { id: 1, title: 'Write PRD document', description: 'Draft the initial project requirement details', assignee: 'John', dueDate: '2026-07-08', priority: 'High', column: 'Done' },
    { id: 2, title: 'Design Landing Page UI', description: 'Create basic layouts for home page', assignee: 'Sarah', dueDate: '2026-07-10', priority: 'Medium', column: 'In Progress' },
    { id: 3, title: 'Implement Authentication', description: 'Setup login/signup flows', assignee: 'Mike', dueDate: '2026-07-25', priority: 'High', column: 'To Do' }
];

// Current filters state
let currentFilters = {
    searchQuery: '',
    assignee: '',
    priority: '',
    dueStatus: ''
};

// Variable to hold task editing state (null if creating)
let editingTaskId = null;

const app = document.getElementById('app');

// Function to render the entire UI
function render() {
    // 1. Get filtered tasks
    const filteredTasks = filterTasks(tasks, currentFilters);

    // 2. Build Columns Map
    const columns = {
        'To Do': [],
        'In Progress': [],
        'Review': [],
        'Done': []
    };

    filteredTasks.forEach(task => {
        if (columns[task.column]) {
            columns[task.column].push(task);
        } else {
            // Default to 'To Do' if column doesn't match
            columns['To Do'].push(task);
        }
    });

    // 3. Build HTML Layout
    let html = `
        <h1 style="font-family: sans-serif;">Trello Style Project Management Board (Demo for Rehan Azim)</h1>
        <p style="font-family: sans-serif; color: #555;">This is a simple demo demonstrating Create/Edit Tasks, Deadline Tracking, and Search/Filters.</p>
        
        <!-- Filters Area -->
        ${getFilterControlsHtml(currentFilters)}
        
        <!-- Task Form Area -->
        <div id="form-container">
            ${getTaskFormHtml(editingTaskId ? tasks.find(t => t.id === editingTaskId) : null)}
        </div>
        
        <!-- Board Columns -->
        <div style="display: flex; gap: 20px; font-family: sans-serif; margin-top: 20px; overflow-x: auto;">
    `;

    // 4. Generate Columns HTML
    for (const columnName in columns) {
        const columnTasks = columns[columnName];
        html += `
            <div style="flex: 1; min-width: 250px; background-color: #f4f5f7; border-radius: 5px; padding: 10px;">
                <h3 style="margin-top: 0; display: flex; justify-content: space-between;">
                    <span>${columnName}</span>
                    <span style="background: #e2e4e6; border-radius: 50%; padding: 2px 8px; font-size: 14px;">${columnTasks.length}</span>
                </h3>
                <div style="display: flex; flex-direction: column; gap: 10px; min-height: 100px;">
                    ${columnTasks.map(task => `
                        <div style="background: white; padding: 10px; border-radius: 3px; border: 1px solid #ccc; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <h4 style="margin: 0 0 5px 0;">${task.title}</h4>
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">${task.description || 'No description'}</p>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 5px;">
                                <span><strong>Assignee:</strong> ${task.assignee || 'Unassigned'}</span>
                                <span style="background: #eee; padding: 2px 5px; border-radius: 3px;">${task.priority}</span>
                            </div>
                            
                            <!-- Deadline Badge -->
                            ${getDeadlineBadgeHtml(task.dueDate)}
                            
                            <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: flex-end;">
                                <button class="edit-task-btn" data-id="${task.id}" style="padding: 2px 6px; font-size: 11px;">Edit</button>
                                <button class="delete-task-btn" data-id="${task.id}" style="padding: 2px 6px; font-size: 11px; background: #ffcccc; border-color: #ff9999;">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += `</div>`;
    app.innerHTML = html;

    // Attach Event Listeners
    setupEventListeners();
}

// Function to attach interactive event listeners
function setupEventListeners() {
    // 1. Task Form Submission
    const form = document.getElementById('task-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('form-title').value;
            const description = document.getElementById('form-description').value;
            const assignee = document.getElementById('form-assignee').value;
            const dueDate = document.getElementById('form-due-date').value;
            const priority = document.getElementById('form-priority').value;
            
            // Perform Validation
            const validation = validateTaskInput(title, dueDate);
            const errorDiv = document.getElementById('form-error-message');
            
            if (!validation.isValid) {
                errorDiv.innerText = validation.message;
                errorDiv.style.display = 'block';
                return;
            }
            
            errorDiv.style.display = 'none';

            if (editingTaskId) {
                // Update existing task
                tasks = tasks.map(task => {
                    if (task.id === editingTaskId) {
                        return { ...task, title, description, assignee, dueDate, priority };
                    }
                    return task;
                });
                editingTaskId = null;
            } else {
                // Create new task
                const newTask = {
                    id: Date.now(),
                    title,
                    description,
                    assignee,
                    dueDate,
                    priority,
                    column: 'To Do' // default column
                };
                tasks.push(newTask);
            }
            
            render();
        });
    }

    // 2. Cancel Edit Button
    const cancelBtn = document.getElementById('form-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            editingTaskId = null;
            render();
        });
    }

    // 3. Edit Task Click
    document.querySelectorAll('.edit-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            editingTaskId = parseInt(e.target.getAttribute('data-id'));
            render();
            // Scroll to form
            document.getElementById('task-form').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // 4. Delete Task Click
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            if (confirm("Are you sure you want to delete this task?")) {
                tasks = tasks.filter(task => task.id !== id);
                if (editingTaskId === id) editingTaskId = null;
                render();
            }
        });
    });

    // 5. Filter Controls Changes
    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.searchQuery = e.target.value;
            render();
            // Restore focus and cursor position to search input
            const input = document.getElementById('filter-search');
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        });
    }

    const assigneeSelect = document.getElementById('filter-assignee');
    if (assigneeSelect) {
        assigneeSelect.addEventListener('change', (e) => {
            currentFilters.assignee = e.target.value;
            render();
        });
    }

    const prioritySelect = document.getElementById('filter-priority');
    if (prioritySelect) {
        prioritySelect.addEventListener('change', (e) => {
            currentFilters.priority = e.target.value;
            render();
        });
    }

    const dueStatusSelect = document.getElementById('filter-due-status');
    if (dueStatusSelect) {
        dueStatusSelect.addEventListener('change', (e) => {
            currentFilters.dueStatus = e.target.value;
            render();
        });
    }

    // 6. Clear Filters Button
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            currentFilters = {
                searchQuery: '',
                assignee: '',
                priority: '',
                dueStatus: ''
            };
            render();
        });
    }
}

// Initial render call
render();

// This code is written for rehan azim
