import { FiCalendar, FiSend, FiX } from 'react-icons/fi';
import LinkifyText from '../task/LinkifyText';

export default function ClientCommentPopup({ task, employees, commentText, setCommentText, onSend, onClose }) {
  const STATUS_META = {
    gray:   { label: 'Pending',     color: '#6b7280' },
    yellow: { label: 'In Progress', color: '#f59e0b' },
    green:  { label: 'Completed',   color: '#10b981' },
    red:    { label: 'Not Done',    color: '#ef4444' },
  };
  const m = STATUS_META[task.status] || STATUS_META.gray;
  const assignedEmp = employees.find(e => e.id === task.assignedEmployeeId);

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" style={{ maxWidth: '560px', width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <div>
            <div className="popup-project" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              <span style={{ color: m.color }}>● {m.label}</span>
            </div>
            <div className="popup-date" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{task.title}</div>
          </div>
          <button className="popup-close" onClick={onClose}><FiX size={20} /></button>
        </div>

        <div className="popup-body scrollable-body" style={{ maxHeight: '420px' }}>
          {task.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.75rem', lineHeight: 1.6, wordBreak: 'break-word' }}><LinkifyText text={task.description} /></p>}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {task.requiredBy && <span><FiCalendar size={12} /> {new Date(task.requiredBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            {assignedEmp && <span>👤 {assignedEmp.name}</span>}
          </div>
          <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>💬 Comments</div>
            {!(task.comments || []).length && <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.8rem', textAlign: 'center', padding: '1rem 0' }}>No comments yet. Start the conversation!</p>}
            <div className="comment-thread" style={{ background: 'transparent', border: 'none', padding: 0, gap: '0.5rem' }}>
              {(task.comments || []).map(c => (
                <div key={c.id} className={`comment-bubble ${c.authorRole === 'client' ? 'cb-client' : 'cb-employee'}`}>
                  <span className="cb-author">{c.authorName} <em>({c.authorRole === 'client' ? 'You' : 'Team'})</em></span>
                  <p className="cb-text"><LinkifyText text={c.text} /></p>
                  <span className="cb-time">{new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border)' }}>
          <div className="comment-input-row">
            <input type="text" placeholder="Write a message to your team..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSend(); }} autoFocus />
            <button onClick={onSend}><FiSend size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
