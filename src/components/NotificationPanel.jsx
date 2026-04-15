import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { FiX, FiCalendar, FiUser, FiCheck } from 'react-icons/fi';

const STATUS_META = {
  gray:   { label: 'Pending',     color: '#6b7280' },
  yellow: { label: 'In Progress', color: '#f59e0b' },
  green:  { label: 'Completed',   color: '#10b981' },
  red:    { label: 'Not Done',    color: '#ef4444' },
};

export default function NotificationPanel({ onClose }) {
  const { currentUser } = useAuth();
  const { clientTasks, clients, projects, employees, services, assignClientTask, updateClientTask } = useData();

  // Per-task assignment selections: { taskId: { empId, serviceId, date } }
  const [assignSelections, setAssignSelections] = useState({});
  const [assignedMsg, setAssignedMsg] = useState({});

  const sortedTasks = [...clientTasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unassignedCount = sortedTasks.filter(t => !t.assignedEmployeeId).length;

  const updateSelection = (taskId, field, value) => {
    setAssignSelections(prev => ({
      ...prev,
      [taskId]: { ...(prev[taskId] || {}), [field]: value },
    }));
  };

  const handleAssign = async (taskId, task) => {
    const sel = assignSelections[taskId] || {};
    const empId = sel.empId;
    if (!empId) return;

    const serviceId = sel.serviceId || null;
    // Default date: client's requiredBy or today
    const assignedDate = sel.date || task.requiredBy || new Date().toISOString().split('T')[0];

    await assignClientTask(taskId, empId, serviceId, assignedDate);
    setAssignedMsg(prev => ({ ...prev, [taskId]: '✅ Assigned!' }));
    setTimeout(() => setAssignedMsg(prev => ({ ...prev, [taskId]: '' })), 2500);
  };

  const handleReassign = async (taskId, task) => {
    const sel = assignSelections[taskId] || {};
    const empId = sel.empId;
    if (!empId) return;
    const serviceId = sel.serviceId !== undefined ? sel.serviceId : task.serviceId;
    const assignedDate = sel.date || task.assignedDate || task.requiredBy || new Date().toISOString().split('T')[0];
    await assignClientTask(taskId, empId, serviceId, assignedDate);
    setAssignedMsg(prev => ({ ...prev, [taskId]: '✅ Reassigned!' }));
    setTimeout(() => setAssignedMsg(prev => ({ ...prev, [taskId]: '' })), 2500);
  };

  return (
    <div className="notif-overlay" onClick={onClose}>
      <div className="notif-panel" onClick={e => e.stopPropagation()}>
        <div className="notif-panel-header">
          <div>
            <h3>Client Task Requests</h3>
            {unassignedCount > 0 && (
              <span className="notif-badge-text">{unassignedCount} unassigned</span>
            )}
          </div>
          <button className="notif-close-btn" onClick={onClose}><FiX size={20} /></button>
        </div>

        <div className="notif-panel-body">
          {sortedTasks.length === 0 ? (
            <div className="notif-empty"><p>No client task requests yet.</p></div>
          ) : (
            sortedTasks.map(task => {
              const client  = clients.find(c => c.id === task.clientId);
              const project = projects.find(p => p.id === task.projectId);
              const assignedEmp = task.assignedEmployeeId
                ? employees.find(e => e.id === task.assignedEmployeeId)
                : null;
              const assignedSvc = task.serviceId
                ? services.find(s => s.id === task.serviceId)
                : null;
              const meta = STATUS_META[task.status] || STATUS_META.gray;
              const sel  = assignSelections[task.id] || {};

              return (
                <div key={task.id} className={`notif-task-card ${!task.assignedEmployeeId ? 'ntc-new' : ''}`}>
                  <div className="ntc-top">
                    <div className="ntc-title">{task.title}</div>
                    <span className="ntc-status-chip" style={{ background: meta.color + '22', color: meta.color, border: `1.5px solid ${meta.color}55` }}>
                      {meta.label}
                    </span>
                  </div>

                  {task.description && <p className="ntc-desc">{task.description}</p>}

                  <div className="ntc-meta">
                    {client  && <span><FiUser size={11} /> {client.name}</span>}
                    {project && <span>📁 {project.name}</span>}
                    {task.requiredBy && (
                      <span><FiCalendar size={11} /> Due: {new Date(task.requiredBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>

                  {/* ── UNASSIGNED: show full assignment form ── */}
                  {!assignedEmp ? (
                    <div className="ntc-assign-form">
                      <div className="ntc-assign-row">
                        <select
                          className="ntc-emp-select"
                          value={sel.empId || ''}
                          onChange={e => updateSelection(task.id, 'empId', e.target.value)}
                        >
                          <option value="">-- Assign to Employee --</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation || 'Employee'})</option>
                          ))}
                        </select>
                      </div>
                      <div className="ntc-assign-row">
                        <select
                          className="ntc-emp-select"
                          value={sel.serviceId || ''}
                          onChange={e => updateSelection(task.id, 'serviceId', e.target.value)}
                        >
                          <option value="">-- Select Service --</option>
                          {services.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="ntc-assign-row">
                        <div className="ntc-date-wrapper">
                          <FiCalendar size={13} className="ntc-date-icon" />
                          <input
                            type="date"
                            className="ntc-emp-select"
                            style={{ paddingLeft: '2rem' }}
                            value={sel.date || task.requiredBy || ''}
                            onChange={e => updateSelection(task.id, 'date', e.target.value)}
                          />
                        </div>
                        <button
                          className="ntc-assign-btn"
                          onClick={() => handleAssign(task.id, task)}
                          disabled={!sel.empId}
                        >
                          Assign
                        </button>
                        {assignedMsg[task.id] && <span className="ntc-assigned-ok">{assignedMsg[task.id]}</span>}
                      </div>
                    </div>
                  ) : (
                    /* ── ASSIGNED: show summary + superadmin can reassign ── */
                    <div>
                      <div className="ntc-assigned-label">
                        <FiCheck size={13} style={{ color: '#10b981' }} />
                        Assigned to <strong>{assignedEmp.name}</strong>
                        {assignedSvc && <> · <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{assignedSvc.name}</span></>}
                        {task.assignedDate && <> · <FiCalendar size={11} /> {new Date(task.assignedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                      </div>

                      {/* SuperAdmin can reassign */}
                      {currentUser?.role === 'superadmin' && (
                        <div className="ntc-assign-form" style={{ marginTop: '0.5rem' }}>
                          <div className="ntc-assign-row">
                            <select
                              className="ntc-emp-select"
                              value={sel.empId || assignedEmp.id}
                              onChange={e => updateSelection(task.id, 'empId', e.target.value)}
                            >
                              {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                              ))}
                            </select>
                            <select
                              className="ntc-emp-select"
                              value={sel.serviceId !== undefined ? sel.serviceId : (task.serviceId || '')}
                              onChange={e => updateSelection(task.id, 'serviceId', e.target.value)}
                            >
                              <option value="">-- Service --</option>
                              {services.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="ntc-assign-row">
                            <div className="ntc-date-wrapper">
                              <FiCalendar size={13} className="ntc-date-icon" />
                              <input
                                type="date"
                                className="ntc-emp-select"
                                style={{ paddingLeft: '2rem' }}
                                value={sel.date || task.assignedDate || task.requiredBy || ''}
                                onChange={e => updateSelection(task.id, 'date', e.target.value)}
                              />
                            </div>
                            <button
                              className="ntc-assign-btn"
                              onClick={() => handleReassign(task.id, task)}
                              disabled={!sel.empId && !assignedEmp}
                            >
                              Reassign
                            </button>
                            {assignedMsg[task.id] && <span className="ntc-assigned-ok">{assignedMsg[task.id]}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="ntc-created">
                    Submitted: {new Date(task.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
