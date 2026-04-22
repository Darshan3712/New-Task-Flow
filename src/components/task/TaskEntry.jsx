import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiTrash2 } from 'react-icons/fi';
import LinkifyText from './LinkifyText';

const STATUSES = [
  { value: 'gray',   label: 'In Progress', emoji: '⚫' },
  { value: 'yellow', label: 'Ready',       emoji: '🟡' },
  { value: 'green',  label: 'Completed',   emoji: '🟢' },
  { value: 'red',    label: 'Not Done',    emoji: '🔴' },
];

export default function TaskEntry({
  task, index, employees, services, updateField,
  onToggleEmp, onToggleSrv, onRemove,
  showRemove, headerServiceIds, isActive, readOnlyAccess, projectId,
  empError, srvError,
}) {
  const { currentUser } = useAuth();
  const [isEmpOpen, setIsEmpOpen] = useState(false);
  const [isSrvOpen, setIsSrvOpen] = useState(false);
  const empRef = useRef(null);
  const srvRef = useRef(null);
  const entryRef = useRef(null);
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  useEffect(() => { if (isActive && entryRef.current) entryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [isActive]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (empRef.current && !empRef.current.contains(event.target)) setIsEmpOpen(false);
      if (srvRef.current && !srvRef.current.contains(event.target)) setIsSrvOpen(false);
    }
    if (isEmpOpen || isSrvOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEmpOpen, isSrvOpen]);

  const filteredServices = headerServiceIds.length > 0 ? services.filter(s => headerServiceIds.includes(s.id)) : services;

  // Filter employees by same project only (no service-based filter)
  const baseEmployees = projectId
    ? employees.filter(emp => (emp.assignedProjectIds || []).includes(projectId))
    : employees;
  const isEmployee = currentUser?.role === 'employee';
  const isSenior = currentUser?.isSenior === true;
  const filteredEmployees = (isEmployee && !isSenior) ? baseEmployees.filter(emp => emp.id === currentUser.id) : baseEmployees;

  const getEmpText = () => { const ids = task.employeeIds || []; if (!ids.length) return 'Select Employees'; if (ids.length === 1) { const e = employees.find(em => em.id === ids[0]); return e ? e.name : '1 Employee'; } return `${ids.length} Employees`; };
  const getSrvText = () => { const ids = task.serviceIds || []; if (!ids.length) return 'Select Services'; if (ids.length === 1) { const s = services.find(sv => sv.id === ids[0]); return s ? s.name : '1 Service'; } return `${ids.length} Services`; };

  return (
    <div className={`task-entry-item ${isActive ? 'task-focused' : ''}`} ref={entryRef}>
      <div className="task-entry-header">
        <span className="task-number">Task {index + 1}</span>
        {showRemove && <button className="btn-remove-entry" onClick={onRemove} title="Remove Task"><FiTrash2 size={16} /></button>}
      </div>
      <div className="task-entry-content">
        <div className="task-entry-main">
          <div className="form-group fg-title">
            <label className="popup-label">Task Title</label>
            {readOnlyAccess ? (
              <div className="popup-input" style={{ minHeight: '2.2rem', display: 'flex', alignItems: 'center', cursor: 'default', userSelect: 'text' }}>
                <LinkifyText text={task.title || '—'} />
              </div>
            ) : (
              <input type="text" className="popup-input" placeholder="What needs to be done?" value={task.title} onChange={(e) => updateField('title', e.target.value)} />
            )}
          </div>
          <div className="form-group fg-desc">
            <label className="popup-label">Description</label>
            {readOnlyAccess ? (
              <div className="popup-input popup-textarea" style={{ minHeight: '3.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', cursor: 'default', userSelect: 'text', background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <LinkifyText text={task.description || '—'} />
              </div>
            ) : isEditingDesc ? (
              <textarea 
                className="popup-input popup-textarea" 
                placeholder="Add more details about the task..." 
                value={task.description} 
                onChange={(e) => updateField('description', e.target.value)} 
                onBlur={() => setIsEditingDesc(false)}
                autoFocus
                rows={2} 
              />
            ) : (
              <div 
                className="popup-input popup-textarea" 
                style={{ minHeight: '3.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', cursor: 'text', userSelect: 'text', background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                onClick={(e) => {
                  if (e.target.tagName !== 'A') setIsEditingDesc(true);
                }}
              >
                {!task.description ? (
                  <span style={{ color: 'var(--text-muted)' }}>Add more details about the task...</span>
                ) : (
                  <LinkifyText text={task.description} />
                )}
              </div>
            )}
          </div>

          <div className="form-row fg-row">
            <div className="form-group">
              <label className="popup-label" style={empError ? { color: 'var(--red)' } : {}}>
                Employees{empError && <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>⚠ Required</span>}
              </label>
              <div className="multi-select-container" ref={empRef}>
                <div
                  className={`dropdown-trigger ${isEmpOpen ? 'active' : ''} ${readOnlyAccess ? 'disabled' : ''}`}
                  onClick={() => !readOnlyAccess && setIsEmpOpen(!isEmpOpen)}
                  style={{
                    ...(readOnlyAccess ? { cursor: 'not-allowed', background: 'var(--bg)' } : {}),
                    ...(empError ? { borderColor: 'var(--red)', boxShadow: '0 0 0 3px rgba(239,68,68,0.18)', animation: 'shake 0.4s ease' } : {}),
                  }}
                >
                  <span className="trigger-text">{getEmpText()}</span>
                  <span className="trigger-icon">▼</span>
                </div>
                {isEmpOpen && !readOnlyAccess && (
                  <div className="dropdown-menu">
                    {filteredEmployees.length === 0 ? (
                      <div className="no-emp-hint">{task.serviceIds?.length ? 'No employees for the selected services.' : headerServiceIds?.length ? 'No employees for the dashboard filter.' : 'No employees available.'}</div>
                    ) : filteredEmployees.map(emp => (
                      <label key={emp.id} className={`emp-checkbox-item ${task.employeeIds?.includes(emp.id) ? 'checked' : ''}`}>
                        <input type="checkbox" checked={task.employeeIds?.includes(emp.id)} onChange={() => onToggleEmp(emp.id)} onClick={e => e.stopPropagation()} />
                        <div className="emp-check-info"><div className="emp-check-name">{emp.name}</div><div className="emp-check-user">@{emp.username}</div></div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="popup-label" style={srvError ? { color: 'var(--red)' } : {}}>
                Services{srvError && <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>⚠ Required</span>}
              </label>
              <div className="multi-select-container" ref={srvRef}>
                <div
                  className={`dropdown-trigger ${isSrvOpen ? 'active' : ''} ${readOnlyAccess ? 'disabled' : ''}`}
                  onClick={() => !readOnlyAccess && setIsSrvOpen(!isSrvOpen)}
                  style={{
                    ...(readOnlyAccess ? { cursor: 'not-allowed', background: 'var(--bg)' } : {}),
                    ...(srvError ? { borderColor: 'var(--red)', boxShadow: '0 0 0 3px rgba(239,68,68,0.18)', animation: 'shake 0.4s ease' } : {}),
                  }}
                >
                  <span className="trigger-text">{getSrvText()}</span>
                  <span className="trigger-icon">▼</span>
                </div>
                {isSrvOpen && !readOnlyAccess && (
                  <div className="dropdown-menu popup-srv-menu">
                    {filteredServices.length === 0 ? <div className="no-emp-hint">No services match current filter.</div> : filteredServices.map(srv => (
                      <label key={srv.id} className={`emp-checkbox-item ${task.serviceIds?.includes(srv.id) ? 'checked' : ''}`}>
                        <input type="checkbox" checked={task.serviceIds?.includes(srv.id)} onChange={() => onToggleSrv(srv.id)} onClick={e => e.stopPropagation()} />
                        <span className="emp-check-name">{srv.name}</span>
                      </label>
                    ))}
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
              <label key={s.value} className={`status-chip status-opt-${s.value} ${task.status === s.value ? 'selected' : ''}`} title={s.label} style={readOnlyAccess ? { pointerEvents: 'none', opacity: task.status === s.value ? 1 : 0.5 } : {}}>
                <input type="radio" name={`status-${task.id || index}`} value={s.value} checked={task.status === s.value} onChange={() => !readOnlyAccess && updateField('status', s.value)} hidden disabled={readOnlyAccess} />
                <span className="status-emoji">{s.emoji}</span>
                <span className={`status-dot-mobile color-${s.value}`} />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
