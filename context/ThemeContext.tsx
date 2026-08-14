// context/ThemeContext.tsx
// Reads theme from localStorage (set by settings page) and applies
// data-theme attribute to <html>. Respects system preference for "system".
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

const STORAGE_KEY = 'ylingo-theme';

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): 'dark' | 'light' {
  return theme === 'system' ? getSystemTheme() : theme;
}

function applyTheme(resolved: 'dark' | 'light') {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  // On mount: read saved theme or default to dark
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme) || 'dark';
    const resolved = resolveTheme(saved);
    setThemeState(saved);
    setResolvedTheme(resolved);
    applyTheme(resolved);

    // Listen for system theme changes when set to "system"
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as Theme) || 'dark';
      if (current === 'system') {
        const r = resolveTheme('system');
        setResolvedTheme(r);
        applyTheme(r);
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    const resolved = resolveTheme(t);
    setThemeState(t);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
