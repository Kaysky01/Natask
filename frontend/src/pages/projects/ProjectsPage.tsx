import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { CreateProjectModal } from '../../components/project/CreateProjectModal';

export const ProjectsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: projects, isLoading } = useProjects({
    search: search || undefined,
    status: statusFilter || undefined,
  });

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Projects</h1>
          <p className="text-xs text-muted">Manage your team spaces, boards, and workflows</p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by title..."
            className="w-full text-xs bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="w-full sm:w-44 text-xs bg-surface border border-border rounded-xl px-3 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="planning">Planning</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-surface border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && projects && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const priorityVariant = 
              project.priority === 'urgent' ? 'error' :
              project.priority === 'high' ? 'warning' :
              project.priority === 'low' ? 'neutral' : 'info';

            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group p-5 bg-surface hover:bg-surface/90 border border-border hover:border-primary/40 rounded-2xl shadow-xs transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={priorityVariant} size="sm">
                      {project.priority}
                    </Badge>
                    <span className="text-[11px] font-mono text-muted uppercase">
                      {project.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text group-hover:text-primary transition-colors line-clamp-1">
                    {project.name}
                  </h3>

                  {project.description && (
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Progress & Members Footer */}
                <div className="space-y-3 pt-3 border-t border-border/60">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-medium text-muted">
                      <span>Tasks ({project.completed_tasks_count ?? 0}/{project.tasks_count ?? 0})</span>
                      <span>{project.progress ?? 0}%</span>
                    </div>
                    <div className="w-full bg-background border border-border/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${project.progress ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {project.members?.map((m) => (
                        <Avatar key={m.id} name={m.user?.name ?? m.name ?? 'User'} src={m.user?.avatar ?? m.avatar} size="xs" />
                      ))}
                    </div>


                    <span className="text-[11px] font-medium text-primary flex items-center gap-1 group-hover:underline">
                      Open Board →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && projects && projects.length === 0 && (
        <div className="py-16 text-center bg-surface border border-dashed border-border rounded-2xl space-y-3">
          <FolderKanban className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-base font-bold text-text">No projects found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Get started by creating your first project workspace to collaborate with your team.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create Project
          </Button>
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default ProjectsPage;
