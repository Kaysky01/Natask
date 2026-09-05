import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, List } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { Task } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function getLeadingBlanks(year: number, month: number): number {
  // Monday = 0 (European style)
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function parseTaskDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onTaskClick }) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  const tasksWithDueDate = useMemo(
    () => tasks.filter((t) => !!t.due_date),
    [tasks]
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasksWithDueDate.forEach((task) => {
      const d = parseTaskDate(task.due_date!);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [tasksWithDueDate]);

  const getTasksForDay = (date: Date): Task[] => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return tasksByDay.get(key) || [];
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const days = getDaysInMonth(year, month);
  const blanks = getLeadingBlanks(year, month);

  // Agenda: tasks sorted by due_date for current month
  const agendaTasks = useMemo(() => {
    return tasksWithDueDate
      .filter((t) => {
        const d = parseTaskDate(t.due_date!);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .sort((a, b) => parseTaskDate(a.due_date!).getTime() - parseTaskDate(b.due_date!).getTime());
  }, [tasksWithDueDate, year, month]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface border border-border transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-bold text-text min-w-[160px] text-center">
            {formatMonthYear(year, month)}
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface border border-border transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
            className="ml-2 px-2.5 py-1 text-xs rounded-lg border border-border text-muted hover:text-text transition-colors"
          >
            Today
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'month' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Month
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'agenda' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Agenda
          </button>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="py-2 text-center text-[11px] font-semibold text-muted uppercase">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 auto-rows-[minmax(116px,auto)]">
            {/* Leading blank cells */}
            {Array.from({ length: blanks }).map((_, i) => (
              <div key={`blank-${i}`} className="border-r border-b border-border bg-background/30" />
            ))}

            {/* Day cells */}
            {days.map((date) => {
              const dayTasks = getTasksForDay(date);
              const isToday = isSameDay(date, today);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={date.toISOString()}
                  className={`
                    border-r border-b border-border p-1.5 relative
                    ${isWeekend ? 'bg-background/50' : ''}
                  `}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-end mb-1">
                    <span
                      className={`
                        text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                        ${isToday
                          ? 'bg-primary text-white'
                          : 'text-muted'
                        }
                      `}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="w-full text-left text-[11px] truncate px-1.5 py-0.5 rounded flex items-center gap-1 hover:opacity-80 transition-opacity group"
                        style={{ backgroundColor: `${PRIORITY_COLORS[task.priority] || '#3B82F6'}20` }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: PRIORITY_COLORS[task.priority] || '#3B82F6' }}
                        />
                        <span className="truncate text-text font-medium">{task.title}</span>
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="text-[10px] text-muted pl-1">+{dayTasks.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agenda View */}
      {viewMode === 'agenda' && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {agendaTasks.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays className="w-10 h-10 text-muted/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-text">No tasks with due dates this month</p>
              <p className="text-xs text-muted mt-1">Set due dates on your tasks to see them here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {agendaTasks.map((task) => {
                const dueDate = parseTaskDate(task.due_date!);
                const isOverdue = dueDate < today;
                const isToday = isSameDay(dueDate, today);

                return (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="w-full text-left flex items-center gap-4 px-5 py-3.5 hover:bg-background transition-colors"
                  >
                    {/* Date column */}
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-[11px] font-semibold text-muted uppercase">
                        {dueDate.toLocaleDateString(undefined, { month: 'short' })}
                      </p>
                      <p className={`text-xl font-bold leading-tight ${isToday ? 'text-primary' : isOverdue ? 'text-error' : 'text-text'}`}>
                        {dueDate.getDate()}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className={`w-px self-stretch ${isOverdue ? 'bg-error/30' : 'bg-border'}`} />

                    {/* Task info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={task.priority === 'urgent' ? 'error' : task.priority === 'high' ? 'warning' : 'neutral'}
                          size="sm"
                        >
                          {task.priority}
                        </Badge>
                        {task.status && (
                          <span className="text-[11px] text-muted">{task.status.name}</span>
                        )}
                        {isOverdue && (
                          <span className="text-[11px] font-semibold text-error">Overdue</span>
                        )}
                        {isToday && (
                          <span className="text-[11px] font-semibold text-primary">Due today</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
