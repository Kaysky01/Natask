import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useCreateTask } from '../../hooks/useTasks';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Label, ProjectMember, TaskStatus, Priority } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  projectId: number;
  statuses: TaskStatus[];
  members: ProjectMember[];
  projectLabels: Label[];
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  projectId,
  statuses,
  members,
  projectLabels,
  onClose,
}) => {
  const createTask = useCreateTask();
  const { error: toastError } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState<number | ''>('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [labelIds, setLabelIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setStatusId(statuses[0]?.id || '');
      setPriority('medium');
      setDueDate('');
      setAssigneeIds([]);
      setLabelIds([]);
    }
  }, [isOpen, statuses]);

  const toggleId = (ids: number[], id: number, setIds: React.Dispatch<React.SetStateAction<number[]>>) => {
    setIds(ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    try {
      await createTask.mutateAsync({
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        status_id: statusId || undefined,
        priority,
        due_date: dueDate || undefined,
        assignee_ids: assigneeIds,
        label_ids: labelIds,
      });
      onClose();
    } catch (err: any) {
      toastError(err?.response?.data?.message || 'Failed to create task. Please try again.', 'Task not created');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-text">New Task</h2>
            <p className="text-xs text-muted mt-0.5">Add the details your team needs to get started.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-muted hover:text-text rounded-lg" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text">Task title <span className="text-error">*</span></label>
            <Input
              autoFocus
              placeholder="What needs to be done?"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">Status</label>
              <select value={statusId} onChange={(event) => setStatusId(event.target.value ? Number(event.target.value) : '')} className="w-full text-xs bg-background border border-border rounded-xl p-2.5 text-text">
                {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">Priority</label>
              <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} className="w-full text-xs bg-background border border-border rounded-xl p-2.5 text-text">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text">Deadline</label>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full text-xs bg-background border border-border rounded-xl p-2.5 text-text" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text">Assign to</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-28 overflow-y-auto">
              {members.map((member) => {
                const userId = member.user_id ?? member.pivot?.user_id ?? member.id;
                const userName = member.user?.name ?? member.name ?? 'User';
                const selected = assigneeIds.includes(userId);
                return (
                  <button key={userId} type="button" onClick={() => toggleId(assigneeIds, userId, setAssigneeIds)} className={`flex items-center gap-2 px-2.5 py-2 text-left text-xs rounded-lg border transition-colors ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text hover:bg-background'}`}>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${selected ? 'bg-primary border-primary text-white' : 'border-border'}`}>
                      {selected && <Check className="w-3 h-3" />}
                    </span>
                    <span className="truncate">{userName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {projectLabels.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text">Labels</label>
              <div className="flex flex-wrap gap-2">
                {projectLabels.map((label) => {
                  const selected = labelIds.includes(label.id);
                  return (
                    <button key={label.id} type="button" onClick={() => toggleId(labelIds, label.id, setLabelIds)} className={`px-2.5 py-1 text-[11px] rounded-full border ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:text-text'}`}>
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text">Description</label>
            <textarea rows={4} placeholder="Add context, acceptance criteria, or notes..." value={description} onChange={(event) => setDescription(event.target.value)} className="w-full text-xs bg-background border border-border rounded-xl p-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" disabled={!title.trim()} isLoading={createTask.isPending}>Save Task</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;