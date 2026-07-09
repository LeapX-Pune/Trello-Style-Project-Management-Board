export function filterTasks(tasks, criteria) {
  const { searchQuery, priority, status, assignee } = criteria;

  return tasks.filter(task => {
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      if (!task.title.toLowerCase().includes(q) && !(task.description || '').toLowerCase().includes(q)) {
        return false;
      }
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
