import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  CheckSquare,
  Sparkles
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { TaskDetailModal } from '../../components/task/TaskDetailModal';
import type { Task } from '../../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useDashboard();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    active_projects: 0,
    assigned_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0,
  };

  const projects = data?.projects || [];
  const myTasks = data?.my_tasks_due_soon || [];
  const activities = data?.recent_activities || [];

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-surface border border-border rounded-2xl shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
            Welcome back, {user?.name || 'there'}! <Sparkles className="w-4 h-4 text-warning" />
          </h1>
          <p className="text-xs text-muted">
            Here is a snapshot of your projects and upcoming milestones for today.
          </p>
        </div>

        <Link to="/projects">
          <Button variant="primary" size="sm" className="gap-1.5 shrink-0">
            <span>View All Projects</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface border border-border rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-text">{stats.active_projects}</p>
        </div>

        <div className="p-4 bg-surface border border-border rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Assigned Tasks</span>
            <CheckSquare className="w-4 h-4 text-info" />
          </div>
          <p className="text-2xl font-bold text-text">{stats.assigned_tasks}</p>
        </div>

        <div className="p-4 bg-surface border border-border rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold text-text">{stats.completed_tasks}</p>
        </div>

        <div className="p-4 bg-surface border border-border rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-error" />
          </div>
          <p className="text-2xl font-bold text-error">{stats.overdue_tasks}</p>
        </div>
      </div>

      {/* Two-Column Grid: My Tasks Due Soon & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Tasks Due Soon */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              My Upcoming Tasks
            </h2>
            <Link to="/tasks" className="text-xs text-primary font-semibold hover:underline">
              View all tasks →
            </Link>
          </div>

          <div className="bg-surface border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-xs">
            {myTasks.map((task) => {
              const isDone = task.status?.name === 'Done' || task.status?.name === 'Completed';
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone;
              return (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setIsModalOpen(true);
                  }}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-background cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        readOnly
                        className="w-4 h-4 rounded text-primary border-border cursor-default shrink-0"
                      />
                    </div>
                    <div className="truncate">
                      <p className={`text-xs font-semibold truncate ${isDone ? 'line-through text-muted' : 'text-text'}`}>
                        {task.title}
                      </p>
                      <p className="text-[11px] text-muted truncate">{task.project?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={task.priority === 'urgent' ? 'error' : task.priority === 'high' ? 'warning' : 'neutral'} size="sm">
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <span className={`text-[11px] font-medium ${isOverdue ? 'text-error font-semibold' : 'text-muted'}`}>
                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {myTasks.length === 0 && (
              <div className="p-8 text-center text-muted text-xs">
                No upcoming tasks due. You're all caught up!
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" />
              Active Projects
            </h2>
            <Link to="/projects" className="text-xs text-primary font-semibold hover:underline">
              All ({projects.length})
            </Link>
          </div>

          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block p-4 bg-surface hover:bg-surface/90 border border-border hover:border-primary/40 rounded-2xl shadow-xs transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-text line-clamp-1">{project.name}</h3>
                  <span className="text-[11px] font-semibold text-primary">{project.progress ?? 0}%</span>
                </div>

                <div className="w-full bg-background border border-border/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${project.progress ?? 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] text-muted">
                  <span>{project.tasks_count ?? 0} tasks total</span>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {project.members?.slice(0, 3).map((m) => (
                      <Avatar key={m.id} name={m.user?.name ?? m.name ?? 'User'} src={m.user?.avatar ?? m.avatar} size="xs" />
                    ))}
                  </div>

                </div>
              </Link>
            ))}

            {projects.length === 0 && (
              <div className="p-6 text-center text-muted text-xs bg-surface border border-border rounded-2xl">
                No active projects found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-text uppercase tracking-wider">Recent Activity</h2>
        <div className="bg-surface border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-xs">
          {activities.map((act) => (
            <div key={act.id} className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Avatar name={act.user?.name || 'System'} src={act.user?.avatar} size="xs" />
                <p className="text-text">
                  <span className="font-semibold">{act.user?.name}</span>{' '}
                  <span className="text-muted">
                    {act.action.replace('_', ' ')}: {act.metadata?.task_title || act.metadata?.name || ''}
                  </span>
                </p>
              </div>
              <span className="text-[10px] text-muted shrink-0">
                {new Date(act.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="p-6 text-center text-muted text-xs">
              No recent activity recorded.
            </div>
          )}
        </div>
      </div>

      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
};

export default DashboardPage;
