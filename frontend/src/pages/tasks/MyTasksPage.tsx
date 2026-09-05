import React, { useState, useMemo } from 'react';
import { Search, Calendar, AlertCircle, CheckCircle2, Clock, ArrowRight, ListTodo } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { Badge } from '../../components/ui/Badge';
import { SkeletonRow } from '../../components/ui/Skeleton';
import { TaskDetailModal } from '../../components/task/TaskDetailModal';
import type { Task } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSection(task: Task): 'overdue' | 'today' | 'thisWeek' | 'upcoming' | 'noDate' | 'completed' {
  const isDone = task.status?.name === 'Done' || task.status?.name === 'Completed';
  if (isDone) return 'completed';
  if (!task.due_date) return 'noDate';

  const now = new Date();
  const due = new Date(task.due_date);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);
  const weekEnd = new Date(todayStart.getTime() + 7 * 86400000 - 1);

  if (due < todayStart) return 'overdue';
  if (due <= todayEnd) return 'today';
  if (due <= weekEnd) return 'thisWeek';
  return 'upcoming';
}

interface SectionConfig {
  key: 'overdue' | 'today' | 'thisWeek' | 'upcoming' | 'noDate' | 'completed';
  label: string;
  icon: React.ReactNode;
  emptyText: string;
  accentClass: string;
}

const SECTIONS: SectionConfig[] = [
  {
    key: 'overdue',
    label: 'Overdue',
    icon: <AlertCircle className="w-4 h-4 text-error" />,
    emptyText: 'No overdue tasks',
    accentClass: 'text-error',
  },
  {
    key: 'today',
    label: 'Due Today',
    icon: <Clock className="w-4 h-4 text-warning" />,
    emptyText: 'Nothing due today',
    accentClass: 'text-warning',
  },
  {
    key: 'thisWeek',
    label: 'This Week',
    icon: <Calendar className="w-4 h-4 text-info" />,
    emptyText: 'Nothing due this week',
    accentClass: 'text-info',
  },
  {
    key: 'upcoming',
    label: 'Upcoming',
    icon: <ArrowRight className="w-4 h-4 text-muted" />,
    emptyText: 'No upcoming tasks',
    accentClass: 'text-muted',
  },
  {
    key: 'noDate',
    label: 'No Due Date',
    icon: <ListTodo className="w-4 h-4 text-muted" />,
    emptyText: 'No undated tasks',
    accentClass: 'text-muted',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: <CheckCircle2 className="w-4 h-4 text-success" />,
    emptyText: 'No completed tasks',
    accentClass: 'text-success',
  },
];

// ─── Task Row ─────────────────────────────────────────────────────────────────

const TaskRow: React.FC<{
  task: Task;
  isDone: boolean;
  onOpen: () => void;
  onToggle: () => void;
}> = ({ task, isDone, onOpen, onToggle }) => {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone;

  return (
    <div
      onClick={onOpen}
      className="flex items-center gap-3 px-4 py-3 hover:bg-background cursor-pointer transition-colors"
    >
      <input
        type="checkbox"
        checked={isDone}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggle}
        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer shrink-0"
      />

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${isDone ? 'line-through text-muted' : 'text-text'}`}>
          {task.title}
        </p>
        {task.project && (
          <p className="text-[11px] text-muted truncate">{task.project.name}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.status && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-background border border-border text-muted">
            {task.status.name}
          </span>
        )}

        <Badge
          variant={task.priority === 'urgent' ? 'error' : task.priority === 'high' ? 'warning' : 'neutral'}
          size="sm"
        >
          {task.priority}
        </Badge>

        {task.due_date && (
          <span className={`text-[11px] font-medium hidden sm:block ${isOverdue ? 'text-error font-semibold' : 'text-muted'}`}>
            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Section ─────────────────────────────────────────────────────────────────

const TaskSection: React.FC<{
  config: SectionConfig;
  tasks: Task[];
  onOpen: (t: Task) => void;
  onToggle: (t: Task) => void;
  defaultOpen?: boolean;
}> = ({ config, tasks, onOpen, onToggle, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-background transition-colors"
      >
        <div className="flex items-center gap-2">
          {config.icon}
          <span className={`text-xs font-bold uppercase tracking-wider ${config.accentClass}`}>
            {config.label}
          </span>
          <span className="text-[11px] font-semibold text-muted bg-background border border-border rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </div>
        <span className="text-xs text-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="divide-y divide-border border-t border-border">
          {tasks.length === 0 ? (
            <p className="px-4 py-4 text-xs text-muted italic">{config.emptyText}</p>
          ) : (
            tasks.map((task) => {
              const isDone = task.status?.name === 'Done' || task.status?.name === 'Completed';
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  isDone={isDone}
                  onOpen={() => onOpen(task)}
                  onToggle={() => onToggle(task)}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const MyTasksPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: tasks, isLoading } = useTasks({
    assigned_to_me: true,
    search: search || undefined,
    priority: priorityFilter || undefined,
  });

  const grouped = useMemo(() => {
    const map: Record<SectionConfig['key'], Task[]> = {
      overdue: [], today: [], thisWeek: [], upcoming: [], noDate: [], completed: [],
    };
    (tasks || []).forEach((task) => {
      map[getSection(task)].push(task);
    });
    return map;
  }, [tasks]);

  const handleToggle = (task: Task) => {
    // Open task modal for status change — avoids hardcoded status ID assumptions
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const totalCount = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-text">My Tasks</h1>
        <p className="text-xs text-muted">
          All your assignments across projects — {totalCount} task{totalCount !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full text-xs bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="w-full sm:w-44 text-xs bg-surface border border-border rounded-xl px-3 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* Sections */}
      {!isLoading && (
        <div className="space-y-3">
          {SECTIONS.map((config) => (
            <TaskSection
              key={config.key}
              config={config}
              tasks={grouped[config.key]}
              onOpen={(task) => { setSelectedTask(task); setIsModalOpen(true); }}
              onToggle={handleToggle}
              defaultOpen={config.key !== 'completed' && config.key !== 'noDate'}
            />
          ))}
        </div>
      )}

      {/* Empty state when no tasks at all */}
      {!isLoading && totalCount === 0 && (
        <div className="py-16 text-center bg-surface border border-dashed border-border rounded-2xl space-y-3">
          <CheckCircle2 className="w-10 h-10 text-success/50 mx-auto" />
          <h3 className="text-base font-bold text-text">You're all caught up!</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            No tasks are assigned to you right now. Enjoy your clear schedule!
          </p>
        </div>
      )}

      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTask(null); }}
      />
    </div>
  );
};

export default MyTasksPage;
