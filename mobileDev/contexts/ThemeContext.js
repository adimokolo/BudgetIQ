import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "@budgetiq_theme";

const lightColors = {
  mode: "light",
  background: "#F9FAFB",
  card: "#FFFFFF",
  cardBorder: "#EEF0F3",
  inputBg: "#F9FAFB",
  inputBorder: "#E5E7EB",
  divider: "#F3F4F6",
  text: "#111827",
  textMuted: "#6B7280",
  textFaint: "#9CA3AF",
  primary: "#174E78",
  primaryText: "#FFFFFF",
  income: "#16A34A",
  incomeBg: "#DCFCE7",
  expense: "#EC4899",
  expenseBg: "#FCE7F3",
  danger: "#EF4444",
  dangerBorder: "#FCA5A5",
  caution: "#D97706",
  overlay: "rgba(17, 24, 39, 0.5)",
  chipBg: "#F3F6F8",
  skeleton: "#F3F4F6",
};

const darkColors = {
  mode: "dark",
  background: "#0B1220",
  card: "#161F2E",
  cardBorder: "#232E42",
  inputBg: "#101828",
  inputBorder: "#2A3547",
  divider: "#232E42",
  text: "#F3F4F6",
  textMuted: "#9CA3AF",
  textFaint: "#6B7280",
  primary: "#2E7DB8",
  primaryText: "#FFFFFF",
  income: "#22C55E",
  incomeBg: "#123521",
  expense: "#F472B6",
  expenseBg: "#3B1330",
  danger: "#F87171",
  dangerBorder: "#7F1D1D",
  caution: "#FBBF24",
  overlay: "rgba(0, 0, 0, 0.65)",
  chipBg: "#1F2937",
  skeleton: "#1F2937",
};

const ThemeContext = createContext({
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
  setDarkMode: () => {},
  loading: true,
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored !== null) {
          setIsDark(stored === "dark");
        }
      } catch (error) {
        console.log("Theme load error:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setDarkMode = async (value) => {
    setIsDark(value);
    try {
      await AsyncStorage.setItem(THEME_KEY, value ? "dark" : "light");
    } catch (error) {
      console.log("Theme save error:", error);
    }
  };

  const toggleTheme = () => setDarkMode(!isDark);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{ colors, isDark, toggleTheme, setDarkMode, loading }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
