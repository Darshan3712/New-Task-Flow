import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [projects,     setProjects]     = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [services,     setServices]     = useState([]);
  const [admins,       setAdmins]       = useState([]);
  const [clients,      setClients]      = useState([]);
  const [clientTasks,  setClientTasks]  = useState([]);
  const [tasks,        setTasks]        = useState({});
  const [systemSettings, setSystemSettings] = useState({ adminCanManageEmployees: true });
  const [loading,      setLoading]      = useState(true);

  const { currentUser } = useAuth();

  // ── Load all reference data — only when authenticated ─────────────────────
  const loadAll = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);

      // Client: load only their own project + client tasks
      if (currentUser.role === 'client') {
        const [p, ct] = await Promise.all([
          api.getProjects(),
          api.getClientTasks(),
        ]);
        setProjects(p);
        setClientTasks(ct.filter(t => t.clientId === currentUser.id));
        return;
      }

      // Employee: load their own assigned data + client tasks assigned to them
      if (currentUser.role === 'employee') {
        const [p, e, s, tMap, ct, sysSet] = await Promise.all([
          api.getProjects(),
          api.getEmployees(),
          api.getServices(),
          api.getAllTasks(),
          api.getClientTasks(),
          api.getSystemSettings()
        ]);
        setProjects(p);
        setEmployees(e);
        setServices(s);
        setTasks(tMap || {});
        setClientTasks(ct.filter(t => t.assignedEmployeeId === currentUser.id));
        setSystemSettings(sysSet);
        return;
      }

      // Admin / SuperAdmin: load everything
      const [p, e, s, tMap, ct, sysSet] = await Promise.all([
        api.getProjects(),
        api.getEmployees(),
        api.getServices(),
        api.getAllTasks(),
        api.getClientTasks(),
        api.getSystemSettings()
      ]);
      setProjects(p);
      setEmployees(e);
      setServices(s);
      setTasks(tMap || {});
      setClientTasks(ct);
      setSystemSettings(sysSet);

      if (currentUser.role === 'superadmin') {
        const [a, cl] = await Promise.all([api.getAdmins(), api.getClients()]);
        setAdmins(a);
        setClients(cl);
      }
      if (currentUser.role === 'admin') {
        const cl = await api.getClients();
        setClients(cl);
      }
    } catch (err) {
      console.error('Failed to load data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadAll();
    } else {
      setProjects([]); setEmployees([]); setServices([]);
      setAdmins([]); setClients([]); setClientTasks([]);
      setTasks({}); setLoading(false);
    }
  }, [currentUser, loadAll]);

  // ── Admins ────────────────────────────────────────────────────────────────
  const addAdmin = async (data) => {
    const admin = await api.createAdmin(data);
    setAdmins(prev => [...prev, admin]);
    return admin;
  };
  const updateAdmin = async (id, data) => {
    const updated = await api.updateAdmin(id, data);
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    return updated;
  };
  const deleteAdmin = async (id) => {
    await api.deleteAdmin(id);
    setAdmins(prev => prev.filter(a => a.id !== id));
  };

  // ── Clients ───────────────────────────────────────────────────────────────
  const addClient = async (data) => {
    const client = await api.createClient(data);
    setClients(prev => [...prev, client]);
    return client;
  };
  const updateClient = async (id, data) => {
    const updated = await api.updateClient(id, data);
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    return updated;
  };
  const deleteClient = async (id) => {
    await api.deleteClient(id);
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // ── Client Tasks ──────────────────────────────────────────────────────────
  const addClientTask = async (data) => {
    const task = await api.createClientTask(data);
    setClientTasks(prev => [...prev, task]);
    return task;
  };
  const updateClientTask = async (id, fields) => {
    const updated = await api.updateClientTask(id, fields);
    setClientTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    return updated;
  };
  const deleteClientTask = async (id) => {
    await api.deleteClientTask(id);
    setClientTasks(prev => prev.filter(t => t.id !== id));
  };
  const assignClientTask = async (taskId, employeeId, serviceId, assignedDate) => {
    const fields = {
      assignedEmployeeId: employeeId,
      serviceId: serviceId || null,
      assignedDate: assignedDate || null,
    };
    const updated = await api.updateClientTask(taskId, fields);
    setClientTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
    return updated;
  };
  const addComment = async (taskId, comment) => {
    const updated = await api.addComment(taskId, comment);
    setClientTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: updated.comments } : t));
    return updated;
  };

  // ── Projects ──────────────────────────────────────────────────────────────
  const addProject = async (name, serviceIds = []) => {
    const project = await api.createProject(name, serviceIds);
    setProjects(prev => [...prev, project]);
    return project;
  };
  const deleteProject = async (id) => {
    await api.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setEmployees(prev => prev.filter(e => e.projectId !== id));
  };
  const updateProject = async (id, fields) => {
    const updated = await api.updateProject(id, fields);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  // ── Employees ─────────────────────────────────────────────────────────────
  const addEmployee = async (name, username, password, designation, assignedServiceIds = [], permissions = {}) => {
    const emp = await api.createEmployee({
      name, username, password, designation, assignedServiceIds,
      canCreateTasks: permissions.canCreateTasks !== false,
      readOnlyAccess: permissions.readOnlyAccess === true,
      canComment: permissions.canComment !== false,
    });
    setEmployees(prev => [...prev, emp]);
    return emp;
  };
  const deleteEmployee = async (id) => {
    await api.deleteEmployee(id);
    setEmployees(prev => prev.filter(e => e.id !== id));
  };
  const updateEmployee = async (id, data) => {
    const updated = await api.updateEmployee(id, data);
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
    return updated;
  };

  // ── Services ─────────────────────────────────────────────────────────────
  const addService = async (name, description) => {
    const service = await api.createService(name, description);
    setServices(prev => [...prev, service]);
    return service;
  };
  const deleteService = async (id) => {
    await api.deleteService(id);
    setServices(prev => prev.filter(s => s.id !== id));
  };
  const updateService = async (id, fields) => {
    const updated = await api.updateService(id, fields);
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  // ── Tasks (Calendar) ─────────────────────────────────────────────────────
  const saveTasks = async (projectId, dateStr, taskList) => {
    const key = `${projectId}_${dateStr}`;
    const entries = await api.saveTasks(projectId, dateStr, taskList);
    setTasks(prev => ({ ...prev, [key]: entries }));
  };
  const getTasks = (projectId, dateStr) => {
    return tasks[`${projectId}_${dateStr}`] || [];
  };
  const loadTasksForProject = async (projectId) => {
    const taskMap = await api.getAllProjectTasks(projectId);
    const newEntries = {};
    Object.entries(taskMap).forEach(([date, entries]) => {
      newEntries[`${projectId}_${date}`] = entries;
    });
    setTasks(prev => ({ ...prev, ...newEntries }));
    return newEntries;
  };
  const deleteTasks = async (projectId, dateStr) => {
    await api.deleteTasks(projectId, dateStr);
    const key = `${projectId}_${dateStr}`;
    setTasks(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  const updateTasks = async (projectId, monthStr, data) => {
    const updated = await api.updateTasks(projectId, monthStr, data);
    setTasks(prev => ({ ...prev, [projectId]: { ...prev[projectId], [monthStr]: updated } }));
    return updated;
  };

  // ── System Settings ───────────────────────────────────────────────────────
  const updateSystemSettings = async (settings) => {
    const updated = await api.updateSystemSettings(settings);
    setSystemSettings(updated);
    return updated;
  };

  return (
    <DataContext.Provider value={{
      projects, employees, services, admins, clients, clientTasks, tasks, systemSettings, loading,
      addProject, deleteProject, updateProject,
      addEmployee, deleteEmployee, updateEmployee,
      addAdmin, updateAdmin, deleteAdmin,
      addClient, updateClient, deleteClient,
      addClientTask, updateClientTask, deleteClientTask, assignClientTask, addComment,
      addService, deleteService, updateService,
      saveTasks, getTasks, deleteTasks, loadTasksForProject,
      updateSystemSettings,
      reload: loadAll,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
