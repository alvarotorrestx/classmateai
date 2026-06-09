import { useTheme } from "../../hooks/useTheme";

const SunFilled = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <path
      d="M12 2v1.5M12 20.5V22M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M2 12h1.5M20.5 12H22M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const MoonFilled = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      fill="currentColor"
    />
  </svg>
);

const SunOutline = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="3.8" stroke="currentColor" strokeWidth="1.35" />
    <path
      d="M12 2.2v1.4M12 20.4v1.4M4.34 4.34l1 1M18.66 18.66l1 1M2.2 12h1.4M20.4 12h1.4M4.34 19.66l1-1M18.66 5.34l1-1"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
    />
  </svg>
);

const MoonOutline = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinejoin="round"
    />
  </svg>
);

const ThemePill = ({ isDark, compact = false }) => {
  if (compact) {
    return (
      <span
        className="
          relative isolate block h-7 w-12 shrink-0 rounded-full p-0.5
          bg-[#e8e8ea] shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)]
          dark:bg-[#2c3038] dark:shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]
          transition-colors duration-300
        "
        aria-hidden
      >
        <SunOutline
          className={`
            pointer-events-none absolute left-1 top-1/2 z-1 h-3 w-3 -translate-y-1/2
            text-[#8b8d95] transition-opacity duration-300 dark:text-[#9ca3af]
            ${isDark ? "opacity-85" : "opacity-0"}
          `}
        />
        <MoonOutline
          className={`
            pointer-events-none absolute right-1 top-1/2 z-1 h-3 w-3 -translate-y-1/2
            text-[#8b8d95] transition-opacity duration-300 dark:text-[#9ca3af]
            ${isDark ? "opacity-0" : "opacity-85"}
          `}
        />
        <span
          className={`
            relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-white
            shadow-[0_1px_4px_rgba(0,0,0,0.2)]
            dark:shadow-[0_2px_5px_rgba(0,0,0,0.4)]
            transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]
            ${isDark ? "translate-x-5" : "translate-x-0"}
            ${
              isDark
                ? "bg-linear-to-b from-[#5c6570] to-[#2f3540]"
                : "bg-linear-to-b from-[#ffd078] via-[#ffb84a] to-[#f7931a]"
            }
          `}
        >
          {isDark ? (
            <MoonFilled className="h-3 w-3" />
          ) : (
            <SunFilled className="h-3 w-3" />
          )}
        </span>
      </span>
    );
  }

  return (
    <span
      className="
        relative isolate block h-8 w-18 shrink-0 rounded-full p-1
        bg-[#e8e8ea] shadow-[inset_0_2px_5px_rgba(0,0,0,0.14)]
        dark:bg-[#2c3038] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.55)]
        transition-colors duration-300
      "
      aria-hidden
    >
      <SunOutline
        className={`
          pointer-events-none absolute left-1.5 top-1/2 z-1 h-3.5 w-3.5 -translate-y-1/2
          text-[#8b8d95] transition-opacity duration-300 dark:text-[#9ca3af]
          ${isDark ? "opacity-85" : "opacity-0"}
        `}
      />
      <MoonOutline
        className={`
          pointer-events-none absolute right-1.5 top-1/2 z-1 h-3.5 w-3.5 -translate-y-1/2
          text-[#8b8d95] transition-opacity duration-300 dark:text-[#9ca3af]
          ${isDark ? "opacity-0" : "opacity-85"}
        `}
      />
      <span
        className={`
          relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-white
          shadow-[0_2px_5px_rgba(0,0,0,0.22),0_1px_2px_rgba(0,0,0,0.12)]
          dark:shadow-[0_2px_6px_rgba(0,0,0,0.45),0_1px_2px_rgba(0,0,0,0.35)]
          transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]
          ${isDark ? "translate-x-8.5" : "translate-x-0"}
          ${
            isDark
              ? "bg-linear-to-b from-[#5c6570] to-[#2f3540]"
              : "bg-linear-to-b from-[#ffd078] via-[#ffb84a] to-[#f7931a]"
          }
        `}
      >
        {isDark ? (
          <MoonFilled className="h-3.5 w-3.5" />
        ) : (
          <SunFilled className="h-3.5 w-3.5" />
        )}
      </span>
    </span>
  );
};

const ThemeToggle = ({ className = "", variant = "menu" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const ariaLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`
          inline-flex items-center justify-center shrink-0
          h-10 w-12 p-0 border-0 bg-transparent rounded-lg
          transition-colors cursor-pointer
          active:bg-white/20
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-(--brand)
          ${className}
        `}
        aria-label={ariaLabel}
        aria-pressed={isDark}
        title={ariaLabel}
      >
        <ThemePill isDark={isDark} compact />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`
        w-full px-4 py-2.5 text-left text-sm font-medium text-base-theme
        transition-colors cursor-pointer
        flex items-center justify-between gap-3 rounded-lg
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--mint-400) focus-visible:ring-offset-2 focus-visible:ring-offset-(--surface)
        ${className}
      `}
      aria-label={ariaLabel}
      aria-pressed={isDark}
      title={ariaLabel}
    >
      <span>{isDark ? "Dark" : "Light"}</span>
      <ThemePill isDark={isDark} />
    </button>
  );
};

export default ThemeToggle;
