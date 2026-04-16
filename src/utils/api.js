// Mock API utility for frontend-only development
// Use api.real.js when you want to connect to the backend again.

function mockDelay(ms = 150) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateToken(user) {
  const payload = btoa(JSON.stringify(user));
  return `mockHeader.${payload}.mockSignature`;
}

function getStore(key, defaultVal) {
  return JSON.parse(localStorage.getItem(`mock_${key}`) || JSON.stringify(defaultVal));
}

function setStore(key, data) {
  localStorage.setItem(`mock_${key}`, JSON.stringify(data));
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: async (username, password) => {
    await mockDelay();
    // Superadmin
    if (username === 'superadmin' && password === 'superadmin123') {
      return { token: generateToken({ id: 'superadmin123', name: 'Super Admin', role: 'superadmin' }) };
    }
    // Admin accounts
    const admins = getStore('admins', []);
    const adminUser = admins.find(a => a.username === username && a.password === password);
    if (adminUser) {
      return { token: generateToken({ id: adminUser.id, name: adminUser.name, role: 'admin' }) };
    }
    // Client accounts
    const clients = getStore('clients', []);
    const clientUser = clients.find(c => c.username === username && c.password === password);
    if (clientUser) {
      return {
        token: generateToken({
          id: clientUser.id,
          name: clientUser.name,
          role: 'client',
          projectId: clientUser.projectId,
        })
      };
    }
    // Employee accounts
    const employees = getStore('employees', []);
    const emp = employees.find(e => e.username === username && e.password === password);
    if (emp) {
      return {
        token: generateToken({
          id: emp.id,
          name: emp.name,
          role: 'employee',
          designation: emp.designation,
          assignedServiceIds: emp.assignedServiceIds || [],
          assignedProjectIds: emp.assignedProjectIds || [],
          isSenior: !!emp.isSenior
        })
      };
    }
    throw new Error('Invalid credentials');
  },

  // ── System Settings ───────────────────────────────────────────────────────
  getSystemSettings: async () => {
    return getStore('system_settings', {
      adminCanManageEmployees: true, // Default: admins can see/edit employees
    });
  },
  updateSystemSettings: async (settings) => {
    await mockDelay();
    setStore('system_settings', settings);
    return settings;
  },

  setupAdmin: async () => {
    await mockDelay();
    return { success: true };
  },

  // ── Admins ────────────────────────────────────────────────────────────────
  getAdmins: async () => getStore('admins', []),
  createAdmin: async (data) => {
    await mockDelay();
    const admins = getStore('admins', []);
    const exists = admins.find(a => a.username === data.username);
    if (exists) throw new Error('Username already exists');
    const newAdmin = { id: Date.now().toString(), ...data };
    admins.push(newAdmin);
    setStore('admins', admins);
    return newAdmin;
  },
  updateAdmin: async (id, data) => {
    await mockDelay();
    const admins = getStore('admins', []);
    const idx = admins.findIndex(a => a.id === String(id));
    if (idx > -1) {
      admins[idx] = { ...admins[idx], ...data };
      setStore('admins', admins);
      return admins[idx];
    }
    throw new Error('Not found');
  },
  deleteAdmin: async (id) => {
    await mockDelay();
    const admins = getStore('admins', []).filter(a => a.id !== String(id));
    setStore('admins', admins);
    return { success: true };
  },

  // ── Clients ───────────────────────────────────────────────────────────────
  getClients: async () => getStore('clients', []),
  createClient: async (data) => {
    await mockDelay();
    const clients = getStore('clients', []);
    const exists = clients.find(c => c.username === data.username);
    if (exists) throw new Error('Username already exists');
    const newClient = { id: Date.now().toString(), ...data };
    clients.push(newClient);
    setStore('clients', clients);
    return newClient;
  },
  updateClient: async (id, data) => {
    await mockDelay();
    const clients = getStore('clients', []);
    const idx = clients.findIndex(c => c.id === String(id));
    if (idx > -1) {
      clients[idx] = { ...clients[idx], ...data };
      setStore('clients', clients);
      return clients[idx];
    }
    throw new Error('Not found');
  },
  deleteClient: async (id) => {
    await mockDelay();
    const clients = getStore('clients', []).filter(c => c.id !== String(id));
    setStore('clients', clients);
    return { success: true };
  },

  // ── Client Tasks ──────────────────────────────────────────────────────────
  getClientTasks: async () => getStore('client_tasks', []),
  createClientTask: async (data) => {
    await mockDelay();
    const tasks = getStore('client_tasks', []);
    const newTask = {
      id: Date.now().toString(),
      status: 'gray',
      assignedEmployeeId: null,
      comments: [],
      createdAt: new Date().toISOString(),
      ...data,
    };
    tasks.push(newTask);
    setStore('client_tasks', tasks);
    return newTask;
  },
  updateClientTask: async (id, fields) => {
    await mockDelay();
    const tasks = getStore('client_tasks', []);
    const idx = tasks.findIndex(t => t.id === String(id));
    if (idx > -1) {
      tasks[idx] = { ...tasks[idx], ...fields };
      setStore('client_tasks', tasks);
      return tasks[idx];
    }
    throw new Error('Not found');
  },
  deleteClientTask: async (id) => {
    await mockDelay();
    const tasks = getStore('client_tasks', []).filter(t => t.id !== String(id));
    setStore('client_tasks', tasks);
    return { success: true };
  },
  addComment: async (taskId, comment) => {
    await mockDelay();
    const tasks = getStore('client_tasks', []);
    const idx = tasks.findIndex(t => t.id === String(taskId));
    if (idx > -1) {
      const newComment = {
        id: Date.now().toString(),
        authorId: comment.authorId,
        authorName: comment.authorName,
        authorRole: comment.authorRole,
        text: comment.text,
        createdAt: new Date().toISOString(),
      };
      tasks[idx].comments = [...(tasks[idx].comments || []), newComment];
      setStore('client_tasks', tasks);
      return tasks[idx];
    }
    throw new Error('Not found');
  },

  // ── Projects ──────────────────────────────────────────────────────────────
  getProjects: async () => getStore('projects', []),
  createProject: async (name, serviceIds) => {
    await mockDelay();
    const projects = getStore('projects', []);
    const newProject = { id: Date.now().toString(), name, serviceIds: serviceIds || [] };
    projects.push(newProject);
    setStore('projects', projects);
    return newProject;
  },
  updateProject: async (id, fields) => {
    await mockDelay();
    const projects = getStore('projects', []);
    const idx = projects.findIndex(p => p.id === String(id));
    if (idx > -1) {
      projects[idx] = { ...projects[idx], ...fields };
      setStore('projects', projects);
      return projects[idx];
    }
    throw new Error('Not found');
  },
  deleteProject: async (id) => {
    await mockDelay();
    const projects = getStore('projects', []).filter(p => p.id !== String(id));
    setStore('projects', projects);
    return { success: true };
  },

  // ── Employees ─────────────────────────────────────────────────────────────
  getEmployees: async () => getStore('employees', []),
  createEmployee: async (data) => {
    await mockDelay();
    const employees = getStore('employees', []);
    const newEmp = { 
      id: Date.now().toString(), 
      ...data, 
      isSenior: !!data.isSenior,
      assignedServiceIds: data.assignedServiceIds || [], 
      assignedProjectIds: data.assignedProjectIds || [] 
    };
    employees.push(newEmp);
    setStore('employees', employees);
    return newEmp;
  },
  updateEmployee: async (id, data) => {
    await mockDelay();
    const employees = getStore('employees', []);
    const idx = employees.findIndex(e => e.id === String(id));
    if (idx > -1) {
      employees[idx] = { ...employees[idx], ...data };
      setStore('employees', employees);
      return employees[idx];
    }
    throw new Error('Not found');
  },
  deleteEmployee: async (id) => {
    await mockDelay();
    const employees = getStore('employees', []).filter(e => e.id !== String(id));
    setStore('employees', employees);
    return { success: true };
  },

  // ── Services ──────────────────────────────────────────────────────────────
  getServices: async () => getStore('services', []),
  createService: async (name, description) => {
    await mockDelay();
    const services = getStore('services', []);
    const newService = { id: Date.now().toString(), name, description };
    services.push(newService);
    setStore('services', services);
    return newService;
  },
  updateService: async (id, fields) => {
    await mockDelay();
    const services = getStore('services', []);
    const idx = services.findIndex(s => s.id === String(id));
    if (idx > -1) {
      services[idx] = { ...services[idx], ...fields };
      setStore('services', services);
      return services[idx];
    }
    throw new Error('Not found');
  },
  deleteService: async (id) => {
    await mockDelay();
    const services = getStore('services', []).filter(s => s.id !== String(id));
    setStore('services', services);
    return { success: true };
  },

  // ── Tasks (Calendar) ──────────────────────────────────────────────────────
  getTasks: async (projectId, date) => {
    await mockDelay();
    const all = getStore('tasks', {});
    return all[`${projectId}_${date}`] || [];
  },
  getAllProjectTasks: async (projectId) => {
    await mockDelay();
    const all = getStore('tasks', {});
    const result = {};
    for (const key in all) {
      if (key.startsWith(`${projectId}_`)) {
        const date = key.split('_')[1];
        result[date] = all[key];
      }
    }
    return result;
  },
  getAllTasks: async () => {
    await mockDelay();
    return getStore('tasks', {});
  },
  saveTasks: async (projectId, date, entries) => {
    await mockDelay();
    const all = getStore('tasks', {});
    all[`${projectId}_${date}`] = entries;
    setStore('tasks', all);
    return entries;
  },
  deleteTasks: async (projectId, date) => {
    await mockDelay();
    const all = getStore('tasks', {});
    delete all[`${projectId}_${date}`];
    setStore('tasks', all);
    return { success: true };
  },
};
