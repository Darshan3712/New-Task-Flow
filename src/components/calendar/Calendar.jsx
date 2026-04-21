import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import TaskPopup from '../task/TaskPopup';
import MasterCalendar from './MasterCalendar';
import { getDay, getDaysInMonth } from 'date-fns';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function getOverallStatus(tasks) {
  if (!tasks?.length) return null;
  if (tasks.some(t => t.status === 'red')) return 'red';
  if (tasks.some(t => t.status === 'yellow')) return 'yellow';
  if (tasks.some(t => t.status === 'gray')) return 'gray';
  return 'green';
}

export default function Calendar({ projectId, month, year, serviceIds = [], isMasterView = false }) {
  const { projects, getTasks, clientTasks } = useData();
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeClientTaskId, setActiveClientTaskId] = useState(null);

  const cells = buildCells(year, month);
  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  if (isMasterView) {
    return <MasterCalendar month={month} year={year} serviceIds={serviceIds} cells={cells} isToday={isToday} />;
  }

  const project = projects.find((p) => p.id === projectId);

  const getDayTasks = (day) => {
    if (!day) return [];
    let all = getTasks(projectId, getDateStr(year, month, day));
    if (currentUser?.role === 'employee') all = all.filter(t => t.employeeIds?.includes(currentUser.id));
    if (serviceIds?.length) all = all.filter(t => serviceIds.some(id => (t.serviceIds || []).includes(id)));
    return all;
  };

  const getClientTasksForDay = (day) => {
    if (!day) return [];
    const dateStr = getDateStr(year, month, day);
    return (clientTasks || []).filter(ct => {
      if (!ct.assignedEmployeeId) return false;
      if (ct.assignedDate !== dateStr) return false;
      if (ct.projectId !== projectId) return false;
      if (currentUser?.role === 'employee' && ct.assignedEmployeeId !== currentUser.id) return false;
      if (serviceIds?.length && !serviceIds.includes(ct.serviceId)) return false;
      return true;
    });
  };

  return (
    <div className="calendar-wrapper">
      <div className="calendar-title-bar">
        <h2 className="calendar-title">{project?.name} — {MONTHS[month]} {year}</h2>
        <div className="status-legend">
          <span className="legend-item"><span className="legend-dot gray" />In Progress</span>
          <span className="legend-item"><span className="legend-dot yellow" />Ready</span>
          <span className="legend-item"><span className="legend-dot green" />Completed</span>
          <span className="legend-item"><span className="legend-dot red" />Not Done</span>
        </div>
      </div>

      <div className="calendar-overflow-container">
        <div className="calendar-grid">
          {DAY_NAMES.map((d) => <div key={d} className="cal-day-name">{d}</div>)}
          {cells.map((day, idx) => {
            const dayTasks = getDayTasks(day);
            const dayClientTasks = getClientTasksForDay(day);
            const totalItems = dayTasks.length + dayClientTasks.length;
            const isMultiTask = totalItems >= 2;
            const overallStatus = getOverallStatus(dayTasks);
            return (
              <div key={idx} className={`cal-cell ${!day ? 'cal-cell-empty' : 'cal-cell-active'} ${isToday(day) ? 'cal-today' : ''} ${isMultiTask ? 'multi-task-cell' : ''} ${(!isMultiTask && overallStatus) ? `status-${overallStatus}` : ''}`} onClick={() => day && setSelectedDate(getDateStr(year, month, day))}>
                {day && (<>
                  <span className="day-num">{day}</span>
                  <div className="day-tasks-container">
                    {dayTasks.map((t, tidx) => (
                      <div key={t.id || tidx} className="day-task-entry" onClick={(e) => { e.stopPropagation(); setSelectedDate(getDateStr(year, month, day)); setActiveTaskId(t.id); setActiveClientTaskId(null); }}>
                        <span className={`day-status-dot status-dot-${t.status} inline-status-dot`} />
                        <span className="day-task-title" title={t.title}>{t.title}</span>
                      </div>
                    ))}
                    {dayClientTasks.map((ct) => (
                      <div key={`ct-${ct.id}`} className="day-task-entry day-client-task-entry" title={`📩 Client: ${ct.title}`} onClick={(e) => { e.stopPropagation(); setSelectedDate(getDateStr(year, month, day)); setActiveClientTaskId(ct.id); setActiveTaskId(null); }}>
                        <span className={`day-status-dot status-dot-${ct.status} inline-status-dot`} />
                        <span className="day-task-title">📩 {ct.title}</span>
                      </div>
                    ))}
                  </div>
                </>)}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <TaskPopup projectId={projectId} dateStr={selectedDate} headerServiceIds={serviceIds} activeTaskId={activeTaskId} activeClientTaskId={activeClientTaskId} onClose={() => { setSelectedDate(null); setActiveTaskId(null); setActiveClientTaskId(null); }} />
      )}
    </div>
  );
}
