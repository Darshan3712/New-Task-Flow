import { useState, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import MultiSelectDropdown from './MultiSelectDropdown';

export default function EmployeesTab({ employees, projects, services, addEmployee, updateEmployee, setDeleteTarget }) {
  // ── Add form state ──────────────────────────────────────────────────────────
  const [empName, setEmpName] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empAssignedServiceIds, setEmpAssignedServiceIds] = useState([]);
  const [empAssignedProjectIds, setEmpAssignedProjectIds] = useState([]);
  const [empIsSenior, setEmpIsSenior] = useState(false);
  const [empMsg, setEmpMsg] = useState('');

  const [isEmpServicesOpen, setIsEmpServicesOpen] = useState(false);
  const [empServicesSearch, setEmpServicesSearch] = useState('');
  const [isEmpProjectsOpen, setIsEmpProjectsOpen] = useState(false);
  const [empProjectsSearch, setEmpProjectsSearch] = useState('');
  const empServicesRef = useRef(null);
  const empProjectsRef = useRef(null);

  // ── Edit row state ──────────────────────────────────────────────────────────
  const [editingEmpId, setEditingEmpId] = useState(null);
  const [empEditData, setEmpEditData] = useState({
    name: '', designation: '', username: '', password: '',
    assignedServiceIds: [], assignedProjectIds: [],
    canCreateTasks: true, readOnlyAccess: false, canComment: true, isSenior: false,
  });

  const [isEmpEditServicesOpen, setIsEmpEditServicesOpen] = useState(false);
  const [empEditServicesSearch, setEmpEditServicesSearch] = useState('');
  const [isEmpEditProjectsOpen, setIsEmpEditProjectsOpen] = useState(false);
  const [empEditProjectsSearch, setEmpEditProjectsSearch] = useState('');
  const empEditServicesRef = useRef(null);
  const empEditProjectsRef = useRef(null);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (!empName.trim() || !empUsername.trim() || !empPassword.trim()) return;
    if (employees.find((em) => em.username === empUsername.trim())) {
      setEmpMsg('❌ Username already exists!');
      setTimeout(() => setEmpMsg(''), 3000);
      return;
    }
    addEmployee(
      empName.trim(), empUsername.trim(), empPassword.trim(),
      empDesignation.trim(), empAssignedServiceIds, empAssignedProjectIds,
      { canCreateTasks: true, readOnlyAccess: false, canComment: true, isSenior: empIsSenior }
    );
    setEmpName(''); setEmpUsername(''); setEmpPassword('');
    setEmpDesignation(''); setEmpAssignedServiceIds([]);
    setEmpAssignedProjectIds([]); setEmpIsSenior(false);
    setEmpMsg('✅ Employee added successfully!');
    setTimeout(() => setEmpMsg(''), 3000);
  };

  const toggleAddService = (id) =>
    setEmpAssignedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAddProject = (id) =>
    setEmpAssignedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleEditService = (id) =>
    setEmpEditData((prev) => {
      const ids = prev.assignedServiceIds || [];
      return { ...prev, assignedServiceIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] };
    });

  const toggleEditProject = (id) =>
    setEmpEditData((prev) => {
      const ids = prev.assignedProjectIds || [];
      return { ...prev, assignedProjectIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] };
    });

  const startEditing = (emp) => {
    setEditingEmpId(emp.id);
    setEmpEditData({
      name: emp.name,
      designation: emp.designation || '',
      username: emp.username,
      password: emp.password,
      assignedServiceIds: emp.assignedServiceIds || [],
      assignedProjectIds: emp.assignedProjectIds || [],
      canCreateTasks: emp.canCreateTasks ?? true,
      readOnlyAccess: emp.readOnlyAccess ?? false,
      canComment: emp.canComment ?? true,
      isSenior: !!emp.isSenior,
    });
  };

  const handleSaveEdit = (empId) => {
    updateEmployee(empId, empEditData);
    setEditingEmpId(null);
    setIsEmpEditServicesOpen(false);
    setIsEmpEditProjectsOpen(false);
  };

  const handleCancelEdit = () => {
    setEditingEmpId(null);
    setIsEmpEditServicesOpen(false);
    setIsEmpEditProjectsOpen(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="admin-section">

      {/* ── Add Employee Form ── */}
      <div className="admin-form-card">
        <h3>Add New Employee</h3>
        <form onSubmit={handleAddEmployee} className="admin-form">

          {/* Row 1: Name | Designation | Projects */}
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
              <label>Projects Assigned</label>
              <MultiSelectDropdown
                items={projects}
                selectedIds={empAssignedProjectIds}
                onToggle={toggleAddProject}
                searchTerm={empProjectsSearch}
                setSearchTerm={setEmpProjectsSearch}
                isOpen={isEmpProjectsOpen}
                setIsOpen={setIsEmpProjectsOpen}
                dropdownRef={empProjectsRef}
                placeholder="Select projects..."
              />
              {empAssignedProjectIds.length > 0 && (
                <div className="selected-tags-preview" style={{ marginTop: '0.4rem' }}>
                  {empAssignedProjectIds.map(id => {
                    const p = projects.find(pr => pr.id === id);
                    return p ? <span key={id} className="gradient-tag sm">{p.name}</span> : null;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Username | Password | Services */}
          <div className="form-row form-row-3">
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
            <div className="form-group">
              <label>Services Assigned</label>
              <MultiSelectDropdown
                items={services}
                selectedIds={empAssignedServiceIds}
                onToggle={toggleAddService}
                searchTerm={empServicesSearch}
                setSearchTerm={setEmpServicesSearch}
                isOpen={isEmpServicesOpen}
                setIsOpen={setIsEmpServicesOpen}
                dropdownRef={empServicesRef}
                placeholder="Select services..."
              />
              {empAssignedServiceIds.length > 0 && (
                <div className="selected-tags-preview" style={{ marginTop: '0.4rem' }}>
                  {empAssignedServiceIds.map(id => {
                    const s = services.find(sv => sv.id === id);
                    return s ? <span key={id} className="gradient-tag sm">{s.name}</span> : null;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Senior checkbox */}
          <div className="form-row">
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="isSenior"
                checked={empIsSenior}
                onChange={(e) => setEmpIsSenior(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <label htmlFor="isSenior" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>
                Senior Employee (Can assign tasks to others)
              </label>
            </div>
          </div>

          {empMsg && <div className="form-msg">{empMsg}</div>}
          <button type="submit" className="btn-add">
            <FiPlus /> Add Employee
          </button>
        </form>
      </div>

      {/* ── Employees List ── */}
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
                <span>Projects</span>
                <span>Services Assigned</span>
                <span>Username/Password</span>
                <span>Action</span>
              </div>

              {employees.map((emp, i) =>
                editingEmpId === emp.id ? (

                  /* ── Edit Row ── */
                  <div className="list-row" key={emp.id}>
                    <span>{i + 1}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <input
                        type="text"
                        value={empEditData.name}
                        onChange={(e) => setEmpEditData({ ...empEditData, name: e.target.value })}
                        style={{ width: '100%', padding: '0.3rem' }}
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={empEditData.designation}
                        onChange={(e) => setEmpEditData({ ...empEditData, designation: e.target.value })}
                        style={{ width: '100%', padding: '0.3rem' }}
                        placeholder="Designation"
                      />
                    </span>
                    <span>
                      <MultiSelectDropdown
                        items={projects}
                        selectedIds={empEditData.assignedProjectIds || []}
                        onToggle={toggleEditProject}
                        searchTerm={empEditProjectsSearch}
                        setSearchTerm={setEmpEditProjectsSearch}
                        isOpen={isEmpEditProjectsOpen}
                        setIsOpen={setIsEmpEditProjectsOpen}
                        dropdownRef={empEditProjectsRef}
                        sm
                      />
                    </span>
                    <span>
                      <MultiSelectDropdown
                        items={services}
                        selectedIds={empEditData.assignedServiceIds || []}
                        onToggle={toggleEditService}
                        searchTerm={empEditServicesSearch}
                        setSearchTerm={setEmpEditServicesSearch}
                        isOpen={isEmpEditServicesOpen}
                        setIsOpen={setIsEmpEditServicesOpen}
                        dropdownRef={empEditServicesRef}
                        sm
                      />
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <input
                        type="text"
                        value={empEditData.username}
                        onChange={(e) => setEmpEditData({ ...empEditData, username: e.target.value })}
                        style={{ width: '100%', padding: '0.3rem' }}
                      />
                      <input
                        type="text"
                        value={empEditData.password}
                        onChange={(e) => setEmpEditData({ ...empEditData, password: e.target.value })}
                        style={{ width: '100%', padding: '0.3rem' }}
                      />
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-start', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <input
                          type="checkbox"
                          id={`edit-senior-${emp.id}`}
                          checked={empEditData.isSenior}
                          onChange={(e) => setEmpEditData({ ...empEditData, isSenior: e.target.checked })}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                        />
                        <label htmlFor={`edit-senior-${emp.id}`} style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                          Senior
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          className="btn-add"
                          style={{ padding: '0.35rem 0.75rem', margin: 0 }}
                          onClick={() => handleSaveEdit(emp.id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn-delete"
                          style={{ border: '1.5px solid var(--border)', color: 'var(--text-muted)', background: 'transparent', padding: '0.35rem 0.75rem' }}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </span>
                  </div>

                ) : (

                  /* ── Display Row ── */
                  <div className="list-row" key={emp.id}>
                    <span>{i + 1}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                      <span className="list-name">
                        {emp.name}
                        {emp.isSenior && (
                          <span className="gradient-tag sm" style={{ marginLeft: '0.4rem', fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'var(--accent-gradient)', color: 'white', display: 'inline-flex', alignItems: 'center' }}>
                            Senior
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {emp.designation || 'No Designation'}
                      </span>
                    </span>
                    <span className="project-services-cell">
                      {(emp.assignedProjectIds || []).length > 0 ? (
                        <div className="gradient-tags-container">
                          {emp.assignedProjectIds.map(pid => {
                            const p = projects.find(pr => pr.id === pid);
                            return p ? <span key={pid} className="gradient-tag">{p.name}</span> : null;
                          })}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None assigned</span>
                      )}
                    </span>
                    <span className="project-services-cell">
                      {(emp.assignedServiceIds || []).length > 0 ? (
                        <div className="gradient-tags-container">
                          {emp.assignedServiceIds.map(sid => {
                            const s = services.find(sv => sv.id === sid);
                            return s ? <span key={sid} className="gradient-tag">{s.name}</span> : null;
                          })}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None assigned</span>
                      )}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.85rem' }}>{emp.username}</span>
                      <span className="emp-password-cell">{emp.password}</span>
                    </span>
                    <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        className="btn-action-edit"
                        onClick={() => startEditing(emp)}
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
