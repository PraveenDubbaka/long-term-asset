import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';
const THEME_KEY = 'luka-theme-preference';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null;
      if (stored) return stored;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
    const timeout = setTimeout(() => root.classList.remove('theme-transition'), 300);
    return () => clearTimeout(timeout);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handle = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(THEME_KEY)) setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  const toggleTheme = useCallback(() => setTheme(p => p === 'dark' ? 'light' : 'dark'), []);
  const isDarkMode  = theme === 'dark';

  return { theme, isDarkMode, toggleTheme, setTheme };
}
