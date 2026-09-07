import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { projectKeys, taskKeys, dashboardKeys } from '../api/queryKeys';
import type { Project, CreateProjectData, UpdateProjectData } from '../types';

export const useProjects = (params?: { status?: string; priority?: string; search?: string }) => {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      const response = await api.get('/projects', { params });
      return response.data.data as Project[];
    },
  });
};

export const useProject = (id?: number | string) => {
  const numericId = id ? Number(id) : undefined;

  return useQuery({
    queryKey: projectKeys.detail(numericId),
    queryFn: async () => {
      if (!numericId) throw new Error('Project ID is required');
      const response = await api.get(`/projects/${numericId}`);
      return response.data.data as Project;
    },
    enabled: !!numericId,
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
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      if (newProject?.id) {
        queryClient.setQueryData(projectKeys.detail(newProject.id), newProject);
      }
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: UpdateProjectData }) => {
      const numericId = Number(id);
      const response = await api.put(`/projects/${numericId}`, data);
      return response.data.data as Project;
    },
    onSuccess: (data) => {
      const numericId = Number(data.id);
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(numericId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      const numericId = Number(id);
      await api.delete(`/projects/${numericId}`);
      return numericId;
    },
    onSuccess: (numericId) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.removeQueries({ queryKey: projectKeys.detail(numericId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

export const useAddProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, email, role }: { projectId: number | string; email: string; role?: string }) => {
      const numericProjectId = Number(projectId);
      const response = await api.post(`/projects/${numericProjectId}/members`, { email, role });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      const numericProjectId = Number(variables.projectId);
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(numericProjectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useCreateProjectInvitation = () => {
  return useMutation({
    mutationFn: async ({
      projectId,
      role,
      expires_in = '10m',
    }: {
      projectId: number | string;
      role: 'admin' | 'member' | 'viewer';
      expires_in?: '5m' | '10m' | '15m' | 'never';
    }) => {
      const numericProjectId = Number(projectId);
      const response = await api.post(`/projects/${numericProjectId}/invitations`, { role, expires_in });
      return response.data.data as {
        id: number;
        role: string;
        expires_at: string | null;
        expires_in_seconds: number | null;
        url: string;
      };
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
      const numericProjectId = Number(data.project.id);
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(numericProjectId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: number | string; userId: number | string }) => {
      const numericProjectId = Number(projectId);
      const numericUserId = Number(userId);
      await api.delete(`/projects/${numericProjectId}/members/${numericUserId}`);
      return { projectId: numericProjectId, userId: numericUserId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useUpdateProjectMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
      role,
    }: {
      projectId: number | string;
      userId: number | string;
      role: 'admin' | 'member' | 'viewer';
    }) => {
      const numericProjectId = Number(projectId);
      const numericUserId = Number(userId);
      await api.put(`/projects/${numericProjectId}/members/${numericUserId}`, { role });
      return { projectId: numericProjectId, userId: numericUserId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useCreateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      name,
      color,
    }: {
      projectId: number | string;
      name: string;
      color?: string;
    }) => {
      const numericProjectId = Number(projectId);
      const response = await api.post(`/projects/${numericProjectId}/statuses`, { name, color });
      return { data: response.data.data, projectId: numericProjectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
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
      projectId: number | string;
      statusId: number | string;
      name?: string;
      color?: string;
    }) => {
      const numericProjectId = Number(projectId);
      const numericStatusId = Number(statusId);
      const response = await api.put(`/projects/${numericProjectId}/statuses/${numericStatusId}`, { name, color });
      return { data: response.data.data, projectId: numericProjectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useDeleteTaskStatusColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      statusId,
    }: {
      projectId: number | string;
      statusId: number | string;
    }) => {
      const numericProjectId = Number(projectId);
      const numericStatusId = Number(statusId);
      await api.delete(`/projects/${numericProjectId}/statuses/${numericStatusId}`);
      return { projectId: numericProjectId, statusId: numericStatusId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useSetupDefaultStatuses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: number | string) => {
      const numericProjectId = Number(projectId);
      const response = await api.post(`/projects/${numericProjectId}/setup-defaults`);
      return { data: response.data.data, projectId: numericProjectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useCreateProjectLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      name,
      color,
    }: {
      projectId: number | string;
      name: string;
      color?: string;
    }) => {
      const numericProjectId = Number(projectId);
      const response = await api.post(`/projects/${numericProjectId}/labels`, { name, color });
      return { data: response.data.data, projectId: numericProjectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

