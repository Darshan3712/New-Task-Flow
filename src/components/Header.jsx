import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { FiLogOut, FiSettings, FiBell } from 'react-icons/fi';
import NotificationPanel from './NotificationPanel';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Header({ onSearch }) {
  const { currentUser, logout } = useAuth();
  const { projects, services, clientTasks } = useData();
  const navigate = useNavigate();

  // Notification bell state
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Unassigned client tasks count for badge
  const unassignedCount = (clientTasks || []).filter(t => !t.assignedEmployeeId).length;

  // Employees only see their assigned services
  const visibleServices = (currentUser?.role === 'employee')
    ? services.filter(s => (currentUser?.assignedServiceIds || []).includes(s.id))
    : services;

  const now = new Date();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  const handleGo = () => {
    if (!selectedProjectId) return;
    const isMasterView = selectedProjectId === '__master__';
    onSearch({
      projectId: isMasterView ? null : selectedProjectId,
      month: selectedMonth,
      year: selectedYear,
      serviceIds: selectedServiceId ? [selectedServiceId] : [],
      isMasterView,
    });
  };

  const years = [];
  for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 3; y++) {
    years.push(y);
  }

  // Client role has a completely different (simplified) header rendered in ClientPortal
  // So here we just show the normal admin/employee header
  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo">
            <img src="/New_Logo.png" alt="TaskFlow Logo" className="app-main-logo" />
          </div>
          <div className="mobile-actions">
            {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
              <button className="btn-mobile-nav" onClick={() => navigate('/admin')} title="Admin Panel">
                <FiSettings size={18} />
              </button>
            )}
            <button className="btn-mobile-nav" onClick={handleLogout} title="Logout">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>

        <div className="header-center">
          <div className="header-row-1">
            <div className="header-control">
              <label className="header-label">Services</label>
              <select
                className="header-select"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                <option value="">{currentUser?.role === 'employee' ? '-- All My Services --' : '-- All Services --'}</option>
                {visibleServices.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="header-control">
              <label className="header-label">Project</label>
              <select
                className="header-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="">-- Select Project --</option>
                <option value="__master__">★ Master View (All Projects)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="header-row-2">
            <div className="header-control">
              <label className="header-label">Month</label>
              <select
                className="header-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>

            <div className="header-control">
              <label className="header-label">Year</label>
              <select
                className="header-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              className={`btn-go ${!selectedProjectId ? 'disabled' : ''}`}
              onClick={handleGo}
              disabled={!selectedProjectId}
            >
              Go
            </button>
          </div>
        </div>

        <div className="header-right">
          {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
            <>
              {/* Notification Bell */}
              <div className="notif-bell-wrapper">
                <button
                  className="notif-bell-btn"
                  onClick={() => setShowNotifPanel(v => !v)}
                  title="Client Task Requests"
                >
                  <FiBell size={20} />
                  {unassignedCount > 0 && (
                    <span className="notif-dot">{unassignedCount > 99 ? '99+' : unassignedCount}</span>
                  )}
                </button>
              </div>

              <button className="btn-admin-panel" onClick={() => navigate('/admin')}>
                <FiSettings size={16} /> Admin Panel
              </button>
            </>
          )}

          <div className="user-badge">
            <span className="user-role">
              {currentUser?.role === 'superadmin' ? 'Super Admin' :
               currentUser?.role === 'admin' ? 'Admin' :
               currentUser?.role === 'client' ? 'Client' : 'Employee'}
            </span>
            <span className="user-name">{currentUser?.name}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Logout">
            <FiLogOut size={20} />
          </button>
        </div>
      </header>

      {/* Notification Panel */}
      {showNotifPanel && (
        <NotificationPanel onClose={() => setShowNotifPanel(false)} />
      )}

      {/* ── Custom Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="popup-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="popup-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px', textAlign: 'center', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>Confirm Logout</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, flex: 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', background: '#e11d48', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, flex: 1 }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
