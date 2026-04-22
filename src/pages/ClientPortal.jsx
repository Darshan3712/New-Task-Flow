import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { FiPlus, FiClock, FiCalendar, FiChevronDown } from 'react-icons/fi';
import ClientTaskForm from '../components/client/ClientTaskForm';
import ClientCommentPopup from '../components/client/ClientCommentPopup';
import LogoutConfirmModal from '../components/header/LogoutConfirmModal';

const STATUS_META = {
  gray:   { label: 'Pending',     color: '#6b7280' },
  yellow: { label: 'In Progress', color: '#f59e0b' },
  green:  { label: 'Completed',   color: '#10b981' },
  red:    { label: 'Not Done',    color: '#ef4444' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function ClientPortal() {
  const { currentUser, logout } = useAuth();
  const { projects, employees, clientTasks, addClientTask, addComment } = useData();

  const myProject = projects.find(p => p.id === currentUser?.projectId);
  const now = new Date();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskRequiredBy, setTaskRequiredBy] = useState('');
  const [formMsg, setFormMsg] = useState('');

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) setIsStatusDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Comment popup ───────────────────────────────────────────────────────────
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const liveSelectedTask = selectedTask ? clientTasks.find(t => t.id === selectedTask.id) || selectedTask : null;

  // ── Logout ──────────────────────────────────────────────────────────────────
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await addClientTask({ clientId: currentUser.id, projectId: currentUser.projectId, title: taskTitle.trim(), description: taskDesc.trim(), requiredBy: taskRequiredBy });
    setTaskTitle(''); setTaskDesc(''); setTaskRequiredBy('');
    setFormMsg('✅ Task submitted!');
    setTimeout(() => { setFormMsg(''); setShowForm(false); }, 1500);
  };

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text || !selectedTask) return;
    const updated = await addComment(selectedTask.id, { authorId: currentUser.id, authorName: currentUser.name, authorRole: 'client', text });
    setCommentText('');
    setSelectedTask(prev => ({ ...prev, comments: updated.comments }));
  };

  const years = [];
  for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 3; y++) years.push(y);

  const filteredClientTasks = clientTasks.filter(task => {
    const d = task.createdAt ? new Date(task.createdAt) : new Date();
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && (selectedStatus === 'all' || task.status === selectedStatus);
  });

  return (
    <div className="client-portal">
      <header className="app-header">
        <div className="header-left"><div className="header-logo"><img src={`${import.meta.env.BASE_URL}New_Logo.png`} alt="TaskFlow" className="app-main-logo" /></div></div>
        <div className="header-center">
          <div className="header-row-2" style={{ justifyContent: 'center', width: '100%' }}>
            <div className="header-control" ref={statusDropdownRef}>
              <label className="header-label">Task Status</label>
              <div className="custom-dropdown-container">
                <div className={`header-custom-select ${isStatusDropdownOpen ? 'active' : ''}`} onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}>
                  <div className="selected-value">
                    {selectedStatus === 'all' ? 'All Statuses' : <><span className="status-dot" style={{ backgroundColor: STATUS_META[selectedStatus]?.color }} />{STATUS_META[selectedStatus]?.label}</>}
                  </div>
                  <FiChevronDown className={`chevron ${isStatusDropdownOpen ? 'up' : ''}`} />
                </div>
                {isStatusDropdownOpen && (
                  <div className="header-dropdown-menu">
                    <div className={`header-dropdown-item ${selectedStatus === 'all' ? 'active' : ''}`} onClick={() => { setSelectedStatus('all'); setIsStatusDropdownOpen(false); }}>All Statuses</div>
                    {Object.entries(STATUS_META).map(([key, meta]) => (
                      <div key={key} className={`header-dropdown-item ${selectedStatus === key ? 'active' : ''}`} onClick={() => { setSelectedStatus(key); setIsStatusDropdownOpen(false); }}>
                        <span className="status-dot" style={{ backgroundColor: meta.color }} />{meta.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="header-control">
              <label className="header-label">Month</label>
              <select className="header-select" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div className="header-control">
              <label className="header-label">Year</label>
              <select className="header-select" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="header-right">
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{myProject ? myProject.name : 'No Project Assigned'}</span>
          <button className="btn-admin-panel" onClick={() => setShowLogoutConfirm(true)}>Logout</button>
        </div>
      </header>

      <main className="client-main">
        <div className="client-welcome">
          <h2>Hello, {currentUser?.name} 👋</h2>
          <p>Submit your task requests below. Your assigned team will get notified and start working on them.</p>
        </div>

        {!showForm ? (
          <button className="client-new-task-btn" onClick={() => setShowForm(true)}><FiPlus size={18} /> New Task Request</button>
        ) : (
          <ClientTaskForm onSubmit={handleCreateTask} onCancel={() => setShowForm(false)} taskTitle={taskTitle} setTaskTitle={setTaskTitle} taskDesc={taskDesc} setTaskDesc={setTaskDesc} taskRequiredBy={taskRequiredBy} setTaskRequiredBy={setTaskRequiredBy} formMsg={formMsg} />
        )}

        <div className="client-tasks-section">
          <h3>My Task Requests ({filteredClientTasks.length})</h3>
          {filteredClientTasks.length === 0 ? (
            <div className="client-empty"><FiClock size={40} opacity={0.3} /><p>No task requests yet. Create your first one above!</p></div>
          ) : (
            <div className="client-task-list">
              {filteredClientTasks.map(task => {
                const meta = STATUS_META[task.status] || STATUS_META.gray;
                const assignedEmp = task.assignedEmployeeId ? employees.find(e => e.id === task.assignedEmployeeId) : null;
                return (
                  <div key={task.id} className="client-task-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedTask(task)}>
                    <div className="ctc-header">
                      <div className="ctc-title">{task.title}</div>
                      <span className="ctc-status-chip" style={{ background: meta.color + '22', color: meta.color, border: `1.5px solid ${meta.color}55` }}>{meta.label}</span>
                    </div>
                    {task.description && <p className="ctc-desc">{task.description}</p>}
                    <div className="ctc-meta">
                      {task.requiredBy && <span className="ctc-meta-item"><FiCalendar size={12} /> Required by: <strong>{new Date(task.requiredBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>}
                      {assignedEmp && <span className="ctc-meta-item">👤 Assigned to: <strong>{assignedEmp.name}</strong></span>}
                    </div>
                    <div className="ctc-footer">
                      <span className="ctc-click-hint">💬 {task.comments?.length > 0 ? `${task.comments.length} Comment${task.comments.length > 1 ? 's' : ''}` : 'Click to view & comment'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {liveSelectedTask && <ClientCommentPopup task={liveSelectedTask} employees={employees} commentText={commentText} setCommentText={setCommentText} onSend={handleSendComment} onClose={() => { setSelectedTask(null); setCommentText(''); }} />}
      {showLogoutConfirm && <LogoutConfirmModal onCancel={() => setShowLogoutConfirm(false)} onConfirm={() => { setShowLogoutConfirm(false); logout(); window.location.href = import.meta.env.BASE_URL + 'login'; }} />}
    </div>
  );
}
