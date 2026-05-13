import { getBadgeIconComponent } from "./badgeIcons";

const BadgeCard = ({ badge }) => {
  const Icon = getBadgeIconComponent(badge.icon);
  const earned = Boolean(badge.earned);
  const progressCurrent = badge.progress_current ?? null;
  const progressTarget = badge.progress_target ?? null;
  const hasProgress = progressCurrent !== null && progressTarget !== null && progressTarget > 0;
  const progressPct = hasProgress ? Math.min(100, Math.round((progressCurrent / progressTarget) * 100)) : 0;

  return (
    <div
      className={`bg-surface rounded-2xl border shadow-sm p-5 flex flex-col gap-3 transition ${
        earned ? "border-(--mint-200)" : "border-theme opacity-90"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              earned ? "bg-(--mint-100) text-(--mint-700)" : "bg-surface-muted text-muted"
            }`}
          >
            <Icon size={20} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-base text-(--text-emphasis) truncate">{badge.name}</p>
            <p className="text-xs text-muted line-clamp-2">{badge.description}</p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            earned ? "bg-(--mint-100) text-(--mint-800)" : "bg-surface-muted text-muted"
          }`}
        >
          {earned ? "Earned" : "Locked"}
        </span>
      </div>

      {hasProgress && (
        <div className="mt-1">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span>{badge.progress_label ?? `${progressCurrent} / ${progressTarget}`}</span>
            <span className="font-semibold text-(--text-emphasis) tabular-nums">{progressPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-muted overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${earned ? "bg-(--mint-600)" : "bg-(--mint-300)"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeCard;

