import { useTheme } from "../../hooks/useTheme";

/**
 * Minimal theme toggle for account menus. Uses existing theme utility classes.
 */
const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-full px-4 py-2 text-left text-sm font-medium text-base-theme hover:bg-surface-muted transition cursor-pointer flex items-center gap-2 ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="text-base" aria-hidden>
        {isDark ? "☀️" : "🌙"}
      </span>
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
};

export default ThemeToggle;
