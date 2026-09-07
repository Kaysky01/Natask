import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { echo } from '../api/echo';
import { projectKeys, taskKeys, dashboardKeys } from '../api/queryKeys';

export const useProjectRealtime = (projectId?: number | string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId || !localStorage.getItem('auth_token')) return;

    const numericId = Number(projectId);
    if (!numericId) return;

    const channelName = `projects.${numericId}`;
    const channel = echo.private(channelName);
    channel.listen('.project.changed', () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(numericId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    });

    return () => {
      echo.leave(channelName);
    };
  }, [projectId, queryClient]);
};
