import { useState, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import MultiSelectDropdown from './MultiSelectDropdown';

export default function ProjectsTab({ projects, services, addProject, updateProject, setDeleteTarget }) {
  // ── Add form state ──────────────────────────────────────────────────────────
  const [projectName, setProjectName] = useState('');
  const [projectServiceIds, setProjectServiceIds] = useState([]);
  const [servicesSearchTerm, setServicesSearchTerm] = useState('');
  const [projectMsg, setProjectMsg] = useState('');
  const [isProjectServicesOpen, setIsProjectServicesOpen] = useState(false);
  const addServicesRef = useRef(null);

  // ── Edit row state ──────────────────────────────────────────────────────────
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', serviceIds: [] });
  const [editServicesSearchTerm, setEditServicesSearchTerm] = useState('');
  const [isEditProjectServicesOpen, setIsEditProjectServicesOpen] = useState(false);
  const editServicesRef = useRef(null);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddProject = (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    if (projectServiceIds.length === 0) {
      setProjectMsg('❌ Please select at least one service!');
      setTimeout(() => setProjectMsg(''), 3000);
      return;
    }
    addProject(projectName.trim(), projectServiceIds);
    setProjectName('');
    setProjectServiceIds([]);
    setProjectMsg('✅ Project added successfully!');
    setTimeout(() => setProjectMsg(''), 3000);
  };

  const toggleProjectService = (id) => {
    setProjectServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setServicesSearchTerm('');
  };

  const toggleEditProjectService = (id) => {
    setEditFormData((prev) => {
      const ids = prev.serviceIds || [];
      return {
        ...prev,
        serviceIds: ids.includes(id) ? ids.filter((s) => s !== id) : [...ids, id],
      };
    });
    setEditServicesSearchTerm('');
  };

  const handleSaveEdit = (p) => {
    if (!(editFormData.serviceIds || []).length) {
      alert('Select at least one service');
      return;
    }
    updateProject(p.id, editFormData);
    setEditingProjectId(null);
    setIsEditProjectServicesOpen(false);
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setIsEditProjectServicesOpen(false);
    setEditServicesSearchTerm('');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="admin-section">

      {/* ── Add Project Form ── */}
      <div className="admin-form-card">
        <h3>Add New Project</h3>
        <form onSubmit={handleAddProject} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Project Name *</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Website Overhaul"
                required
              />
            </div>
            <div className="form-group">
              <label>Services *</label>
              <MultiSelectDropdown
                items={services}
                selectedIds={projectServiceIds}
                onToggle={toggleProjectService}
                searchTerm={servicesSearchTerm}
                setSearchTerm={setServicesSearchTerm}
                isOpen={isProjectServicesOpen}
                setIsOpen={setIsProjectServicesOpen}
                dropdownRef={addServicesRef}
                placeholder="Type to search services..."
              />
            </div>
          </div>

          {projectServiceIds.length > 0 && (
            <div className="selected-tags-preview">
              {projectServiceIds.map(id => {
                const s = services.find(sv => sv.id === id);
                return s ? <span key={id} className="gradient-tag sm">{s.name}</span> : null;
              })}
            </div>
          )}

          {projectMsg && <div className="form-msg">{projectMsg}</div>}
          <button type="submit" className="btn-add">
            <FiPlus /> Add Project
          </button>
        </form>
      </div>

      {/* ── Projects List ── */}
      <div className="admin-list-card">
        <h3>All Projects ({projects.length})</h3>
        {projects.length === 0 ? (
          <p className="empty-msg">No projects added yet.</p>
        ) : (
          <div className="admin-table-overflow-container">
            <div className="list-table project-list-table">
              <div className="list-header">
                <span>#</span>
                <span>Project Name</span>
                <span>Services</span>
                <span>Action</span>
              </div>

              {projects.map((p, i) =>
                editingProjectId === p.id ? (

                  /* ── Edit Row ── */
                  <div className="list-row" key={p.id}>
                    <span>{i + 1}</span>
                    <span>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        style={{ width: '100%', padding: '0.3rem' }}
                      />
                    </span>
                    <span>
                      <MultiSelectDropdown
                        items={services}
                        selectedIds={editFormData.serviceIds || []}
                        onToggle={toggleEditProjectService}
                        searchTerm={editServicesSearchTerm}
                        setSearchTerm={setEditServicesSearchTerm}
                        isOpen={isEditProjectServicesOpen}
                        setIsOpen={setIsEditProjectServicesOpen}
                        dropdownRef={editServicesRef}
                        sm
                      />
                    </span>
                    <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        className="btn-add"
                        style={{ padding: '0.35rem 0.75rem', margin: 0 }}
                        onClick={() => handleSaveEdit(p)}
                      >
                        Save
                      </button>
                      <button
                        className="btn-delete"
                        style={{ border: '1.5px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </span>
                  </div>

                ) : (

                  /* ── Display Row ── */
                  <div className="list-row" key={p.id}>
                    <span>{i + 1}</span>
                    <span className="list-name">{p.name}</span>
                    <span className="project-services-cell">
                      {(p.serviceIds || []).length > 0 ? (
                        <div className="gradient-tags-container">
                          {p.serviceIds.map(sid => {
                            const s = services.find(sv => sv.id === sid);
                            return s ? <span key={sid} className="gradient-tag">{s.name}</span> : null;
                          })}
                        </div>
                      ) : '—'}
                    </span>
                    <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        className="btn-action-edit"
                        onClick={() => {
                          setEditingProjectId(p.id);
                          setEditFormData({ name: p.name, serviceIds: p.serviceIds || [] });
                        }}
                        title="Edit Project"
                      >
                        <FiEdit2 size={14} /> Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => setDeleteTarget({ type: 'project', id: p.id, name: `project "${p.name}"` })}
                        title="Delete Project"
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
