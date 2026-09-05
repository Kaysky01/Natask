import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

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
  return useQuery<FonnteSettingsData>({
    queryKey: ['fonnte-settings', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID required');
      const response = await api.get(`/projects/${projectId}/fonnte`);
      return response.data.data;
    },
    enabled: !!projectId,
  });
};

export const useUpdateFonnteSettings = (projectId: number | string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<FonnteSettingsData>) => {
      if (!projectId) throw new Error('Project ID required');
      const response = await api.post(`/projects/${projectId}/fonnte`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fonnte-settings', projectId] });
    },
  });
};

export const useCheckFonnteDevice = (projectId: number | string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { api_token?: string; api_endpoint?: string }) => {
      if (!projectId) throw new Error('Project ID required');
      const response = await api.post(`/projects/${projectId}/fonnte/check-device`, params || {});
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fonnte-settings', projectId] });
    },
  });
};

export const useTestSendFonnte = (projectId: number | string | undefined) => {
  return useMutation({
    mutationFn: async (target: string) => {
      if (!projectId) throw new Error('Project ID required');
      const response = await api.post(`/projects/${projectId}/fonnte/test-send`, { target });
      return response.data;
    },
  });
};
