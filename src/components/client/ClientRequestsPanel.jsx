import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { FiX, FiMessageCircle, FiSend, FiCalendar, FiUser, FiInbox } from 'react-icons/fi';
import LinkifyText from '../task/LinkifyText';
import { getTaskAssigner } from '../../utils/taskUtils';

const STATUS_META = {
  gray:   { label: 'Pending',     color: '#6b7280' },
  yellow: { label: 'In Progress', color: '#f59e0b' },
  green:  { label: 'Completed',   color: '#10b981' },
  red:    { label: 'Not Done',    color: '#ef4444' },
};

export default function ClientRequestsPanel({ onClose }) {
  const { currentUser } = useAuth();
  const {
    clientTasks, clients, projects, employees, services, admins,
    addComment,
  } = useData();

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [openComments, setOpenComments] = useState(false);

  // Sort client tasks by latest first
  const sortedTasks = useMemo(() =>
    [...clientTasks]
      .filter(t => t.status !== 'cancelled')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [clientTasks]
  );

  const selectedTask = sortedTasks.find(t => t.id === selectedTaskId) || null;

  const handleSendComment = async () => {
    if (!commentText.trim() || !selectedTask) return;
    await addComment(selectedTask.id, {
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
        {/* ── Header ── */}
        <div className="crp-header">
          <div className="crp-header-left">
            <FiInbox size={18} />
            <h3>Client Requests</h3>
            <span className="crp-count">{sortedTasks.length}</span>
          </div>
          <button className="crp-close-btn" onClick={onClose}><FiX size={20} /></button>
        </div>

        <div className="crp-body">
          {/* ── Left: Mail-type list ── */}
          <div className="crp-list">
            {sortedTasks.length === 0 ? (
              <div className="crp-empty">
                <FiInbox size={36} style={{ opacity: 0.3 }} />
                <p>No client requests yet.</p>
              </div>
            ) : (
              sortedTasks.map(task => {
                const client = clients.find(c => c.id === task.clientId);
                const meta = STATUS_META[task.status] || STATUS_META.gray;
                const commentCount = (task.comments || []).length;
                const isSelected = selectedTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`crp-list-item ${isSelected ? 'active' : ''} ${!task.assignedEmployeeId ? 'unassigned' : ''}`}
                    onClick={() => { setSelectedTaskId(task.id); setOpenComments(false); setCommentText(''); }}
                  >
                    <div className="crp-list-item-top">
                      <span className="crp-client-name">
                        <FiUser size={11} />
                        {client?.name || 'Unknown Client'}
                      </span>
                      <span className="crp-status-dot" style={{ background: meta.color }} title={meta.label} />
                    </div>
                    <div className="crp-list-item-title">{task.title}</div>
                    <div className="crp-list-item-bottom">
                      <span className="crp-list-date">
                        {new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      {commentCount > 0 && (
                        <span className="crp-comment-badge">
                          <FiMessageCircle size={10} /> {commentCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Right: Detail pane (master-view style) ── */}
          <div className="crp-detail">
            {selectedTask ? (() => {
              const meta = STATUS_META[selectedTask.status] || STATUS_META.gray;
              const client = clients.find(c => c.id === selectedTask.clientId);
              const project = projects.find(p => p.id === selectedTask.projectId);
              const assignedEmp = selectedTask.assignedEmployeeId
                ? employees.find(e => e.id === selectedTask.assignedEmployeeId) : null;
              const assignedSvc = selectedTask.serviceId
                ? services.find(s => s.id === selectedTask.serviceId) : null;

              return (
                <>
                  {/* Title + Status */}
                  <div className="crp-detail-top">
                    <div className="crp-detail-title">{selectedTask.title}</div>
                    <div className="crp-detail-actions">
                      {selectedTask.comments !== undefined && (
                        <button
                          className={`crp-comment-toggle ${openComments ? 'active' : ''}`}
                          onClick={() => setOpenComments(!openComments)}
                        >
                          <FiMessageCircle size={12} /> {(selectedTask.comments || []).length} Comments
                        </button>
                      )}
                      <span
                        className="crp-status-chip"
                        style={{ background: meta.color + '22', color: meta.color, border: `1.5px solid ${meta.color}55` }}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedTask.description && (
                    <div className="crp-detail-section">
                      <div className="crp-detail-label">Description</div>
                      <div className="crp-detail-desc">
                        <LinkifyText text={selectedTask.description} />
                      </div>
                    </div>
                  )}

                  {/* Comments thread */}
                  {openComments && selectedTask.comments !== undefined && (
                    <div className="crp-comments-section">
                      <div className="crp-detail-label">Comments</div>
                      {(selectedTask.comments || []).length === 0 && (
                        <div className="crp-no-comments">No comments yet.</div>
                      )}
                      {(selectedTask.comments || []).map(c => (
                        <div key={c.id} className={`comment-bubble ${c.authorRole === 'client' ? 'cb-client' : 'cb-employee'}`}>
                          <span className="cb-author">{c.authorName} <em>({c.authorRole})</em></span>
                          <p className="cb-text"><LinkifyText text={c.text} /></p>
                          <span className="cb-time">
                            {new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                      <div className="comment-input-row" style={{ marginTop: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder="Write a message..."
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSendComment(); }}
                        />
                        <button onClick={handleSendComment}><FiSend size={13} /></button>
                      </div>
                    </div>
                  )}

                  {/* Assigned To + Service */}
                  <div className="crp-detail-grid">
                    <div>
                      <div className="crp-detail-label">👤 Assigned To</div>
                      {assignedEmp ? (
                        <span className="crp-detail-chip">{assignedEmp.name}</span>
                      ) : (
                        <span className="crp-detail-unassigned">Unassigned</span>
                      )}
                    </div>
                    <div>
                      <div className="crp-detail-label">📋 Service</div>
                      {assignedSvc ? (
                        <span className="crp-detail-chip accent">{assignedSvc.name}</span>
                      ) : (
                        <span className="crp-detail-unassigned">No service</span>
                      )}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div className="crp-detail-label">✍ Assigned By</div>
                      <span className="crp-detail-chip" style={{ color: 'var(--accent)', background: 'var(--bg3)' }}>
                        {getTaskAssigner(selectedTask, employees, admins)}
                      </span>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="crp-detail-meta">
                    {client && <span><FiUser size={11} /> Client: <strong>{client.name}</strong></span>}
                    {project && <span>📁 Project: <strong>{project.name}</strong></span>}
                    {selectedTask.requiredBy && (
                      <span>
                        <FiCalendar size={11} /> Required by:{' '}
                        <strong>{new Date(selectedTask.requiredBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                      </span>
                    )}
                    {selectedTask.assignedDate && (
                      <span>
                        🗓 Assigned for:{' '}
                        <strong>{new Date(selectedTask.assignedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                      </span>
                    )}
                    {selectedTask.createdAt && (
                      <span style={{ color: 'var(--text-dim)' }}>
                        📌 Submitted: {new Date(selectedTask.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </>
              );
            })() : (
              <div className="crp-detail-empty">
                <span style={{ fontSize: '2.5rem', opacity: 0.4 }}>📩</span>
                <span>Select a client request from the left to view details</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
