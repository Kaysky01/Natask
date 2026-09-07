import { create } from 'zustand';
import { api, handleApiError } from '../api/client';
import { queryClient } from '../api/queryClient';
import { projectKeys, taskKeys, dashboardKeys } from '../api/queryKeys';
import type { User, LoginCredentials, RegisterData } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: {
    name: string;
    email: string;
    phone?: string;
    bio?: string;
    timezone: string;
    preferences?: Record<string, unknown>;
  }) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/auth/profile', data);
      const updatedUser = response.data.data;
      set({ user: updatedUser, isLoading: false });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedUser = response.data.data;
      set({ user: updatedUser, isLoading: false });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      queryClient.clear();
      const response = await api.post('/auth/login', credentials);
      const { user, token } = response.data.data;
      localStorage.setItem('auth_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      queryClient.clear();
      const response = await api.post('/auth/register', data);
      const { user, token } = response.data.data;
      localStorage.setItem('auth_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    try {
      if (get().token) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('auth_token');
      queryClient.clear();
      set({ user: null, token: null, isAuthenticated: false, error: null });
    }
  },

  setToken: async (token: string) => {
    localStorage.setItem('auth_token', token);
    queryClient.clear();
    set({ token, isAuthenticated: true });
    await get().checkAuth();
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('auth_token');
      queryClient.clear();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
