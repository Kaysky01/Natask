import axios, { AxiosError } from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token and properly handle FormData
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // When sending FormData (file uploads), remove manual Content-Type so browser sets boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle and extract human-friendly API errors
export const handleApiError = (error: any): string => {
  if (error?.response?.data) {
    const errorData = error.response.data;

    // Check for Laravel validation errors object { errors: { field: ['message'] } }
    if (errorData.errors && typeof errorData.errors === 'object') {
      const fieldKeys = Object.keys(errorData.errors);
      if (fieldKeys.length > 0) {
        const firstFieldErrors = errorData.errors[fieldKeys[0]];
        if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
          return firstFieldErrors[0];
        }
        if (typeof firstFieldErrors === 'string') {
          return firstFieldErrors;
        }
      }
    }

    if (errorData.message && typeof errorData.message === 'string' && errorData.message !== 'Validation error') {
      return errorData.message;
    }
  }

  // Handle specific HTTP Status Codes
  if (error?.response?.status === 413) {
    return 'Ukuran file terlalu besar untuk diunggah ke server (Payload Too Large).';
  }

  if (error?.response?.status === 415) {
    return 'Format file tidak didukung oleh sistem.';
  }

  if (error?.response?.status === 403) {
    return error?.response?.data?.message || 'Anda tidak memiliki izin untuk melakukan tindakan ini.';
  }

  if (error?.response?.status === 404) {
    return error?.response?.data?.message || 'Data atau berkas tidak ditemukan.';
  }

  if (error?.response?.status >= 500) {
    return 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
  }

  if (error?.request) {
    return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
  }

  return error?.message || 'Terjadi kesalahan yang tidak terduga.';
};

export default api;