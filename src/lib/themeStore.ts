export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'oep-theme-preference';

export const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // fallback
  }
  return 'dark';
};

export const setStoredTheme = (theme: ThemeMode): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyThemeToDocument(theme);
    window.dispatchEvent(new CustomEvent('oep-theme-changed', { detail: theme }));
  } catch {
    // ignore
  }
};

export const applyThemeToDocument = (theme: ThemeMode): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
};

// Immediately apply stored theme on script load before React hydrates
if (typeof window !== 'undefined') {
  applyThemeToDocument(getStoredTheme());
}

// React Hook for dynamic theme switching
import { useState, useEffect } from 'react';

export const useTheme = (): [ThemeMode, (theme: ThemeMode) => void] => {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    applyThemeToDocument(theme);

    const handleThemeChange = (e: Event) => {
      const customEvt = e as CustomEvent<ThemeMode>;
      if (customEvt.detail) {
        setThemeState(customEvt.detail);
      }
    };

    window.addEventListener('oep-theme-changed', handleThemeChange);
    return () => {
      window.removeEventListener('oep-theme-changed', handleThemeChange);
    };
  }, [theme]);

  const toggleTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
  };

  return [theme, toggleTheme];
};
