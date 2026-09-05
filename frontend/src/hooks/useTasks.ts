import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Task, CreateTaskData, UpdateTaskData } from '../types';

export const useTasks = (params?: {
  project_id?: number;
  status_id?: number;
  priority?: string;
  assigned_to_me?: boolean;
  due_soon?: boolean;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const response = await api.get('/tasks', { params });
      return response.data.data as Task[];
    },
  });
};

export const useTask = (id?: number) => {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      if (!id) throw new Error('Task ID is required');
      const response = await api.get(`/tasks/${id}`);
      return response.data.data as Task;
    },
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskData & { project_id: number }) => {
      const response = await api.post('/tasks', data);
      return response.data.data as Task;
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project', newTask.project_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTaskData }) => {
      const response = await api.put(`/tasks/${id}`, data);
      return response.data.data as Task;
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', updatedTask.id] });
      queryClient.invalidateQueries({ queryKey: ['project', updatedTask.project_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, statusId, position }: { taskId: number; statusId: number; position?: number }) => {
      const response = await api.put(`/tasks/${taskId}/status`, {
        status_id: statusId,
        position,
      });
      return response.data.data as Task;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['project', task.project_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: number; projectId?: number }) => {
      await api.delete(`/tasks/${id}`);
      return { id, projectId };
    },
    onSuccess: ({ id, projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.removeQueries({ queryKey: ['task', id] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useToggleChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: number; completed: boolean; taskId?: number }) => {
      const response = await api.put(`/tasks/checklist-items/${itemId}`, { completed });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      if (variables.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      }
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
};

export const useAddChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { checklistId: number; title: string; taskId?: number }) => {
      const response = await api.post(`/tasks/checklists/${payload.checklistId}/items`, { title: payload.title });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      if (variables.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      }
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, body }: { taskId: number; body: string }) => {
      const response = await api.post(`/tasks/${taskId}/comments`, { body });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useCreateChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, title }: { taskId: number; title: string }) => {
      const response = await api.post(`/tasks/${taskId}/checklists`, { title });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
};

export const useDeleteChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ checklistId }: { checklistId: number; taskId?: number }) => {
      await api.delete(`/tasks/checklists/${checklistId}`);
      return checklistId;
    },
    onSuccess: (_, variables) => {
      if (variables.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      }
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
};

export const useDeleteChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId }: { itemId: number; taskId?: number }) => {
      await api.delete(`/tasks/checklist-items/${itemId}`);
      return itemId;
    },
    onSuccess: (_, variables) => {
      if (variables.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      }
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
};

export const useAssignTaskMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: number; userId: number }) => {
      const response = await api.post(`/tasks/${taskId}/assign`, { user_id: userId });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
};

export const useUnassignTaskMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: number; userId: number }) => {
      await api.delete(`/tasks/${taskId}/assign/${userId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
};

export const useAttachTaskLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, labelIds }: { taskId: number; labelIds: number[] }) => {
      const response = await api.post(`/tasks/${taskId}/labels`, { label_ids: labelIds });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
};

export const useDetachTaskLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, labelId }: { taskId: number; labelId: number }) => {
      await api.delete(`/tasks/${taskId}/labels/${labelId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
};

export const useUploadAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, file }: { taskId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attachmentId }: { taskId: number; attachmentId: number }) => {
      await api.delete(`/tasks/attachments/${attachmentId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
};

