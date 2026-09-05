import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  Calendar,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Tag,
  UserPlus,
  Send,
  Plus,
  Check,
  Edit2,
  Clock,
  Download,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import type { Task, ProjectMember, TaskStatus, Label, Priority } from '../../types';
import {
  useUpdateTask,
  useDeleteTask,
  useUpdateTaskStatus,
  useToggleChecklistItem,
  useAddChecklistItem,
  useDeleteChecklistItem,
  useCreateChecklist,
  useDeleteChecklist,
  useAddComment,
  useAssignTaskMember,
  useUnassignTaskMember,
  useAttachTaskLabel,
  useDetachTaskLabel,
  useUploadAttachment,
  useDeleteAttachment,
  useTask,
} from '../../hooks/useTasks';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../ui/Toast';
import { useCreateProjectLabel } from '../../hooks/useProjects';
import { api } from '../../api/client';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  statuses?: TaskStatus[];
  members?: ProjectMember[];
  projectLabels?: Label[];
  readOnly?: boolean;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  statuses = [],
  members = [],
  projectLabels = [],
  readOnly = false,
}) => {

  const { user: currentUser } = useAuthStore();
  const { error: toastError, success: toastSuccess } = useToast();

  // Local state for inline edits
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [draftStatusId, setDraftStatusId] = useState<number | null>(null);
  const [draftPriority, setDraftPriority] = useState<Priority>('medium');
  const [draftAssigneeIds, setDraftAssigneeIds] = useState<number[]>([]);
  const [draftLabelIds, setDraftLabelIds] = useState<number[]>([]);
  const [draftChecklistItems, setDraftChecklistItems] = useState<Record<number, boolean>>({});
  const [newComment, setNewComment] = useState('');

  // Checklist items inline inputs keyed by checklistId
  const [newItemTitles, setNewItemTitles] = useState<Record<number, string>>({});
  const [activeChecklistId, setActiveChecklistId] = useState<number | null>(null);

  // Popover menus state
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showLabelCreator, setShowLabelCreator] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const [showChecklistCreator, setShowChecklistCreator] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('Checklist');
  const [showDatesPicker, setShowDatesPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mutations
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateTaskStatus = useUpdateTaskStatus();
  const toggleChecklistItem = useToggleChecklistItem();
  const addChecklistItem = useAddChecklistItem();
  const deleteChecklistItem = useDeleteChecklistItem();
  const createChecklist = useCreateChecklist();
  const deleteChecklist = useDeleteChecklist();
  const addComment = useAddComment();
  const assignMember = useAssignTaskMember();
  const unassignMember = useUnassignTaskMember();
  const attachLabels = useAttachTaskLabel();
  const detachLabel = useDetachTaskLabel();
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();
  const createProjectLabel = useCreateProjectLabel();
  const { data: detailedTask } = useTask(task?.id);
  const taskData = detailedTask || task;

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
      setDraftStatusId(task.status_id);
      setDraftPriority(task.priority);
      setDraftAssigneeIds(task.assignees?.map((assignee) => assignee.id) || []);
      setDraftLabelIds(task.labels?.map((label) => label.id) || []);
      setDraftChecklistItems(Object.fromEntries(
        (task.checklists || []).flatMap((checklist) => checklist.items || []).map((item) => [item.id, item.completed])
      ));
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      setShowMemberPicker(false);
      setShowLabelPicker(false);
      setShowLabelCreator(false);
      setShowChecklistCreator(false);
      setShowDatesPicker(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const currentStatus =
    statuses.find((s) => s.id === (taskData?.status_id ?? task.status_id)) || taskData?.status;

  const handleSaveTitle = async () => {
    if (!title.trim() || title === (taskData?.title ?? task.title)) {
      setIsEditingTitle(false);
      return;
    }
    await updateTask.mutateAsync({
      id: task.id,
      data: { title: title.trim() },
    });
    setIsEditingTitle(false);
  };

  const handleSaveDescription = async () => {
    await updateTask.mutateAsync({
      id: task.id,
      data: { description },
    });
    setIsEditingDescription(false);
  };

  const handleStatusChange = async (newStatusId: number) => {
    setDraftStatusId(newStatusId);
  };

  const handlePriorityChange = (newPriority: Priority) => {
    setDraftPriority(newPriority);
  };

  const handleDueDateChange = (dateVal: string) => {
    setDueDate(dateVal);
  };

  const handleSaveMetadata = async () => {
    try {
      if (draftStatusId && draftStatusId !== (taskData?.status_id ?? task.status_id)) {
        await updateTaskStatus.mutateAsync({ taskId: task.id, statusId: draftStatusId });
      }
      if (draftPriority !== (taskData?.priority ?? task.priority) || dueDate !== (taskData?.due_date ? taskData.due_date.split('T')[0] : '')) {
        await updateTask.mutateAsync({
          id: task.id,
          data: { priority: draftPriority, due_date: dueDate || undefined },
        });
      }
      const currentAssigneeIds = taskData?.assignees?.map((assignee) => assignee.id) || [];
      await Promise.all([
        ...draftAssigneeIds.filter((userId) => !currentAssigneeIds.includes(userId)).map((userId) =>
          assignMember.mutateAsync({ taskId: task.id, userId })
        ),
        ...currentAssigneeIds.filter((userId) => !draftAssigneeIds.includes(userId)).map((userId) =>
          unassignMember.mutateAsync({ taskId: task.id, userId })
        ),
      ]);
      const checklistItems = (taskData?.checklists || []).flatMap((checklist) => checklist.items || []);
      await Promise.all(checklistItems
        .filter((item) => draftChecklistItems[item.id] !== undefined && draftChecklistItems[item.id] !== item.completed)
        .map((item) => toggleChecklistItem.mutateAsync({
          itemId: item.id,
          completed: draftChecklistItems[item.id],
          taskId: task.id,
        })));
      const currentLabelIds = taskData?.labels?.map((label) => label.id) || [];
      await Promise.all([
        ...draftLabelIds.filter((labelId) => !currentLabelIds.includes(labelId)).map((labelId) =>
          attachLabels.mutateAsync({ taskId: task.id, labelIds: [labelId] })
        ),
        ...currentLabelIds.filter((labelId) => !draftLabelIds.includes(labelId)).map((labelId) =>
          detachLabel.mutateAsync({ taskId: task.id, labelId })
        ),
      ]);
      setShowDatesPicker(false);
      toastSuccess('Task changes saved.', 'Saved');
    } catch (err: any) {
      toastError(err?.response?.data?.message || 'Could not save task changes.', 'Save failed');
    }
  };

  const handleCancelMetadata = () => {
    setDraftStatusId(taskData?.status_id ?? task.status_id);
    setDraftPriority(taskData?.priority ?? task.priority);
    setDraftAssigneeIds(taskData?.assignees?.map((assignee) => assignee.id) || []);
    setDraftLabelIds(taskData?.labels?.map((label) => label.id) || []);
    setDraftChecklistItems(Object.fromEntries(
      (taskData?.checklists || []).flatMap((checklist) => checklist.items || []).map((item) => [item.id, item.completed])
    ));
    setDueDate(taskData?.due_date ? taskData.due_date.split('T')[0] : '');
    setShowDatesPicker(false);
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask.mutateAsync({ id: task.id, projectId: task.project_id });
      onClose();
    }
  };

  // Checklists handlers
  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistName.trim()) return;
    await createChecklist.mutateAsync({
      taskId: task.id,
      title: newChecklistName.trim(),
    });
    setNewChecklistName('Checklist');
    setShowChecklistCreator(false);
  };

  const handleDeleteChecklist = async (checklistId: number) => {
    if (window.confirm('Delete this checklist?')) {
      await deleteChecklist.mutateAsync({ checklistId, taskId: task.id });
    }
  };

  const handleToggleChecklistItem = (itemId: number, completed: boolean) => {
    setDraftChecklistItems((current) => ({ ...current, [itemId]: !completed }));
  };

  const handleAddChecklistItem = async (checklistId: number) => {
    const itemTitle = newItemTitles[checklistId]?.trim();
    if (!itemTitle) return;

    await addChecklistItem.mutateAsync({
      checklistId,
      title: itemTitle,
      taskId: task.id,
    });

    setNewItemTitles((prev) => ({ ...prev, [checklistId]: '' }));
  };

  const handleDeleteChecklistItem = async (itemId: number) => {
    await deleteChecklistItem.mutateAsync({ itemId, taskId: task.id });
  };

  // Member assignment toggle
  const handleToggleMember = (userId: number) => {
    setDraftAssigneeIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]);
  };

  // Label toggle
  const handleToggleLabel = (labelId: number) => {
    setDraftLabelIds((current) => current.includes(labelId)
      ? current.filter((id) => id !== labelId)
      : [...current, labelId]);
  };

  const handleCreateLabel = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newLabelName.trim()) return;

    try {
      await createProjectLabel.mutateAsync({
        projectId: task.project_id,
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      setNewLabelName('');
      setShowLabelCreator(false);
      toastSuccess('Label created. You can select it now.', 'Label ready');
    } catch (err: any) {
      toastError(err?.response?.data?.message || 'Could not create label.', 'Label creation failed');
    }
  };

  // Attachment handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toastError('Files must be 2 MB or smaller.', 'File too large');
      e.target.value = '';
      return;
    }

    try {
      await uploadAttachment.mutateAsync({ taskId: task.id, file });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toastError(err?.response?.data?.message || err.message || 'Failed to upload attachment', 'Upload failed');
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (window.confirm('Remove this attachment?')) {
      await deleteAttachment.mutateAsync({ taskId: task.id, attachmentId });
    }
  };

  const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
    try {
      const response = await api.get(`/tasks/attachments/${attachmentId}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toastError(err?.response?.data?.message || 'Could not download this file.', 'Download failed');
    }
  };

  // Comment handler
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addComment.mutateAsync({
      taskId: task.id,
      body: newComment.trim(),
    });
    setNewComment('');
  };

  const isOverdue = taskData?.due_date && new Date(taskData.due_date) < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface border border-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header (Trello Style) */}
        <div className="px-6 py-4 border-b border-border bg-surface flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1 flex-1 min-w-0">
            {/* Inline Title Editing */}
            {!readOnly && isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  className="w-full text-base font-bold bg-background border border-primary rounded px-2 py-1 text-text focus:outline-none"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveTitle}
                  className="h-8 text-xs"
                >
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2
                  onClick={() => !readOnly && setIsEditingTitle(true)}
                  className={`text-base md:text-lg font-bold text-text truncate rounded px-1 -mx-1 py-0.5 transition-colors ${
                    !readOnly ? 'cursor-pointer hover:bg-background/50' : ''
                  }`}
                  title={!readOnly ? 'Click to edit title' : undefined}
                >
                  {taskData?.title}
                </h2>
                {readOnly && (
                  <Badge variant="neutral" size="sm">Viewer (Read-only)</Badge>
                )}
              </div>
            )}

            {/* List location breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>in list</span>
              {!readOnly ? (
                <select
                  value={draftStatusId ?? taskData?.status_id ?? task.status_id}
                  onChange={(e) => handleStatusChange(Number(e.target.value))}
                  className="font-semibold text-text bg-background/80 border border-border rounded px-2 py-0.5 text-xs hover:border-primary/40 focus:outline-none"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-semibold text-text">{currentStatus?.name || '—'}</span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-muted hover:text-text rounded-lg hover:bg-background transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (2-Column Trello Layout) */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Left Column (Content) */}
          <div className="md:col-span-2 space-y-6">
            {/* Quick Metadata Row (Members, Labels, Due Date) */}
            <div className="flex flex-wrap items-start gap-6 pb-2">
              {/* Members Preview */}
              {taskData?.assignees && taskData.assignees.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Members
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {taskData.assignees.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-1.5 bg-background border border-border rounded-full pl-1 pr-2.5 py-0.5 text-xs"
                      >
                        <Avatar name={a.name} src={a.avatar} size="xs" />
                        <span className="text-text font-medium">{a.name}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowMemberPicker(true)}
                      className="w-6 h-6 rounded-full bg-background border border-dashed border-border hover:border-primary/60 flex items-center justify-center text-muted hover:text-text text-xs"
                      title="Add member"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Labels Preview */}
              {taskData?.labels && taskData.labels.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Labels
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {taskData.labels.map((l) => (
                      <span
                        key={l.id}
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white tracking-wide shadow-xs"
                        style={{ backgroundColor: l.color || '#6366F1' }}
                      >
                        {l.name}
                      </span>
                    ))}
                    <button
                      onClick={() => setShowLabelPicker(true)}
                      className="w-6 h-6 rounded-full bg-background border border-dashed border-border hover:border-primary/60 flex items-center justify-center text-muted hover:text-text text-xs"
                      title="Add label"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Due Date Preview */}
              {taskData?.due_date && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Due Date
                  </span>
                  <div
                    onClick={() => setShowDatesPicker(true)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      currentStatus?.name.toLowerCase() === 'done'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : isOverdue
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                        : 'bg-background border-border text-text'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(taskData.due_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {isOverdue && currentStatus?.name.toLowerCase() !== 'done' && (
                      <span className="text-[10px] uppercase font-bold bg-rose-500 text-white px-1 rounded">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" />
                  Description
                </h3>
                {!readOnly && !isEditingDescription && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>

              {!readOnly && isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    className="w-full text-xs bg-background border border-border rounded-xl p-3 text-text focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleSaveDescription}
                      disabled={updateTask.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDescription(taskData?.description || '');
                        setIsEditingDescription(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !readOnly && setIsEditingDescription(true)}
                  className={`p-3 rounded-xl border text-xs leading-relaxed transition-colors ${
                    !readOnly ? 'cursor-pointer' : ''
                  } ${
                    taskData?.description
                      ? 'bg-background border-border text-text hover:border-primary/40'
                      : 'bg-background/40 border-dashed border-border text-muted hover:bg-background'
                  }`}
                >
                  {taskData?.description ? (
                    <p className="whitespace-pre-wrap">{taskData.description}</p>
                  ) : (
                    <p className="italic">No description provided.</p>
                  )}
                </div>
              )}
            </div>

            {/* Checklists Section */}
            <div className="space-y-6">
              {taskData?.checklists?.map((checklist) => {
                const items = checklist.items || [];
                const completedCount = items.filter((item) => draftChecklistItems[item.id] ?? item.completed).length;
                const progressPct =
                  items.length > 0
                    ? Math.round((completedCount / items.length) * 100)
                    : 0;

                return (
                  <div
                    key={checklist.id}
                    className="space-y-3 bg-surface/40 p-4 border border-border/80 rounded-2xl"
                  >
                    {/* Checklist Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-primary" />
                        <h4 className="text-xs font-bold text-text">
                          {checklist.title}
                        </h4>
                      </div>
                      {!readOnly && (
                        <button
                          onClick={() => handleDeleteChecklist(checklist.id)}
                          className="text-muted hover:text-rose-500 p-1 rounded transition-colors"
                          title="Delete checklist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>


                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
                        <span>{progressPct}% completed</span>
                        <span>
                          {completedCount} / {items.length}
                        </span>
                      </div>
                      <div className="w-full bg-background border border-border rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            progressPct === 100 ? 'bg-emerald-500' : 'bg-primary'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Checklist Items */}
                    <div className="space-y-1.5 pt-1">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between p-1.5 hover:bg-background rounded-lg transition-colors"
                        >
                          <label className="flex items-center gap-2.5 text-xs text-text flex-1">
                            <input
                              type="checkbox"
                              disabled={readOnly}
                              checked={draftChecklistItems[item.id] ?? item.completed}
                              onChange={() =>
                                !readOnly && handleToggleChecklistItem(item.id, draftChecklistItems[item.id] ?? item.completed)
                              }
                              className={`rounded border-border text-primary focus:ring-primary w-4 h-4 ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                            />
                            <span
                              className={
                                (draftChecklistItems[item.id] ?? item.completed)
                                  ? 'line-through text-muted transition-all'
                                  : 'text-text font-medium transition-all'
                              }
                            >
                              {item.title}
                            </span>
                          </label>

                          {!readOnly && (
                            <button
                              onClick={() => handleDeleteChecklistItem(item.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-rose-500 rounded transition-opacity"
                              title="Delete item"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Item to Checklist */}
                    {!readOnly && (
                      activeChecklistId === checklist.id ? (
                        <div className="space-y-2 pt-1">
                          <input
                            type="text"
                            placeholder="Add an item..."
                            value={newItemTitles[checklist.id] || ''}
                            onChange={(e) =>
                              setNewItemTitles({
                                ...newItemTitles,
                                [checklist.id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddChecklistItem(checklist.id);
                              if (e.key === 'Escape') setActiveChecklistId(null);
                            }}
                            className="w-full text-xs bg-background border border-border rounded-lg p-2 text-text focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              className="h-7 text-xs"
                              onClick={() => handleAddChecklistItem(checklist.id)}
                              disabled={!newItemTitles[checklist.id]?.trim()}
                            >
                              Add
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setActiveChecklistId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveChecklistId(checklist.id)}
                          className="flex items-center gap-1.5 text-xs text-muted hover:text-text px-2 py-1 rounded-md hover:bg-background transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add an item
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>

            {/* Attachments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  Attachments ({taskData?.attachments?.length || 0})
                </h3>

                {!readOnly && (
                  <label className="cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <span className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      Upload File
                    </span>
                  </label>
                )}
              </div>

              {taskData?.attachments && taskData.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {taskData.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 bg-background border border-border rounded-xl flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text truncate">
                            {att.original_name}
                          </p>
                          <p className="text-[10px] text-muted">
                            {Math.round(att.size / 1024)} KB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(att.id, att.original_name)}
                          className="p-1 text-muted hover:text-text rounded"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {!readOnly && (
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="p-1 text-muted hover:text-rose-500 rounded"
                            title="Delete attachment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-background/50 border border-dashed border-border rounded-xl text-center">
                  <p className="text-xs text-muted">No files attached yet</p>
                </div>
              )}
            </div>

            {/* Comments & Activity Section */}
            <div className="space-y-4 pt-2 border-t border-border/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Discussion ({taskData?.comments?.length || 0})
              </h3>

              {/* Comment Input */}
              {!readOnly ? (
                <form onSubmit={handleAddComment} className="flex gap-3">
                  <Avatar
                    name={currentUser?.name || 'User'}
                    src={currentUser?.avatar}
                    size="sm"
                  />
                  <div className="flex-1 space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full text-xs bg-background border border-border rounded-xl p-2.5 text-text focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={!newComment.trim() || addComment.isPending}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        Comment
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-background/50 border border-dashed border-border rounded-xl text-center">
                  <p className="text-xs text-muted">Viewers have read-only access to discussions.</p>
                </div>
              )}


              {/* Comments Feed */}
              <div className="space-y-3 pt-2">
                {taskData?.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3 text-xs">
                    <Avatar
                      name={comment.user?.name || 'User'}
                      src={comment.user?.avatar}
                      size="sm"
                    />
                    <div className="flex-1 bg-background border border-border/70 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text">
                          {comment.user?.name}
                        </span>
                        <span className="text-[10px] text-muted">
                          {new Date(comment.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-text/90 leading-relaxed whitespace-pre-wrap">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar (Trello Quick Action Buttons / Read-only Info) */}
          <div className="space-y-6">
            {!readOnly ? (
              <>
                {/* Task tools section */}
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Task tools
                  </h4>

                  {/* Members Button & Popover */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMemberPicker(!showMemberPicker)}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-background hover:bg-surface border border-border rounded-xl text-xs font-semibold text-text transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-muted" />
                      Assign members
                    </button>

                    {showMemberPicker && (
                      <div className="absolute right-0 top-10 z-40 w-56 bg-surface border border-border rounded-xl shadow-xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex items-center justify-between border-b border-border pb-1.5">
                          <span className="text-xs font-bold text-text">Members</span>
                          <button
                            onClick={() => setShowMemberPicker(false)}
                            className="text-muted hover:text-text"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {members.map((m) => {
                            const memberId = m.user_id ?? m.pivot?.user_id ?? m.id;
                            const memberName = m.user?.name ?? m.name ?? 'User';
                            const memberAvatar = m.user?.avatar ?? m.avatar;
                            const isSelected = draftAssigneeIds.includes(memberId);
                            return (
                              <button
                                key={m.id}
                                onClick={() => handleToggleMember(memberId)}
                                className="w-full flex items-center justify-between p-1.5 hover:bg-background rounded-lg text-xs transition-colors"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Avatar
                                    name={memberName}
                                    src={memberAvatar}
                                    size="xs"
                                  />
                                  <span className="truncate">{memberName}</span>
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Labels Button & Popover */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLabelPicker(!showLabelPicker)}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-background hover:bg-surface border border-border rounded-xl text-xs font-semibold text-text transition-colors"
                    >
                      <Tag className="w-3.5 h-3.5 text-muted" />
                      Add labels
                    </button>

                    {showLabelPicker && (
                      <div className="absolute right-0 top-10 z-40 w-56 bg-surface border border-border rounded-xl shadow-xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex items-center justify-between border-b border-border pb-1.5">
                          <span className="text-xs font-bold text-text">Labels</span>
                          <button
                            onClick={() => setShowLabelPicker(false)}
                            className="text-muted hover:text-text"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {projectLabels.map((lbl) => {
                            const isAttached = draftLabelIds.includes(lbl.id);
                            return (
                              <button
                                key={lbl.id}
                                onClick={() => handleToggleLabel(lbl.id)}
                                className="w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-xs font-semibold text-white transition-transform hover:scale-102"
                                style={{ backgroundColor: lbl.color || '#6366F1' }}
                              >
                                <span>{lbl.name}</span>
                                {isAttached && <Check className="w-3.5 h-3.5 text-white" />}
                              </button>
                            );
                          })}

                          {projectLabels.length === 0 && (
                            <p className="text-[11px] text-muted text-center py-2">
                              No labels yet. Create one below.
                            </p>
                          )}
                        </div>

                        {!showLabelCreator ? (
                          <button
                            type="button"
                            onClick={() => setShowLabelCreator(true)}
                            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Create label
                          </button>
                        ) : (
                          <form onSubmit={handleCreateLabel} className="border-t border-border pt-2 space-y-2">
                            <input
                              value={newLabelName}
                              onChange={(event) => setNewLabelName(event.target.value)}
                              placeholder="Label name"
                              className="w-full text-xs bg-background border border-border rounded-lg p-2 text-text focus:outline-none focus:ring-1 focus:ring-primary"
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <input type="color" value={newLabelColor} onChange={(event) => setNewLabelColor(event.target.value)} className="w-8 h-8 rounded cursor-pointer" title="Label color" />
                              <Button type="submit" size="sm" className="flex-1 text-xs h-8" disabled={!newLabelName.trim()} isLoading={createProjectLabel.isPending}>
                                Save label
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Checklist Creator Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowChecklistCreator(!showChecklistCreator)}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-background hover:bg-surface border border-border rounded-xl text-xs font-semibold text-text transition-colors"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-muted" />
                      Create checklist
                    </button>

                    {showChecklistCreator && (
                      <form
                        onSubmit={handleCreateChecklist}
                        className="absolute right-0 top-10 z-40 w-56 bg-surface border border-border rounded-xl shadow-xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <div className="flex items-center justify-between border-b border-border pb-1.5">
                          <span className="text-xs font-bold text-text">Add Checklist</span>
                          <button
                            type="button"
                            onClick={() => setShowChecklistCreator(false)}
                            className="text-muted hover:text-text"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={newChecklistName}
                          onChange={(e) => setNewChecklistName(e.target.value)}
                          placeholder="Checklist title..."
                          className="w-full text-xs bg-background border border-border rounded-lg p-2 text-text focus:outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                        />

                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          className="w-full text-xs h-7"
                        >
                          Add Checklist
                        </Button>
                      </form>
                    )}
                  </div>

                  {/* Dates Picker Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowDatesPicker(!showDatesPicker)}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-background hover:bg-surface border border-border rounded-xl text-xs font-semibold text-text transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 text-muted" />
                      Set deadline
                    </button>

                    {showDatesPicker && (
                      <div className="absolute right-0 top-10 z-40 w-60 bg-surface border border-border rounded-xl shadow-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex items-center justify-between border-b border-border pb-1.5">
                          <span className="text-xs font-bold text-text">Due Date</span>
                          <button
                            onClick={() => setShowDatesPicker(false)}
                            className="text-muted hover:text-text"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => handleDueDateChange(e.target.value)}
                          className="w-full text-xs bg-background border border-border rounded-lg p-2 text-text focus:outline-none focus:ring-1 focus:ring-primary"
                        />

                        {dueDate && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-rose-500 h-7"
                            onClick={() => handleDueDateChange('')}
                          >
                            Remove date
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Attachment File Input Button */}
                  <div>
                    <label className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 bg-background hover:bg-surface border border-border rounded-xl text-xs font-semibold text-text transition-colors">
                      <Paperclip className="w-3.5 h-3.5 text-muted" />
                      Upload file
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.zip"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Actions section */}
                <div className="space-y-2.5 border-t border-border pt-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Actions
                  </h4>

                  {/* Priority Select */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted">
                      Priority
                    </label>
                    <select
                      value={draftPriority}
                      onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                      className="w-full text-xs bg-background border border-border rounded-xl p-2 text-text focus:outline-none"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button type="button" variant="primary" size="sm" onClick={handleSaveMetadata}>
                      Save changes
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={handleCancelMetadata}>
                      Cancel
                    </Button>
                  </div>

                  {/* Delete Card Button */}
                  <button
                    onClick={handleDeleteTask}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-colors mt-4"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete card
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3 bg-background/50 border border-border p-4 rounded-2xl">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Task Info
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted block mb-1">Priority</span>
                    <Badge variant={taskData?.priority === 'urgent' ? 'error' : taskData?.priority === 'high' ? 'warning' : 'neutral'} size="sm">
                      {taskData?.priority || 'medium'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted block mb-1">Status</span>
                    <span className="font-semibold text-text">{currentStatus?.name || '—'}</span>
                  </div>
                  {taskData?.due_date && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted block mb-1">Due Date</span>
                      <span className="font-medium text-text">{new Date(taskData.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
