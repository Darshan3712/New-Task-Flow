import { FiCalendar } from 'react-icons/fi';

export default function ClientTaskForm({ onSubmit, onCancel, taskTitle, setTaskTitle, taskDesc, setTaskDesc, taskRequiredBy, setTaskRequiredBy, formMsg }) {
  return (
    <div className="client-form-card">
      <h3>New Task Request</h3>
      <form onSubmit={onSubmit} className="client-task-form">
        <div className="form-group">
          <label>Task Name *</label>
          <input type="text" placeholder="e.g. Update homepage banner" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea placeholder="Describe the task in detail..." value={taskDesc} onChange={e => setTaskDesc(e.target.value)} rows={3} />
        </div>
        <div className="form-group">
          <label>Required By</label>
          <div className="client-date-wrapper">
            <FiCalendar className="date-icon" />
            <input type="date" value={taskRequiredBy} onChange={e => setTaskRequiredBy(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Status</label>
          <span className="status-chip-static gray-chip">⚫ Pending</span>
        </div>
        {formMsg && <div className="form-msg">{formMsg}</div>}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="submit" className="btn-save-task">Save Task</button>
          <button type="button" className="btn-delete-task" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
