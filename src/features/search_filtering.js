// This code is written for rehan azim

import { getDeadlineStatus } from './deadline_tracking.js';

/**
 * Filters a list of tasks based on multiple search and filter criteria.
 * @param {Array} tasks - The array of tasks to filter.
 * @param {object} criteria - The filter criteria.
 * @param {string} criteria.searchQuery - Title search query.
 * @param {string} criteria.assignee - Filter by assignee name.
 * @param {string} criteria.priority - Filter by High, Medium, or Low priority.
 * @param {string} criteria.dueStatus - Filter by Overdue, Approaching, or Far Away.
 * @returns {Array} The filtered array of tasks.
 */
export function filterTasks(tasks, criteria) {
    const { searchQuery, assignee, priority, dueStatus } = criteria;
    
    return tasks.filter(task => {
        // 1. Search by title (case-insensitive)
        if (searchQuery && searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase().trim();
            if (!task.title.toLowerCase().includes(query)) {
                return false;
            }
        }
        
        // 2. Filter by assignee
        if (assignee && assignee !== "") {
            if (task.assignee !== assignee) {
                return false;
            }
        }
        
        // 3. Filter by priority
        if (priority && priority !== "") {
            if (task.priority !== priority) {
                return false;
            }
        }
        
        // 4. Filter by due status (Overdue, Approaching, Far Away)
        if (dueStatus && dueStatus !== "") {
            const { status } = getDeadlineStatus(task.dueDate);
            if (status.toLowerCase() !== dueStatus.toLowerCase()) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Generates simple search and filter controls HTML string.
 * @param {object} currentFilters - The currently applied filters to pre-fill the form.
 * @returns {string} The HTML string for the search and filter UI controls.
 */
export function getFilterControlsHtml(currentFilters = {}) {
    const searchQuery = currentFilters.searchQuery || "";
    const assignee = currentFilters.assignee || "";
    const priority = currentFilters.priority || "";
    const dueStatus = currentFilters.dueStatus || "";

    return `
        <div id="filter-controls" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; padding: 10px; border: 1px dashed #ccc;">
            <input type="text" id="filter-search" value="${searchQuery}" placeholder="Search tasks by title..." style="padding: 5px;" />
            
            <select id="filter-assignee" style="padding: 5px;">
                <option value="">All Assignees</option>
                <option value="John" ${assignee === 'John' ? 'selected' : ''}>John</option>
                <option value="Sarah" ${assignee === 'Sarah' ? 'selected' : ''}>Sarah</option>
                <option value="Mike" ${assignee === 'Mike' ? 'selected' : ''}>Mike</option>
            </select>
            
            <select id="filter-priority" style="padding: 5px;">
                <option value="">All Priorities</option>
                <option value="High" ${priority === 'High' ? 'selected' : ''}>High</option>
                <option value="Medium" ${priority === 'Medium' ? 'selected' : ''}>Medium</option>
                <option value="Low" ${priority === 'Low' ? 'selected' : ''}>Low</option>
            </select>
            
            <select id="filter-due-status" style="padding: 5px;">
                <option value="">All Deadlines</option>
                <option value="Overdue" ${dueStatus === 'Overdue' ? 'selected' : ''}>Overdue</option>
                <option value="Approaching" ${dueStatus === 'Approaching' ? 'selected' : ''}>Approaching</option>
                <option value="Far Away" ${dueStatus === 'Far Away' ? 'selected' : ''}>Far Away</option>
            </select>
            
            <button id="clear-filters-btn" style="padding: 5px 10px;">Clear Filters</button>
        </div>
    `;
}

// This code is written for rehan azim
