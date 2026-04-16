import { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { FiX, FiSave, FiTrash2, FiMessageCircle, FiSend, FiCalendar } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const STATUSES = [
  { value: 'gray',   label: 'In Progress', emoji: '⚫' },
  { value: 'yellow', label: 'Ready',       emoji: '🟡' },
  { value: 'green',  label: 'Completed',   emoji: '🟢' },
  { value: 'red',    label: 'Not Done',    emoji: '🔴' },
];

const MONTHS_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function TaskPopup({ projectId, dateStr, headerServiceIds = [], activeTaskId = null, activeClientTaskId = null, onClose }) {
  const { projects, employees, services, clientTasks, saveTasks, getTasks, deleteTasks, updateClientTask, addComment, systemSettings } = useData();
  const { currentUser } = useAuth();

  const existingTasks = getTasks(projectId, dateStr);

  const isEmp = currentUser?.role === 'employee';
  const isAdmin = currentUser?.role === 'admin';
  const isSuperadmin = currentUser?.role === 'superadmin';

  let empPerms = { canCreateTasks: true, readOnlyAccess: false, canComment: true };
  
  if (isSuperadmin) {
    empPerms.canComment = true;
  } else if (isAdmin) {
    empPerms.canComment = systemSettings?.adminCanComment !== false;
  } else if (isEmp) {
    const e = employees.find(x => x.id === currentUser.id);
    if (e) {
      empPerms = {
        canCreateTasks: e.canCreateTasks !== false,
        readOnlyAccess: e.readOnlyAccess === true,
        canComment: (e.canComment !== false) && (systemSettings?.employeeCanComment !== false)
      };
    }
  }

  const [taskList, setTaskList] = useState(() => {
    if (existingTasks && existingTasks.length > 0) return existingTasks;
    return [{
      id: uuidv4(),
      title: '',
      description: '',
      employeeIds: [],
      serviceIds: [],
      status: 'gray'
    }];
  });

  const [msg, setMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const project = projects.find((p) => p.id === projectId);

  // Format date nicely
  const [yr, mo, dy] = dateStr.split('-');
  const displayDate = `${Number(dy)} ${MONTHS_FULL[Number(mo) - 1]} ${yr}`;

  const addTask = () => {
    setTaskList([...taskList, {
      id: uuidv4(),
      title: '',
      description: '',
      employeeIds: [],
      serviceIds: [],
      status: 'gray'
    }]);
  };

  const removeTask = (index) => {
    const taskToDelete = taskList[index];
    const newList = [...taskList];
    newList.splice(index, 1);
    
    // If we're in focused mode and deleting the only visible task,
    // let's save and close immediately to provide a better UX.
    if (activeTaskId && taskToDelete.id === activeTaskId) {
      if (newList.length === 0) {
        deleteTasks(projectId, dateStr);
      } else {
        saveTasks(projectId, dateStr, newList);
      }
      onClose();
      return;
    }

    setTaskList(newList);
  };

  const updateTaskField = (index, field, value) => {
    const newList = [...taskList];
    newList[index] = { ...newList[index], [field]: value };
    setTaskList(newList);
  };

  const toggleEmployee = (index, empId) => {
    const task = taskList[index];
    const prev = task.employeeIds || [];
    const newValue = prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId];
    updateTaskField(index, 'employeeIds', newValue);
  };

  const toggleService = (index, srvId) => {
    const task = taskList[index];
    const prev = task.serviceIds || [];
    const newValue = prev.includes(srvId) ? prev.filter((id) => id !== srvId) : [...prev, srvId];
    updateTaskField(index, 'serviceIds', newValue);
  };

  const handleSave = () => {
    const validTasks = taskList.filter(t => t.title.trim());
    
    if (validTasks.length === 0) {
      // If the user removed all tasks and clicked save, we treat it as an overall deletion
      deleteTasks(projectId, dateStr);
      setMsg('✅ Tasks cleared!');
    } else {
      saveTasks(projectId, dateStr, validTasks.map(t => ({
        ...t,
        title: t.title.trim(),
        description: t.description.trim(),
        updatedAt: new Date().toISOString(),
      })));
      setMsg('✅ Tasks saved!');
    }

    setTimeout(() => onClose(), 800);
  };

  const handleDeleteAll = () => {
    setDeleteTarget({ type: 'all', name: `all tasks for this date` });
  };

  const confirmDelete = () => {
    if (deleteTarget?.type === 'single') {
      removeTask(deleteTarget.index);
    } else if (deleteTarget?.type === 'all') {
      deleteTasks(projectId, dateStr);
      onClose();
    }
    setDeleteTarget(null);
  };

  const [commentTexts, setCommentTexts] = useState({});
  const [openClientComments, setOpenClientComments] = useState({});

  // Client tasks for this day — resolve date from assignedDate OR requiredBy
  const dayClientTasks = (clientTasks || []).filter(ct => {
    if (!ct.assignedEmployeeId) return false;
    const effectiveDate = ct.assignedDate || ct.requiredBy;
    if (!effectiveDate || effectiveDate !== dateStr) return false;
    if (currentUser?.role === 'employee') {
      return ct.assignedEmployeeId === currentUser.id;
    }
    // admin/superadmin: filter by project
    return ct.projectId === projectId;
  });

  const visibleClientTasks = activeClientTaskId
    ? dayClientTasks.filter(t => t.id === activeClientTaskId)
    : dayClientTasks;

  const handleClientStatusChange = async (taskId, newStatus) => {
    await updateClientTask(taskId, { status: newStatus });
  };

  const handleSendClientComment = async (taskId) => {
    const text = (commentTexts[taskId] || '').trim();
    if (!text) return;
    await addComment(taskId, {
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      text,
    });
    setCommentTexts(prev => ({ ...prev, [taskId]: '' }));
  };

  return (
    <>
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card multi-task-card" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <div>
            <div className="popup-project">{project?.name}</div>
            <div className="popup-date">{displayDate}</div>
          </div>
          <button className="popup-close" onClick={onClose}><FiX size={20} /></button>
        </div>

        <div className="popup-body scrollable-body">
          {/* ── If focused on a client task, hide regular tasks ── */}
          {!activeClientTaskId && taskList
            .filter((task) => !activeTaskId || task.id === activeTaskId)
            .map((task) => {
              const originalIndex = taskList.findIndex(t => t.id === task.id);
              return (
                <TaskEntry 
                  key={task.id || originalIndex}
                  task={task}
                  index={originalIndex}
                  employees={employees}
                  services={services}
                  updateField={(f, v) => updateTaskField(originalIndex, f, v)}
                  onToggleEmp={(id) => toggleEmployee(originalIndex, id)}
                  onToggleSrv={(id) => toggleService(originalIndex, id)}
                  onRemove={() => setDeleteTarget({ type: 'single', index: originalIndex, name: `Task ${originalIndex + 1}` })}
                  headerServiceIds={headerServiceIds}
                  isLast={originalIndex === taskList.length - 1}
                  showRemove={!empPerms.readOnlyAccess}
                  isActive={activeTaskId === task.id}
                  readOnlyAccess={empPerms.readOnlyAccess}
                />
              );
            })}

          {!activeClientTaskId && !activeTaskId && empPerms.canCreateTasks && !empPerms.readOnlyAccess && (
            <button className="btn-add-another" onClick={addTask}>
              + Add Another Task for this Day
            </button>
          )}

          {/* ── Client Requests with status + comments (Unified for Admin & Employee) ── */}
          {visibleClientTasks.length > 0 && (
            <div className="client-requests-section">
              <div className="crs-header">
                <span>📩 {activeClientTaskId ? 'Client Request' : 'Client Requests for this Day'}</span>
                <span className="crs-count">{visibleClientTasks.length}</span>
              </div>
              {visibleClientTasks.map(ct => {
                const STATUS_META = {
                  gray:   { label: 'Pending',     color: '#6b7280' },
                  yellow: { label: 'In Progress', color: '#f59e0b' },
                  green:  { label: 'Completed',   color: '#10b981' },
                  red:    { label: 'Not Done',    color: '#ef4444' },
                };
                const assignedEmp = employees.find(e => e.id === ct.assignedEmployeeId);
                const assignedSvc = services.find(s => s.id === ct.serviceId);
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
                      {Object.entries(STATUS_META).map(([val, m]) => (
                        <button
                          key={val}
                          className={`crs-status-btn ${ct.status === val ? 'crs-active' : ''} ${empPerms.readOnlyAccess ? 'disabled' : ''}`}
                          style={{ '--sc': m.color, pointerEvents: empPerms.readOnlyAccess ? 'none' : 'auto', opacity: empPerms.readOnlyAccess && ct.status !== val ? 0.6 : 1 }}
                          onClick={() => !empPerms.readOnlyAccess && handleClientStatusChange(ct.id, val)}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <button
                      className="ctc-comment-toggle"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => setOpenClientComments(prev => ({ ...prev, [ct.id]: !prev[ct.id] }))}
                    >
                      <FiMessageCircle size={13} />
                      {ct.comments?.length > 0 ? `${ct.comments.length} Comment${ct.comments.length > 1 ? 's' : ''}` : 'Comments'}
                    </button>
                    {openClientComments[ct.id] && (
                      <div className="comment-thread" style={{ marginTop: '0.5rem' }}>
                        {(ct.comments || []).map(c => (
                          <div key={c.id} className={`comment-bubble ${c.authorRole === 'client' ? 'cb-client' : 'cb-employee'}`}>
                            <span className="cb-author">{c.authorName} <em>({c.authorRole})</em></span>
                            <p className="cb-text">{c.text}</p>
                            <span className="cb-time">{new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))}
                        {empPerms.canComment && !empPerms.readOnlyAccess && (
                          <div className="comment-input-row">
                            <input
                              type="text"
                              placeholder="Write a message..."
                              value={commentTexts[ct.id] || ''}
                              onChange={e => setCommentTexts(prev => ({ ...prev, [ct.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') handleSendClientComment(ct.id); }}
                            />
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
            {existingTasks.length > 0 && !activeTaskId && (
              <button className="btn-delete-task" onClick={handleDeleteAll}>
                <FiTrash2 /> Delete All
              </button>
            )}
            <button className="btn-save-task" onClick={handleSave}>
              <FiSave /> Save All Tasks
            </button>
          </div>
        )}
      </div>
    </div>

    <ConfirmDeleteModal 
      isOpen={!!deleteTarget}
      onClose={() => setDeleteTarget(null)}
      onConfirm={confirmDelete}
      itemName={deleteTarget?.name}
    />
    </>
  );
}

function TaskEntry({ task, index, employees, services, updateField, onToggleEmp, onToggleSrv, onRemove, showRemove, headerServiceIds, isActive, readOnlyAccess }) {
  const [isEmpOpen, setIsEmpOpen] = useState(false);
  const [isSrvOpen, setIsSrvOpen] = useState(false);
  
  const empRef = useRef(null);
  const srvRef = useRef(null);
  const entryRef = useRef(null);

  useEffect(() => {
    if (isActive && entryRef.current) {
      entryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (empRef.current && !empRef.current.contains(event.target)) {
        setIsEmpOpen(false);
      }
      if (srvRef.current && !srvRef.current.contains(event.target)) {
        setIsSrvOpen(false);
      }
    }
    if (isEmpOpen || isSrvOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmpOpen, isSrvOpen]);

  // Filter services based on header selection
  const filteredServices = headerServiceIds.length > 0
    ? services.filter(s => headerServiceIds.includes(s.id))
    : services;

  // Filter employees:
  // 1. If task has selected services, only show employees assigned to those services.
  // 2. If task has NO services selected, but Dashboard Header has services selected,
  //    show employees assigned to the header services.
  // 3. Otherwise (All Services), show all employees.
  let effectiveServiceIds = [];
  if (task.serviceIds && task.serviceIds.length > 0) {
    effectiveServiceIds = task.serviceIds;
  } else if (headerServiceIds && headerServiceIds.length > 0) {
    effectiveServiceIds = headerServiceIds;
  }

  let baseEmployees = effectiveServiceIds.length > 0
    ? employees.filter(emp =>
        (emp.assignedServiceIds || []).some(sid => effectiveServiceIds.includes(sid))
      )
    : employees;

  // Senior Employee logic: Standard employees can only assign to themselves.
  // currentUser role is 'employee' and isSenior is false.
  // Admins and Superadmins (and Senior Employees) can assign to anyone.
  const isEmployee = currentUser?.role === 'employee';
  const isSenior = currentUser?.isSenior === true;
  
  const filteredEmployees = (isEmployee && !isSenior)
    ? baseEmployees.filter(emp => emp.id === currentUser.id)
    : baseEmployees;

  const getEmpText = () => {
    const ids = task.employeeIds || [];
    if (ids.length === 0) return 'Select Employees';
    if (ids.length === 1) {
      const e = employees.find(emp => emp.id === ids[0]);
      return e ? e.name : '1 Employee';
    }
    return `${ids.length} Employees`;
  };

  const getSrvText = () => {
    const ids = task.serviceIds || [];
    if (ids.length === 0) return 'Select Services';
    if (ids.length === 1) {
      const s = services.find(srv => srv.id === ids[0]);
      return s ? s.name : '1 Service';
    }
    return `${ids.length} Services`;
  };

  return (
    <div className={`task-entry-item ${isActive ? 'task-focused' : ''}`} ref={entryRef}>
      <div className="task-entry-header">
        <span className="task-number">Task {index + 1}</span>
        {showRemove && (
          <button className="btn-remove-entry" onClick={onRemove} title="Remove Task">
            <FiTrash2 size={16} />
          </button>
        )}
      </div>

      <div className="task-entry-content">
        <div className="task-entry-main">
          <div className="form-group fg-title">
            <label className="popup-label">Task Title</label>
            <input
              type="text"
              className="popup-input"
              placeholder="What needs to be done?"
              value={task.title}
              onChange={(e) => updateField('title', e.target.value)}
              readOnly={readOnlyAccess}
            />
          </div>

          <div className="form-group fg-desc">
            <label className="popup-label">Description</label>
            <textarea
              className="popup-input popup-textarea"
              placeholder="Add more details about the task..."
              value={task.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
              readOnly={readOnlyAccess}
            />
          </div>

          <div className="form-row fg-row">
            <div className="form-group">
              <label className="popup-label">Employees</label>
              <div className="multi-select-container" ref={empRef}>
                <div 
                  className={`dropdown-trigger ${isEmpOpen ? 'active' : ''} ${readOnlyAccess ? 'disabled' : ''}`}
                  onClick={() => !readOnlyAccess && setIsEmpOpen(!isEmpOpen)}
                  style={readOnlyAccess ? { cursor: 'not-allowed', background: 'var(--bg)' } : {}}
                >
                  <span className="trigger-text">{getEmpText()}</span>
                  <span className="trigger-icon">▼</span>
                </div>
                {isEmpOpen && !readOnlyAccess && (
                  <div className="dropdown-menu">
                    {filteredEmployees.length === 0 ? (
                      <div className="no-emp-hint">
                        {(task.serviceIds && task.serviceIds.length > 0)
                          ? 'No employees assigned to the selected services.'
                          : (headerServiceIds && headerServiceIds.length > 0)
                            ? 'No employees assigned to the dashboard service filter.'
                            : 'No employees available.'}
                      </div>
                    ) : (
                      filteredEmployees.map(emp => (
                        <label key={emp.id} className={`emp-checkbox-item ${task.employeeIds?.includes(emp.id) ? 'checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={task.employeeIds?.includes(emp.id)}
                            onChange={() => onToggleEmp(emp.id)}
                            onClick={e => e.stopPropagation()}
                          />
                          <div className="emp-check-info">
                            <div className="emp-check-name">{emp.name}</div>
                            <div className="emp-check-user">@{emp.username}</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="popup-label">Services</label>
              <div className="multi-select-container" ref={srvRef}>
                <div 
                  className={`dropdown-trigger ${isSrvOpen ? 'active' : ''} ${readOnlyAccess ? 'disabled' : ''}`}
                  onClick={() => !readOnlyAccess && setIsSrvOpen(!isSrvOpen)}
                  style={readOnlyAccess ? { cursor: 'not-allowed', background: 'var(--bg)' } : {}}
                >
                  <span className="trigger-text">{getSrvText()}</span>
                  <span className="trigger-icon">▼</span>
                </div>
                {isSrvOpen && !readOnlyAccess && (
                  <div className="dropdown-menu popup-srv-menu">
                    {filteredServices.length === 0 ? (
                      <div className="no-emp-hint">No services match current filter.</div>
                    ) : (
                      filteredServices.map(srv => (
                        <label key={srv.id} className={`emp-checkbox-item ${task.serviceIds?.includes(srv.id) ? 'checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={task.serviceIds?.includes(srv.id)}
                            onChange={() => onToggleSrv(srv.id)}
                            onClick={e => e.stopPropagation()}
                          />
                          <span className="emp-check-name">{srv.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="task-entry-status">
          <label className="status-heading">Status</label>
          <div className="status-options-compact">
            {STATUSES.map((s) => (
              <label
                key={s.value}
                className={`status-chip status-opt-${s.value} ${task.status === s.value ? 'selected' : ''}`}
                title={s.label}
                style={readOnlyAccess ? { pointerEvents: 'none', opacity: task.status === s.value ? 1 : 0.5 } : {}}
              >
                <input
                  type="radio"
                  name={`status-${task.id || index}`}
                  value={s.value}
                  checked={task.status === s.value}
                  onChange={() => !readOnlyAccess && updateField('status', s.value)}
                  hidden
                  disabled={readOnlyAccess}
                />
                <span className="status-emoji">{s.emoji}</span>
                <span className={`status-dot-mobile color-${s.value}`}></span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
