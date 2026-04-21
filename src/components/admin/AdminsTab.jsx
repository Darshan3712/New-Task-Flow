import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiCopy, FiCheck } from 'react-icons/fi';

export default function AdminsTab({ admins, addAdmin, updateAdmin, setDeleteTarget }) {
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [adminEditData, setAdminEditData] = useState({ name: '', username: '', password: '' });
  const [showAdminPasswords, setShowAdminPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const handleAddAdmin = (e) => {
    e.preventDefault();
    if (!adminName.trim() || !adminUsername.trim() || !adminPassword.trim()) return;
    if (admins.find((a) => a.username === adminUsername.trim())) {
      setAdminMsg('❌ Username already exists!'); setTimeout(() => setAdminMsg(''), 3000); return;
    }
    addAdmin({ name: adminName.trim(), username: adminUsername.trim(), password: adminPassword.trim() });
    setAdminName(''); setAdminUsername(''); setAdminPassword('');
    setAdminMsg('✅ Admin created successfully!'); setTimeout(() => setAdminMsg(''), 3000);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleShow = (id) => setShowAdminPasswords((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="admin-section">
      <div className="admin-form-card">
        <h3>Create New Admin</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Create admin credentials. The username and password shown below can be used to log in as Admin.
        </p>
        <form onSubmit={handleAddAdmin} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Admin Full Name *</label>
              <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="e.g. Priya Mehta" required />
            </div>
            <div className="form-group">
              <label>Username *</label>
              <input type="text" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="e.g. priya.admin" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <input type="text" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Set a strong password" required />
            </div>
            <div className="form-group" />
          </div>
          {adminMsg && <div className="form-msg">{adminMsg}</div>}
          <button type="submit" className="btn-add"><FiPlus /> Create Admin</button>
        </form>
      </div>

      <div className="admin-list-card">
        <h3>All Admins ({admins.length})</h3>
        {admins.length === 0 ? <p className="empty-msg">No admins created yet.</p> : (
          <div className="admin-table-overflow-container">
            <div className="list-table admin-list-table">
              <div className="list-header"><span>#</span><span>Admin Name</span><span>Username</span><span>Password</span><span>Action</span></div>
              {admins.map((admin, i) => editingAdminId === admin.id ? (
                <div className="list-row" key={admin.id}>
                  <span>{i + 1}</span>
                  <span><input type="text" value={adminEditData.name} onChange={(e) => setAdminEditData({ ...adminEditData, name: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} /></span>
                  <span><input type="text" value={adminEditData.username} onChange={(e) => setAdminEditData({ ...adminEditData, username: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} /></span>
                  <span><input type="text" value={adminEditData.password} onChange={(e) => setAdminEditData({ ...adminEditData, password: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} /></span>
                  <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button className="btn-add" style={{ padding: '0.35rem 0.75rem', margin: 0 }} onClick={() => { updateAdmin(admin.id, adminEditData); setEditingAdminId(null); }}>Save</button>
                    <button className="btn-delete" style={{ border: '1.5px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }} onClick={() => setEditingAdminId(null)}>Cancel</button>
                  </span>
                </div>
              ) : (
                <div className="list-row" key={admin.id}>
                  <span>{i + 1}</span>
                  <span className="list-name">{admin.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <code className="cred-code">{admin.username}</code>
                    <button className="btn-copy" title="Copy username" onClick={() => handleCopy(admin.username, `u_${admin.id}`)}>
                      {copiedId === `u_${admin.id}` ? <FiCheck size={13} style={{ color: '#4ade80' }} /> : <FiCopy size={13} />}
                    </button>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <code className="cred-code">{showAdminPasswords[admin.id] ? admin.password : '••••••••'}</code>
                    <button className="btn-copy" title={showAdminPasswords[admin.id] ? 'Hide password' : 'Show password'} onClick={() => toggleShow(admin.id)}>
                      {showAdminPasswords[admin.id] ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                    </button>
                    {showAdminPasswords[admin.id] && (
                      <button className="btn-copy" title="Copy password" onClick={() => handleCopy(admin.password, `p_${admin.id}`)}>
                        {copiedId === `p_${admin.id}` ? <FiCheck size={13} style={{ color: '#4ade80' }} /> : <FiCopy size={13} />}
                      </button>
                    )}
                  </span>
                  <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button className="btn-action-edit" onClick={() => { setEditingAdminId(admin.id); setAdminEditData({ name: admin.name, username: admin.username, password: admin.password }); }} title="Edit Admin"><FiEdit2 size={14} /> Edit</button>
                    <button className="btn-delete" onClick={() => setDeleteTarget({ type: 'admin', id: admin.id, name: `admin "${admin.name}"` })} title="Delete Admin"><FiTrash2 size={15} /></button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
