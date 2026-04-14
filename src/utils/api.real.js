// Central API utility — automatically attaches the JWT token to every request
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('taskapp_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'API error');
  }

  return res.json();
}

export const api = {
  // Auth
  login: (username, password)               => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  setupAdmin: ()                             => request('/auth/setup-admin', { method: 'POST' }),

  // Projects
  getProjects: ()                            => request('/projects'),
  createProject: (name, serviceIds)          => request('/projects', { method: 'POST', body: JSON.stringify({ name, serviceIds }) }),
  updateProject: (id, fields)               => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(fields) }),
  deleteProject: (id)                        => request(`/projects/${id}`, { method: 'DELETE' }),

  // Employees
  getEmployees: ()                           => request('/employees'),
  createEmployee: (data)                     => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data)                 => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id)                       => request(`/employees/${id}`, { method: 'DELETE' }),

  // Services
  getServices: ()                            => request('/services'),
  createService: (name, description)        => request('/services', { method: 'POST', body: JSON.stringify({ name, description }) }),
  updateService: (id, fields)               => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(fields) }),
  deleteService: (id)                        => request(`/services/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (projectId, date)               => request(`/tasks?projectId=${projectId}&date=${date}`),
  getAllProjectTasks: (projectId)            => request(`/tasks/all?projectId=${projectId}`),
  getAllTasks: ()                            => request('/tasks/all'),
  saveTasks: (projectId, date, entries)     => request('/tasks', { method: 'POST', body: JSON.stringify({ projectId, date, entries }) }),
  deleteTasks: (projectId, date)            => request(`/tasks?projectId=${projectId}&date=${date}`, { method: 'DELETE' }),
};
