import { useCallback, useSyncExternalStore } from "react";

export const THEME_STORAGE_KEY = "classmateai-theme";

function applyClass(isDark) {
  const root = document.documentElement;
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");
}

/**
 * Run on app load (after inline index.html script) so DOM + storage stay aligned.
 */
export function initTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark") {
      applyClass(true);
      return;
    }
    if (stored === "light") {
      applyClass(false);
      return;
    }
    applyClass(window.matchMedia("(prefers-color-scheme: dark)").matches);
  } catch {
    applyClass(false);
  }
}

export function getTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme) {
  if (theme !== "light" && theme !== "dark") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore quota / private mode
  }
  applyClass(theme === "dark");
  window.dispatchEvent(new CustomEvent("classmateai-theme-change"));
}

export function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

function subscribeTheme(callback) {
  window.addEventListener("classmateai-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("classmateai-theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot() {
  return getTheme();
}

/**
 * Hook for components that need to re-render when theme changes.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeSnapshot);
  const set = useCallback((t) => setTheme(t), []);
  const toggle = useCallback(() => toggleTheme(), []);
  return { theme, setTheme: set, toggleTheme: toggle };
}
