import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { taskKeys, projectKeys, dashboardKeys } from '../api/queryKeys';
import type { Task, CreateTaskData, UpdateTaskData, ExtendDeadlineData } from '../types';

export const useTasks = (params?: {
  project_id?: number | string;
  status_id?: number | string;
  priority?: string;
  assigned_to_me?: boolean;
  due_soon?: boolean;
  search?: string;
}) => {
  return useQuery({
    queryKey: taskKeys.list(params as Record<string, unknown>),
    queryFn: async () => {
      const response = await api.get('/tasks', { params });
      return response.data.data as Task[];
    },
  });
};

export const useTask = (id?: number | string) => {
  const numericId = id ? Number(id) : undefined;

  return useQuery({
    queryKey: taskKeys.detail(numericId),
    queryFn: async () => {
      if (!numericId) throw new Error('Task ID is required');
      const response = await api.get(`/tasks/${numericId}`);
      return response.data.data as Task;
    },
    enabled: !!numericId,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskData & { project_id: number | string }) => {
      const numericProjectId = Number(data.project_id);
      const response = await api.post('/tasks', { ...data, project_id: numericProjectId });
      return response.data.data as Task;
    },
    onSuccess: (newTask) => {
      const numericTaskId = Number(newTask.id);
      const numericProjectId = Number(newTask.project_id);

      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(numericProjectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });

      if (numericTaskId) {
        queryClient.setQueryData(taskKeys.detail(numericTaskId), newTask);
      }
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: UpdateTaskData }) => {
      const numericId = Number(id);
      const response = await api.put(`/tasks/${numericId}`, data);
      return response.data.data as Task;
    },
    onSuccess: (updatedTask) => {
      const numericTaskId = Number(updatedTask.id);
      const numericProjectId = Number(updatedTask.project_id);

      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(numericTaskId) });
      if (numericProjectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(numericProjectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });

      queryClient.setQueryData(taskKeys.detail(numericTaskId), updatedTask);
    },
  });
};

