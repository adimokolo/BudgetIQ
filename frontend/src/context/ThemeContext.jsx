import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

function getSystemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * `preference` is what the user picked: 'light' | 'dark' | 'system'.
 * `theme` is the actually-applied theme, resolved from preference (and the
 * OS setting, when preference is 'system') - components that just want to
 * know "is dark mode on right now" should read `theme`, not `preference`.
 */
export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(
    () => localStorage.getItem('budgetiq_theme') || 'light'
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemPrefersDark(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const theme = preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('budgetiq_theme', preference);
  }, [theme, preference]);

  const setThemePreference = useCallback((next) => setPreference(next), []);

  // Kept for anywhere that just wants a simple light/dark flip (ignores system).
  const toggleTheme = useCallback(() => {
    setPreference((p) => (p === 'dark' || (p === 'system' && systemPrefersDark) ? 'light' : 'dark'));
  }, [systemPrefersDark]);

  return (
    <ThemeContext.Provider value={{ theme, preference, setThemePreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
