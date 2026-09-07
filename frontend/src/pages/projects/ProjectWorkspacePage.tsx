import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  ListTodo, 
  Info, 
  Plus, 
  UserPlus, 
  Trash2, 
  AlertCircle,
  Calendar,
  Copy,
  Clock,
  RefreshCw,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useProject, useRemoveProjectMember, useDeleteProject, useCreateProjectInvitation, useUpdateProjectMemberRole } from '../../hooks/useProjects';
import { useUpdateTaskStatus } from '../../hooks/useTasks';
import { KanbanBoard } from '../../components/kanban/KanbanBoard';
import { TaskDetailModal } from '../../components/task/TaskDetailModal';
import { CreateTaskModal } from '../../components/task/CreateTaskModal';
import { ProjectFonnteModal } from '../../components/project/ProjectFonnteModal';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { CalendarView } from '../../components/calendar/CalendarView';
import { useAuthStore } from '../../stores/authStore';
import { useProjectRealtime } from '../../hooks/useProjectRealtime';
import type { Task, TaskStatus, User, ProjectRole } from '../../types';


export const ProjectWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'board' | 'list' | 'calendar' | 'overview'>('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isFonnteModalOpen, setIsFonnteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [inviteDuration, setInviteDuration] = useState<'5m' | '10m' | '15m' | 'never'>('10m');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteExpiresAt, setInviteExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<number | null>(null);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const { user: currentUser } = useAuthStore();
  const { success, error: toastError } = useToast();
  const { data: project, isLoading, error } = useProject(id);
  useProjectRealtime(project?.id);
  const createInvitation = useCreateProjectInvitation();
  const removeMember = useRemoveProjectMember();
  const updateMemberRole = useUpdateProjectMemberRole();
  const deleteProject = useDeleteProject();
  const updateTaskStatus = useUpdateTaskStatus();

  // Invitation countdown timer
  React.useEffect(() => {
    if (!inviteExpiresAt) {
      setTimeLeft(null);
      return;
    }
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((inviteExpiresAt.getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [inviteExpiresAt]);

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex-1 p-8 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-error mx-auto" />
        <h2 className="text-lg font-bold text-text">Project not found</h2>
        <p className="text-xs text-muted">You might not have access to this workspace or it was deleted.</p>
        <Link to="/projects">
          <Button variant="secondary" size="sm">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const handleInvite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      const invitation = await createInvitation.mutateAsync({
        projectId: project.id,
        role: inviteRole,
        expires_in: inviteDuration,
      });
      setInviteLink(invitation.url);
      if (invitation.expires_at) {
        const expDate = new Date(invitation.expires_at);
        setInviteExpiresAt(expDate);
        setTimeLeft(Math.max(0, Math.floor((expDate.getTime() - Date.now()) / 1000)));
        const durationText = inviteDuration === '5m' ? '5 menit' : inviteDuration === '15m' ? '15 menit' : '10 menit';
        success(`Link undangan (${durationText}) berhasil dibuat.`, 'Link Siap');
      } else {
        setInviteExpiresAt(null);
        setTimeLeft(null);
        success('Link undangan tanpa batas waktu berhasil dibuat.', 'Link Siap');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal membuat link undangan';
      toastError(msg, 'Gagal');
    }
  };

  const handleCopyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    success('Link undangan berhasil disalin ke clipboard.', 'Tersalin');
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember.mutateAsync({ projectId: project.id, userId: memberToRemove });
      success('Member has been removed from the project.', 'Member removed');
    } catch {
      toastError('Failed to remove member. Please try again.', 'Error');
    } finally {
      setMemberToRemove(null);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    try {
      await deleteProject.mutateAsync(project.id);
      navigate('/projects');
    } catch (err: any) {
      toastError(err?.response?.data?.message || 'Failed to delete project. Please try again.', 'Delete failed');
    }
  };

  const priorityVariant = 
    project.priority === 'urgent' ? 'error' :
    project.priority === 'high' ? 'warning' :
    project.priority === 'low' ? 'neutral' : 'info';

  const statuses = project.task_statuses || project.taskStatuses || [];
  const projectLabels = project.labels || [];
  const currentMember = project.members?.find((member) =>
    (member.user_id ?? member.pivot?.user_id ?? member.id) === currentUser?.id
  );
  const currentRole: ProjectRole = project.owner_id === currentUser?.id
    ? 'owner'
    : currentMember?.role ?? currentMember?.pivot?.role ?? 'member';
  const isOwner = currentRole === 'owner';
  const isAdmin = isOwner || currentRole === 'admin';
  const isViewer = currentRole === 'viewer';
  const canDeleteProject = isOwner; // Only the project owner can delete the project
  const canInviteMembers = isAdmin; // Only owner and admin can invite members
  const canCreateTask = !isViewer; // Owner, Admin, Member can write/create tasks; Viewer cannot
  const currentSelectedTask = selectedTask
    ? project.tasks?.find((t) => t.id === selectedTask.id) || selectedTask
    : null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Project Workspace Header */}
      <div className="border-b border-border bg-surface px-4 sm:px-6 py-3.5 sm:py-4 space-y-3 sm:space-y-4 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text truncate max-w-full">{project.name}</h1>
              <Badge variant={priorityVariant} size="sm">{project.priority}</Badge>
              <Badge variant="neutral" size="sm">{project.status}</Badge>
              {isViewer && (
                <Badge variant="neutral" size="sm">Viewer (Read-only)</Badge>
              )}
            </div>
            {project.description && (
              <p className="text-xs text-muted max-w-2xl line-clamp-2 sm:line-clamp-none">{project.description}</p>
            )}
          </div>

          {/* Members Avatars & Add Member */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            {project.members && project.members.length > 0 && (
              <div className="flex -space-x-1.5 overflow-hidden items-center mr-1" title="Project Members">
                {project.members.slice(0, 5).map((m) => {
                  const name = m.user?.name ?? m.name ?? 'User';
                  const avatar = m.user?.avatar ?? m.avatar;
                  return (
                    <Avatar key={m.id} name={name} src={avatar} size="xs" className="ring-2 ring-surface" />
                  );
                })}
                {project.members.length > 5 && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border text-[9px] font-semibold text-muted ring-2 ring-surface">
                    +{project.members.length - 5}
                  </span>
                )}
              </div>
            )}

            {canCreateTask && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateTaskOpen(true)}
                className="text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                <span>New Task</span>
              </Button>
            )}

            {canInviteMembers && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsInviteModalOpen(true)}
                className="text-xs h-8"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                <span>Invite</span>
              </Button>
            )}

            {isOwner && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsFonnteModalOpen(true)}
                className="text-xs h-8 gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                title="Integrasi WhatsApp (Fonnte) - Khusus Owner"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp Bot</span>
              </Button>
            )}

            {canDeleteProject && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteProjectOpen(true)}
                className="text-error hover:bg-error/10 h-8 px-2"
                title="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Workspace Navigation Tabs (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-1 border-t border-border/60 pt-2.5 overflow-x-auto no-scrollbar scroll-smooth">
          {([
            { key: 'board', label: 'Board', icon: FolderKanban },
            { key: 'list', label: 'List', icon: ListTodo },
            { key: 'calendar', label: 'Calendar', icon: Calendar },
            { key: 'overview', label: 'Overview', icon: Info },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0
                ${activeTab === key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:text-text hover:bg-background'}
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Kanban Board View */}
        {activeTab === 'board' && (
          <KanbanBoard
            projectId={project.id}
            statuses={statuses}
            tasks={project.tasks || []}
            members={project.members || []}
            labels={projectLabels}
            readOnly={isViewer}
          />
        )}

        {/* List View */}
        {activeTab === 'list' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-6xl mx-auto w-full">
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-background/50 text-[11px] font-semibold text-muted uppercase">
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Assignees</th>
                    <th className="py-3 px-4">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {project.tasks?.map((task: Task) => (
                    <tr
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setIsTaskModalOpen(true);
                      }}
                      className="hover:bg-background cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-text max-w-[360px]">
                        <span className="block truncate" title={task.title}>{task.title}</span>
                      </td>
                      <td className="py-3 px-4">
                        {isViewer ? (
                          <Badge variant="neutral" size="sm">
                            {task.status?.name ?? 'Todo'}
                          </Badge>
                        ) : (
                          <select
                            value={task.status_id}
                            onClick={(e) => e.stopPropagation()}
                            onChange={async (e) => {
                              e.stopPropagation();
                              const newStatusId = Number(e.target.value);
                              if (newStatusId === task.status_id) return;
                              try {
                                await updateTaskStatus.mutateAsync({ taskId: task.id, statusId: newStatusId });
                                success('Task status updated.', 'Status saved');
                              } catch (err: any) {
                                toastError(err?.response?.data?.message || 'Could not update task status.', 'Status update failed');
                              }
                            }}
                            className="text-xs bg-background border border-border rounded-md px-2 py-1 text-text cursor-pointer hover:border-primary/40 focus:outline-none"
                          >
                            {statuses.map((s: TaskStatus) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={task.priority === 'urgent' ? 'error' : task.priority === 'high' ? 'warning' : 'neutral'} size="sm">
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {task.assignees?.map((u: User) => (
                            <Avatar key={u.id} name={u.name} src={u.avatar} size="xs" />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {(!project.tasks || project.tasks.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted text-xs">
                        No tasks created in this project yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-6xl mx-auto w-full">
            <CalendarView
              tasks={project.tasks || []}
              onTaskClick={(task) => {
                setSelectedTask(task);
                setIsTaskModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
            {/* Progress & Stats Card */}
            <div className="p-6 bg-surface border border-border rounded-2xl space-y-4">
              <h2 className="text-sm font-bold text-text uppercase tracking-wider">Project Progress</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Completion Rate</span>
                  <span className="text-primary font-bold">{project.progress}%</span>
                </div>
                <div className="w-full bg-background border border-border rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Team Members List */}
            <div className="p-6 bg-surface border border-border rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-text uppercase tracking-wider">Team Members</h2>
                {canInviteMembers && <Button variant="secondary" size="sm" onClick={() => setIsInviteModalOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Member
                </Button>}
              </div>

              <div className="divide-y divide-border">
                {project.members?.map((member) => (
                  (() => {
                    const memberId = member.user_id ?? member.pivot?.user_id ?? member.id;
                    const memberName = member.user?.name ?? member.name ?? 'User';
                    const memberEmail = member.user?.email ?? member.email ?? '';
                    const memberAvatar = member.user?.avatar ?? member.avatar;
                    const memberRole = member.role ?? member.pivot?.role ?? 'member';
                    const canEditThisRole =
                      (isOwner && memberRole !== 'owner') ||
                      (isAdmin && !isOwner && memberRole !== 'owner' && memberRole !== 'admin');
                    const canKickThisMember =
                      (isOwner && memberRole !== 'owner') ||
                      (isAdmin && !isOwner && memberRole !== 'owner' && memberRole !== 'admin');

                    return (
                  <div key={member.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={memberName} src={memberAvatar} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-text">{memberName}</p>
                        <p className="text-[11px] text-muted">{memberEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {canEditThisRole ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={memberRole}
                            onChange={async (event) => {
                              const newRole = event.target.value as 'admin' | 'member' | 'viewer';
                              if (newRole === memberRole) return;
                              try {
                                await updateMemberRole.mutateAsync({ projectId: project.id, userId: memberId, role: newRole });
                                success('Member role updated.', 'Role saved');
                              } catch (err: any) {
                                toastError(err?.response?.data?.message || 'Could not update this member role.', 'Role update failed');
                              }
                            }}
                            className="text-[11px] bg-background border border-border rounded-md px-2 py-1 text-text capitalize cursor-pointer hover:border-primary/40 focus:outline-none"
                          >
                            {isOwner && <option value="admin">admin</option>}
                            <option value="member">member</option>
                            <option value="viewer">viewer</option>
                          </select>
                        </div>
                      ) : (
                        <Badge variant={memberRole === 'owner' ? 'primary' : memberRole === 'admin' ? 'warning' : 'neutral'} size="sm">
                          {memberRole}
                        </Badge>
                      )}

                      {canKickThisMember && (
                        <button
                          onClick={() => setMemberToRemove(memberId)}
                          className="p-1 text-muted hover:text-error rounded transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Undang Anggota Tim
              </h2>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                inviteDuration === 'never'
                  ? 'text-primary bg-primary/10'
                  : 'text-amber-500 bg-amber-500/10'
              }`}>
                <Clock className="w-3 h-3" />
                {inviteDuration === 'never' ? 'Tanpa Kadaluarsa' : `${inviteDuration === '5m' ? '5' : inviteDuration === '15m' ? '15' : '10'} Menit`}
              </span>
            </div>

            <p className="text-xs text-muted">
              Pilih batas waktu link undangan sesuai kebutuhan keamanan. Link dapat di-generate ulang kapan saja.
            </p>

            <form onSubmit={handleInvite} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text">Role Akses</label>
                  <select
                    className="w-full text-xs bg-background border border-border rounded-xl p-2.5 text-text"
                    value={inviteRole}
                    onChange={(e) => {
                      setInviteRole(e.target.value as any);
                      setInviteLink('');
                      setInviteExpiresAt(null);
                    }}
                  >
                    {isOwner && <option value="admin">Admin</option>}
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text">Masa Berlaku</label>
                  <select
                    className="w-full text-xs bg-background border border-border rounded-xl p-2.5 text-text"
                    value={inviteDuration}
                    onChange={(e) => {
                      setInviteDuration(e.target.value as any);
                      setInviteLink('');
                      setInviteExpiresAt(null);
                    }}
                  >
                    <option value="5m">5 Menit</option>
                    <option value="10m">10 Menit (Standar)</option>
                    <option value="15m">15 Menit</option>
                    <option value="never">Tanpa Kadaluarsa</option>
                  </select>
                </div>
              </div>

              {inviteLink ? (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] bg-background/50 border border-border rounded-lg p-2">
                    <span className="text-muted">Status Link:</span>
                    {inviteExpiresAt === null ? (
                      <span className="font-semibold text-primary flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Aktif Selamanya (Tanpa Batas Waktu)
                      </span>
                    ) : timeLeft !== null && timeLeft > 0 ? (
                      <span className="font-semibold text-emerald-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Aktif ({formatTimeLeft(timeLeft)})
                      </span>
                    ) : (
                      <span className="font-semibold text-error flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Expired (Kadaluarsa)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="min-w-0 flex-1 text-xs bg-background border border-border rounded-xl p-2.5 text-text font-mono truncate select-all"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyInviteLink}
                      disabled={inviteExpiresAt !== null && (timeLeft ?? 0) <= 0}
                      title="Salin link undangan"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" /> Salin
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsInviteModalOpen(false);
                        setInviteLink('');
                        setInviteExpiresAt(null);
                      }}
                    >
                      Tutup
                    </Button>
                    <Button
                      type="button"
                      variant={inviteExpiresAt !== null && (timeLeft ?? 0) <= 0 ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handleInvite()}
                      disabled={createInvitation.isPending}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${createInvitation.isPending ? 'animate-spin' : ''}`} />
                      {createInvitation.isPending ? 'Membuat...' : 'Generate Ulang Link'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsInviteModalOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={createInvitation.isPending}
                  >
                    {createInvitation.isPending ? 'Membuat...' : 'Buat Link Undangan'}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Confirm Remove Member */}
      <ConfirmDialog
        isOpen={memberToRemove !== null}
        title="Remove Member"
        description="Are you sure you want to remove this member from the project? They will lose access immediately."
        confirmLabel="Remove"
        variant="danger"
        isLoading={removeMember.isPending}
        onConfirm={handleConfirmRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />

      <ConfirmDialog
        isOpen={isDeleteProjectOpen}
        title="Delete Project"
        description={`Delete "${project.name}" and all of its tasks? This action cannot be undone.`}
        confirmLabel="Delete Project"
        variant="danger"
        isLoading={deleteProject.isPending}
        onConfirm={handleDeleteProject}
        onCancel={() => setIsDeleteProjectOpen(false)}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        projectId={project.id}
        statuses={statuses}
        members={project.members || []}
        projectLabels={projectLabels}
        onClose={() => setIsCreateTaskOpen(false)}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={currentSelectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        statuses={statuses}
        members={project.members || []}
        projectLabels={projectLabels}
        readOnly={isViewer}
      />

      {/* WhatsApp (Fonnte) Integration Modal */}
      <ProjectFonnteModal
        isOpen={isFonnteModalOpen}
        onClose={() => setIsFonnteModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  );
};

export default ProjectWorkspacePage;
