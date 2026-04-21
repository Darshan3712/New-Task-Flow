import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function ServicesTab({ services, addService, updateService, setDeleteTarget }) {
  // ── Add form state ──────────────────────────────────────────────────────────
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceMsg, setServiceMsg] = useState('');

  // ── Edit row state ──────────────────────────────────────────────────────────
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceEditData, setServiceEditData] = useState({ name: '', description: '' });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddService = (e) => {
    e.preventDefault();
    if (!serviceName.trim()) return;
    addService(serviceName.trim(), serviceDesc.trim());
    setServiceName('');
    setServiceDesc('');
    setServiceMsg('✅ Service added successfully!');
    setTimeout(() => setServiceMsg(''), 3000);
  };

  const startEditing = (s) => {
    setEditingServiceId(s.id);
    setServiceEditData({ name: s.name, description: s.description || '' });
  };

  const handleSaveEdit = (id) => {
    updateService(id, serviceEditData);
    setEditingServiceId(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="admin-section">

      {/* ── Add Service Form ── */}
      <div className="admin-form-card">
        <h3>Add New Service</h3>
        <form onSubmit={handleAddService} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Service Name *</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Design, Development"
                required
              />
            </div>
            <div className="form-group">
              <label>Description (Optional)</label>
              <input
                type="text"
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                placeholder="Short description..."
              />
            </div>
          </div>
          {serviceMsg && <div className="form-msg">{serviceMsg}</div>}
          <button type="submit" className="btn-add">
            <FiPlus /> Add Service
          </button>
        </form>
      </div>

      {/* ── Services List ── */}
      <div className="admin-list-card">
        <h3>All Services ({services.length})</h3>
        {services.length === 0 ? (
          <p className="empty-msg">No services added yet.</p>
        ) : (
          <div className="admin-table-overflow-container">
            <div className="list-table service-list-table">
              <div className="list-header">
                <span>#</span>
                <span>Service Name</span>
                <span>Description</span>
                <span>Action</span>
              </div>

              {services.map((s, i) =>
                editingServiceId === s.id ? (

                  /* ── Edit Row ── */
                  <div className="list-row" key={s.id}>
                    <span>{i + 1}</span>
                    <span>
                      <input
                        type="text"
                        value={serviceEditData.name}
                        onChange={(e) => setServiceEditData({ ...serviceEditData, name: e.target.value })}
                        style={{ width: '100%', padding: '0.3rem' }}
                      />
                    </span>
                    <span>
                      <input
                        type="text"
                        value={serviceEditData.description}
                        onChange={(e) => setServiceEditData({ ...serviceEditData, description: e.target.value })}
                        style={{ width: '100%', padding: '0.3rem' }}
                      />
                    </span>
                    <span style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn-add"
                        style={{ padding: '0.3rem 0.6rem', margin: 0 }}
                        onClick={() => handleSaveEdit(s.id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn-delete"
                        style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                        onClick={() => setEditingServiceId(null)}
                      >
                        Cancel
                      </button>
                    </span>
                  </div>

                ) : (

                  /* ── Display Row ── */
                  <div className="list-row" key={s.id}>
                    <span>{i + 1}</span>
                    <span className="list-name">{s.name}</span>
                    <span>{s.description || '—'}</span>
                    <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        className="btn-action-edit"
                        onClick={() => startEditing(s)}
                        title="Edit Service"
                      >
                        <FiEdit2 size={14} /> Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => setDeleteTarget({ type: 'service', id: s.id, name: `service "${s.name}"` })}
                        title="Delete Service"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
