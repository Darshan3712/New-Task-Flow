import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { FiX, FiSave, FiTrash2, FiMessageCircle, FiSend, FiCalendar } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import TaskEntry from './TaskEntry';

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_META = {
  gray:   { label: 'Pending',     color: '#6b7280' },
  yellow: { label: 'In Progress', color: '#f59e0b' },
  green:  { label: 'Completed',   color: '#10b981' },
  red:    { label: 'Not Done',    color: '#ef4444' },
};

export default function TaskPopup({ projectId, dateStr, headerServiceIds = [], activeTaskId = null, activeClientTaskId = null, onClose }) {
  const { projects, employees, services, clientTasks, saveTasks, getTasks, deleteTasks, updateClientTask, addComment, systemSettings } = useData();
  const { currentUser } = useAuth();

  const existingTasks = getTasks(projectId, dateStr);
  const isEmp = currentUser?.role === 'employee';
  const isAdmin = currentUser?.role === 'admin';
  const isSuperadmin = currentUser?.role === 'superadmin';

  let empPerms = { canCreateTasks: true, readOnlyAccess: false, canComment: true };
  if (isSuperadmin) { empPerms.canComment = true; }
  else if (isAdmin) { empPerms.canComment = systemSettings?.adminCanComment !== false; }
  else if (isEmp) {
    const e = employees.find(x => x.id === currentUser.id);
    if (e) empPerms = { canCreateTasks: e.canCreateTasks !== false, readOnlyAccess: e.readOnlyAccess === true, canComment: (e.canComment !== false) && (systemSettings?.employeeCanComment !== false) };
  }

  const [taskList, setTaskList] = useState(() => existingTasks?.length ? existingTasks : [{ id: uuidv4(), title: '', description: '', employeeIds: [], serviceIds: [], status: 'gray' }]);
  const [msg, setMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [openClientComments, setOpenClientComments] = useState({});

  const project = projects.find((p) => p.id === projectId);
  const [yr, mo, dy] = dateStr.split('-');
  const displayDate = `${Number(dy)} ${MONTHS_FULL[Number(mo) - 1]} ${yr}`;

  const newBlankTask = () => ({ id: uuidv4(), title: '', description: '', employeeIds: [], serviceIds: [], status: 'gray' });
  const addTask = () => setTaskList([...taskList, newBlankTask()]);

  const updateTaskField = (index, field, value) => { const n = [...taskList]; n[index] = { ...n[index], [field]: value }; setTaskList(n); };
  const toggleEmployee = (index, empId) => { const t = taskList[index]; const prev = t.employeeIds || []; updateTaskField(index, 'employeeIds', prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]); };
  const toggleService = (index, srvId) => { const t = taskList[index]; const prev = t.serviceIds || []; updateTaskField(index, 'serviceIds', prev.includes(srvId) ? prev.filter(id => id !== srvId) : [...prev, srvId]); };

  const removeTask = (index) => {
    const taskToDelete = taskList[index];
    const newList = taskList.filter((_, i) => i !== index);
    if (activeTaskId && taskToDelete.id === activeTaskId) { if (!newList.length) deleteTasks(projectId, dateStr); else saveTasks(projectId, dateStr, newList); onClose(); return; }
    setTaskList(newList);
  };

  const handleSave = () => {
    const valid = taskList.filter(t => t.title.trim());
    if (!valid.length) { deleteTasks(projectId, dateStr); setMsg('✅ Tasks cleared!'); }
    else { saveTasks(projectId, dateStr, valid.map(t => ({ ...t, title: t.title.trim(), description: t.description.trim(), updatedAt: new Date().toISOString() }))); setMsg('✅ Tasks saved!'); }
    setTimeout(() => onClose(), 800);
  };

  const confirmDelete = () => {
    if (deleteTarget?.type === 'single') removeTask(deleteTarget.index);
    else if (deleteTarget?.type === 'all') { deleteTasks(projectId, dateStr); onClose(); }
    setDeleteTarget(null);
  };

  const dayClientTasks = (clientTasks || []).filter(ct => {
    if (!ct.assignedEmployeeId) return false;
    const eff = ct.assignedDate || ct.requiredBy;
    if (!eff || eff !== dateStr) return false;
    if (currentUser?.role === 'employee') return ct.assignedEmployeeId === currentUser.id;
    return ct.projectId === projectId;
  });
  const visibleClientTasks = activeClientTaskId ? dayClientTasks.filter(t => t.id === activeClientTaskId) : dayClientTasks;

  const handleSendClientComment = async (taskId) => {
    const text = (commentTexts[taskId] || '').trim();
    if (!text) return;
    await addComment(taskId, { authorId: currentUser.id, authorName: currentUser.name, authorRole: currentUser.role, text });
    setCommentTexts(prev => ({ ...prev, [taskId]: '' }));
  };

  return (
    <>
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-card multi-task-card" onClick={(e) => e.stopPropagation()}>
          <div className="popup-header">
            <div><div className="popup-project">{project?.name}</div><div className="popup-date">{displayDate}</div></div>
            <button className="popup-close" onClick={onClose}><FiX size={20} /></button>
          </div>

          <div className="popup-body scrollable-body">
            {!activeClientTaskId && taskList.filter((task) => !activeTaskId || task.id === activeTaskId).map((task) => {
              const originalIndex = taskList.findIndex(t => t.id === task.id);
              return (
                <TaskEntry key={task.id || originalIndex} task={task} index={originalIndex} employees={employees} services={services} updateField={(f, v) => updateTaskField(originalIndex, f, v)} onToggleEmp={(id) => toggleEmployee(originalIndex, id)} onToggleSrv={(id) => toggleService(originalIndex, id)} onRemove={() => setDeleteTarget({ type: 'single', index: originalIndex, name: `Task ${originalIndex + 1}` })} headerServiceIds={headerServiceIds} isLast={originalIndex === taskList.length - 1} showRemove={!empPerms.readOnlyAccess} isActive={activeTaskId === task.id} readOnlyAccess={empPerms.readOnlyAccess} />
              );
            })}

            {!activeClientTaskId && !activeTaskId && empPerms.canCreateTasks && !empPerms.readOnlyAccess && (
              <button className="btn-add-another" onClick={addTask}>+ Add Another Task for this Day</button>
            )}

            {visibleClientTasks.length > 0 && (
              <div className="client-requests-section">
                <div className="crs-header">
                  <span>📩 {activeClientTaskId ? 'Client Request' : 'Client Requests for this Day'}</span>
                  <span className="crs-count">{visibleClientTasks.length}</span>
                </div>
                {visibleClientTasks.map(ct => {
                  const assignedEmp = employees.find(e => e.id === ct.assignedEmployeeId);
                  const assignedSvc = services.find(s => s.id === ct.serviceId);
                  const m = STATUS_META[ct.status] || STATUS_META.gray;
                  return (
                    <div key={ct.id} className="crs-task-card">
                      <div className="crs-task-title">{ct.title}</div>
                      {ct.description && <p className="crs-task-desc">{ct.description}</p>}
                      <div className="crs-meta" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {assignedEmp && <span>👤 {assignedEmp.name}</span>}
                        {assignedSvc && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>📋 {assignedSvc.name}</span>}
                        {ct.requiredBy && <span><FiCalendar size={11} /> Required by: <strong>{new Date(ct.requiredBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>}
                      </div>
                      <div className="crs-status-row">
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>Status:</span>
                        {Object.entries(STATUS_META).map(([val, sm]) => <button key={val} className={`crs-status-btn ${ct.status === val ? 'crs-active' : ''} ${empPerms.readOnlyAccess ? 'disabled' : ''}`} style={{ '--sc': sm.color, pointerEvents: empPerms.readOnlyAccess ? 'none' : 'auto', opacity: empPerms.readOnlyAccess && ct.status !== val ? 0.6 : 1 }} onClick={() => !empPerms.readOnlyAccess && updateClientTask(ct.id, { status: val })}>{sm.label}</button>)}
                      </div>
                      <button className="ctc-comment-toggle" style={{ marginTop: '0.5rem' }} onClick={() => setOpenClientComments(prev => ({ ...prev, [ct.id]: !prev[ct.id] }))}>
                        <FiMessageCircle size={13} /> {ct.comments?.length > 0 ? `${ct.comments.length} Comment${ct.comments.length > 1 ? 's' : ''}` : 'Comments'}
                      </button>
                      {openClientComments[ct.id] && (
                        <div className="comment-thread" style={{ marginTop: '0.5rem' }}>
                          {(ct.comments || []).map(c => <div key={c.id} className={`comment-bubble ${c.authorRole === 'client' ? 'cb-client' : 'cb-employee'}`}><span className="cb-author">{c.authorName} <em>({c.authorRole})</em></span><p className="cb-text">{c.text}</p><span className="cb-time">{new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>)}
                          {empPerms.canComment && !empPerms.readOnlyAccess && (
                            <div className="comment-input-row">
                              <input type="text" placeholder="Write a message..." value={commentTexts[ct.id] || ''} onChange={e => setCommentTexts(prev => ({ ...prev, [ct.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') handleSendClientComment(ct.id); }} />
                              <button onClick={() => handleSendClientComment(ct.id)}><FiSend size={13} /></button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {msg && <div className="popup-msg">{msg}</div>}
          {!empPerms.readOnlyAccess && (
            <div className="popup-footer">
              {existingTasks.length > 0 && !activeTaskId && <button className="btn-delete-task" onClick={() => setDeleteTarget({ type: 'all', name: 'all tasks for this date' })}><FiTrash2 /> Delete All</button>}
              <button className="btn-save-task" onClick={handleSave}><FiSave /> Save All Tasks</button>
            </div>
          )}
        </div>
      </div>
      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} itemName={deleteTarget?.name} />
    </>
  );
}
