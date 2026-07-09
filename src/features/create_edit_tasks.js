// This code is written for rehan azim

/**
 * Validates task input fields.
 * @param {string} title - The title of the task.
 * @param {string} dueDate - The due date string (YYYY-MM-DD).
 * @returns {object} An object containing { isValid: boolean, message: string }.
 */
export function validateTaskInput(title, dueDate) {
    if (!title || title.trim() === "") {
        return { isValid: false, message: "Task title cannot be empty." };
    }
    
    if (dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // normalize today's date to midnight
        
        const selectedDate = new Date(dueDate);
        selectedDate.setHours(0, 0, 0, 0); // normalize selected date to midnight
        
        if (selectedDate < today) {
            return { isValid: false, message: "Due date cannot be in the past." };
        }
    }
    
    return { isValid: true, message: "" };
}

/**
 * Generates a simple task form HTML string for creating or editing.
 * @param {object} [task] - Optional task object to pre-fill the form (for editing).
 * @returns {string} The HTML form as a string.
 */
export function getTaskFormHtml(task = null) {
    const isEdit = !!task;
    const title = isEdit ? task.title : "";
    const description = isEdit ? task.description : "";
    const assignee = isEdit ? task.assignee : "";
    const dueDate = isEdit ? task.dueDate : "";
    const priority = isEdit ? task.priority : "Medium";
    
    return `
        <form id="task-form" style="display: flex; flex-direction: column; gap: 10px; max-width: 400px; margin: 10px 0; padding: 10px; border: 1px solid #ccc;">
            <h3>${isEdit ? 'Edit Task' : 'Create Task'}</h3>
            
            <label>Title *</label>
            <input type="text" id="form-title" value="${title}" placeholder="Enter task title" required />
            
            <label>Description</label>
            <textarea id="form-description" placeholder="Enter task description">${description}</textarea>
            
            <label>Assignee</label>
            <select id="form-assignee">
                <option value="" ${assignee === '' ? 'selected' : ''}>Unassigned</option>
                <option value="John" ${assignee === 'John' ? 'selected' : ''}>John</option>
                <option value="Sarah" ${assignee === 'Sarah' ? 'selected' : ''}>Sarah</option>
                <option value="Mike" ${assignee === 'Mike' ? 'selected' : ''}>Mike</option>
            </select>
            
            <label>Due Date</label>
            <input type="date" id="form-due-date" value="${dueDate}" />
            
            <label>Priority</label>
            <select id="form-priority">
                <option value="High" ${priority === 'High' ? 'selected' : ''}>High</option>
                <option value="Medium" ${priority === 'Medium' ? 'selected' : ''}>Medium</option>
                <option value="Low" ${priority === 'Low' ? 'selected' : ''}>Low</option>
            </select>
            
            <div id="form-error-message" style="color: red; font-size: 14px; display: none;"></div>
            
            <div style="display: flex; gap: 10px;">
                <button type="submit" id="form-submit-btn">${isEdit ? 'Save Changes' : 'Add Task'}</button>
                ${isEdit ? '<button type="button" id="form-cancel-btn">Cancel</button>' : ''}
            </div>
        </form>
    `;
}

// This code is written for rehan azim
