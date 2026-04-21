import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiBriefcase, FiUsers, FiLayers, FiShield, FiUserCheck } from 'react-icons/fi';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import ProjectsTab  from '../components/admin/ProjectsTab';
import EmployeesTab from '../components/admin/EmployeesTab';
import ServicesTab  from '../components/admin/ServicesTab';
import AdminsTab    from '../components/admin/AdminsTab';
import ClientsTab   from '../components/admin/ClientsTab';
import SettingsTab  from '../components/admin/SettingsTab';

export default function AdminPanel() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isSA = currentUser?.role === 'superadmin';

  const {
    projects, employees, services, admins, clients,
    addProject, deleteProject, updateProject,
    addEmployee, deleteEmployee, updateEmployee,
    addAdmin, updateAdmin, deleteAdmin,
    addClient, updateClient, deleteClient,
    addService, deleteService, updateService,
    systemSettings, updateSystemSettings,
  } = useData();

  const [activeTab, setActiveTab] = useState('projects');
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
    return <div className="access-denied">Access Denied</div>;
  }

  const canSeeEmployees = isSA || systemSettings?.adminCanManageEmployees;

  const tabs = [
    { key: 'projects',  label: 'Projects',  icon: <FiBriefcase /> },
    ...(canSeeEmployees ? [{ key: 'employees', label: 'Employees', icon: <FiUsers /> }] : []),
    { key: 'services',  label: 'Services',  icon: <FiLayers /> },
    ...(isSA ? [{ key: 'admins',    label: 'Admins',    icon: <FiShield /> }]   : []),
    ...(isSA ? [{ key: 'clients',   label: 'Clients',   icon: <FiUserCheck /> }] : []),
    ...(isSA ? [{ key: 'settings',  label: 'Settings',  icon: <span>⚙️</span> }] : []),
  ];

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'project')  deleteProject(deleteTarget.id);
    if (deleteTarget.type === 'employee') deleteEmployee(deleteTarget.id);
    if (deleteTarget.type === 'service')  deleteService(deleteTarget.id);
    if (deleteTarget.type === 'admin')    deleteAdmin(deleteTarget.id);
    if (deleteTarget.type === 'client')   deleteClient(deleteTarget.id);
  };

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
        <div className="header-right-spacer" />
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
        {activeTab === 'projects'  && <ProjectsTab  projects={projects}  services={services}  addProject={addProject}   updateProject={updateProject}   setDeleteTarget={setDeleteTarget} />}
        {activeTab === 'employees' && <EmployeesTab employees={employees} projects={projects} services={services} addEmployee={addEmployee} updateEmployee={updateEmployee} setDeleteTarget={setDeleteTarget} />}
        {activeTab === 'services'  && <ServicesTab  services={services}  addService={addService}   updateService={updateService}   setDeleteTarget={setDeleteTarget} />}
        {activeTab === 'admins'    && isSA && <AdminsTab   admins={admins}     addAdmin={addAdmin}       updateAdmin={updateAdmin}       setDeleteTarget={setDeleteTarget} />}
        {activeTab === 'clients'   && isSA && <ClientsTab  clients={clients}   projects={projects}  addClient={addClient}     updateClient={updateClient}     setDeleteTarget={setDeleteTarget} />}
        {activeTab === 'settings'  && isSA && <SettingsTab systemSettings={systemSettings} updateSystemSettings={updateSystemSettings} />}
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget?.name}
      />
    </div>
  );
}
