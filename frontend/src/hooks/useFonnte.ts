import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { fonnteKeys } from '../api/queryKeys';

export interface FonnteSettingsData {
  id?: number;
  is_enabled: boolean;
  api_token?: string;
  is_token_set?: boolean;
  api_endpoint: string;
  target_type: 'group' | 'personal' | 'both';
  group_target: string;
  notify_task_created: boolean;
  notify_task_status_changed: boolean;
  notify_task_commented: boolean;
  notify_member_joined: boolean;
  sender_number?: string | null;
  device_status?: string | null;
  updated_at?: string;
}

export const useFonnteSettings = (projectId: number | string | undefined) => {
  const numericProjectId = projectId ? Number(projectId) : undefined;

  return useQuery<FonnteSettingsData>({
    queryKey: fonnteKeys.detail(numericProjectId),
    queryFn: async () => {
      if (!numericProjectId) throw new Error('Project ID required');
      const response = await api.get(`/projects/${numericProjectId}/fonnte`);
      return response.data.data;
    },
    enabled: !!numericProjectId,
  });
};

export const useUpdateFonnteSettings = (projectId: number | string | undefined) => {
  const queryClient = useQueryClient();
  const numericProjectId = projectId ? Number(projectId) : undefined;

  return useMutation({
    mutationFn: async (payload: Partial<FonnteSettingsData>) => {
      if (!numericProjectId) throw new Error('Project ID required');
      const response = await api.post(`/projects/${numericProjectId}/fonnte`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      if (numericProjectId) {
        queryClient.invalidateQueries({ queryKey: fonnteKeys.detail(numericProjectId) });
      }
    },
  });
};

export const useCheckFonnteDevice = (projectId: number | string | undefined) => {
  const queryClient = useQueryClient();
  const numericProjectId = projectId ? Number(projectId) : undefined;

  return useMutation({
    mutationFn: async (params?: { api_token?: string; api_endpoint?: string }) => {
      if (!numericProjectId) throw new Error('Project ID required');
      const response = await api.post(`/projects/${numericProjectId}/fonnte/check-device`, params || {});
      return response.data.data;
    },
    onSuccess: () => {
      if (numericProjectId) {
        queryClient.invalidateQueries({ queryKey: fonnteKeys.detail(numericProjectId) });
      }
    },
  });
};

export const useTestSendFonnte = (projectId: number | string | undefined) => {
  const numericProjectId = projectId ? Number(projectId) : undefined;

  return useMutation({
    mutationFn: async (target: string) => {
      if (!numericProjectId) throw new Error('Project ID required');
      const response = await api.post(`/projects/${numericProjectId}/fonnte/test-send`, { target });
      return response.data;
    },
  });
};
