import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { echo } from '../api/echo';

export const useProjectRealtime = (projectId?: number) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId || !localStorage.getItem('auth_token')) return;

    const channelName = `projects.${projectId}`;
    const channel = echo.private(channelName);
    channel.listen('.project.changed', () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    return () => {
      echo.leave(channelName);
    };
  }, [projectId, queryClient]);
};
