import { Flame, Sparkles, Trophy } from "lucide-react";

const StatPill = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-surface rounded-2xl border-2 border-(--mint-200) p-5">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={18} className="text-(--mint-700)" aria-hidden />
      <p className="text-(--mint-700) font-bold text-base">{label}</p>
    </div>
    <p className="text-4xl font-bold text-(--text-emphasis) tabular-nums">{value}</p>
    {sub ? <p className="text-sm text-muted mt-1">{sub}</p> : null}
  </div>
);

const GamificationStats = ({ stats }) => {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatPill
        icon={Flame}
        label="Study streak"
        value={stats.current_streak_days ?? 0}
        sub={`Best: ${stats.longest_streak_days ?? 0} day${(stats.longest_streak_days ?? 0) === 1 ? "" : "s"}`}
      />
      <StatPill icon={Trophy} label="Total points" value={stats.total_points ?? 0} />
      <StatPill
        icon={Sparkles}
        label="Activity totals"
        value={`${stats.total_flashcards_reviewed ?? 0} / ${stats.total_quiz_attempts ?? 0}`}
        sub="Flashcards reviewed / quiz attempts"
      />
    </div>
  );
};

export default GamificationStats;

