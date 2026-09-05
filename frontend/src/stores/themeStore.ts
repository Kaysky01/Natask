import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyTheme, getSystemTheme } from '../utils';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      actualTheme: 'light',

      setTheme: (theme: Theme) => {
        const actualTheme = theme === 'system' ? getSystemTheme() : theme;
        applyTheme(theme);
        set({ theme, actualTheme });
      },

      toggleTheme: () => {
        const { actualTheme } = get();
        const nextTheme = actualTheme === 'dark' ? 'light' : 'dark';
        get().setTheme(nextTheme);
      },

      initializeTheme: () => {
        const { theme } = get();
        const actualTheme = theme === 'system' ? getSystemTheme() : theme;
        applyTheme(theme);
        set({ actualTheme });

        // Listen for system theme changes
        if (theme === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => {
            const newActualTheme = getSystemTheme();
            applyTheme('system');
            set({ actualTheme: newActualTheme });
          };

          mediaQuery.addEventListener('change', handleChange);
          return () => mediaQuery.removeEventListener('change', handleChange);
        }
      },
    }),
    {
      name: 'natask-theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);