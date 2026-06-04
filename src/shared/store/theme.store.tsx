import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  dark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDarkState] = useState(() => {
    const s = localStorage.getItem('theme');
    if (s) return s === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const setDark = (v: boolean) => setDarkState(v);
  const toggle = () => setDarkState(d => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
