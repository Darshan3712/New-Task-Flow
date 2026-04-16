import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import TaskPopup from './TaskPopup';
import { getDay, getDaysInMonth } from 'date-fns';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const STATUS_COLORS = {
  gray: '#6B7280',
  yellow: '#F59E0B',
  green: '#10B981',
  red: '#EF4444',
};

function buildCells(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (getDay(firstDay) + 6) % 7;
  const daysInMonth = getDaysInMonth(firstDay);
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getDateStr(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getOverallStatus(tasks) {
  if (!tasks || tasks.length === 0) return null;
  if (tasks.some(t => t.status === 'red')) return 'red';
  if (tasks.some(t => t.status === 'yellow')) return 'yellow';
  if (tasks.some(t => t.status === 'gray')) return 'gray';
  return 'green';
}


// ─── MASTER VIEW CALENDAR ─────────────────────────────────────────────────────

function MasterCalendar({ month, year, serviceIds = [] }) {
  const { projects, getTasks, clientTasks, employees, services } = useData();
  const { currentUser } = useAuth();
  // Email-style sidebar state
  const [sidebarDate, setSidebarDate] = useState(null);
  const [sidebarEntries, setSidebarEntries] = useState([]);
  const [sidebarSelectedProject, setSidebarSelectedProject] = useState(null);
  const [sidebarSelectedTask, setSidebarSelectedTask] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});

  const cells = buildCells(year, month);
  const today = new Date();

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  // For each day, gather flat list of { project, task } pairs
  const getDayEntries = (day) => {
    if (!day) return [];
    const dateStr = getDateStr(year, month, day);
    const entries = [];

    projects.forEach(p => {
      let allTasks = getTasks(p.id, dateStr);
      if (!allTasks || allTasks.length === 0) return;

      // Employee filter check
      if (currentUser?.role === 'employee') {
        allTasks = allTasks.filter(t => t.employeeIds && t.employeeIds.includes(currentUser.id));
      }
      if (allTasks.length === 0) return;

      // Service filter
      if (serviceIds && serviceIds.length > 0) {
        allTasks = allTasks.filter(t => {
          const tServices = t.serviceIds || [];
          return serviceIds.some(id => tServices.includes(id));
        });
        if (allTasks.length === 0) return;
      }

      // Push each task individually (project name repeated per task)
      allTasks.forEach(task => {
        entries.push({ project: p, task });
      });
    });

    // Add client tasks
    if (clientTasks) {
      let filteredClientTasks = clientTasks.filter(ct => {
        if (!ct.assignedEmployeeId) return false; // Ignore unassigned client tasks in calendar grid
        // Strictly place the task in the cell the Admin assigned it to:
        const effectiveDate = ct.assignedDate;
        return effectiveDate === dateStr;
      });

      if (currentUser?.role === 'employee') {
        filteredClientTasks = filteredClientTasks.filter(ct => ct.assignedEmployeeId === currentUser.id);
      }

      if (serviceIds && serviceIds.length > 0) {
        filteredClientTasks = filteredClientTasks.filter(ct => serviceIds.includes(ct.serviceId));
      }

      filteredClientTasks.forEach(ct => {
        const project = projects.find(p => p.id === ct.projectId) || { name: 'Client Request' };
        entries.push({ project, task: ct, isClientTask: true });
      });
    }

    return entries;
  };

  const openSidebar = (day, entries) => {
    const dateStr = getDateStr(year, month, day);
    setSidebarDate(dateStr);
    setSidebarEntries(entries);
    // group by project
    const firstProject = entries[0]?.project?.id || entries[0]?.project?.name;
    setSidebarSelectedProject(firstProject);
    setSidebarSelectedTask(entries[0]?.task || null);
    setExpandedProjects({});
  };

  // Group sidebar entries by project
  const sidebarProjects = sidebarEntries.reduce((acc, entry) => {
    const key = entry.project.id || entry.project.name;
    if (!acc[key]) acc[key] = { project: entry.project, tasks: [] };
    acc[key].tasks.push({ task: entry.task, isClientTask: entry.isClientTask });
    return acc;
  }, {});

  const [displayDate_s, displayDate_m, displayDate_y] = sidebarDate ? sidebarDate.split('-') : [];
  const sidebarDisplayDate = sidebarDate
    ? `${Number(displayDate_s.split('-')[2] || displayDate_s)} ${MONTHS[month]} ${year}`
    : '';
  // Parse nicely
  const parsedSidebarDate = sidebarDate
    ? (() => { const [yr2, mo2, dy2] = sidebarDate.split('-'); return `${Number(dy2)} ${MONTHS[Number(mo2)-1]} ${yr2}`; })()
    : '';

  const STATUS_META = {
    gray:   { label: 'Pending',     color: '#6b7280' },
    yellow: { label: 'In Progress', color: '#f59e0b' },
    green:  { label: 'Completed',   color: '#10b981' },
    red:    { label: 'Not Done',    color: '#ef4444' },
  };

  return (
    <div className="calendar-wrapper">
      <div className="calendar-title-bar">
        <h2 className="calendar-title master-view-title">
          <span className="master-badge">★ Master View</span> — {MONTHS[month]} {year}
        </h2>
        <div className="status-legend">
          <span className="legend-item"><span className="legend-dot gray"></span> In Progress</span>
          <span className="legend-item"><span className="legend-dot yellow"></span> Ready</span>
          <span className="legend-item"><span className="legend-dot green"></span> Completed</span>
          <span className="legend-item"><span className="legend-dot red"></span> Not Done</span>
        </div>
      </div>

      <div className="calendar-overflow-container">
        <div className="calendar-grid">
          {DAY_NAMES.map((d) => (
            <div key={d} className="cal-day-name">{d}</div>
          ))}
          {cells.map((day, idx) => {
            const entries = getDayEntries(day);
            const PILL_LIMIT = 2;
            const visibleEntries = entries.slice(0, PILL_LIMIT);
            const overflowCount = entries.length - PILL_LIMIT;
            const isMulti = entries.length >= 2;
            const singleStatus = !isMulti && entries.length === 1 ? entries[0].task.status : null;

            return (
              <div
                key={idx}
                className={`cal-cell ${!day ? 'cal-cell-empty' : 'cal-cell-active'} ${isToday(day) ? 'cal-today' : ''} ${isMulti ? 'multi-task-cell' : ''} ${singleStatus ? `status-${singleStatus}` : ''}`}
                onClick={() => day && openSidebar(day, entries)}
              >
                {day && (
                  <>
                    <span className="day-num">{day}</span>
                    <div className="master-entries-container">
                      {visibleEntries.map(({ project, task, isClientTask }, i) => (
                        <div
                          key={`${project.id}-${task.id || i}`}
                          className="day-task-entry"
                          title={project.name}
                        >
                          <span className={`day-status-dot status-dot-${task.status} inline-status-dot`} />
                          <span className="day-task-title">{isClientTask ? '📩 ' : ''}{project.name}</span>
                        </div>
                      ))}
                      {overflowCount > 0 && (
                        <div
                          className="master-overflow-badge"
                          onClick={e => { e.stopPropagation(); openSidebar(day, entries); }}
                          title={`${overflowCount} more entries`}
                        >
                          +{overflowCount} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Email-style Sidebar ─────────────────────────────── */}
      {sidebarDate && (
        <div className="popup-overlay" onClick={() => setSidebarDate(null)}>
          <div className="master-sidebar" onClick={e => e.stopPropagation()}>
            {/* Sidebar Header */}
            <div className="master-sidebar-header">
              <div>
                <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>★ Master View</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>{parsedSidebarDate}</div>
              </div>
              <button className="popup-close" onClick={() => setSidebarDate(null)}>✕</button>
            </div>

            <div className="master-sidebar-body">
              {/* Left panel: project list */}
              <div className="master-sidebar-projects">
                {Object.entries(sidebarProjects).map(([key, { project, tasks }]) => (
                  <div key={key}>
                    <div
                      className={`master-sidebar-project-item ${sidebarSelectedProject === key ? 'active' : ''}`}
                      onClick={() => {
                        setSidebarSelectedProject(key);
                        if (tasks.length === 1) setSidebarSelectedTask(tasks[0].task);
                        else setSidebarSelectedTask(null);
                        setExpandedProjects(prev => ({ ...prev, [key]: !prev[key] }));
                      }}
                    >
                      <span className="sidebar-project-name">{project.name}</span>
                      <span className="sidebar-task-count">{tasks.length}</span>
                      {tasks.length > 1 && <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.7rem' }}>{expandedProjects[key] ? '▲' : '▼'}</span>}
                    </div>
                    {/* Task dropdown for project with multiple tasks */}
                    {tasks.length > 1 && expandedProjects[key] && (
                      <div className="master-sidebar-task-list">
                        {tasks.map(({ task, isClientTask }, ti) => {
                          const m = STATUS_META[task.status] || STATUS_META.gray;
                          return (
                            <div
                              key={task.id || ti}
                              className={`master-sidebar-task-item ${sidebarSelectedTask?.id === task.id ? 'active' : ''}`}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-start' }}
                              onClick={() => { setSidebarSelectedProject(key); setSidebarSelectedTask(task); }}
                            >
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

              {/* Right panel: task detail */}
              <div className="master-sidebar-detail">
                {sidebarSelectedTask ? (() => {
                  const m = STATUS_META[sidebarSelectedTask.status] || STATUS_META.gray;
                  const detail = sidebarSelectedTask;

                  // Resolve actual employee/service names
                  const assignedEmployeeNames = (detail.employeeIds || [])
                    .map(id => employees.find(e => e.id === id)?.name)
                    .filter(Boolean);
                  const assignedServiceNames = (detail.serviceIds || [])
                    .map(id => services.find(s => s.id === id)?.name)
                    .filter(Boolean);
                  // For client tasks, single employee
                  const clientEmpName = detail.assignedEmployeeId
                    ? employees.find(e => e.id === detail.assignedEmployeeId)?.name
                    : null;
                  const clientSvcName = detail.serviceId
                    ? services.find(s => s.id === detail.serviceId)?.name
                    : null;

                  const allEmpNames = clientEmpName ? [clientEmpName] : assignedEmployeeNames;
                  const allSvcNames = clientSvcName ? [clientSvcName] : assignedServiceNames;

                  return (
                    <>
                      {/* Title + Status */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', lineHeight: 1.3, flex: 1 }}>
                          {detail.title || '(Untitled)'}
                        </div>
                        <div style={{ flexShrink: 0, marginTop: '2px' }}>
                          <span style={{ background: m.color + '22', color: m.color, border: `1.5px solid ${m.color}55`, borderRadius: 99, padding: '0.2rem 0.75rem', fontSize: '0.72rem', fontWeight: 700 }}>
                            {m.label}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {detail.description && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Description</div>
                          <p style={{ color: 'var(--text)', fontSize: '0.88rem', lineHeight: 1.65, margin: 0, padding: '0.75rem', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                            {detail.description}
                          </p>
                        </div>
                      )}

                      {/* Info Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {/* Employees */}
                        <div style={{ gridColumn: allEmpNames.length > 2 ? '1 / -1' : 'auto' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>👤 Assigned To</div>
                          {allEmpNames.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                              {allEmpNames.map((name, i) => (
                                <span key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>Unassigned</span>
                          )}
                        </div>

                        {/* Services */}
                        <div style={{ gridColumn: allSvcNames.length > 2 ? '1 / -1' : 'auto' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>📋 Services</div>
                          {allSvcNames.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                              {allSvcNames.map((name, i) => (
                                <span key={i} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>No service</span>
                          )}
                        </div>

                        {/* Required By */}
                        {(detail.requiredBy || detail.assignedDate) && (
                          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                            {detail.assignedDate && (
                              <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>🗓 Assigned For</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                                  {new Date(detail.assignedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                              </div>
                            )}
                            {detail.requiredBy && (
                              <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>📅 Required By</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                                  {new Date(detail.requiredBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                              </div>
                            )}
                            {(detail.createdAt) && (
                              <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>📌 Submitted On</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                                  {new Date(detail.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  );
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



// ─── REGULAR SINGLE-PROJECT CALENDAR ──────────────────────────────────────────

export default function Calendar({ projectId, month, year, serviceIds = [], isMasterView = false }) {
  const { projects, getTasks, clientTasks } = useData();
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeClientTaskId, setActiveClientTaskId] = useState(null);

  // Render Master View if requested
  if (isMasterView) {
    return <MasterCalendar month={month} year={year} serviceIds={serviceIds} />;
  }

  const project = projects.find((p) => p.id === projectId);
  const cells = buildCells(year, month);
  const today = new Date();

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const getDayTasks = (day) => {
    if (!day) return [];
    let allTasks = getTasks(projectId, getDateStr(year, month, day));

    // For employees: only show tasks they are assigned to
    if (currentUser?.role === 'employee') {
      allTasks = allTasks.filter(t => t.employeeIds && t.employeeIds.includes(currentUser.id));
    }

    if (serviceIds && serviceIds.length > 0) {
      return allTasks.filter(t => {
        const tServices = t.serviceIds || [];
        return serviceIds.some(id => tServices.includes(id));
      });
    }
    return allTasks;
  };

  // Client tasks that should appear on a specific calendar day
  const getClientTasksForDay = (day) => {
    if (!day) return [];
    const dateStr = getDateStr(year, month, day);
    return (clientTasks || []).filter(ct => {
      if (!ct.assignedEmployeeId) return false;
      // Resolve which date this task should appear on
      // — use assignedDate if set, otherwise fall back to requiredBy
      const effectiveDate = ct.assignedDate;
      if (!effectiveDate || effectiveDate !== dateStr) return false;

      // Enforce project filter for ALL roles
      if (ct.projectId !== projectId) return false;

      // For employees: only show their own assignments
      if (currentUser?.role === 'employee') {
        if (ct.assignedEmployeeId !== currentUser.id) return false;
      }
      
      // Enforce service filter if any services are selected
      if (serviceIds && serviceIds.length > 0) {
        if (!serviceIds.includes(ct.serviceId)) return false;
      }
      
      return true;
    });
  };

  return (
    <div className="calendar-wrapper">
      <div className="calendar-title-bar">
        <h2 className="calendar-title">
          {project?.name} — {MONTHS[month]} {year}
        </h2>
        <div className="status-legend">
          <span className="legend-item"><span className="legend-dot gray"></span> In Progress</span>
          <span className="legend-item"><span className="legend-dot yellow"></span> Ready</span>
          <span className="legend-item"><span className="legend-dot green"></span> Completed</span>
          <span className="legend-item"><span className="legend-dot red"></span> Not Done</span>
        </div>
      </div>

      <div className="calendar-overflow-container">
        <div className="calendar-grid">
          {DAY_NAMES.map((d) => (
            <div key={d} className="cal-day-name">{d}</div>
          ))}
          {cells.map((day, idx) => {
            const dayTasks       = getDayTasks(day);
            const dayClientTasks = getClientTasksForDay(day);
            const totalItems     = dayTasks.length + dayClientTasks.length;
            const isMultiTask    = totalItems >= 2;
            const overallStatus  = getOverallStatus(dayTasks);

            return (
              <div
                key={idx}
                className={`cal-cell ${!day ? 'cal-cell-empty' : 'cal-cell-active'} ${isToday(day) ? 'cal-today' : ''} ${isMultiTask ? 'multi-task-cell' : ''} ${(!isMultiTask && overallStatus) ? `status-${overallStatus}` : ''}`}
                onClick={() => day && setSelectedDate(getDateStr(year, month, day))}
              >
                {day && (
                  <>
                    <span className="day-num">{day}</span>
                    <div className="day-tasks-container">
                      {dayTasks.map((t, tidx) => (
                        <div
                          key={t.id || tidx}
                          className="day-task-entry"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(getDateStr(year, month, day));
                            setActiveTaskId(t.id);
                            setActiveClientTaskId(null);
                          }}
                        >
                          <span className={`day-status-dot status-dot-${t.status} inline-status-dot`}></span>
                          <span className="day-task-title" title={t.title}>{t.title}</span>
                        </div>
                      ))}
                      {dayClientTasks.map((ct) => (
                        <div
                          key={`ct-${ct.id}`}
                          className="day-task-entry day-client-task-entry"
                          title={`📩 Client: ${ct.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(getDateStr(year, month, day));
                            setActiveClientTaskId(ct.id);
                            setActiveTaskId(null);
                          }}
                        >
                          <span className={`day-status-dot status-dot-${ct.status} inline-status-dot`}></span>
                          <span className="day-task-title">📩 {ct.title}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <TaskPopup
          projectId={projectId}
          dateStr={selectedDate}
          headerServiceIds={serviceIds}
          activeTaskId={activeTaskId}
          activeClientTaskId={activeClientTaskId}
          onClose={() => {
            setSelectedDate(null);
            setActiveTaskId(null);
            setActiveClientTaskId(null);
          }}
        />
      )}
    </div>
  );
}
