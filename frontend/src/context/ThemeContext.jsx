import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

// Apply theme immediately (called before first render too, via the inline script trick)
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  // Update the browser tab / PWA theme-color meta tag
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#1a1a2e' : '#003859';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('theme');
    // Respect OS preference on first visit if no saved value
    if (!saved) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return saved;
  });

  // Apply on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  const setTheme = useCallback((t) => {
    localStorage.setItem('theme', t);
    setThemeState(t);
  }, []);

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
