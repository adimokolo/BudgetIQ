import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const ThemeContext = createContext(null);

function getSystemPrefersDark() {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(
    () => localStorage.getItem("budgetiq_theme") || "light",
  );
  const [systemPrefersDark, setSystemPrefersDark] =
    useState(getSystemPrefersDark);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setSystemPrefersDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const theme =
    preference === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : preference;

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("budgetiq_theme", preference);
  }, [theme, preference]);

  const setThemePreference = useCallback((next) => setPreference(next), []);

  const toggleTheme = useCallback(() => {
    setPreference((p) =>
      p === "dark" || (p === "system" && systemPrefersDark) ? "light" : "dark",
    );
  }, [systemPrefersDark]);

  return (
    <ThemeContext.Provider
      value={{ theme, preference, setThemePreference, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
