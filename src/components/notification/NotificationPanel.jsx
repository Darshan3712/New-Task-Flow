import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { FiX, FiCalendar, FiUser, FiCheck, FiChevronLeft, FiChevronRight, FiTrash2, FiMessageSquare, FiArrowRight } from 'react-icons/fi';

const STATUS_META = {
  gray:      { label: 'Pending',     color: '#6b7280' },
  yellow:    { label: 'In Progress', color: '#f59e0b' },
  green:     { label: 'Completed',   color: '#10b981' },
  red:       { label: 'Not Done',    color: '#ef4444' },
  cancelled: { label: 'Cancelled',   color: '#dc2626' },
};

// Width steps for the resize arrows (px)
const WIDTH_STEPS = [340, 420, 520, 640, 780];

export default function NotificationPanel({ onClose, onNavigateToTask }) {
  const { currentUser } = useAuth();
  const {
    clientTasks, clients, projects, employees, services,
    assignClientTask, updateClientTask, deleteClientTask,
  } = useData();

  // ── Panel width ─────────────────────────────────────────────
  const [widthIdx, setWidthIdx] = useState(1); // default 420px
  const panelWidth = WIDTH_STEPS[widthIdx];

  // ── Tab: 'tasks' | 'comments' ───────────────────────────────
  const [activeTab, setActiveTab] = useState('tasks');

  // ── Assignment state ─────────────────────────────────────────
  const [assignSelections, setAssignSelections] = useState({});
  const [assignedMsg, setAssignedMsg]           = useState({});
  const [deletingId, setDeletingId]             = useState(null);

  const sortedTasks = [...clientTasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unassignedCount = sortedTasks.filter(t => !t.assignedEmployeeId).length;

  // ── Build comment notifications: any task with comments, sorted by latest comment ──
  const commentNotifications = useMemo(() => {
    const items = [];
    sortedTasks.forEach(task => {
      const comments = task.comments || [];
      // Only client-authored comments count as "new notifications"
      const clientComments = comments.filter(c => c.authorRole === 'client');
      if (clientComments.length === 0) return;
      const project = projects.find(p => p.id === task.projectId);
      const client  = clients.find(c => c.id === task.clientId);
      clientComments.forEach(comment => {
        items.push({ task, project, client, comment });
      });
    });
    // Sort by comment createdAt descending
    items.sort((a, b) => new Date(b.comment.createdAt) - new Date(a.comment.createdAt));
    return items;
  }, [sortedTasks, projects, clients]);

  const updateSelection = (taskId, field, value) => {
    setAssignSelections(prev => ({
      ...prev,
      [taskId]: { ...(prev[taskId] || {}), [field]: value },
    }));
  };

  const handleAssign = async (taskId) => {
    const sel = assignSelections[taskId] || {};
    if (!sel.empId) return;
    const assignedDate = sel.date || new Date().toISOString().split('T')[0];
    await assignClientTask(taskId, sel.empId, sel.serviceId || null, assignedDate);
    setAssignedMsg(prev => ({ ...prev, [taskId]: '✅ Assigned!' }));
    setTimeout(() => setAssignedMsg(prev => ({ ...prev, [taskId]: '' })), 2500);
  };

  const handleReassign = async (taskId, task) => {
    const sel = assignSelections[taskId] || {};
    const empId = sel.empId || task.assignedEmployeeId;
    if (!empId) return;
    const serviceId  = sel.serviceId !== undefined ? sel.serviceId : task.serviceId;
    const assignedDate = sel.date || task.assignedDate || new Date().toISOString().split('T')[0];
    await assignClientTask(taskId, empId, serviceId, assignedDate);
    setAssignedMsg(prev => ({ ...prev, [taskId]: '✅ Reassigned!' }));
    setTimeout(() => setAssignedMsg(prev => ({ ...prev, [taskId]: '' })), 2500);
  };

  const handleDelete = async (taskId) => {
    if (deletingId === taskId) {
      await deleteClientTask(taskId);
      setDeletingId(null);
    } else {
      setDeletingId(taskId);
      setTimeout(() => setDeletingId(prev => (prev === taskId ? null : prev)), 3000);
    }
  };

  return (
    <div className="notif-overlay" onClick={onClose}>
      <div
        className="notif-panel"
        style={{ width: panelWidth }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="notif-panel-header">
          <div>
            <h3>Client Task Requests</h3>
            {unassignedCount > 0 && (
              <span className="notif-badge-text">{unassignedCount} unassigned</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Resize arrows */}
            <div className="notif-resize-controls">
              <button
                className="notif-resize-btn"
                onClick={() => setWidthIdx(i => Math.max(0, i - 1))}
                disabled={widthIdx === 0}
                title="Shrink panel"
              >
                <FiChevronLeft size={14} />
              </button>
              <span className="notif-resize-label">{panelWidth}px</span>
              <button
                className="notif-resize-btn"
                onClick={() => setWidthIdx(i => Math.min(WIDTH_STEPS.length - 1, i + 1))}
                disabled={widthIdx === WIDTH_STEPS.length - 1}
                title="Expand panel"
              >
                <FiChevronRight size={14} />
              </button>
            </div>

            <button className="notif-close-btn" onClick={onClose}><FiX size={20} /></button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="notif-tabs">
          <button
            className={`notif-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            📋 Task Requests
            {unassignedCount > 0 && <span className="notif-tab-badge">{unassignedCount}</span>}
          </button>
          <button
            className={`notif-tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            <FiMessageSquare size={13} /> Client Comments
            {commentNotifications.length > 0 && (
              <span className="notif-tab-badge" style={{ background: '#3b82f6' }}>
                {commentNotifications.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Body ── */}
        <div className="notif-panel-body">

          {/* ══════════ TASK REQUESTS TAB ══════════ */}
          {activeTab === 'tasks' && (
            sortedTasks.length === 0 ? (
              <div className="notif-empty"><p>No client task requests yet.</p></div>
            ) : (
              sortedTasks.map(task => {
                const client     = clients.find(c => c.id === task.clientId);
                const project    = projects.find(p => p.id === task.projectId);
                const assignedEmp = task.assignedEmployeeId
                  ? (employees.find(e => e.id === task.assignedEmployeeId) || (task.assignedEmployeeId === currentUser?.id ? currentUser : null)) : null;
                const assignedSvc = task.serviceId
                  ? services.find(s => s.id === task.serviceId) : null;
                const meta = STATUS_META[task.status] || STATUS_META.gray;
                const sel  = assignSelections[task.id] || {};
                const isConfirmingDelete = deletingId === task.id;

                return (
                  <div key={task.id} className={`notif-task-card ${!task.assignedEmployeeId ? 'ntc-new' : ''}`}>
                    {/* Title row + status chip + delete */}
                    <div className="ntc-top">
                      <div className="ntc-title">
                        {task.title}
                        {task.status === 'cancelled' && (
                          <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: 700 }}>
                            ⚠️ Task is Deleted by client
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        <span
                          className="ntc-status-chip"
                          style={{ background: meta.color + '22', color: meta.color, border: `1.5px solid ${meta.color}55` }}
                        >
                          {meta.label}
                        </span>
                        {/* Delete button */}
                        <button
                          className={`ntc-delete-btn ${isConfirmingDelete ? 'confirming' : ''}`}
                          onClick={() => handleDelete(task.id)}
                          title={isConfirmingDelete ? 'Click again to confirm delete' : 'Delete task'}
                        >
                          {isConfirmingDelete ? '⚠️' : <FiTrash2 size={13} />}
                        </button>
                      </div>
                    </div>

                    {isConfirmingDelete && (
                      <div className="ntc-delete-confirm-msg">
                        Click ⚠️ again to permanently delete this task
                      </div>
                    )}

                    {task.description && <p className="ntc-desc">{task.description}</p>}

                    <div className="ntc-meta">
                      {client  && <span><FiUser size={11} /> {client.name}</span>}
                      {project && <span>📁 {project.name}</span>}
                      {task.requiredBy && (
                        <span>
                          <FiCalendar size={11} /> Due:{' '}
                          {new Date(task.requiredBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {/* Unassigned: show assign form */}
                    {!assignedEmp ? (
                      <div className="ntc-assign-form">
                        <div className="ntc-assign-row">
                          <select
                            className="ntc-emp-select"
                            value={sel.empId || ''}
                            onChange={e => updateSelection(task.id, 'empId', e.target.value)}
                          >
                            <option value="">-- Assign to Employee --</option>
                            {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                              <option value={currentUser.id}>Assign to Self ({currentUser.name})</option>
                            )}
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
                              value={sel.date || new Date().toISOString().split('T')[0]}
                              onChange={e => updateSelection(task.id, 'date', e.target.value)}
                            />
                          </div>
                          <button
                            className="ntc-assign-btn"
                            onClick={() => handleAssign(task.id)}
                            disabled={!sel.empId}
                          >
                            Assign
                          </button>
                          {assignedMsg[task.id] && <span className="ntc-assigned-ok">{assignedMsg[task.id]}</span>}
                        </div>
                      </div>
                    ) : (
                      /* Assigned: show summary + superadmin can reassign */
                      <div>
                        <div className="ntc-assigned-label">
                          <FiCheck size={13} style={{ color: '#10b981' }} />
                          Assigned to <strong>{assignedEmp.name}</strong>
                          {assignedSvc && <> · <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{assignedSvc.name}</span></>}
                          {task.assignedDate && (
                            <> · <FiCalendar size={11} /> {new Date(task.assignedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                          )}
                        </div>

                        {currentUser?.role === 'superadmin' && (
                          <div className="ntc-assign-form" style={{ marginTop: '0.5rem' }}>
                            <div className="ntc-assign-row">
                              <select
                                className="ntc-emp-select"
                                value={sel.empId || assignedEmp?.id || ''}
                                onChange={e => updateSelection(task.id, 'empId', e.target.value)}
                              >
                                {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                                  <option value={currentUser.id}>Assign to Self ({currentUser.name})</option>
                                )}
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
                                  value={sel.date || (task.assignedDate || new Date().toISOString().split('T')[0])}
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
            )
          )}

          {/* ══════════ CLIENT COMMENTS TAB ══════════ */}
          {activeTab === 'comments' && (
            commentNotifications.length === 0 ? (
              <div className="notif-empty">
                <div style={{ textAlign: 'center' }}>
                  <FiMessageSquare size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p>No client comments yet.</p>
                </div>
              </div>
            ) : (
              commentNotifications.map(({ task, project, client, comment }, idx) => {
                const meta = STATUS_META[task.status] || STATUS_META.gray;
                const canNavigate = !!(task.assignedDate && task.projectId);
                return (
                  <div
                    key={`${task.id}-${comment.id || idx}`}
                    className={`notif-comment-card ${canNavigate ? 'ncc-clickable' : ''}`}
                    onClick={canNavigate ? () => onNavigateToTask && onNavigateToTask(task) : undefined}
                    title={canNavigate ? 'Click to open this task in the calendar' : ''}
                  >
                    {/* Project + Task name */}
                    <div className="ncc-top">
                      <div className="ncc-project">
                        📁 {project?.name || 'Unknown Project'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span
                          className="ntc-status-chip"
                          style={{ background: meta.color + '22', color: meta.color, border: `1.5px solid ${meta.color}55`, fontSize: '0.62rem' }}
                        >
                          {meta.label}
                        </span>
                        {canNavigate && (
                          <span className="ncc-goto-arrow" title="Open in calendar">
                            <FiArrowRight size={13} />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ncc-task-title">{task.title}</div>

                    {/* Comment bubble */}
                    <div className="ncc-comment-bubble">
                      <div className="ncc-comment-meta">
                        <span className="ncc-author">
                          <FiUser size={11} /> {comment.authorName || client?.name || 'Client'}
                        </span>
                        <span className="ncc-date">
                          <FiCalendar size={11} />
                          {new Date(comment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}
                          {new Date(comment.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="ncc-comment-text">"{comment.text}"</p>
                    </div>

                    {canNavigate && (
                      <div className="ncc-nav-hint">👆 Click to open task in calendar →</div>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
}
