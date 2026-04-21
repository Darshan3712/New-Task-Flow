import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiCopy, FiCheck } from 'react-icons/fi';

export default function ClientsTab({ clients, projects, addClient, updateClient, setDeleteTarget }) {
  // ── Add form state ──────────────────────────────────────────────────────────
  const [clientName, setClientName] = useState('');
  const [clientProjectId, setClientProjectId] = useState('');
  const [clientUsername, setClientUsername] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [clientMsg, setClientMsg] = useState('');

  // ── Edit row state ──────────────────────────────────────────────────────────
  const [editingClientId, setEditingClientId] = useState(null);
  const [clientEditData, setClientEditData] = useState({
    name: '', projectId: '', username: '', password: '',
  });
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientUsername.trim() || !clientPassword.trim() || !clientProjectId) {
      setClientMsg('❌ All fields including project are required!');
      setTimeout(() => setClientMsg(''), 3000);
      return;
    }
    if (clients.find((c) => c.username === clientUsername.trim())) {
      setClientMsg('❌ Username already exists!');
      setTimeout(() => setClientMsg(''), 3000);
      return;
    }
    await addClient({
      name: clientName.trim(),
      projectId: clientProjectId,
      username: clientUsername.trim(),
      password: clientPassword.trim(),
    });
    setClientName(''); setClientProjectId('');
    setClientUsername(''); setClientPassword('');
    setClientMsg('✅ Client created successfully!');
    setTimeout(() => setClientMsg(''), 3000);
  };

  const startEditing = (client) => {
    setEditingClientId(client.id);
    setClientEditData({
      name: client.name,
      projectId: client.projectId,
      username: client.username,
      password: client.password,
    });
  };

  const handleSaveEdit = (id) => {
    updateClient(id, clientEditData);
    setEditingClientId(null);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleShowPassword = (id) =>
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="admin-section">

      {/* ── Add Client Form ── */}
      <div className="admin-form-card">
        <h3>Add New Client</h3>
        <form onSubmit={handleAddClient} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Client Name *</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Ramesh Industries"
                required
              />
            </div>
            <div className="form-group">
              <label>Project *</label>
              <select
                value={clientProjectId}
                onChange={(e) => setClientProjectId(e.target.value)}
                className="header-select"
                style={{ width: '100%', marginTop: 0 }}
                required
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={clientUsername}
                onChange={(e) => setClientUsername(e.target.value)}
                placeholder="e.g. ramesh.ind"
                required
              />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input
                type="text"
                value={clientPassword}
                onChange={(e) => setClientPassword(e.target.value)}
                placeholder="Set password"
                required
              />
            </div>
          </div>
          {clientMsg && <div className="form-msg">{clientMsg}</div>}
          <button type="submit" className="btn-add">
            <FiPlus /> Add Client
          </button>
        </form>
      </div>

      {/* ── Clients List ── */}
      <div className="admin-list-card">
        <h3>All Clients ({clients.length})</h3>
        {clients.length === 0 ? (
          <p className="empty-msg">No clients added yet.</p>
        ) : (
          <div className="admin-table-overflow-container">
            <div className="list-table client-list-table">
              <div className="list-header">
                <span>#</span>
                <span>Client Name</span>
                <span>Project</span>
                <span>Username</span>
                <span>Password</span>
                <span>Action</span>
              </div>

              {clients.map((client, i) => {
                const proj = projects.find((p) => p.id === client.projectId);
                return editingClientId === client.id ? (

                  /* ── Edit Row ── */
                  <div className="list-row" key={client.id}>
                    <span>{i + 1}</span>
                    <span>
                      <input
                        type="text"
                        value={clientEditData.name}
                        onChange={(e) => setClientEditData({ ...clientEditData, name: e.target.value })}
                        style={{ width: '100%', padding: '0.3rem' }}
                      />
                    </span>
                    <span>
                      <select
                        value={clientEditData.projectId}
                        onChange={(e) => setClientEditData({ ...clientEditData, projectId: e.target.value })}
                        className="header-select"
                        style={{ width: '100%' }}
                      >
                        <option value="">-- Select --</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </span>
                    <span>
                      <input
                        type="text"
                        value={clientEditData.username}
                        onChange={(e) => setClientEditData({ ...clientEditData, username: e.target.value })}
                        style={{ width: '100%', padding: '0.3rem' }}
                      />
                    </span>
                    <span>
                      <input
                        type="text"
                        value={clientEditData.password}
                        onChange={(e) => setClientEditData({ ...clientEditData, password: e.target.value })}
                        style={{ width: '100%', padding: '0.3rem' }}
                      />
                    </span>
                    <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        className="btn-add"
                        style={{ padding: '0.35rem 0.75rem', margin: 0 }}
                        onClick={() => handleSaveEdit(client.id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn-delete"
                        style={{ border: '1.5px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}
                        onClick={() => setEditingClientId(null)}
                      >
                        Cancel
                      </button>
                    </span>
                  </div>

                ) : (

                  /* ── Display Row ── */
                  <div className="list-row" key={client.id}>
                    <span>{i + 1}</span>
                    <span className="list-name">{client.name}</span>
                    <span>{proj ? proj.name : <em style={{ color: 'var(--text-muted)' }}>—</em>}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <code className="cred-code">{client.username}</code>
                      <button
                        className="btn-copy"
                        title="Copy username"
                        onClick={() => handleCopy(client.username, `cu_${client.id}`)}
                      >
                        {copiedId === `cu_${client.id}`
                          ? <FiCheck size={13} style={{ color: '#4ade80' }} />
                          : <FiCopy size={13} />}
                      </button>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <code className="cred-code">
                        {showPasswords[client.id] ? client.password : '••••••••'}
                      </code>
                      <button
                        className="btn-copy"
                        title={showPasswords[client.id] ? 'Hide' : 'Show'}
                        onClick={() => toggleShowPassword(client.id)}
                      >
                        {showPasswords[client.id] ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                      </button>
                      {showPasswords[client.id] && (
                        <button
                          className="btn-copy"
                          title="Copy password"
                          onClick={() => handleCopy(client.password, `cp_${client.id}`)}
                        >
                          {copiedId === `cp_${client.id}`
                            ? <FiCheck size={13} style={{ color: '#4ade80' }} />
                            : <FiCopy size={13} />}
                        </button>
                      )}
                    </span>
                    <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        className="btn-action-edit"
                        onClick={() => startEditing(client)}
                        title="Edit Client"
                      >
                        <FiEdit2 size={14} /> Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => setDeleteTarget({ type: 'client', id: client.id, name: `client "${client.name}"` })}
                        title="Delete Client"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
