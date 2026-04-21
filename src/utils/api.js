// ── src/utils/api.js ──────────────────────────────────────────────────────────
// Real HTTP client for the Node.js + MongoDB backend.
// Base URL is set via the VITE_API_URL environment variable.
// For local dev: create src/.env.local with VITE_API_URL=http://localhost:5000/api

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Internal fetch helper ─────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('taskapp_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token   = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

const get    = (path)        => request('GET',    path);
const post   = (path, body)  => request('POST',   path, body);
const put    = (path, body)  => request('PUT',    path, body);
const del    = (path)        => request('DELETE', path);

// ── Exported API surface ─────────────────────────────────────────────────────
export const api = {
  // Auth
  login: (username, password) => post('/auth/login', { username, password }),

  // System Settings
  getSystemSettings: ()         => get('/settings'),
  updateSystemSettings: (data)  => put('/settings', data),

  // Admins
  getAdmins:    ()           => get('/users/admins'),
  createAdmin:  (data)       => post('/users/admins', data),
  updateAdmin:  (id, data)   => put(`/users/admins/${id}`, data),
  deleteAdmin:  (id)         => del(`/users/admins/${id}`),

  // Clients
  getClients:   ()           => get('/users/clients'),
  createClient: (data)       => post('/users/clients', data),
  updateClient: (id, data)   => put(`/users/clients/${id}`, data),
  deleteClient: (id)         => del(`/users/clients/${id}`),

  // Employees
  getEmployees:   ()         => get('/users/employees'),
  createEmployee: (data)     => post('/users/employees', data),
  updateEmployee: (id, data) => put(`/users/employees/${id}`, data),
  deleteEmployee: (id)       => del(`/users/employees/${id}`),

  // Projects
  getProjects:   ()                    => get('/projects'),
  createProject: (name, serviceIds)    => post('/projects', { name, serviceIds }),
  updateProject: (id, fields)          => put(`/projects/${id}`, fields),
  deleteProject: (id)                  => del(`/projects/${id}`),

  // Services
  getServices:   ()                    => get('/services'),
  createService: (name, description)   => post('/services', { name, description }),
  updateService: (id, fields)          => put(`/services/${id}`, fields),
  deleteService: (id)                  => del(`/services/${id}`),

  // Calendar Tasks
  getAllTasks:         ()                     => get('/tasks/all'),
  getAllProjectTasks:  (projectId)            => get(`/tasks/project/${projectId}`),
  getTasks:           (projectId, date)      => get(`/tasks/${projectId}/${date}`),
  saveTasks:          (projectId, date, entries) => put(`/tasks/${projectId}/${date}`, entries),
  deleteTasks:        (projectId, date)      => del(`/tasks/${projectId}/${date}`),

  // Client Tasks
  getClientTasks:   ()           => get('/client-tasks'),
  createClientTask: (data)       => post('/client-tasks', data),
  updateClientTask: (id, fields) => put(`/client-tasks/${id}`, fields),
  deleteClientTask: (id)         => del(`/client-tasks/${id}`),
  addComment:       (taskId, comment) => post(`/client-tasks/${taskId}/comments`, comment),

  // (kept for compatibility — not used by real backend)
  setupAdmin: async () => ({ success: true }),
};
