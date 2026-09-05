import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  CheckSquare,
  MessageSquare,
  Calendar,
  GripVertical,
  Paperclip,
  Search,
  Filter,
  MoreHorizontal,
  X,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import type { Task, TaskStatus, ProjectMember, Label } from '../../types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useCreateTask, useUpdateTaskStatus } from '../../hooks/useTasks';
import {
  useCreateTaskStatus,
  useUpdateTaskStatusColumn,
  useDeleteTaskStatusColumn,
  useSetupDefaultStatuses,
} from '../../hooks/useProjects';
import { TaskDetailModal } from '../task/TaskDetailModal';

interface KanbanBoardProps {
  projectId: number;
  statuses: TaskStatus[];
  tasks: Task[];
  members: ProjectMember[];
  labels?: Label[];
  readOnly?: boolean;
}

// Single Sortable Task Card
const TaskCard: React.FC<{
  task: Task;
  onClick: () => void;
  statuses: TaskStatus[];
  statusId: number;
  onStatusDraft: (taskId: number, statusId: number) => void;
  readOnly?: boolean;
}> = ({ task, onClick, statuses, statusId, onStatusDraft, readOnly = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: readOnly });


  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const allItems = task.checklists?.flatMap((c) => c.items || []) || [];
  const completedItems = allItems.filter((i) => i.completed).length;
  const isAllChecklistDone = allItems.length > 0 && completedItems === allItems.length;

  const priorityVariant =
    task.priority === 'urgent'
      ? 'error'
      : task.priority === 'high'
      ? 'warning'
      : task.priority === 'low'
      ? 'neutral'
      : 'info';

  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  const isDoneStatus = task.status?.name?.toLowerCase() === 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className="group relative p-3.5 bg-surface hover:bg-surface/90 border border-border/80 hover:border-primary/50 rounded-xl shadow-xs transition-all cursor-pointer space-y-2.5"
    >
      {/* Labels pill stack if present */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((lbl) => (
            <span
              key={lbl.id}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white tracking-wide"
              style={{ backgroundColor: lbl.color || '#6366F1' }}
            >
              {lbl.name}
            </span>
          ))}
        </div>
      )}

      {/* Priority, status, and drag handle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant={priorityVariant} size="sm">
            {task.priority}
          </Badge>
          <select
            value={statusId}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => onStatusDraft(task.id, Number(event.target.value))}
            className="max-w-[115px] text-[10px] bg-background border border-border rounded-md px-1.5 py-1 text-text focus:outline-none focus:ring-1 focus:ring-primary"
            title="Change task status"
          >
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>{status.name}</option>
            ))}
          </select>
        </div>

        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="p-1 text-muted/40 group-hover:text-muted hover:bg-background rounded cursor-grab active:cursor-grabbing transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-semibold text-text leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Footer Info: Checklist, Comments, Attachments, Due Date, Assignees */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-muted gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          {allItems.length > 0 && (
            <span
              className={`flex items-center gap-1 font-medium px-1.5 py-0.5 rounded text-[10px] ${
                isAllChecklistDone
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-muted'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              {completedItems}/{allItems.length}
            </span>
          )}

          {(task.comments_count ?? 0) > 0 && (
            <span className="flex items-center gap-1 font-medium">
              <MessageSquare className="w-3 h-3 text-muted" />
              {task.comments_count}
            </span>
          )}

          {(task.attachments_count ?? 0) > 0 && (
            <span className="flex items-center gap-1 font-medium">
              <Paperclip className="w-3 h-3 text-muted" />
              {task.attachments_count}
            </span>
          )}

          {task.due_date && (
            <span
              className={`flex items-center gap-1 font-medium text-[10px] px-1.5 py-0.5 rounded ${
                isDoneStatus
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : isOverdue
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
                  : 'text-muted'
              }`}
            >
              <Calendar className="w-3 h-3" />
              {new Date(task.due_date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Assignees avatars stack */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
            {task.assignees.slice(0, 3).map((u) => (
              <Avatar key={u.id} name={u.name} src={u.avatar} size="xs" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Kanban Column
const KanbanColumn: React.FC<{
  projectId: number;
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (statusId: number, title: string) => Promise<void>;
  statuses: TaskStatus[];
  pendingTaskStatuses: Record<number, number>;
  onStatusDraft: (taskId: number, statusId: number) => void;
  readOnly?: boolean;
}> = ({ projectId, status, tasks, onTaskClick, onAddTask, statuses, pendingTaskStatuses, onStatusDraft, readOnly = false }) => {

  const [isAdding, setIsAdding] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnName, setColumnName] = useState(status.name);

  const updateColumn = useUpdateTaskStatusColumn();
  const deleteColumn = useDeleteTaskStatusColumn();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const title = taskTitle.trim();
    setTaskTitle('');
    await onAddTask(status.id, title);
  };

  const handleRenameColumn = async () => {
    if (!columnName.trim() || columnName === status.name) {
      setIsEditingTitle(false);
      return;
    }
    await updateColumn.mutateAsync({
      projectId,
      statusId: status.id,
      name: columnName.trim(),
    });
    setIsEditingTitle(false);
  };

  const handleChangeColor = async (color: string) => {
    await updateColumn.mutateAsync({
      projectId,
      statusId: status.id,
      color,
    });
    setIsMenuOpen(false);
  };

  const handleDeleteColumn = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete the "${status.name}" list? Any tasks inside will be moved to another list.`
      )
    ) {
      await deleteColumn.mutateAsync({
        projectId,
        statusId: status.id,
      });
      setIsMenuOpen(false);
    }
  };

  const colorPalette = [
    '#64748B', // Slate
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
  ];

  return (
    <div className="w-72 shrink-0 flex flex-col bg-surface/50 dark:bg-surface/30 border border-border/80 rounded-2xl p-3 max-h-[calc(100vh-210px)] relative">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2.5 px-1 border-b border-border/60 mb-2.5 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: status.color || '#64748B' }}
          />

          {isEditingTitle && !readOnly ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameColumn();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                className="w-full text-xs font-bold bg-background border border-primary/40 rounded px-1.5 py-0.5 text-text focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleRenameColumn}
                className="p-1 text-primary hover:bg-primary/10 rounded"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <h3
              onClick={() => {
                if (!readOnly) setIsEditingTitle(true);
              }}
              className={`text-xs font-bold text-text uppercase tracking-wider truncate ${
                !readOnly ? 'cursor-pointer hover:underline' : ''
              }`}
              title={!readOnly ? 'Click to rename' : undefined}
            >
              {status.name}
            </h3>
          )}

          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface border border-border text-muted shrink-0">
            {tasks.length}
          </span>
        </div>

        {/* Right Header Action Buttons */}
        <div className="flex items-center gap-0.5 relative">
          {!readOnly && (
            <>
              <button
                onClick={() => setIsAdding(true)}
                className="p-1 text-muted hover:text-text rounded-md hover:bg-surface transition-colors"
                title="Add task to this list"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 text-muted hover:text-text rounded-md hover:bg-surface transition-colors"
                title="List actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </>
          )}

          {/* List Actions Dropdown */}
          {!readOnly && isMenuOpen && (
            <div className="absolute right-0 top-7 z-30 w-48 bg-surface border border-border rounded-xl shadow-lg p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100">
              <p className="text-[11px] font-semibold text-muted px-2">List actions</p>

              <button
                onClick={() => {
                  setIsEditingTitle(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-text hover:bg-background rounded-lg transition-colors text-left"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Rename list
              </button>

              <button
                onClick={() => {
                  setIsAdding(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-text hover:bg-background rounded-lg transition-colors text-left"
              >
                <Plus className="w-3.5 h-3.5" />
                Add card
              </button>

              <div className="border-t border-border pt-2 px-2">
                <p className="text-[10px] text-muted mb-1.5 font-medium">Color accent</p>
                <div className="flex items-center gap-1.5">
                  {colorPalette.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleChangeColor(c)}
                      className="w-4 h-4 rounded-full border border-black/10 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-1">
                <button
                  onClick={handleDeleteColumn}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete list
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task List (Droppable & Scrollable) */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[100px] max-h-[calc(100vh-300px)]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              statuses={statuses}
              statusId={pendingTaskStatuses[task.id] ?? task.status_id}
              onStatusDraft={onStatusDraft}
              readOnly={readOnly}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <div className="py-7 text-center border border-dashed border-border/70 rounded-xl">
            <p className="text-[11px] text-muted">No cards here</p>
          </div>
        )}

        {/* Inline Trello-style Quick Add Form */}
        {!readOnly && isAdding && (
          <form
            onSubmit={handleCreate}
            className="p-2.5 bg-surface border border-primary/40 rounded-xl space-y-2 shadow-sm animate-in fade-in duration-100"
          >
            <textarea
              placeholder="Enter a title for this card..."
              className="w-full text-xs bg-background border border-border rounded-lg p-2 text-text focus:outline-none focus:ring-1 focus:ring-primary resize-none h-16"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreate(e);
                }
                if (e.key === 'Escape') {
                  setIsAdding(false);
                }
              }}
              autoFocus
            />
            <div className="flex items-center justify-between gap-1.5">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="h-7 text-xs px-2.5"
                disabled={!taskTitle.trim()}
              >
                Add card
              </Button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 text-muted hover:text-text rounded"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bottom "+ Add a card" button if not currently adding */}
      {!readOnly && !isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted hover:text-text hover:bg-surface rounded-lg transition-colors w-full text-left"
        >
          <Plus className="w-3.5 h-3.5" />
          Add a card
        </button>
      )}
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  statuses,
  tasks,
  members,
  labels = [],
  readOnly = false,
}) => {

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Board Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedDueDate, setSelectedDueDate] = useState<string>('all');

  // Add Column Inline State
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [pendingTaskStatuses, setPendingTaskStatuses] = useState<Record<number, number>>({});

  const createTask = useCreateTask();
  const updateTaskStatus = useUpdateTaskStatus();
  const createStatus = useCreateTaskStatus();
  const setupDefaults = useSetupDefaultStatuses();
  const { error: toastError } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchDesc = task.description?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }

      // Assignee filter
      if (selectedAssignee !== 'all') {
        if (selectedAssignee === 'unassigned') {
          if (task.assignees && task.assignees.length > 0) return false;
        } else {
          const assigneeId = Number(selectedAssignee);
          if (!task.assignees?.some((a) => a.id === assigneeId)) return false;
        }
      }

      // Priority filter
      if (selectedPriority !== 'all') {
        if (task.priority !== selectedPriority) return false;
      }

      // Due date filter
      if (selectedDueDate !== 'all') {
        if (!task.due_date) return false;
        const due = new Date(task.due_date);
        const now = new Date();
        if (selectedDueDate === 'overdue') {
          if (due >= now) return false;
        } else if (selectedDueDate === 'week') {
          const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (due < now || due > in7Days) return false;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, selectedAssignee, selectedPriority, selectedDueDate]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedAssignee !== 'all' ||
    selectedPriority !== 'all' ||
    selectedDueDate !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAssignee('all');
    setSelectedPriority('all');
    setSelectedDueDate('all');
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleAddTask = async (statusId: number, title: string) => {
    await createTask.mutateAsync({
      project_id: projectId,
      status_id: statusId,
      title,
      priority: 'medium',
    });
  };

  const handleTaskStatusDraft = (taskId: number, statusId: number) => {
    setPendingTaskStatuses((current) => ({ ...current, [taskId]: statusId }));
  };

  const handleSaveTaskStatuses = async () => {
    try {
      await Promise.all(Object.entries(pendingTaskStatuses).map(([taskId, statusId]) =>
        updateTaskStatus.mutateAsync({ taskId: Number(taskId), statusId })
      ));
      setPendingTaskStatuses({});
    } catch (err: any) {
      toastError(err?.response?.data?.message || 'Could not save task status changes.', 'Save failed');
    }
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    await createStatus.mutateAsync({
      projectId,
      name: newListTitle.trim(),
    });

    setNewListTitle('');
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = Number(active.id);
    const activeTask = tasks.find((t) => t.id === activeTaskId);
    if (!activeTask) return;

    // Determine target column / status
    let targetStatusId: number | null = null;

    // Check if over a task card
    const overTaskId = Number(over.id);
    const overTask = tasks.find((t) => t.id === overTaskId);
    if (overTask) {
      targetStatusId = pendingTaskStatuses[overTask.id] ?? overTask.status_id;
    } else {
      // Over a column
      const overStatus = statuses.find((s) => s.id === Number(over.id));
      if (overStatus) {
        targetStatusId = overStatus.id;
      }
    }

    const currentStatusId = pendingTaskStatuses[activeTaskId] ?? activeTask.status_id;
    if (targetStatusId && targetStatusId !== currentStatusId) {
      handleTaskStatusDraft(activeTaskId, targetStatusId);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      {/* Trello-style Filter & Search Toolbar */}
      <div className="border-b border-border/80 px-6 py-2.5 bg-surface/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cards in this board..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="text-xs bg-surface border border-border rounded-lg px-2.5 py-1 text-text focus:outline-none"
          >
            <option value="all">All Members</option>
            <option value="unassigned">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.user_id}>
                {m.user?.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-surface border border-border rounded-lg px-2.5 py-1 text-text focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Due Date Filter */}
          <select
            value={selectedDueDate}
            onChange={(e) => setSelectedDueDate(e.target.value)}
            className="text-xs bg-surface border border-border rounded-lg px-2.5 py-1 text-text focus:outline-none"
          >
            <option value="all">All Due Dates</option>
            <option value="overdue">Overdue</option>
            <option value="week">Due This Week</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-primary hover:underline px-2 py-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}

          <div className="text-[11px] text-muted pl-2 border-l border-border">
            {filteredTasks.length} / {tasks.length} cards
          </div>
          {Object.keys(pendingTaskStatuses).length > 0 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-border">
              <button
                type="button"
                onClick={handleSaveTaskStatuses}
                disabled={updateTaskStatus.isPending}
                className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >
                Save changes
              </button>
              <button type="button" onClick={() => setPendingTaskStatuses({})} className="text-xs text-muted hover:text-text">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Board Canvas */}
      <div className="flex-1 overflow-x-auto p-4 md:p-6 min-h-0 flex items-start">
        {/* Onboarding Empty State if 0 statuses */}
        {statuses.length === 0 ? (
          <div className="m-auto max-w-md text-center p-8 bg-surface border border-border rounded-2xl shadow-sm space-y-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-text">No Lists on this Board</h3>
              <p className="text-xs text-muted">
                Every board needs lists like "To Do", "In Progress", and "Done" to organize tasks.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setupDefaults.mutate(projectId)}
                disabled={setupDefaults.isPending}
              >
                {setupDefaults.isPending ? 'Setting up...' : '✨ Generate Default Lists'}
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 items-start pb-4">
              {/* Render Columns */}
              {statuses.map((status) => {
                const columnTasks = filteredTasks.filter((t) => (pendingTaskStatuses[t.id] ?? t.status_id) === status.id);
                return (
                  <KanbanColumn
                    key={status.id}
                    projectId={projectId}
                    status={status}
                    tasks={columnTasks}
                    onTaskClick={handleTaskClick}
                    onAddTask={handleAddTask}
                    statuses={statuses}
                    pendingTaskStatuses={pendingTaskStatuses}
                    onStatusDraft={handleTaskStatusDraft}
                    readOnly={readOnly}
                  />
                );
              })}

              {/* Trello "+ Add another list" Column */}
              {!readOnly && (
                <div className="w-72 shrink-0">
                  {isAddingList ? (
                    <form
                      onSubmit={handleAddList}
                      className="p-3 bg-surface border border-primary/40 rounded-2xl space-y-2.5 shadow-sm animate-in fade-in duration-100"
                    >
                      <input
                        type="text"
                        placeholder="Enter list title..."
                        value={newListTitle}
                        onChange={(e) => setNewListTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setIsAddingList(false);
                        }}
                        className="w-full text-xs font-semibold bg-background border border-border rounded-xl p-2.5 text-text focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          className="text-xs h-8"
                          disabled={!newListTitle.trim() || createStatus.isPending}
                        >
                          {createStatus.isPending ? 'Adding...' : 'Add list'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setIsAddingList(false)}
                          className="p-1.5 text-muted hover:text-text rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsAddingList(true)}
                      className="w-full flex items-center gap-2 p-3 rounded-2xl bg-surface/40 hover:bg-surface/80 border border-dashed border-border hover:border-primary/50 text-xs font-semibold text-muted hover:text-text transition-all"
                    >
                      <Plus className="w-4 h-4 text-primary" />
                      Add another list
                    </button>
                  )}
                </div>
              )}
            </div>
          </DndContext>
        )}
      </div>

      {/* Trello-Style Card Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        statuses={statuses}
        members={members}
        projectLabels={labels}
        readOnly={readOnly}
      />
    </div>
  );
};

export default KanbanBoard;

