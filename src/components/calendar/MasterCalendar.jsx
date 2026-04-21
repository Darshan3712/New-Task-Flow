import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_META = {
  gray:   { label: 'Pending',     color: '#6b7280' },
  yellow: { label: 'In Progress', color: '#f59e0b' },
  green:  { label: 'Completed',   color: '#10b981' },
  red:    { label: 'Not Done',    color: '#ef4444' },
};

function getDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export default function MasterCalendar({ month, year, serviceIds = [], cells, isToday, openSidebar }) {
  const { projects, getTasks, clientTasks, employees, services } = useData();
  const { currentUser } = useAuth();
  const [sidebarDate, setSidebarDate] = useState(null);
  const [sidebarEntries, setSidebarEntries] = useState([]);
  const [sidebarSelectedProject, setSidebarSelectedProject] = useState(null);
  const [sidebarSelectedTask, setSidebarSelectedTask] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});

  const getDayEntries = (day) => {
    if (!day) return [];
    const dateStr = getDateStr(year, month, day);
    const entries = [];
    projects.forEach(p => {
      let allTasks = getTasks(p.id, dateStr);
      if (!allTasks?.length) return;
      if (currentUser?.role === 'employee') allTasks = allTasks.filter(t => t.employeeIds?.includes(currentUser.id));
      if (!allTasks.length) return;
      if (serviceIds?.length) { allTasks = allTasks.filter(t => serviceIds.some(id => (t.serviceIds || []).includes(id))); if (!allTasks.length) return; }
      allTasks.forEach(task => entries.push({ project: p, task }));
    });
    if (clientTasks) {
      let fct = clientTasks.filter(ct => ct.assignedEmployeeId && ct.assignedDate === dateStr);
      if (currentUser?.role === 'employee') fct = fct.filter(ct => ct.assignedEmployeeId === currentUser.id);
      if (serviceIds?.length) fct = fct.filter(ct => serviceIds.includes(ct.serviceId));
      fct.forEach(ct => entries.push({ project: projects.find(p => p.id === ct.projectId) || { name: 'Client Request' }, task: ct, isClientTask: true }));
    }
    return entries;
  };

  const handleOpenSidebar = (day, entries) => {
    const dateStr = getDateStr(year, month, day);
    setSidebarDate(dateStr);
    setSidebarEntries(entries);
    const firstKey = entries[0]?.project?.id || entries[0]?.project?.name;
    setSidebarSelectedProject(firstKey);
    setSidebarSelectedTask(entries[0]?.task || null);
    setExpandedProjects({});
  };

  const sidebarProjects = sidebarEntries.reduce((acc, entry) => {
    const key = entry.project.id || entry.project.name;
    if (!acc[key]) acc[key] = { project: entry.project, tasks: [] };
    acc[key].tasks.push({ task: entry.task, isClientTask: entry.isClientTask });
    return acc;
  }, {});

  const parsedSidebarDate = sidebarDate
    ? (() => { const [yr2,mo2,dy2] = sidebarDate.split('-'); return `${Number(dy2)} ${MONTHS[Number(mo2)-1]} ${yr2}`; })()
    : '';

  return (
    <div className="calendar-wrapper">
      <div className="calendar-title-bar">
        <h2 className="calendar-title master-view-title">
          <span className="master-badge">★ Master View</span> — {MONTHS[month]} {year}
        </h2>
        <div className="status-legend">
          <span className="legend-item"><span className="legend-dot gray" />In Progress</span>
          <span className="legend-item"><span className="legend-dot yellow" />Ready</span>
          <span className="legend-item"><span className="legend-dot green" />Completed</span>
          <span className="legend-item"><span className="legend-dot red" />Not Done</span>
        </div>
      </div>
      <div className="calendar-overflow-container">
        <div className="calendar-grid">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} className="cal-day-name">{d}</div>)}
          {cells.map((day, idx) => {
            const entries = getDayEntries(day);
            const visible = entries.slice(0, 2);
            const overflow = entries.length - 2;
            const single = entries.length === 1 ? entries[0].task.status : null;
            return (
              <div key={idx} className={`cal-cell ${!day ? 'cal-cell-empty' : 'cal-cell-active'} ${isToday(day) ? 'cal-today' : ''} ${entries.length >= 2 ? 'multi-task-cell' : ''} ${single ? `status-${single}` : ''}`} onClick={() => day && handleOpenSidebar(day, entries)}>
                {day && (<>
                  <span className="day-num">{day}</span>
                  <div className="master-entries-container">
                    {visible.map(({ project, task, isClientTask }, i) => (
                      <div key={`${project.id}-${task.id || i}`} className="day-task-entry" title={project.name}>
                        <span className={`day-status-dot status-dot-${task.status} inline-status-dot`} />
                        <span className="day-task-title">{isClientTask ? '📩 ' : ''}{project.name}</span>
                      </div>
                    ))}
                    {overflow > 0 && <div className="master-overflow-badge" onClick={e => { e.stopPropagation(); handleOpenSidebar(day, entries); }} title={`${overflow} more`}>+{overflow} more</div>}
                  </div>
                </>)}
              </div>
            );
          })}
        </div>
      </div>

      {sidebarDate && (
        <div className="popup-overlay" onClick={() => setSidebarDate(null)}>
          <div className="master-sidebar" onClick={e => e.stopPropagation()}>
            <div className="master-sidebar-header">
              <div>
                <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>★ Master View</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>{parsedSidebarDate}</div>
              </div>
              <button className="popup-close" onClick={() => setSidebarDate(null)}>✕</button>
            </div>
            <div className="master-sidebar-body">
              <div className="master-sidebar-projects">
                {Object.entries(sidebarProjects).map(([key, { project, tasks }]) => (
                  <div key={key}>
                    <div className={`master-sidebar-project-item ${sidebarSelectedProject === key ? 'active' : ''}`} onClick={() => { setSidebarSelectedProject(key); if (tasks.length === 1) setSidebarSelectedTask(tasks[0].task); else setSidebarSelectedTask(null); setExpandedProjects(prev => ({ ...prev, [key]: !prev[key] })); }}>
                      <span className="sidebar-project-name">{project.name}</span>
                      <span className="sidebar-task-count">{tasks.length}</span>
                      {tasks.length > 1 && <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.7rem' }}>{expandedProjects[key] ? '▲' : '▼'}</span>}
                    </div>
                    {tasks.length > 1 && expandedProjects[key] && (
                      <div className="master-sidebar-task-list">
                        {tasks.map(({ task, isClientTask }, ti) => {
                          const m = STATUS_META[task.status] || STATUS_META.gray;
                          return (
                            <div key={task.id || ti} className={`master-sidebar-task-item ${sidebarSelectedTask?.id === task.id ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => { setSidebarSelectedProject(key); setSidebarSelectedTask(task); }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, display: 'inline-block', flexShrink: 0 }} />
                              <span>{isClientTask ? '📩 ' : ''}{task.title || '(Untitled)'}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="master-sidebar-detail">
                {sidebarSelectedTask ? (() => {
                  const m = STATUS_META[sidebarSelectedTask.status] || STATUS_META.gray;
                  const d = sidebarSelectedTask;
                  const empNames = (d.employeeIds || []).map(id => employees.find(e => e.id === id)?.name).filter(Boolean);
                  const svcNames = (d.serviceIds || []).map(id => services.find(s => s.id === id)?.name).filter(Boolean);
                  const allEmp = d.assignedEmployeeId ? [employees.find(e => e.id === d.assignedEmployeeId)?.name].filter(Boolean) : empNames;
                  const allSvc = d.serviceId ? [services.find(s => s.id === d.serviceId)?.name].filter(Boolean) : svcNames;
                  return (<>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', lineHeight: 1.3, flex: 1 }}>{d.title || '(Untitled)'}</div>
                      <div style={{ flexShrink: 0, marginTop: '2px' }}><span style={{ background: m.color + '22', color: m.color, border: `1.5px solid ${m.color}55`, borderRadius: 99, padding: '0.2rem 0.75rem', fontSize: '0.72rem', fontWeight: 700 }}>{m.label}</span></div>
                    </div>
                    {d.description && (<div style={{ marginBottom: '1.25rem' }}><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Description</div><p style={{ color: 'var(--text)', fontSize: '0.88rem', lineHeight: 1.65, margin: 0, padding: '0.75rem', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>{d.description}</p></div>)}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ gridColumn: allEmp.length > 2 ? '1 / -1' : 'auto' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>👤 Assigned To</div>
                        {allEmp.length > 0 ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>{allEmp.map((name, i) => <span key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{name}</span>)}</div> : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>Unassigned</span>}
                      </div>
                      <div style={{ gridColumn: allSvc.length > 2 ? '1 / -1' : 'auto' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>📋 Services</div>
                        {allSvc.length > 0 ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>{allSvc.map((name, i) => <span key={i} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>{name}</span>)}</div> : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>No service</span>}
                      </div>
                      {(d.requiredBy || d.assignedDate) && (
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                          {d.assignedDate && <div><div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>🗓 Assigned For</div><div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>{new Date(d.assignedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>}
                          {d.requiredBy && <div><div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>📅 Required By</div><div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>{new Date(d.requiredBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>}
                          {d.createdAt && <div><div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>📌 Submitted On</div><div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>{new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>}
                        </div>
                      )}
                    </div>
                  </>);
                })() : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.88rem', flexDirection: 'column', gap: '0.75rem' }}>
                    <span style={{ fontSize: '2.5rem', opacity: 0.4 }}>📋</span>
                    <span>Select a project or task from the left panel to view details</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
