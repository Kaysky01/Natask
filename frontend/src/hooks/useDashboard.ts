import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Project, Task, Activity } from '../types';

export interface DashboardData {
  stats: {
    active_projects: number;
    assigned_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
  };
  projects: Project[];
  my_tasks_due_soon: Task[];
  recent_activities: Activity[];
}

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data.data as DashboardData;
    },
  });
};
