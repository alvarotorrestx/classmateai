import { useState } from "react";
import { Brain, ChevronDown, Flag, Zap } from "lucide-react";

const ITEMS = [
  {
    key: "flashcard",
    label: "Flashcard Review",
    points: 10,
    Icon: Zap,
    desc: "Earned each time you flip through a flashcard",
  },
  {
    key: "quiz_attempt",
    label: "Quiz Attempt",
    points: 15,
    Icon: Brain,
    desc: "Earned for each quiz question you answer",
  },
  {
    key: "quiz_completion",
    label: "Quiz Completion",
    points: 25,
    Icon: Flag,
    desc: "Bonus points awarded when you finish a full quiz",
  },
];

const PointsLegend = ({ defaultCollapsed = true, className = "" }) => {
  const [collapsed, setCollapsed] = useState(Boolean(defaultCollapsed));

  return (
    <section
      className={`bg-surface rounded-2xl border border-theme p-5 sm:p-6 ${className}`}
      aria-label="How points work"
    >
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 rounded-xl -mx-2 px-2 py-2 hover:bg-surface-muted/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--mint-400) focus-visible:ring-offset-2 focus-visible:ring-offset-(--surface)"
        aria-expanded={!collapsed}
        aria-controls="points-legend-panel"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Zap size={18} className="text-(--mint-700)" aria-hidden />
          <span className="text-(--mint-700) font-bold text-base truncate">How Points Work</span>
        </span>
        <ChevronDown
          size={18}
          className={`text-(--mint-700) shrink-0 transition-transform ${collapsed ? "" : "rotate-180"}`}
          aria-hidden
        />
      </button>

      <div
        id="points-legend-panel"
        className={`overflow-hidden transition-[max-height,opacity] duration-200 ${
          collapsed ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
        }`}
      >
        <div className="flex flex-col gap-3 pt-3">
          {ITEMS.map(({ key, label, points, Icon, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-xl bg-surface-muted/60 px-4 py-3"
            >
              <div className="flex items-start gap-2 min-w-0">
                <Icon size={18} className="text-(--mint-700) shrink-0 mt-0.5" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-base-theme truncate">{label}</p>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-(--text-emphasis) tabular-nums shrink-0">
                +{points} pts
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PointsLegend;
