// This code is written for rehan azim

/**
 * Calculates the deadline status of a task based on its due date.
 * - Red (Overdue): Due date is in the past.
 * - Yellow (Approaching): Due date is today, tomorrow, or the day after (within 2 days).
 * - Green (Far Away): Due date is more than 2 days in the future.
 * 
 * @param {string} dueDateString - The due date as a string (YYYY-MM-DD).
 * @returns {object} An object containing { status: string, color: string }
 */
export function getDeadlineStatus(dueDateString) {
    if (!dueDateString) {
        return { status: "No Due Date", color: "gray" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize to midnight

    const dueDate = new Date(dueDateString);
    dueDate.setHours(0, 0, 0, 0); // normalize to midnight

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { status: "Overdue", color: "red" };
    } else if (diffDays <= 2) {
        return { status: "Approaching", color: "orange" };
    } else {
        return { status: "Far Away", color: "green" };
    }
}

/**
 * Returns a simple HTML badge indicating deadline status.
 * @param {string} dueDateString - The due date as a string (YYYY-MM-DD).
 * @returns {string} HTML string representing the deadline status badge.
 */
export function getDeadlineBadgeHtml(dueDateString) {
    if (!dueDateString) return "";
    
    const { status, color } = getDeadlineStatus(dueDateString);
    
    return `
        <span class="deadline-badge" style="
            display: inline-block; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-size: 11px; 
            font-weight: bold; 
            color: white; 
            background-color: ${color};
            margin-top: 5px;
        ">
            Due: ${dueDateString} (${status})
        </span>
    `;
}

// This code is written for rehan azim
