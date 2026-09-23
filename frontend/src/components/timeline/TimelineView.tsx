import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import type { Task, Priority } from '../../types';
import { Avatar } from '../ui/Avatar';

interface TimelineViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

type ViewScale = 'day' | 'week' | 'month';
type GroupBy = 'none' | 'status' | 'priority';

export const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewScale, setViewScale] = useState<ViewScale>('day');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  // Generate date range based on viewScale and currentDate
  const { dateRange, startPeriodDate, endPeriodDate } = useMemo(() => {
    const range: Date[] = [];
    const base = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    let daysBefore = 7;
    let daysAfter = 21;

    if (viewScale === 'day') {
      daysBefore = 7;
      daysAfter = 21;
    } else if (viewScale === 'week') {
      daysBefore = 14;
      daysAfter = 42;
    } else if (viewScale === 'month') {
      daysBefore = 30;
      daysAfter = 90;
    }

    const startDate = new Date(base);
    startDate.setDate(base.getDate() - daysBefore);

    const total = daysBefore + daysAfter;
    for (let i = 0; i <= total; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      range.push(d);
    }

    const end = range[range.length - 1];
    return {
      dateRange: range,
      startPeriodDate: range[0],
      endPeriodDate: end,
    };
  }, [currentDate, viewScale]);

  // Scroll to "Today" on initial mount or period change
  useEffect(() => {
    if (!timelineScrollRef.current) return;
    const todayIndex = dateRange.findIndex(
      (d) => d.toDateString() === new Date().toDateString()
    );
    if (todayIndex !== -1) {
      const colWidth = viewScale === 'day' ? 44 : viewScale === 'week' ? 36 : 28;
      timelineScrollRef.current.scrollLeft = Math.max(0, todayIndex * colWidth - 200);
    }
  }, [dateRange, viewScale]);

  // Navigate functions
  const handlePrev = () => {
    const next = new Date(currentDate);
    const step = viewScale === 'day' ? 7 : viewScale === 'week' ? 21 : 30;
    next.setDate(next.getDate() - step);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    const step = viewScale === 'day' ? 7 : viewScale === 'week' ? 21 : 30;
    next.setDate(next.getDate() + step);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Grouped tasks
  const { tasksWithoutDates, groupedTasks } = useMemo(() => {
    const withDates: Task[] = [];
    const withoutDates: Task[] = [];

    tasks.forEach((t) => {
      if (t.start_date || t.due_date) {
        withDates.push(t);
      } else {
        withoutDates.push(t);
      }
    });

    // Sort by start_date or due_date or created_at
    withDates.sort((a, b) => {
      const dateA = new Date(a.start_date || a.due_date || a.created_at).getTime();
      const dateB = new Date(b.start_date || b.due_date || b.created_at).getTime();
      return dateA - dateB;
    });

    const groups: Record<string, Task[]> = {};
    if (groupBy === 'status') {
      withDates.forEach((task) => {
        const key = task.status?.name || 'Unassigned';
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
      });
    } else if (groupBy === 'priority') {
      const order: Priority[] = ['urgent', 'high', 'medium', 'low'];
      order.forEach((p) => { groups[p] = []; });
      withDates.forEach((task) => {
        const key = task.priority || 'medium';
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
      });
    } else {
      groups['All Tasks'] = withDates;
    }

    return { tasksWithoutDates: withoutDates, groupedTasks: groups };
  }, [tasks, groupBy]);

  // Helper to calculate task position on the grid
  const getTaskGridStyle = (task: Task) => {
    const taskStart = new Date(task.start_date || task.created_at);
    taskStart.setHours(0, 0, 0, 0);

    const taskEnd = task.due_date
      ? new Date(task.due_date)
      : new Date(taskStart.getTime() + 86400000); // 1 day fallback
    taskEnd.setHours(23, 59, 59, 999);

    const startTime = startPeriodDate.getTime();
    const endTime = endPeriodDate.getTime();
    const totalDuration = endTime - startTime;

    const startOffset = Math.max(0, taskStart.getTime() - startTime);
    const endOffset = Math.min(totalDuration, taskEnd.getTime() - startTime);

    const leftPercent = Math.max(0, Math.min(100, (startOffset / totalDuration) * 100));
    const widthPercent = Math.max(1.5, Math.min(100 - leftPercent, ((endOffset - startOffset) / totalDuration) * 100));

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    };
  };

  const getPriorityBarColor = (priority: Priority, isDone: boolean) => {
    if (isDone) return 'bg-emerald-500 hover:bg-emerald-600 text-white';
    switch (priority) {
      case 'urgent':
        return 'bg-rose-500 hover:bg-rose-600 text-white';
      case 'high':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      case 'medium':
        return 'bg-primary hover:bg-primary-hover text-white';
      case 'low':
      default:
        return 'bg-slate-500 hover:bg-slate-600 text-white';
    }
  };

  const todayStr = new Date().toDateString();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-background border border-border rounded-xl p-0.5 shadow-xs">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
              title="Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-text hover:text-primary transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
              title="Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs font-bold text-text ml-1 sm:ml-2">
            {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Group By Filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <ListFilter className="w-3.5 h-3.5" />
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="text-xs bg-background border border-border rounded-xl px-2.5 py-1.5 text-text focus:outline-none"
            >
              <option value="none">Tanpa Grup</option>
              <option value="status">Grup berdasarkan Status</option>
              <option value="priority">Grup berdasarkan Prioritas</option>
            </select>
          </div>

          {/* Scale Buttons */}
          <div className="flex items-center bg-background border border-border rounded-xl p-0.5">
            {(['day', 'week', 'month'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setViewScale(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  viewScale === s
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted hover:text-text'
                }`}
              >
                {s === 'day' ? 'Hari' : s === 'week' ? 'Minggu' : 'Bulan'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Timeline Body */}
      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <CalendarIcon className="w-12 h-12 text-muted/40 mb-3" />
          <h3 className="text-sm font-bold text-text mb-1">Belum ada task pada timeline</h3>
          <p className="text-xs text-muted max-w-sm">
            Buat task baru dengan tanggal mulai atau deadline untuk melihat visualisasi linimasa pengerjaan.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Column: Fixed Task List */}
          <div className="w-64 sm:w-72 shrink-0 border-r border-border bg-surface flex flex-col overflow-hidden">
            <div className="h-12 border-b border-border px-4 flex items-center font-bold text-xs uppercase tracking-wider text-muted shrink-0">
              <span>Daftar Tugas ({tasks.length})</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                <div key={groupName}>
                  {groupBy !== 'none' && (
                    <div className="px-3.5 py-2 bg-background/80 font-bold text-[11px] text-muted uppercase tracking-wider border-b border-border/50 sticky top-0 z-10 backdrop-blur-xs flex items-center justify-between">
                      <span className="capitalize">{groupName}</span>
                      <span className="text-[10px] font-normal bg-surface px-1.5 py-0.2 rounded-full border border-border">
                        {groupTasks.length}
                      </span>
                    </div>
                  )}

                  {groupTasks.map((task) => {
                    const isDone = ['done', 'completed'].includes(task.status?.name.toLowerCase() || '');
                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="h-14 px-3.5 flex items-center justify-between gap-2 hover:bg-background/80 cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 truncate">
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  task.priority === 'urgent'
                                    ? 'bg-rose-500'
                                    : task.priority === 'high'
                                    ? 'bg-amber-500'
                                    : task.priority === 'medium'
                                    ? 'bg-blue-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                            )}
                            <span className="text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted">
                            {task.due_date ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(task.due_date).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            ) : (
                              <span className="italic">Tanpa deadline</span>
                            )}
                          </div>
                        </div>

                        {/* Assignees avatars */}
                        {task.assignees && task.assignees.length > 0 && (
                          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                            {task.assignees.slice(0, 2).map((a) => (
                              <Avatar key={a.id} name={a.name} src={a.avatar} size="xs" className="ring-1 ring-surface" />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Tasks without dates note */}
              {tasksWithoutDates.length > 0 && (
                <div className="p-3 bg-background/50 border-t border-dashed border-border text-[11px] text-muted space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-text">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>{tasksWithoutDates.length} Tugas Belum Diatur Tanggal</span>
                  </div>
                  <div className="space-y-1">
                    {tasksWithoutDates.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onTaskClick(t)}
                        className="truncate text-xs hover:text-primary cursor-pointer transition-colors"
                      >
                        • {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Horizontal Scrollable Timeline Area */}
          <div ref={timelineScrollRef} className="flex-1 overflow-x-auto overflow-y-auto relative bg-background/50">
            <div className="min-w-max flex flex-col">
              {/* Date Header Row */}
              <div className="h-12 border-b border-border bg-surface/90 backdrop-blur-xs flex sticky top-0 z-20">
                {dateRange.map((d, index) => {
                  const isToday = d.toDateString() === todayStr;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const dayNum = d.getDate();
                  const dayName = d.toLocaleDateString(undefined, { weekday: 'narrow' });

                  return (
                    <div
                      key={index}
                      className={`w-11 shrink-0 border-r border-border/50 flex flex-col items-center justify-center text-center transition-colors ${
                        isToday
                          ? 'bg-primary/10 text-primary font-bold'
                          : isWeekend
                          ? 'bg-background/40 text-muted'
                          : 'text-text'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-semibold opacity-70">{dayName}</span>
                      <span
                        className={`text-xs ${
                          isToday
                            ? 'w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px]'
                            : 'font-medium'
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Rows matching tasks */}
              <div className="relative">
                {/* Vertical Grid Columns */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {dateRange.map((d, index) => {
                    const isToday = d.toDateString() === todayStr;
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <div
                        key={index}
                        className={`w-11 shrink-0 border-r border-border/30 h-full relative ${
                          isToday ? 'bg-primary/5' : isWeekend ? 'bg-muted/5' : ''
                        }`}
                      >
                        {isToday && (
                          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-primary/60 z-10" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Timeline task bars */}
                <div className="divide-y divide-border/60 relative z-10">
                  {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                    <div key={groupName}>
                      {groupBy !== 'none' && (
                        <div className="h-8 bg-transparent" />
                      )}

                      {groupTasks.map((task) => {
                        const hasDates = task.start_date || task.due_date;
                        const isDone = ['done', 'completed'].includes(task.status?.name.toLowerCase() || '');
                        const barColor = getPriorityBarColor(task.priority, isDone);
                        const pos = hasDates ? getTaskGridStyle(task) : null;

                        const dateHistories = task.date_histories || task.dateHistories || [];
                        const extensions = dateHistories.filter((h) => h.type === 'deadline_extended');
                        const totalExt = extensions.length;

                        return (
                          <div
                            key={task.id}
                            className="h-14 relative flex items-center px-2 group/row hover:bg-primary/5 transition-colors"
                          >
                            {hasDates && pos ? (
                              <div
                                onClick={() => onTaskClick(task)}
                                style={{ left: pos.left, width: pos.width }}
                                className={`absolute h-8 rounded-xl shadow-xs px-2.5 flex items-center justify-between gap-1.5 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ${barColor}`}
                                title={`${task.title} (${task.start_date || 'Created'} s/d ${task.due_date || 'No deadline'})`}
                              >
                                <div className="flex items-center gap-1.5 truncate min-w-0">
                                  <span className="text-xs font-semibold truncate leading-none">
                                    {task.title}
                                  </span>
                                  {totalExt > 0 && (
                                    <span className="text-[9px] font-bold bg-black/25 px-1 py-0.2 rounded-full shrink-0">
                                      +{extensions.reduce((acc, curr) => acc + (curr.extension_days || 0), 0)}h
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0 text-[10px] font-medium opacity-90">
                                  {task.due_date && (
                                    <span className="hidden sm:inline">
                                      {new Date(task.due_date).toLocaleDateString(undefined, {
                                        month: 'numeric',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-muted italic pl-4">
                                Belum diatur tanggal (klik pada nama tugas untuk mengatur)
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineView;