export const useExtendTaskDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: ExtendDeadlineData }) => {
      const numericId = Number(id);
      const response = await api.post(`/tasks/${numericId}/extend-deadline`, data);
      return response.data.data as Task;
    },
    onSuccess: (updatedTask) => {
      const numericTaskId = Number(updatedTask.id);
      const numericProjectId = Number(updatedTask.project_id);

      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(numericTaskId) });
      if (numericProjectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(numericProjectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });

      queryClient.setQueryData(taskKeys.detail(numericTaskId), updatedTask);
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      statusId,
      position,
    }: {
      taskId: number | string;
      statusId: number | string;
      position?: number;
    }) => {
      const numericTaskId = Number(taskId);
      const numericStatusId = Number(statusId);
      const response = await api.put(`/tasks/${numericTaskId}/status`, {
        status_id: numericStatusId,
        position,
      });
      return response.data.data as Task;
    },
    onSuccess: (task) => {
      const numericTaskId = Number(task.id);
      const numericProjectId = Number(task.project_id);

      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(numericTaskId) });
      if (numericProjectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(numericProjectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });

      queryClient.setQueryData(taskKeys.detail(numericTaskId), task);
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: number | string; projectId?: number | string }) => {
      const numericId = Number(id);
      const numericProjectId = projectId ? Number(projectId) : undefined;
      await api.delete(`/tasks/${numericId}`);
      return { id: numericId, projectId: numericProjectId };
    },
    onSuccess: ({ id, projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

export const useToggleChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      completed,
      taskId,
      projectId,
    }: {
      itemId: number | string;
      completed: boolean;
      taskId?: number | string;
      projectId?: number | string;
    }) => {
      const numericItemId = Number(itemId);
      const response = await api.put(`/tasks/checklist-items/${numericItemId}`, { completed });
      return { data: response.data.data, taskId: taskId ? Number(taskId) : undefined, projectId: projectId ? Number(projectId) : undefined };
    },
    onSuccess: ({ taskId, projectId }) => {
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      }
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useAddChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      checklistId: number | string;
      title: string;
      taskId?: number | string;
      projectId?: number | string;
    }) => {
      const numericChecklistId = Number(payload.checklistId);
      const response = await api.post(`/tasks/checklists/${numericChecklistId}/items`, { title: payload.title });
      return {
        data: response.data.data,
        taskId: payload.taskId ? Number(payload.taskId) : undefined,
        projectId: payload.projectId ? Number(payload.projectId) : undefined,
      };
    },
    onSuccess: ({ taskId, projectId }) => {
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      }
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useDeleteChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      taskId,
      projectId,
    }: {
      itemId: number | string;
      taskId?: number | string;
      projectId?: number | string;
    }) => {
      const numericItemId = Number(itemId);
      await api.delete(`/tasks/checklist-items/${numericItemId}`);
      return { itemId: numericItemId, taskId: taskId ? Number(taskId) : undefined, projectId: projectId ? Number(projectId) : undefined };
    },
    onSuccess: ({ taskId, projectId }) => {
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      }
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useCreateChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, title, projectId }: { taskId: number | string; title: string; projectId?: number | string }) => {
      const numericTaskId = Number(taskId);
      const response = await api.post(`/tasks/${numericTaskId}/checklists`, { title });
      return { data: response.data.data, taskId: numericTaskId, projectId: projectId ? Number(projectId) : undefined };
    },
    onSuccess: ({ taskId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useDeleteChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ checklistId, taskId, projectId }: { checklistId: number | string; taskId?: number | string; projectId?: number | string }) => {
      const numericChecklistId = Number(checklistId);
      await api.delete(`/tasks/checklists/${numericChecklistId}`);
      return { checklistId: numericChecklistId, taskId: taskId ? Number(taskId) : undefined, projectId: projectId ? Number(projectId) : undefined };
    },
    onSuccess: ({ taskId, projectId }) => {
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      }
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, body, projectId }: { taskId: number | string; body: string; projectId?: number | string }) => {
      const numericTaskId = Number(taskId);
      const response = await api.post(`/tasks/${numericTaskId}/comments`, { body });
      return { data: response.data.data, taskId: numericTaskId, projectId: projectId ? Number(projectId) : undefined };
    },
    onSuccess: ({ taskId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

export const useAssignTaskMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      userId,
      projectId,
    }: {
      taskId: number | string;
      userId: number | string;
      projectId?: number | string;
    }) => {
      const numericTaskId = Number(taskId);
      const numericUserId = Number(userId);
      const response = await api.post(`/tasks/${numericTaskId}/assign`, { user_id: numericUserId });
      return { data: response.data.data, taskId: numericTaskId, projectId: projectId ? Number(projectId) : undefined };
    },
    onSuccess: ({ taskId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

export const useUnassignTaskMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      userId,
      projectId,
    }: {
      taskId: number | string;
      userId: number | string;
      projectId?: number | string;
    }) => {
      const numericTaskId = Number(taskId);
      const numericUserId = Number(userId);
      await api.delete(`/tasks/${numericTaskId}/assign/${numericUserId}`);
      return { taskId: numericTaskId, projectId: projectId ? Number(projectId) : undefined };
    },
    onSuccess: ({ taskId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

export const useAttachTaskLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      labelIds,
      projectId,
    }: {
      taskId: number | string;
      labelIds: (number | string)[];
      projectId?: number | string;
    }) => {
      const numericTaskId = Number(taskId);
      const numericLabelIds = labelIds.map((id) => Number(id));
      const response = await api.post(`/tasks/${numericTaskId}/labels`, { label_ids: numericLabelIds });
      return { data: response.data.data, taskId: numericTaskId, projectId: projectId ? Number(projectId) : undefined };
    },
    onSuccess: ({ taskId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useDetachTaskLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      labelId,
      projectId,
    }: {
      taskId: number | string;
      labelId: number | string;
      projectId?: number | string;
    }) => {
      const numericTaskId = Number(taskId);
      const numericLabelId = Number(labelId);
      await api.delete(`/tasks/${numericTaskId}/labels/${numericLabelId}`);
      return { taskId: numericTaskId, projectId: projectId ? Number(projectId) : undefined };
    },
    onSuccess: ({ taskId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useUploadAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, file, projectId }: { taskId: number | string; file: File; projectId?: number | string }) => {
      const numericTaskId = Number(taskId);
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/tasks/${numericTaskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { data: response.data.data, taskId: numericTaskId, projectId: projectId ? Number(projectId) : undefined };
    },
    onSuccess: ({ taskId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attachmentId, taskId, projectId }: { attachmentId: number | string; taskId: number | string; projectId?: number | string }) => {
      const numericAttachmentId = Number(attachmentId);
      const numericTaskId = Number(taskId);
      await api.delete(`/tasks/attachments/${numericAttachmentId}`);
      return { taskId: numericTaskId, projectId: projectId ? Number(projectId) : undefined };
    },
    onSuccess: ({ taskId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

