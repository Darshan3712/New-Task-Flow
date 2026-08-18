import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { FiLogOut, FiSettings, FiBell, FiInbox } from 'react-icons/fi';
import NotificationPanel from '../notification/NotificationPanel';
import ClientRequestsPanel from '../client/ClientRequestsPanel';
import LogoutConfirmModal from './LogoutConfirmModal';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Header({ onSearch, onNavigateToTask }) {
  const { currentUser, logout } = useAuth();
  const { projects, services, employees, clientTasks } = useData();
  const navigate = useNavigate();

  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showClientRequests, setShowClientRequests] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const unassignedCount = (clientTasks || []).filter(t => !t.assignedEmployeeId).length;
  const totalClientTasks = (clientTasks || []).filter(t => t.status !== 'cancelled').length;

  const now = new Date();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdminRole = currentUser?.role === 'admin' || isSuperAdmin;

  // ── Cascading filter logic (SuperAdmin only) ──
  // Get the selected employee object
  const selectedEmployee = selectedEmployeeId
    ? employees.find(e => e.id === selectedEmployeeId)
    : null;

  // Filter services: if an employee is selected, show only their assigned services
  const filteredServices = selectedEmployee
    ? services.filter(s => (selectedEmployee.assignedServiceIds || []).includes(s.id))
    : services;

  // For project filtering, consider both employee assignment and service
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Filter projects: if employee selected, show only their assigned projects
  let filteredProjects = selectedEmployee
    ? projects.filter(p => (selectedEmployee.assignedProjectIds || []).includes(p.id))
    : projects;

  // Additionally if a service is selected, filter projects that include that service
  if (selectedServiceId) {
    filteredProjects = filteredProjects.filter(p =>
      (p.serviceIds || []).includes(selectedServiceId)
    );
  }

  // Visible services scoped to selected project
  const visibleServices = selectedProject && selectedProject.serviceIds?.length > 0
    ? filteredServices.filter(s => selectedProject.serviceIds.includes(s.id))
    : filteredServices;

  // ── Reset cascading selections when employee changes ──
  const handleEmployeeChange = (empId) => {
    setSelectedEmployeeId(empId);
    setSelectedServiceId('');
    setSelectedProjectId('');
  };

  const handleServiceChange = (svcId) => {
    setSelectedServiceId(svcId);
    setSelectedProjectId('');
  };

  const confirmLogout = () => { setShowLogoutConfirm(false); logout(); navigate('/login'); };

  const handleGo = () => {
    if (!selectedProjectId) return;
    const isMasterView = selectedProjectId === '__master__';
    onSearch({
      projectId: isMasterView ? null : selectedProjectId,
      month: selectedMonth,
      year: selectedYear,
      serviceIds: selectedServiceId ? [selectedServiceId] : [],
      isMasterView,
      employeeId: selectedEmployeeId || null,
    });
  };

  const years = [];
  for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 3; y++) years.push(y);

  return (
    <>
      <header className="app-header app-header-2row">
        {/* ════════ ROW 1: Action Bar ════════ */}
        <div className="header-row1">
          <div className="header-row1-left">
            <div className="header-logo">
              <img src={`${import.meta.env.BASE_URL}New_Logo.png`} alt="TaskFlow Logo" className="app-main-logo" />
            </div>
          </div>

          {/* Mobile actions */}
          <div className="mobile-actions">
            {isAdminRole && (<>
              {isSuperAdmin && (
                <button className="btn-mobile-nav" onClick={() => setShowClientRequests(v => !v)} title="Client Requests" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', position: 'relative' }}>
                  <FiInbox size={18} />
                  {totalClientTasks > 0 && <span className="notif-dot" style={{ width: '14px', height: '14px', fontSize: '0.6rem' }}>{totalClientTasks > 99 ? '99+' : totalClientTasks}</span>}
                </button>
              )}
              <div className="notif-bell-wrapper" style={{ marginRight: '0.5rem' }}>
                <button className="notif-bell-btn" onClick={() => setShowNotifPanel(v => !v)} title="Client Task Requests" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}>
                  <FiBell size={18} />
                  {unassignedCount > 0 && <span className="notif-dot" style={{ width: '14px', height: '14px', fontSize: '0.6rem' }}>{unassignedCount > 99 ? '99+' : unassignedCount}</span>}
                </button>
              </div>
              <button className="btn-mobile-nav" onClick={() => navigate('/admin')} title="Admin Panel"><FiSettings size={18} /></button>
            </>)}
            <button className="btn-mobile-nav" onClick={() => setShowLogoutConfirm(true)} title="Logout"><FiLogOut size={18} /></button>
          </div>

          <div className="header-row1-right">
            {/* Client Requests button (SuperAdmin only) */}
            {isSuperAdmin && (
              <button className="btn-client-requests" onClick={() => setShowClientRequests(v => !v)} title="Client Requests">
                <FiInbox size={16} />
                <span className="btn-cr-text">Client Requests</span>
                {totalClientTasks > 0 && <span className="btn-cr-badge">{totalClientTasks > 99 ? '99+' : totalClientTasks}</span>}
              </button>
            )}

            {/* Notification bell */}
            {isAdminRole && (
              <div className="notif-bell-wrapper">
                <button className="notif-bell-btn" onClick={() => setShowNotifPanel(v => !v)} title="Client Task Requests">
                  <FiBell size={20} />
                  {unassignedCount > 0 && <span className="notif-dot">{unassignedCount > 99 ? '99+' : unassignedCount}</span>}
                </button>
              </div>
            )}

            {/* Admin Panel */}
            {isAdminRole && (
              <button className="btn-admin-panel" onClick={() => navigate('/admin')}><FiSettings size={16} /> Admin Panel</button>
            )}

            {/* User badge */}
            <div className="user-badge">
              <span className="user-role">{currentUser?.role === 'superadmin' ? 'Super Admin' : currentUser?.role === 'admin' ? 'Admin' : currentUser?.role === 'client' ? 'Client' : 'Employee'}</span>
              <span className="user-name">{currentUser?.name}</span>
            </div>

            {/* Logout */}
            <button className="btn-logout" onClick={() => setShowLogoutConfirm(true)} title="Logout"><FiLogOut size={20} /></button>
          </div>
        </div>

        {/* ════════ ROW 2: Filters Bar ════════ */}
        <div className="header-row2">
          {/* Employee filter (SuperAdmin only) */}
          {isSuperAdmin && (
            <div className="header-control">
              <label className="header-label">Employee</label>
              <select
                className="header-select"
                value={selectedEmployeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
              >
                <option value="">-- All Employees --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Services */}
          <div className="header-control">
            <label className="header-label">Services</label>
            <select
              className="header-select"
              value={selectedServiceId}
              onChange={(e) => handleServiceChange(e.target.value)}
            >
              <option value="">{currentUser?.role === 'employee' ? '-- All My Services --' : '-- All Services --'}</option>
              {visibleServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Project */}
          <div className="header-control header-control-project">
            <label className="header-label">Project</label>
            <select
              className="header-select"
              value={selectedProjectId}
              onChange={(e) => { setSelectedProjectId(e.target.value); }}
            >
              <option value="">-- Select Project --</option>
              <option value="__master__">★ Master View (All Projects)</option>
              {filteredProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Month */}
          <div className="header-control header-control-month">
            <label className="header-label">Month</label>
            <select className="header-select" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>

          {/* Year */}
          <div className="header-control header-control-year">
            <label className="header-label">Year</label>
            <select className="header-select" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Go */}
          <button className={`btn-go ${!selectedProjectId ? 'disabled' : ''}`} onClick={handleGo} disabled={!selectedProjectId}>Go</button>
        </div>
      </header>

      {showNotifPanel && <NotificationPanel onClose={() => setShowNotifPanel(false)} onNavigateToTask={(task) => { setShowNotifPanel(false); onNavigateToTask && onNavigateToTask(task); }} />}
      {showClientRequests && <ClientRequestsPanel onClose={() => setShowClientRequests(false)} />}
      {showLogoutConfirm && <LogoutConfirmModal onCancel={() => setShowLogoutConfirm(false)} onConfirm={confirmLogout} />}
    </>
  );
}
