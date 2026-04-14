import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiPlus, FiTrash2, FiBriefcase, FiUsers, FiLayers, FiEdit2, FiChevronDown, FiShield, FiEye, FiEyeOff, FiCopy, FiCheck, FiUserCheck } from 'react-icons/fi';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function AdminPanel() {
  const isSuperAdmin = true; // will be derived from currentUser below
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isSA = currentUser?.role === 'superadmin';

  const [activeTab, setActiveTab] = useState('projects');
  const { projects, employees, services, admins, clients,
    addProject, deleteProject, updateProject,
    addEmployee, deleteEmployee, updateEmployee,
    addAdmin, updateAdmin, deleteAdmin,
    addClient, updateClient, deleteClient,
    addService, deleteService, updateService,
    systemSettings, updateSystemSettings } = useData();

  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Project form state ──────────────────────────────────────────────────
  const [projectName, setProjectName] = useState('');
  const [projectServiceIds, setProjectServiceIds] = useState([]);
  const [servicesSearchTerm, setServicesSearchTerm] = useState('');
  const [projectMsg, setProjectMsg] = useState('');
  const [isProjectServicesOpen, setIsProjectServicesOpen] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', serviceIds: [] });
  const [editServicesSearchTerm, setEditServicesSearchTerm] = useState('');
  const [isEditProjectServicesOpen, setIsEditProjectServicesOpen] = useState(false);

  const addServicesRef = useRef(null);
  const editServicesRef = useRef(null);

  // ── Employee form state ─────────────────────────────────────────────────
  const [empName, setEmpName] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empAssignedServiceIds, setEmpAssignedServiceIds] = useState([]);
  const [empCanCreateTasks, setEmpCanCreateTasks] = useState(true);
  const [empReadOnlyTasks, setEmpReadOnlyTasks] = useState(false);
  const [empCanComment, setEmpCanComment] = useState(true);
  const [empMsg, setEmpMsg] = useState('');
  const [isEmpServicesOpen, setIsEmpServicesOpen] = useState(false);
  const [empServicesSearch, setEmpServicesSearch] = useState('');
  const empServicesRef = useRef(null);

  // ── Service form state ──────────────────────────────────────────────────
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceMsg, setServiceMsg] = useState('');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceEditData, setServiceEditData] = useState({ name: '', description: '' });

  // ── Employee edit state ─────────────────────────────────────────────────
  const [editingEmpId, setEditingEmpId] = useState(null);
  const [empEditData, setEmpEditData] = useState({ name: '', designation: '', username: '', password: '', assignedServiceIds: [], canCreateTasks: true, readOnlyAccess: false, canComment: true });
  const [isEmpEditServicesOpen, setIsEmpEditServicesOpen] = useState(false);
  const [empEditServicesSearch, setEmpEditServicesSearch] = useState('');
  const empEditServicesRef = useRef(null);

  // ── Admin form state (superadmin only) ─────────────────────────────────
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  // ── Admin edit state ────────────────────────────────────────────────────
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [adminEditData, setAdminEditData] = useState({ name: '', username: '', password: '' });

  const [showAdminPasswords, setShowAdminPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (addServicesRef.current && !addServicesRef.current.contains(event.target)) {
        setIsProjectServicesOpen(false);
      }
      if (editServicesRef.current && !editServicesRef.current.contains(event.target)) {
        setIsEditProjectServicesOpen(false);
      }
      if (empServicesRef.current && !empServicesRef.current.contains(event.target)) {
        setIsEmpServicesOpen(false);
      }
      if (empEditServicesRef.current && !empEditServicesRef.current.contains(event.target)) {
        setIsEmpEditServicesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
    return <div className="access-denied">Access Denied</div>;
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
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
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
    setServicesSearchTerm('');
  };

  const toggleEditProjectService = (id) => {
    setEditFormData((prev) => {
      const currentIds = prev.serviceIds || [];
      const nextIds = currentIds.includes(id)
        ? currentIds.filter((sid) => sid !== id)
        : [...currentIds, id];
      return { ...prev, serviceIds: nextIds };
    });
    setEditServicesSearchTerm('');
  };

  const toggleEmpService = (id) => {
    setEmpAssignedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
    setEmpServicesSearch('');
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (!empName.trim() || !empUsername.trim() || !empPassword.trim()) return;
    const duplicate = employees.find((e) => e.username === empUsername.trim());
    if (duplicate) {
      setEmpMsg('❌ Username already exists!');
      setTimeout(() => setEmpMsg(''), 3000);
      return;
    }
    addEmployee(empName.trim(), empUsername.trim(), empPassword.trim(), empDesignation.trim(), empAssignedServiceIds, {
      canCreateTasks: empCanCreateTasks,
      readOnlyAccess: empReadOnlyTasks,
      canComment: empCanComment
    });
    setEmpName('');
    setEmpDesignation('');
    setEmpUsername('');
    setEmpPassword('');
    setEmpAssignedServiceIds([]);
    setEmpCanCreateTasks(true);
    setEmpReadOnlyTasks(false);
    setEmpCanComment(true);
    setEmpMsg('✅ Employee added successfully!');
    setTimeout(() => setEmpMsg(''), 3000);
  };

  const handleAddService = (e) => {
    e.preventDefault();
    if (!serviceName.trim()) return;
    addService(serviceName.trim(), serviceDesc.trim());
    setServiceName('');
    setServiceDesc('');
    setServiceMsg('✅ Service added successfully!');
    setTimeout(() => setServiceMsg(''), 3000);
  };

  const handleAddAdmin = (e) => {
    e.preventDefault();
    if (!adminName.trim() || !adminUsername.trim() || !adminPassword.trim()) return;
    const duplicate = admins.find((a) => a.username === adminUsername.trim());
    if (duplicate) {
      setAdminMsg('❌ Username already exists!');
      setTimeout(() => setAdminMsg(''), 3000);
      return;
    }
    addAdmin({ name: adminName.trim(), username: adminUsername.trim(), password: adminPassword.trim() });
    setAdminName('');
    setAdminUsername('');
    setAdminPassword('');
    setAdminMsg('✅ Admin created successfully!');
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const toggleShowAdminPassword = (id) => {
    setShowAdminPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Tabs logic
  const canSeeEmployees = isSA || systemSettings?.adminCanManageEmployees;

  const tabs = [
    { key: 'projects', label: 'Projects', icon: <FiBriefcase /> },
    ...(canSeeEmployees ? [{ key: 'employees', label: 'Employees', icon: <FiUsers /> }] : []),
    { key: 'services', label: 'Services', icon: <FiLayers /> },
    ...(isSA ? [{ key: 'admins', label: 'Admins', icon: <FiShield /> }] : []),
    ...(isSA ? [{ key: 'clients', label: 'Clients', icon: <FiUserCheck /> }] : []),
    ...(isSA ? [{ key: 'settings', label: 'Settings', icon: <span>⚙️</span> }] : []),
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="header-left-box">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            <FiArrowLeft /> Back to Dashboard
          </button>
        </div>

        <div className="admin-user-center">
          <h2 className="admin-user-name">{currentUser?.name}</h2>
        </div>

        <div className="header-right-spacer"></div>
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">

        {/* ── PROJECTS TAB ── */}
        {activeTab === 'projects' && (
          <div className="admin-section">
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
                    <div className="multi-select-container" ref={addServicesRef}>
                      <div
                        className={`dropdown-trigger searchable ${isProjectServicesOpen ? 'active' : ''}`}
                        onClick={() => setIsProjectServicesOpen(true)}
                        style={{ background: 'var(--bg)' }}
                      >
                        <input
                          type="text"
                          className="dropdown-search-input"
                          placeholder={projectServiceIds.length === 0 ? "Type to search services..." : `${projectServiceIds.length} Selected`}
                          value={servicesSearchTerm}
                          onChange={(e) => {
                            setServicesSearchTerm(e.target.value);
                            setIsProjectServicesOpen(true);
                          }}
                          onFocus={() => setIsProjectServicesOpen(true)}
                        />
                        <FiChevronDown className="trigger-icon" />
                      </div>

                      {isProjectServicesOpen && (
                        <div className="dropdown-menu">
                          {services.length === 0 ? (
                            <div className="no-emp-hint">No services added yet.</div>
                          ) : (
                            services
                              .filter(s => s.name.toLowerCase().includes(servicesSearchTerm.toLowerCase()))
                              .map((s) => (
                                <label
                                  key={s.id}
                                  className={`emp-checkbox-item ${projectServiceIds.includes(s.id) ? 'checked' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={projectServiceIds.includes(s.id)}
                                    onChange={() => toggleProjectService(s.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="emp-check-name">{s.name}</span>
                                </label>
                              ))
                          )}
                          {services.length > 0 && services.filter(s => s.name.toLowerCase().includes(servicesSearchTerm.toLowerCase())).length === 0 && (
                            <div className="no-emp-hint">No matching services found.</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {projectServiceIds.length > 0 && (
                  <div className="selected-tags-preview">
                    {projectServiceIds.map(id => {
                      const s = services.find(srv => srv.id === id);
                      return s ? <span key={id} className="gradient-tag sm">{s.name}</span> : null;
                    })}
                  </div>
                )}
                <div className="form-row">
                </div>
                {projectMsg && <div className="form-msg">{projectMsg}</div>}
                <button type="submit" className="btn-add">
                  <FiPlus /> Add Project
                </button>
              </form>
            </div>

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
                    {projects.map((p, i) => (
                      editingProjectId === p.id ? (
                        <div className="list-row" key={p.id}>
                          <span>{i + 1}</span>
                          <span>
                            <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} />
                          </span>
                          <span>
                            <div className="multi-select-container" ref={editServicesRef}>
                              <div
                                className={`dropdown-trigger searchable ${isEditProjectServicesOpen ? 'active' : ''}`}
                                onMouseDown={(e) => { e.preventDefault(); setIsEditProjectServicesOpen(v => !v); }}
                                style={{ padding: '0.1rem 0.5rem', minHeight: '32px' }}
                              >
                                <input
                                  type="text"
                                  className="dropdown-search-input sm"
                                  placeholder={`${(editFormData.serviceIds || []).length} Selected`}
                                  value={editServicesSearchTerm}
                                  onChange={(e) => {
                                    setEditServicesSearchTerm(e.target.value);
                                    setIsEditProjectServicesOpen(true);
                                  }}
                                  onFocus={() => setIsEditProjectServicesOpen(true)}
                                  style={{ fontSize: '0.75rem' }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                />
                                <FiChevronDown className="trigger-icon" style={{ fontSize: '0.7rem' }} />
                              </div>
                              {isEditProjectServicesOpen && (
                                <div
                                  className="dropdown-menu"
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  {services
                                    .filter(s => s.name.toLowerCase().includes(editServicesSearchTerm.toLowerCase()))
                                    .map((s) => (
                                      <label key={s.id} className={`emp-checkbox-item ${(editFormData.serviceIds || []).includes(s.id) ? 'checked' : ''}`}>
                                        <input
                                          type="checkbox"
                                          checked={(editFormData.serviceIds || []).includes(s.id)}
                                          onChange={() => toggleEditProjectService(s.id)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="emp-check-name" style={{ fontSize: '0.75rem' }}>{s.name}</span>
                                      </label>
                                    ))}
                                  {services.filter(s => s.name.toLowerCase().includes(editServicesSearchTerm.toLowerCase())).length === 0 && (
                                    <div className="no-emp-hint">No matches</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </span>
                          <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button className="btn-add" style={{ padding: '0.35rem 0.75rem', margin: 0 }} onClick={() => { if ((editFormData.serviceIds || []).length === 0) return alert('Select at least one service'); updateProject(p.id, editFormData); setEditingProjectId(null); setIsEditProjectServicesOpen(false); }}>Save</button>
                            <button className="btn-delete" style={{ border: '1.5px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }} onClick={() => { setEditingProjectId(null); setIsEditProjectServicesOpen(false); setEditServicesSearchTerm(''); }}>Cancel</button>
                          </span>
                        </div>
                      ) : (
                        <div className="list-row" key={p.id}>
                          <span>{i + 1}</span>
                          <span className="list-name">{p.name}</span>
                          <span className="project-services-cell">
                            {(p.serviceIds || []).length > 0 ? (
                              <div className="gradient-tags-container">
                                {p.serviceIds.map(sid => {
                                  const s = services.find(srv => srv.id === sid);
                                  return s ? <span key={sid} className="gradient-tag">{s.name}</span> : null;
                                })}
                              </div>
                            ) : '—'}
                          </span>
                          <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              className="btn-action-edit"
                              onClick={() => { setEditingProjectId(p.id); setEditFormData({ name: p.name, serviceIds: p.serviceIds || [] }); }}
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EMPLOYEES TAB ── */}
        {activeTab === 'employees' && (
          <div className="admin-section">
            <div className="admin-form-card">
              <h3>Add New Employee</h3>
              <form onSubmit={handleAddEmployee} className="admin-form">
                {/* Row 1: 3 columns — Full Name | Designation | Services Assigned */}
                <div className="form-row form-row-3">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Designation</label>
                    <input
                      type="text"
                      value={empDesignation}
                      onChange={(e) => setEmpDesignation(e.target.value)}
                      placeholder="e.g. Senior Developer"
                    />
                  </div>
                  <div className="form-group">
                    <label>Services Assigned</label>
                    <div className="multi-select-container" ref={empServicesRef}>
                      <div
                        className={`dropdown-trigger searchable ${isEmpServicesOpen ? 'active' : ''}`}
                        onClick={() => setIsEmpServicesOpen(true)}
                        style={{ background: 'var(--bg)' }}
                      >
                        <input
                          type="text"
                          className="dropdown-search-input"
                          placeholder={empAssignedServiceIds.length === 0 ? "Select services..." : `${empAssignedServiceIds.length} Selected`}
                          value={empServicesSearch}
                          onChange={(e) => {
                            setEmpServicesSearch(e.target.value);
                            setIsEmpServicesOpen(true);
                          }}
                          onFocus={() => setIsEmpServicesOpen(true)}
                        />
                        <FiChevronDown className="trigger-icon" />
                      </div>
                      {isEmpServicesOpen && (
                        <div className="dropdown-menu">
                          {services.length === 0 ? (
                            <div className="no-emp-hint">No services added yet.</div>
                          ) : (
                            services
                              .filter(s => s.name.toLowerCase().includes(empServicesSearch.toLowerCase()))
                              .map((s) => (
                                <label
                                  key={s.id}
                                  className={`emp-checkbox-item ${empAssignedServiceIds.includes(s.id) ? 'checked' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={empAssignedServiceIds.includes(s.id)}
                                    onChange={() => toggleEmpService(s.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="emp-check-name">{s.name}</span>
                                </label>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                    {empAssignedServiceIds.length > 0 && (
                      <div className="selected-tags-preview" style={{ marginTop: '0.4rem' }}>
                        {empAssignedServiceIds.map(id => {
                          const s = services.find(srv => srv.id === id);
                          return s ? <span key={id} className="gradient-tag sm">{s.name}</span> : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {/* Row 2: 2 columns — Username | Password */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      value={empUsername}
                      onChange={(e) => setEmpUsername(e.target.value)}
                      placeholder="e.g. rahul.sharma"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="text"
                      value={empPassword}
                      onChange={(e) => setEmpPassword(e.target.value)}
                      placeholder="Set password"
                      required
                    />
                  </div>
                </div>
                {/* Row 3: Setup Employee Permissions */}
                <div className="form-row form-row-3" style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginTop: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={empCanCreateTasks} onChange={e => setEmpCanCreateTasks(e.target.checked)} style={{ cursor: 'pointer' }} />
                      Can Create Tasks
                    </label>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginLeft: '1.5rem' }}>Allow employee to add new tasks</div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={empReadOnlyTasks} onChange={e => setEmpReadOnlyTasks(e.target.checked)} style={{ cursor: 'pointer' }} />
                      Read-only Access
                    </label>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginLeft: '1.5rem' }}>Disable editing existing task details</div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={empCanComment} onChange={e => setEmpCanComment(e.target.checked)} style={{ cursor: 'pointer' }} />
                      Can Comment
                    </label>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginLeft: '1.5rem' }}>Allow chatting in client requests</div>
                  </div>
                </div>
                {empMsg && <div className="form-msg">{empMsg}</div>}
                <button type="submit" className="btn-add">
                  <FiPlus /> Add Employee
                </button>
              </form>
            </div>

            <div className="admin-list-card">
              <h3>All Employees ({employees.length})</h3>
              {employees.length === 0 ? (
                <p className="empty-msg">No employees added yet.</p>
              ) : (
                <div className="admin-table-overflow-container">
                  <div className="list-table employee-list-table-v2">
                    <div className="list-header">
                      <span>#</span>
                      <span>Employee Name</span>
                      <span>Designation</span>
                      <span>Services Assigned</span>
                      <span>Username/Password</span>
                      <span>Permissions</span>
                      <span>Action</span>
                    </div>
                    {employees.map((emp, i) => (
                      editingEmpId === emp.id ? (
                        // ── Inline edit row ──
                        <div className="list-row" key={emp.id}>
                          <span>{i + 1}</span>
                          <span><input type="text" value={empEditData.name} onChange={(e) => setEmpEditData({ ...empEditData, name: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} /></span>
                          <span><input type="text" value={empEditData.designation} onChange={(e) => setEmpEditData({ ...empEditData, designation: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} /></span>
                          <span>
                            <div className="multi-select-container" ref={empEditServicesRef}>
                              <div
                                className={`dropdown-trigger searchable ${isEmpEditServicesOpen ? 'active' : ''}`}
                                onMouseDown={(e) => { e.preventDefault(); setIsEmpEditServicesOpen(v => !v); }}
                                style={{ padding: '0.1rem 0.5rem', minHeight: '32px' }}
                              >
                                <input
                                  type="text"
                                  className="dropdown-search-input sm"
                                  placeholder={`${(empEditData.assignedServiceIds || []).length} Selected`}
                                  value={empEditServicesSearch}
                                  onChange={(e) => { setEmpEditServicesSearch(e.target.value); setIsEmpEditServicesOpen(true); }}
                                  onFocus={() => setIsEmpEditServicesOpen(true)}
                                  style={{ fontSize: '0.75rem' }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                />
                                <FiChevronDown className="trigger-icon" style={{ fontSize: '0.7rem' }} />
                              </div>
                              {isEmpEditServicesOpen && (
                                <div className="dropdown-menu" onMouseDown={(e) => e.stopPropagation()}>
                                  {services.filter(s => s.name.toLowerCase().includes(empEditServicesSearch.toLowerCase())).map((s) => (
                                    <label key={s.id} className={`emp-checkbox-item ${(empEditData.assignedServiceIds || []).includes(s.id) ? 'checked' : ''}`}>
                                      <input
                                        type="checkbox"
                                        checked={(empEditData.assignedServiceIds || []).includes(s.id)}
                                        onChange={() => setEmpEditData(prev => {
                                          const ids = prev.assignedServiceIds || [];
                                          return { ...prev, assignedServiceIds: ids.includes(s.id) ? ids.filter(x => x !== s.id) : [...ids, s.id] };
                                        })}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <span className="emp-check-name" style={{ fontSize: '0.75rem' }}>{s.name}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          </span>
                          <span style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <input type="text" value={empEditData.username} onChange={(e) => setEmpEditData({ ...empEditData, username: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} />
                            <input type="text" value={empEditData.password} onChange={(e) => setEmpEditData({ ...empEditData, password: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} />
                          </span>
                          <span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.5rem 0', background: 'transparent', borderRadius: '6px' }}>
                              <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <input type="checkbox" checked={empEditData.canCreateTasks !== false} onChange={e => setEmpEditData({ ...empEditData, canCreateTasks: e.target.checked })} />
                                Can Create Tasks
                              </label>
                              <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <input type="checkbox" checked={empEditData.readOnlyAccess === true} onChange={e => setEmpEditData({ ...empEditData, readOnlyAccess: e.target.checked })} />
                                Read-Only Access
                              </label>
                              <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <input type="checkbox" checked={empEditData.canComment !== false} onChange={e => setEmpEditData({ ...empEditData, canComment: e.target.checked })} />
                                Can Comment
                              </label>
                            </div>
                          </span>
                          <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button className="btn-add" style={{ padding: '0.35rem 0.75rem', margin: 0 }} onClick={() => { updateEmployee(emp.id, empEditData); setEditingEmpId(null); setIsEmpEditServicesOpen(false); }}>Save</button>
                            <button className="btn-delete" style={{ border: '1.5px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }} onClick={() => { setEditingEmpId(null); setIsEmpEditServicesOpen(false); }}>Cancel</button>
                          </span>
                        </div>
                      ) : (
                        // ── Normal display row ──
                        <div className="list-row" key={emp.id}>
                          <span>{i + 1}</span>
                          <span className="list-name">{emp.name}</span>
                          <span>{emp.designation || '-'}</span>
                          <span className="project-services-cell">
                            {(emp.assignedServiceIds || []).length > 0 ? (
                              <div className="gradient-tags-container">
                                {emp.assignedServiceIds.map(sid => {
                                  const s = services.find(srv => srv.id === sid);
                                  return s ? <span key={sid} className="gradient-tag">{s.name}</span> : null;
                                })}
                              </div>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None assigned</span>}
                          </span>
                          <span style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.85rem' }}>{emp.username}</span>
                            <span className="emp-password-cell">{emp.password}</span>
                          </span>
                          <span style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', color: emp.canCreateTasks !== false ? 'var(--accent)' : 'var(--text-muted)' }}>{emp.canCreateTasks !== false ? '✓ Create Tasks' : '✕ No Task Create'}</span>
                            <span style={{ fontSize: '0.75rem', color: emp.readOnlyAccess ? 'var(--text-muted)' : 'var(--accent)' }}>{emp.readOnlyAccess ? '✓ Read-Only' : '✓ Full Edit'}</span>
                            <span style={{ fontSize: '0.75rem', color: emp.canComment !== false ? 'var(--accent)' : 'var(--text-muted)' }}>{emp.canComment !== false ? '✓ Comments' : '✕ No Comments'}</span>
                          </span>
                          <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              className="btn-action-edit"
                              onClick={() => { setEditingEmpId(emp.id); setEmpEditData({ name: emp.name, designation: emp.designation || '', username: emp.username, password: emp.password, assignedServiceIds: emp.assignedServiceIds || [], canCreateTasks: emp.canCreateTasks ?? true, readOnlyAccess: emp.readOnlyAccess ?? false, canComment: emp.canComment ?? true }); }}
                              title="Edit Employee"
                            >
                              <FiEdit2 size={14} /> Edit
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => setDeleteTarget({ type: 'employee', id: emp.id, name: `employee "${emp.name}"` })}
                              title="Delete Employee"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </span>
                        </div>
                      )

                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SERVICES TAB ── */}
        {activeTab === 'services' && (
          <div className="admin-section">
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
                    {services.map((s, i) => (
                      editingServiceId === s.id ? (
                        <div className="list-row" key={s.id}>
                          <span>{i + 1}</span>
                          <span><input type="text" value={serviceEditData.name} onChange={(e) => setServiceEditData({ ...serviceEditData, name: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} /></span>
                          <span><input type="text" value={serviceEditData.description} onChange={(e) => setServiceEditData({ ...serviceEditData, description: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} /></span>
                          <span style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn-add" style={{ padding: '0.3rem 0.6rem', margin: 0 }} onClick={() => { updateService(s.id, serviceEditData); setEditingServiceId(null); }}>Save</button>
                            <button className="btn-delete" style={{ border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => setEditingServiceId(null)}>Cancel</button>
                          </span>
                        </div>
                      ) : (
                        <div className="list-row" key={s.id}>
                          <span>{i + 1}</span>
                          <span className="list-name">{s.name}</span>
                          <span>{s.description || '—'}</span>
                          <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              className="btn-action-edit"
                              onClick={() => { setEditingServiceId(s.id); setServiceEditData({ name: s.name, description: s.description || '' }); }}
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ADMINS TAB (SuperAdmin only) ── */}
        {activeTab === 'admins' && isSA && (
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
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Priya Mehta"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="e.g. priya.admin"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="text"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Set a strong password"
                      required
                    />
                  </div>
                  <div className="form-group" />
                </div>
                {adminMsg && <div className="form-msg">{adminMsg}</div>}
                <button type="submit" className="btn-add">
                  <FiPlus /> Create Admin
                </button>
              </form>
            </div>

            <div className="admin-list-card">
              <h3>All Admins ({admins.length})</h3>
              {admins.length === 0 ? (
                <p className="empty-msg">No admins created yet.</p>
              ) : (
                <div className="admin-table-overflow-container">
                  <div className="list-table admin-list-table">
                    <div className="list-header">
                      <span>#</span>
                      <span>Admin Name</span>
                      <span>Username</span>
                      <span>Password</span>
                      <span>Action</span>
                    </div>
                    {admins.map((admin, i) => (
                      editingAdminId === admin.id ? (
                        // ── Inline edit row ──
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
                        // ── Normal display row ──
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
                            <code className="cred-code">
                              {showAdminPasswords[admin.id] ? admin.password : '••••••••'}
                            </code>
                            <button className="btn-copy" title={showAdminPasswords[admin.id] ? 'Hide password' : 'Show password'} onClick={() => toggleShowAdminPassword(admin.id)}>
                              {showAdminPasswords[admin.id] ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                            </button>
                            {showAdminPasswords[admin.id] && (
                              <button className="btn-copy" title="Copy password" onClick={() => handleCopy(admin.password, `p_${admin.id}`)}>
                                {copiedId === `p_${admin.id}` ? <FiCheck size={13} style={{ color: '#4ade80' }} /> : <FiCopy size={13} />}
                              </button>
                            )}
                          </span>
                          <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              className="btn-action-edit"
                              onClick={() => { setEditingAdminId(admin.id); setAdminEditData({ name: admin.name, username: admin.username, password: admin.password }); }}
                              title="Edit Admin"
                            >
                              <FiEdit2 size={14} /> Edit
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => setDeleteTarget({ type: 'admin', id: admin.id, name: `admin "${admin.name}"` })}
                              title="Delete Admin"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CLIENTS TAB (SuperAdmin only) ── */}
        {activeTab === 'clients' && isSA && (
          <ClientsTab
            clients={clients}
            projects={projects}
            addClient={addClient}
            updateClient={updateClient}
            setDeleteTarget={setDeleteTarget}
          />
        )}

        {/* ── SETTINGS TAB (SuperAdmin Only) ── */}
        {activeTab === 'settings' && isSA && (
          <div className="admin-section">
            <div className="admin-form-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3>Global System Settings</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Use these settings to restrict what standard Admins are allowed to do. Changes are saved automatically.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.2rem' }}>Admins can manage Employees</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>If disabled, the "Employees" tab is completely hidden from standard Admins.</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={async () => await updateSystemSettings({ ...systemSettings, adminCanManageEmployees: true })}
                      style={{
                        padding: '0.4rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid ' + (systemSettings?.adminCanManageEmployees !== false ? 'var(--accent)' : 'var(--border)'),
                        background: systemSettings?.adminCanManageEmployees !== false ? 'var(--accent)' : 'var(--bg)',
                        color: systemSettings?.adminCanManageEmployees !== false ? '#fff' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={async () => await updateSystemSettings({ ...systemSettings, adminCanManageEmployees: false })}
                      style={{
                        padding: '0.4rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid ' + (systemSettings?.adminCanManageEmployees === false ? 'var(--red)' : 'var(--border)'),
                        background: systemSettings?.adminCanManageEmployees === false ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg)',
                        color: systemSettings?.adminCanManageEmployees === false ? 'var(--red)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.2rem' }}>Admins can comment with Clients</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>If disabled, standard Admins will not see the comment input box in client requests.</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={async () => await updateSystemSettings({ ...systemSettings, adminCanComment: true })}
                      style={{
                        padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)',
                        border: '1px solid ' + (systemSettings?.adminCanComment !== false ? 'var(--accent)' : 'var(--border)'),
                        background: systemSettings?.adminCanComment !== false ? 'var(--accent)' : 'var(--bg)',
                        color: systemSettings?.adminCanComment !== false ? '#fff' : 'var(--text-muted)',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >Yes</button>
                    <button
                      onClick={async () => await updateSystemSettings({ ...systemSettings, adminCanComment: false })}
                      style={{
                        padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)',
                        border: '1px solid ' + (systemSettings?.adminCanComment === false ? 'var(--red)' : 'var(--border)'),
                        background: systemSettings?.adminCanComment === false ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg)',
                        color: systemSettings?.adminCanComment === false ? 'var(--red)' : 'var(--text-muted)',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >No</button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.2rem' }}>Employees can comment with Clients</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>If disabled, no Employee will be able to comment, regardless of individual settings.</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={async () => await updateSystemSettings({ ...systemSettings, employeeCanComment: true })}
                      style={{
                        padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)',
                        border: '1px solid ' + (systemSettings?.employeeCanComment !== false ? 'var(--accent)' : 'var(--border)'),
                        background: systemSettings?.employeeCanComment !== false ? 'var(--accent)' : 'var(--bg)',
                        color: systemSettings?.employeeCanComment !== false ? '#fff' : 'var(--text-muted)',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >Yes</button>
                    <button
                      onClick={async () => await updateSystemSettings({ ...systemSettings, employeeCanComment: false })}
                      style={{
                        padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)',
                        border: '1px solid ' + (systemSettings?.employeeCanComment === false ? 'var(--red)' : 'var(--border)'),
                        background: systemSettings?.employeeCanComment === false ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg)',
                        color: systemSettings?.employeeCanComment === false ? 'var(--red)' : 'var(--text-muted)',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >No</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget.type === 'project') deleteProject(deleteTarget.id);
          else if (deleteTarget.type === 'employee') deleteEmployee(deleteTarget.id);
          else if (deleteTarget.type === 'service') deleteService(deleteTarget.id);
          else if (deleteTarget.type === 'admin') deleteAdmin(deleteTarget.id);
          else if (deleteTarget.type === 'client') deleteClient(deleteTarget.id);
        }}
        itemName={deleteTarget?.name}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ClientsTab sub-component
// ─────────────────────────────────────────────────────────────────────────────
function ClientsTab({ clients, projects, addClient, updateClient, setDeleteTarget }) {
  const [clientName, setClientName] = useState('');
  const [clientProjectId, setClientProjectId] = useState('');
  const [clientUsername, setClientUsername] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [clientMsg, setClientMsg] = useState('');

  const [editingClientId, setEditingClientId] = useState(null);
  const [clientEditData, setClientEditData] = useState({ name: '', projectId: '', username: '', password: '' });

  const [showPasswords, setShowPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientUsername.trim() || !clientPassword.trim() || !clientProjectId) {
      setClientMsg('❌ All fields including project are required!');
      setTimeout(() => setClientMsg(''), 3000);
      return;
    }
    const dup = clients.find(c => c.username === clientUsername.trim());
    if (dup) {
      setClientMsg('❌ Username already exists!');
      setTimeout(() => setClientMsg(''), 3000);
      return;
    }
    await addClient({ name: clientName.trim(), projectId: clientProjectId, username: clientUsername.trim(), password: clientPassword.trim() });
    setClientName(''); setClientProjectId(''); setClientUsername(''); setClientPassword('');
    setClientMsg('✅ Client created successfully!');
    setTimeout(() => setClientMsg(''), 3000);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="admin-section">
      {/* ── Add Client Form ──────────────────────────────────── */}
      <div className="admin-form-card">
        <h3>Add New Client</h3>
        <form onSubmit={handleAddClient} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Client Name *</label>
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Ramesh Industries" required />
            </div>
            <div className="form-group">
              <label>Project *</label>
              <select value={clientProjectId} onChange={e => setClientProjectId(e.target.value)} className="header-select" style={{ width: '100%', marginTop: 0 }} required>
                <option value="">-- Select Project --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Username *</label>
              <input type="text" value={clientUsername} onChange={e => setClientUsername(e.target.value)} placeholder="e.g. ramesh.ind" required />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input type="text" value={clientPassword} onChange={e => setClientPassword(e.target.value)} placeholder="Set password" required />
            </div>
          </div>
          {clientMsg && <div className="form-msg">{clientMsg}</div>}
          <button type="submit" className="btn-add"><FiPlus /> Add Client</button>
        </form>
      </div>

      {/* ── Clients List ──────────────────────────────────────── */}
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
                const proj = projects.find(p => p.id === client.projectId);
                return editingClientId === client.id ? (
                  <div className="list-row" key={client.id}>
                    <span>{i + 1}</span>
                    <span><input type="text" value={clientEditData.name} onChange={e => setClientEditData({ ...clientEditData, name: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} /></span>
                    <span>
                      <select value={clientEditData.projectId} onChange={e => setClientEditData({ ...clientEditData, projectId: e.target.value })} className="header-select" style={{ width: '100%' }}>
                        <option value="">-- Select --</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </span>
                    <span><input type="text" value={clientEditData.username} onChange={e => setClientEditData({ ...clientEditData, username: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} /></span>
                    <span><input type="text" value={clientEditData.password} onChange={e => setClientEditData({ ...clientEditData, password: e.target.value })} style={{ width: '100%', padding: '0.3rem' }} /></span>
                    <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button className="btn-add" style={{ padding: '0.35rem 0.75rem', margin: 0 }} onClick={() => { updateClient(client.id, clientEditData); setEditingClientId(null); }}>Save</button>
                      <button className="btn-delete" style={{ border: '1.5px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }} onClick={() => setEditingClientId(null)}>Cancel</button>
                    </span>
                  </div>
                ) : (
                  <div className="list-row" key={client.id}>
                    <span>{i + 1}</span>
                    <span className="list-name">{client.name}</span>
                    <span>{proj ? proj.name : <em style={{ color: 'var(--text-muted)' }}>—</em>}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <code className="cred-code">{client.username}</code>
                      <button className="btn-copy" title="Copy username" onClick={() => handleCopy(client.username, `cu_${client.id}`)}>
                        {copiedId === `cu_${client.id}` ? <FiCheck size={13} style={{ color: '#4ade80' }} /> : <FiCopy size={13} />}
                      </button>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <code className="cred-code">{showPasswords[client.id] ? client.password : '••••••••'}</code>
                      <button className="btn-copy" title={showPasswords[client.id] ? 'Hide' : 'Show'} onClick={() => setShowPasswords(prev => ({ ...prev, [client.id]: !prev[client.id] }))}>
                        {showPasswords[client.id] ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                      </button>
                      {showPasswords[client.id] && (
                        <button className="btn-copy" title="Copy password" onClick={() => handleCopy(client.password, `cp_${client.id}`)}>
                          {copiedId === `cp_${client.id}` ? <FiCheck size={13} style={{ color: '#4ade80' }} /> : <FiCopy size={13} />}
                        </button>
                      )}
                    </span>
                    <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button className="btn-action-edit" onClick={() => { setEditingClientId(client.id); setClientEditData({ name: client.name, projectId: client.projectId, username: client.username, password: client.password }); }} title="Edit Client">
                        <FiEdit2 size={14} /> Edit
                      </button>
                      <button className="btn-delete" onClick={() => setDeleteTarget({ type: 'client', id: client.id, name: `client "${client.name}"` })} title="Delete Client">
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
