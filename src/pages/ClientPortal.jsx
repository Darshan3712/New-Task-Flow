import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { FiCalendar, FiSend, FiPlus, FiClock, FiX } from 'react-icons/fi';

const STATUS_META = {
  gray:   { label: 'Pending',    color: '#6b7280' },
  yellow: { label: 'In Progress', color: '#f59e0b' },
  green:  { label: 'Completed',  color: '#10b981' },
  red:    { label: 'Revision',   color: '#ef4444' },
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function ClientPortal() {
  const { currentUser, logout } = useAuth();
  const { projects, employees, clientTasks, addClientTask, addComment } = useData();

  const myProject = projects.find(p => p.id === currentUser?.projectId);

  // ── New Task Form ─────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [taskTitle, setTaskTitle]       = useState('');
  const [taskDesc, setTaskDesc]         = useState('');
  const [taskRequiredBy, setTaskRequiredBy] = useState('');
  const [formMsg, setFormMsg]           = useState('');

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await addClientTask({
      clientId: currentUser.id,
      projectId: currentUser.projectId,
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      requiredBy: taskRequiredBy,
    });
    setTaskTitle(''); setTaskDesc(''); setTaskRequiredBy('');
    setFormMsg('✅ Task submitted!');
    setTimeout(() => { setFormMsg(''); setShowForm(false); }, 1500);
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    window.location.href = '/login';
  };

  // ── Comment Popup ─────────────────────────────────────────────────────────
  const [selectedTask, setSelectedTask] = useState(null); // the task object for the popup
  const [commentText, setCommentText]   = useState('');

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text || !selectedTask) return;
    const updated = await addComment(selectedTask.id, {
      authorId:   currentUser.id,
      authorName: currentUser.name,
      authorRole: 'client',
      text,
    });
    setCommentText('');
    // Refresh selectedTask from latest clientTasks list immediately
    setSelectedTask(prev => ({ ...prev, comments: updated.comments }));
  };

  // Keep selectedTask in sync when clientTasks updates (after comment saved)
  const liveSelectedTask = selectedTask
    ? clientTasks.find(t => t.id === selectedTask.id) || selectedTask
    : null;


  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const years = [];
  for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 3; y++) {
    years.push(y);
  }

  const filteredClientTasks = clientTasks.filter(task => {
    const taskDate = task.createdAt ? new Date(task.createdAt) : new Date();
    return taskDate.getMonth() === selectedMonth && taskDate.getFullYear() === selectedYear;
  });

  return (
    <div className="client-portal">
      {/* ── Client Header ────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo">
            <img src={`${import.meta.env.BASE_URL}New_Logo.png`} alt="TaskFlow" className="app-main-logo" />
          </div>
        </div>
        
        <div className="header-center">
          <div className="header-row-2" style={{ justifyContent: 'center', width: '100%' }}>
            <div className="header-control">
              <label className="header-label">Month</label>
              <select
                className="header-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>
            <div className="header-control">
              <label className="header-label">Year</label>
              <select
                className="header-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="header-right">
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
            {myProject ? myProject.name : 'No Project Assigned'}
          </span>
          <button className="btn-admin-panel" onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="client-main">
        <div className="client-welcome">
          <h2>Hello, {currentUser?.name} 👋</h2>
          <p>Submit your task requests below. Your assigned team will get notified and start working on them.</p>
        </div>

        {/* ── New Task Button / Form ───────────────────────────── */}
        {!showForm ? (
          <button className="client-new-task-btn" onClick={() => setShowForm(true)}>
            <FiPlus size={18} /> New Task Request
          </button>
        ) : (
          <div className="client-form-card">
            <h3>New Task Request</h3>
            <form onSubmit={handleCreateTask} className="client-task-form">
              <div className="form-group">
                <label>Task Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Update homepage banner"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe the task in detail..."
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Required By</label>
                <div className="client-date-wrapper">
                  <FiCalendar className="date-icon" />
                  <input
                    type="date"
                    value={taskRequiredBy}
                    onChange={e => setTaskRequiredBy(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <span className="status-chip-static gray-chip">⚫ Pending</span>
              </div>
              {formMsg && <div className="form-msg">{formMsg}</div>}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-save-task">Save Task</button>
                <button type="button" className="btn-delete-task" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── My Tasks List ────────────────────────────────────── */}
        <div className="client-tasks-section">
          <h3>My Task Requests ({filteredClientTasks.length})</h3>
          {filteredClientTasks.length === 0 ? (
            <div className="client-empty">
              <FiClock size={40} opacity={0.3} />
              <p>No task requests yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="client-task-list">
              {filteredClientTasks.map(task => {
                const meta = STATUS_META[task.status] || STATUS_META.gray;
                const assignedEmp = task.assignedEmployeeId
                  ? employees.find(e => e.id === task.assignedEmployeeId)
                  : null;

                return (
                  <div
                    key={task.id}
                    className="client-task-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="ctc-header">
                      <div className="ctc-title">{task.title}</div>
                      <span className="ctc-status-chip" style={{ background: meta.color + '22', color: meta.color, border: `1.5px solid ${meta.color}55` }}>
                        {meta.label}
                      </span>
                    </div>

                    {task.description && <p className="ctc-desc">{task.description}</p>}

                    <div className="ctc-meta">
                      {task.requiredBy && (
                        <span className="ctc-meta-item">
                          <FiCalendar size={12} /> Required by: <strong>{new Date(task.requiredBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        </span>
                      )}
                      {assignedEmp && (
                        <span className="ctc-meta-item">
                          👤 Assigned to: <strong>{assignedEmp.name}</strong>
                        </span>
                      )}
                      {!assignedEmp && task.status === 'green' && (
                        <span className="ctc-meta-item" style={{ color: '#10b981' }}>✅ Assignment completed</span>
                      )}
                      {!assignedEmp && task.status !== 'green' && (
                        <span className="ctc-meta-item ctc-unassigned">⏳ Awaiting assignment</span>
                      )}
                    </div>

                    <div className="ctc-footer">
                      <span className="ctc-click-hint">
                        💬 {task.comments?.length > 0 ? `${task.comments.length} Comment${task.comments.length > 1 ? 's' : ''}` : 'Click to view & comment'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Comment Popup Modal ──────────────────────────────────── */}
      {liveSelectedTask && (
        <div className="popup-overlay" onClick={() => { setSelectedTask(null); setCommentText(''); }}>
          <div className="popup-card" style={{ maxWidth: '560px', width: '95%' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="popup-header">
              <div>
                <div className="popup-project" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                  {(() => { const m = STATUS_META[liveSelectedTask.status] || STATUS_META.gray; return <span style={{ color: m.color }}>● {m.label}</span>; })()}
                </div>
                <div className="popup-date" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{liveSelectedTask.title}</div>
              </div>
              <button className="popup-close" onClick={() => { setSelectedTask(null); setCommentText(''); }}><FiX size={20} /></button>
            </div>

            <div className="popup-body scrollable-body" style={{ maxHeight: '420px' }}>
              {/* Task details */}
              {liveSelectedTask.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.75rem', lineHeight: 1.6 }}>{liveSelectedTask.description}</p>
              )}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {liveSelectedTask.requiredBy && (
                  <span><FiCalendar size={12} /> {new Date(liveSelectedTask.requiredBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                )}
                {employees.find(e => e.id === liveSelectedTask.assignedEmployeeId) && (
                  <span>👤 {employees.find(e => e.id === liveSelectedTask.assignedEmployeeId).name}</span>
                )}
              </div>

              {/* Comment thread */}
              <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>💬 Comments</div>
                {(liveSelectedTask.comments || []).length === 0 && (
                  <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.8rem', textAlign: 'center', padding: '1rem 0' }}>No comments yet. Start the conversation!</p>
                )}
                <div className="comment-thread" style={{ background: 'transparent', border: 'none', padding: 0, gap: '0.5rem' }}>
                  {(liveSelectedTask.comments || []).map(c => (
                    <div key={c.id} className={`comment-bubble ${c.authorRole === 'client' ? 'cb-client' : 'cb-employee'}`}>
                      <span className="cb-author">{c.authorName} <em>({c.authorRole === 'client' ? 'You' : 'Team'})</em></span>
                      <p className="cb-text">{c.text}</p>
                      <span className="cb-time">{new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Comment input */}
            <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              {liveSelectedTask.assignedEmployeeId ? (
                <div className="comment-input-row">
                  <input
                    type="text"
                    placeholder="Write a message to your team..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSendComment(); }}
                    autoFocus
                  />
                  <button onClick={handleSendComment}><FiSend size={14} /></button>
                </div>
              ) : (
                <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.8rem', textAlign: 'center' }}>Comments will be available once your task is assigned to a team member.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="popup-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="popup-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px', textAlign: 'center', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>Confirm Logout</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, flex: 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', background: '#e11d48', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, flex: 1 }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
