import React, { createContext, useContext } from 'react';
import { useTheme } from '@/hooks/useTheme';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeState = useTheme();
  return <ThemeContext.Provider value={themeState}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useThemeContext must be used within a ThemeProvider');
  return context;
}
