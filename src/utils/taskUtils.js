// ── src/utils/taskUtils.js ──────────────────────────────────────────────────
// Helper to accurately determine who assigned/created a task

export function getTaskAssigner(task, employees = [], admins = []) {
  if (!task) return '—';

  // 1. If explicit assignedById / createdById is given, verify who they are
  const assignerId = task.assignedById || task.createdById || task.adminId || task.userId;
  if (assignerId) {
    const matchedAdmin = admins.find(a => a.id === assignerId || a._id === assignerId);
    if (matchedAdmin) return matchedAdmin.name;
    const matchedEmp = employees.find(e => e.id === assignerId || e._id === assignerId);
    if (matchedEmp) {
      // If this employee has "Can Assign Tasks" or is the sole person on this task
      if (matchedEmp.isSenior || (task.employeeIds?.length === 1 && task.employeeIds[0] === matchedEmp.id)) {
        return matchedEmp.name + (task.employeeIds?.length === 1 ? ' (Self)' : '');
      }
    }
  }

  // 2. Explicit assignedByName / createdByName
  if (task.assignedByName && task.assignedByName.trim()) {
    const name = task.assignedByName.trim();
    // Check if this person is an employee without "can assign tasks" permission
    const empByName = employees.find(e => e.name?.toLowerCase() === name.toLowerCase());
    if (empByName) {
      // If the task has multiple employees, but this employee cannot assign tasks to others:
      if (task.employeeIds && task.employeeIds.length > 1 && !empByName.isSenior) {
        // Look if another employee on the task has senior permission
        const seniorOnTask = task.employeeIds
          .map(id => employees.find(e => e.id === id))
          .find(e => e?.isSenior === true);
        if (seniorOnTask) return seniorOnTask.name;
        return 'Admin';
      }
      if (task.employeeIds && task.employeeIds.length === 1 && task.employeeIds[0] === empByName.id) {
        return `${empByName.name} (Self)`;
      }
    }
    return name;
  }
  if (task.createdByName && task.createdByName.trim()) {
    return task.createdByName.trim();
  }
  if (task.authorName && task.authorName.trim()) {
    return task.authorName.trim();
  }

  // 3. For Client tasks: if unassigned, it was submitted by the client
  if (task.clientId && !task.assignedEmployeeId) {
    return 'Client Request';
  }

  // 4. For regular tasks with employee assignments:
  if (task.employeeIds && task.employeeIds.length > 0) {
    const assignedEmpObjects = task.employeeIds
      .map(id => employees.find(e => e.id === id))
      .filter(Boolean);

    // If exactly 1 employee is on the task -> they created it for themselves
    if (assignedEmpObjects.length === 1) {
      return `${assignedEmpObjects[0].name} (Self)`;
    }

    // If multiple employees are on the task:
    // Only an Employee with "Can Assign Tasks" (isSenior === true) or an Admin can assign to other employees
    const seniorEmp = assignedEmpObjects.find(e => e.isSenior === true);
    if (seniorEmp) {
      return seniorEmp.name;
    }

    // If none of the employees on the task has "Can Assign Tasks", then an Admin scheduled it
    return 'Admin';
  }

  // 5. For client task assigned to an employee
  if (task.assignedEmployeeId) {
    return 'Admin';
  }

  return 'Admin';
}
