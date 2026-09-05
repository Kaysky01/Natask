import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Project, CreateProjectData, UpdateProjectData } from '../types';

export const useProjects = (params?: { status?: string; priority?: string; search?: string }) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const response = await api.get('/projects', { params });
      return response.data.data as Project[];
    },
  });
};

export const useProject = (id?: number | string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      const response = await api.get(`/projects/${id}`);
      return response.data.data as Project;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async (data: CreateProjectData) => {
      const response = await api.post('/projects', data);
      return response.data.data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProjectData }) => {
      const response = await api.put(`/projects/${id}`, data);
      return response.data.data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/projects/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.removeQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useAddProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, email, role }: { projectId: number; email: string; role?: string }) => {
      const response = await api.post(`/projects/${projectId}/members`, { email, role });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });
};

export const useCreateProjectInvitation = () => {
  return useMutation({
    mutationFn: async ({ projectId, role }: { projectId: number; role: 'admin' | 'member' | 'viewer' }) => {
      const response = await api.post(`/projects/${projectId}/invitations`, { role });
      return response.data.data as { id: number; role: string; expires_at: string; url: string };
    },
  });
};

export const useAcceptProjectInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await api.post(`/invitations/${token}/accept`);
      return response.data.data as {
        project: { id: number; name: string; slug: string };
        role: string;
        already_member?: boolean;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['project', data.project.id] });
    },
  });
};

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: number; userId: number }) => {
      await api.delete(`/projects/${projectId}/members/${userId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });
};

export const useUpdateProjectMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId, role }: { projectId: number; userId: number; role: 'admin' | 'member' | 'viewer' }) => {
      await api.put(`/projects/${projectId}/members/${userId}`, { role });
      return { projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
};

export const useCreateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, name, color }: { projectId: number; name: string; color?: string }) => {
      const response = await api.post(`/projects/${projectId}/statuses`, { name, color });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });
};

export const useUpdateTaskStatusColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      statusId,
      name,
      color,
    }: {
      projectId: number;
      statusId: number;
      name?: string;
      color?: string;
    }) => {
      const response = await api.put(`/projects/${projectId}/statuses/${statusId}`, { name, color });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });
};

export const useDeleteTaskStatusColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, statusId }: { projectId: number; statusId: number }) => {
      await api.delete(`/projects/${projectId}/statuses/${statusId}`);
      return { projectId, statusId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useSetupDefaultStatuses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: number) => {
      const response = await api.post(`/projects/${projectId}/setup-defaults`);
      return response.data.data;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
};

export const useCreateProjectLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, name, color }: { projectId: number; name: string; color?: string }) => {
      const response = await api.post(`/projects/${projectId}/labels`, { name, color });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });
};

