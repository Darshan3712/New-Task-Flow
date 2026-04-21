import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/header/Header';
import Calendar from '../components/calendar/Calendar';
import ClientPortal from './ClientPortal';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { projects } = useData();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useState(null);

  // Client gets their own portal — no calendar
  if (currentUser?.role === 'client') {
    return <ClientPortal />;
  }

  const handleSearch = ({ projectId, month, year, serviceIds, isMasterView }) => {
    setSearchParams({ projectId, month, year, serviceIds, isMasterView });
  };

  const today = new Date();

  return (
    <div className="dashboard-page">
      <Header onSearch={handleSearch} />

      <main className="dashboard-main">
        {!searchParams ? (
          <div className="hero-empty">
            <div className="dynamic-cal-icon">
              <div className="dynamic-cal-header">{format(today, 'MMMM')}</div>
              <div className="dynamic-cal-body">{format(today, 'd')}</div>
            </div>
            <p>Choose a project and month from the header, then click <strong>Go</strong> to view the task calendar.</p>
            {projects.length === 0 && currentUser?.role === 'admin' && (
              <button className="btn-goto-admin" onClick={() => navigate('/admin')}>
                ➕ Add your first project in Admin Panel
              </button>
            )}
            {projects.length === 0 && currentUser?.role !== 'admin' && (
              <p className="hint-text">No projects available. Contact your Admin.</p>
            )}
          </div>
        ) : (
          <Calendar
            projectId={searchParams.projectId}
            month={searchParams.month}
            year={searchParams.year}
            serviceIds={searchParams.serviceIds}
            isMasterView={searchParams.isMasterView}
          />
        )}
      </main>
    </div>
  );
}
