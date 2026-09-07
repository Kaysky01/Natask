/**
 * Centralized Query Keys Factory
 * Ensures consistent key structures across queries, mutations, invalidations, and realtime events.
 * All entity IDs are strictly normalized to numbers to prevent string vs number cache mismatches.
 */

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...projectKeys.lists(), params ?? {}] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number | string | undefined) => [...projectKeys.details(), Number(id)] as const,
};

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...taskKeys.lists(), params ?? {}] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number | string | undefined) => [...taskKeys.details(), Number(id)] as const,
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
};

export const fonnteKeys = {
  all: ['fonnte-settings'] as const,
  detail: (projectId: number | string | undefined) => [...fonnteKeys.all, Number(projectId)] as const,
};

export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
};
