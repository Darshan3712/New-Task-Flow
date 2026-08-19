import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiX, FiMessageCircle, FiSend, FiCalendar, FiUser, FiInbox,
  FiCheck, FiTrash2, FiArrowRight, FiSearch, FiAlertCircle, FiClock
} from 'react-icons/fi';
import LinkifyText from '../task/LinkifyText';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import { getTaskAssigner } from '../../utils/taskUtils';

const STATUS_META = {
  gray:   { label: 'Pending',     color: '#6b7280' },
  yellow: { label: 'In Progress', color: '#f59e0b' },
  green:  { label: 'Completed',   color: '#10b981' },
  red:    { label: 'Not Done',    color: '#ef4444' },
  cancelled: { label: 'Cancelled', color: '#dc2626' },
};

export default function ClientRequestsPanel({ onClose, onNavigateToTask, initialTab = 'all' }) {
  const { currentUser } = useAuth();
  const {
    clientTasks, clients, projects, employees, services, admins,
    assignClientTask, deleteClientTask, addComment,
  } = useData();

  // ── Tabs: 'all' (Task Requests) | 'unassigned' (Unassigned) | 'assigned' (Assigned) ──
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [commentText, setCommentText] = useState('');

  // ── Assignment form state per task ──
  const [assignSelections, setAssignSelections] = useState({});
  const [assignedMsg, setAssignedMsg] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  // ── Helper to calculate latest activity timestamp (task creation or latest comment) ──
  const getLatestActivityTime = (task) => {
    let latest = new Date(task.createdAt || 0).getTime();
    if (task.comments && task.comments.length > 0) {
      task.comments.forEach(c => {
        const cTime = new Date(c.createdAt || 0).getTime();
        if (cTime > latest) latest = cTime;
      });
    }
    return latest;
  };

  // ── All valid tasks sorted by latest activity (newest request or latest comment on top) ──
  const allTasksSorted = useMemo(() => {
    return [...(clientTasks || [])]
      .filter(t => t.status !== 'cancelled')
      .sort((a, b) => getLatestActivityTime(b) - getLatestActivityTime(a));
  }, [clientTasks]);

  // ── Tab Counts ──
  const unassignedCount = allTasksSorted.filter(t => !t.assignedEmployeeId).length;
  const assignedCount = allTasksSorted.filter(t => !!t.assignedEmployeeId).length;
  const totalCount = allTasksSorted.length;

  // ── Filter by active tab and search query ──
  const filteredTasks = useMemo(() => {
    let list = allTasksSorted;
    if (activeTab === 'unassigned') {
      list = list.filter(t => !t.assignedEmployeeId);
    } else if (activeTab === 'assigned') {
      list = list.filter(t => !!t.assignedEmployeeId);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(t => {
        const client = clients.find(c => c.id === t.clientId);
        const project = projects.find(p => p.id === t.projectId);
        const emp = employees.find(e => e.id === t.assignedEmployeeId);
        return (
          (t.title || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (client?.name || '').toLowerCase().includes(q) ||
          (project?.name || '').toLowerCase().includes(q) ||
          (emp?.name || '').toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [allTasksSorted, activeTab, searchTerm, clients, projects, employees]);

  // Auto-select first task if none selected or if selected task is not in list
  const activeTask = useMemo(() => {
    if (selectedTaskId) {
      const found = allTasksSorted.find(t => t.id === selectedTaskId);
      if (found) return found;
    }
    return filteredTasks[0] || null;
  }, [selectedTaskId, allTasksSorted, filteredTasks]);

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
    setAssignedMsg(prev => ({ ...prev, [taskId]: '✅ Assigned successfully!' }));
    setTimeout(() => setAssignedMsg(prev => ({ ...prev, [taskId]: '' })), 3000);
  };

  const handleReassign = async (taskId, task) => {
    const sel = assignSelections[taskId] || {};
    const empId = sel.empId || task.assignedEmployeeId;
    if (!empId) return;
    const serviceId = sel.serviceId !== undefined ? sel.serviceId : task.serviceId;
    const assignedDate = sel.date || task.assignedDate || new Date().toISOString().split('T')[0];
    await assignClientTask(taskId, empId, serviceId, assignedDate);
    setAssignedMsg(prev => ({ ...prev, [taskId]: '✅ Reassigned successfully!' }));
    setTimeout(() => setAssignedMsg(prev => ({ ...prev, [taskId]: '' })), 3000);
  };

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const idToDelete = deleteTarget.id;
    await deleteClientTask(idToDelete);
    setDeleteTarget(null);
    if (selectedTaskId === idToDelete) {
      setSelectedTaskId(null);
    }
  };

  const handleSendComment = async (taskId) => {
    if (!commentText.trim() || !taskId) return;
    await addComment(taskId, {
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      text: commentText.trim(),
    });
    setCommentText('');
  };

  return (
    <div className="crp-overlay" onClick={onClose}>
      <div className="crp-panel" onClick={e => e.stopPropagation()}>
        {/* ════════ HEADER ════════ */}
        <div className="crp-header">
          <div className="crp-header-left">
            <div className="crp-icon-box">
              <FiInbox size={20} />
            </div>
            <div>
              <h3>Client Task Requests</h3>
              <span className="crp-subtitle">
                Manage, assign, reassign client requests and communicate with clients
              </span>
            </div>
          </div>
          <button className="crp-close-btn" onClick={onClose} title="Close">
            <FiX size={20} />
          </button>
        </div>

        {/* ════════ 3 MAIN TABS ════════ */}
        <div className="crp-tab-bar">
          <div className="crp-tabs-left">
            <button
              className={`crp-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              📋 Task Requests
              <span className="crp-tab-badge">{totalCount}</span>
            </button>

            <button
              className={`crp-tab-btn ${activeTab === 'unassigned' ? 'active' : ''}`}
              onClick={() => setActiveTab('unassigned')}
            >
              <FiAlertCircle size={14} /> Unassigned
              {unassignedCount > 0 && (
                <span className="crp-tab-badge unassigned-badge">{unassignedCount}</span>
              )}
            </button>

            <button
              className={`crp-tab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
              onClick={() => setActiveTab('assigned')}
            >
              <FiCheck size={14} /> Assigned
              <span className="crp-tab-badge">{assignedCount}</span>
            </button>
          </div>

          <div className="crp-search-box">
            <FiSearch size={14} className="crp-search-icon" />
            <input
              type="text"
              placeholder="Search by title, client, project..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="crp-search-clear" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>
        </div>

        {/* ════════ BODY: 2-COLUMN MASTER-DETAIL ════════ */}
        <div className="crp-body">
          {/* ──── LEFT COLUMN: TASK LIST ──── */}
          <div className="crp-list">
            {filteredTasks.length === 0 ? (
              <div className="crp-empty">
                <FiInbox size={36} style={{ opacity: 0.3 }} />
                <p>
                  {searchTerm
                    ? 'No requests match your search.'
                    : activeTab === 'unassigned'
                    ? '🎉 All client requests are assigned!'
                    : activeTab === 'assigned'
                    ? 'No assigned requests yet.'
                    : 'No client task requests yet.'}
                </p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const client = clients.find(c => c.id === task.clientId);
                const project = projects.find(p => p.id === task.projectId);
                const assignedEmp = task.assignedEmployeeId
                  ? (employees.find(e => e.id === task.assignedEmployeeId) || (task.assignedEmployeeId === currentUser?.id ? currentUser : null))
                  : null;
                const meta = STATUS_META[task.status] || STATUS_META.gray;
                const comments = task.comments || [];
                const clientComments = comments.filter(c => c.authorRole === 'client');
                const isSelected = activeTask?.id === task.id;
                const isUnassigned = !task.assignedEmployeeId;

                return (
                  <div
                    key={task.id}
                    className={`crp-list-item ${isSelected ? 'active' : ''} ${isUnassigned ? 'unassigned' : ''}`}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setCommentText('');
                    }}
                  >
                    <div className="crp-list-item-top">
                      <span className="crp-client-name">
                        <FiUser size={11} />
                        {client?.name || 'Client'}
                      </span>
                      <span
                        className="crp-status-dot"
                        style={{ background: meta.color }}
                        title={meta.label}
                      />
                    </div>

                    <div className="crp-list-item-title">{task.title}</div>

                    <div className="crp-list-item-project">
                      📁 {project?.name || 'Unknown Project'}
                    </div>

                    <div className="crp-list-item-bottom">
                      <span className="crp-list-date">
                        <FiClock size={11} />
                        {new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {isUnassigned ? (
                          <span className="crp-unassigned-tag">Unassigned</span>
                        ) : (
                          <span className="crp-assigned-tag">
                            👤 {assignedEmp?.name?.split(' ')[0] || 'Assigned'}
                          </span>
                        )}

                        {comments.length > 0 && (
                          <span className={`crp-comment-badge ${clientComments.length > 0 ? 'has-client-comment' : ''}`} title={`${comments.length} comments`}>
                            <FiMessageCircle size={10} /> {comments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ──── RIGHT COLUMN: MAIN VIEW DETAIL ──── */}
          <div className="crp-detail">
            {activeTask ? (() => {
              const task = activeTask;
              const meta = STATUS_META[task.status] || STATUS_META.gray;
              const client = clients.find(c => c.id === task.clientId);
              const project = projects.find(p => p.id === task.projectId);
              const assignedEmp = task.assignedEmployeeId
                ? (employees.find(e => e.id === task.assignedEmployeeId) || (task.assignedEmployeeId === currentUser?.id ? currentUser : null))
                : null;
              const assignedSvc = task.serviceId
                ? services.find(s => s.id === task.serviceId) : null;
              const sel = assignSelections[task.id] || {};
              const isConfirmingDelete = deletingId === task.id;
              const canNavigate = !!(task.assignedDate && task.projectId);

              return (
                <div className="crp-detail-content">
                  {/* Title Bar */}
                  <div className="crp-detail-top">
                    <div>
                      <div className="crp-detail-title">{task.title}</div>
                      <div className="crp-detail-submeta">
                        {client && (
                          <span className="crp-meta-pill client">
                            <FiUser size={12} /> {client.name}
                          </span>
                        )}
                        {project && (
                          <span className="crp-meta-pill project">
                            📁 {project.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="crp-detail-actions">
                      <span
                        className="crp-status-chip"
                        style={{
                          background: meta.color + '22',
                          color: meta.color,
                          border: `1.5px solid ${meta.color}55`,
                        }}
                      >
                        {meta.label}
                      </span>

                      {canNavigate && (
                        <button
                          className="crp-btn-navigate"
                          onClick={() => {
                            onClose();
                            onNavigateToTask && onNavigateToTask(task);
                          }}
                          title="Open this task in Calendar"
                        >
                          <FiArrowRight size={13} /> View in Calendar
                        </button>
                      )}

                      {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                        <button
                          className="crp-btn-delete"
                          onClick={() => setDeleteTarget(task)}
                          title="Delete task"
                        >
                          <FiTrash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <div className="crp-detail-section">
                      <div className="crp-detail-label">Description</div>
                      <div className="crp-detail-desc">
                        <LinkifyText text={task.description} />
                      </div>
                    </div>
                  )}

                  {/* ════════ ASSIGN / REASSIGN SECTION ════════ */}
                  <div className="crp-assign-card">
                    <div className="crp-detail-label">
                      {assignedEmp ? '🔄 Reassign Task' : '⚡ Assign Task to Employee'}
                    </div>

                    {assignedEmp && (
                      <div className="crp-current-assignment">
                        <FiCheck size={14} style={{ color: '#10b981' }} />
                        <span>
                          Currently assigned to <strong>{assignedEmp.name}</strong>
                          {assignedSvc && <> for <span className="crp-inline-svc">{assignedSvc.name}</span></>}
                          {task.assignedDate && <> on <strong>{new Date(task.assignedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></>}
                        </span>
                      </div>
                    )}

                    <div className="crp-assign-form-grid">
                      {/* Employee select */}
                      <div className="crp-form-group">
                        <label>Employee *</label>
                        <select
                          className="crp-select"
                          value={sel.empId !== undefined ? sel.empId : (task.assignedEmployeeId || '')}
                          onChange={e => updateSelection(task.id, 'empId', e.target.value)}
                        >
                          <option value="">-- Select Employee --</option>
                          {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                            <option value={currentUser.id}>Assign to Self ({currentUser.name})</option>
                          )}
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} {emp.designation ? `(${emp.designation})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Service select */}
                      <div className="crp-form-group">
                        <label>Service (Optional)</label>
                        <select
                          className="crp-select"
                          value={sel.serviceId !== undefined ? sel.serviceId : (task.serviceId || '')}
                          onChange={e => updateSelection(task.id, 'serviceId', e.target.value)}
                        >
                          <option value="">-- Select Service --</option>
                          {services.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Date picker */}
                      <div className="crp-form-group">
                        <label>Assigned For Date</label>
                        <input
                          type="date"
                          className="crp-input-date"
                          value={sel.date || (task.assignedDate || new Date().toISOString().split('T')[0])}
                          onChange={e => updateSelection(task.id, 'date', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="crp-assign-actions">
                      <button
                        className="crp-btn-assign"
                        onClick={() => assignedEmp ? handleReassign(task.id, task) : handleAssign(task.id)}
                        disabled={!(sel.empId || task.assignedEmployeeId)}
                      >
                        {assignedEmp ? '🔄 Reassign' : '⚡ Assign Task'}
                      </button>

                      {assignedMsg[task.id] && (
                        <span className="crp-assigned-ok-msg">{assignedMsg[task.id]}</span>
                      )}
                    </div>
                  </div>

                  {/* ════════ COMMENTS SECTION ════════ */}
                  <div className="crp-comments-container">
                    <div className="crp-detail-label">
                      💬 Client Communication & Comments ({(task.comments || []).length})
                    </div>

                    <div className="crp-comment-thread">
                      {(task.comments || []).length === 0 ? (
                        <div className="crp-no-comments">No comments yet. Write a message below to reply to the client.</div>
                      ) : (
                        (task.comments || []).map(c => (
                          <div
                            key={c.id}
                            className={`comment-bubble ${c.authorRole === 'client' ? 'cb-client' : 'cb-employee'}`}
                          >
                            <span className="cb-author">
                              {c.authorName} <em>({c.authorRole})</em>
                            </span>
                            <p className="cb-text">
                              <LinkifyText text={c.text} />
                            </p>
                            <span className="cb-time">
                              {new Date(c.createdAt).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="comment-input-row">
                      <input
                        type="text"
                        placeholder="Write a message or reply to client..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSendComment(task.id);
                        }}
                      />
                      <button
                        onClick={() => handleSendComment(task.id)}
                        disabled={!commentText.trim()}
                        title="Send Message"
                      >
                        <FiSend size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Meta details footer */}
                  <div className="crp-detail-meta">
                    {task.requiredBy && (
                      <span>
                        <FiCalendar size={12} /> Required by:{' '}
                        <strong>
                          {new Date(task.requiredBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </strong>
                      </span>
                    )}

                    {task.assignedByName && (
                      <span>
                        ✍ Assigned by: <strong>{getTaskAssigner(task, employees, admins)}</strong>
                      </span>
                    )}

                    {task.createdAt && (
                      <span>
                        📌 Submitted on:{' '}
                        {new Date(task.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })() : (
              <div className="crp-detail-empty">
                <span style={{ fontSize: '3rem', opacity: 0.35 }}>📋</span>
                <span style={{ fontWeight: 600, fontSize: '1rem' }}>No task selected</span>
                <span style={{ fontSize: '0.85rem' }}>Select a request from the left list to view details, assign work, or respond to comments.</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget ? `client request "${deleteTarget.title}"` : 'this request'}
      />
    </div>
  );
}
