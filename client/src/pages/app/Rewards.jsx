import { useEffect, useMemo, useState } from "react";
import MainAppPageLayout from "../../components/layout/MainAppPageLayout";
import useAuth from "../../hooks/useAuth";
import { getBadges, getMyGamification } from "../../services/gamificationService";
import BadgeGrid from "../../components/gamification/BadgeGrid";
import GamificationStats from "../../components/gamification/GamificationStats";
import PointsLegend from "../../components/gamification/PointsLegend";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "earned", label: "Earned" },
  { id: "locked", label: "Locked" },
];

const Rewards = () => {
  const { auth } = useAuth();
  const fullName = auth?.user?.full_name || "Student";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [filter, setFilter] = useState("all");
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getBadges(), getMyGamification()])
      .then(([badgeData, gami]) => {
        if (cancelled) return;
        setBadges(badgeData || []);
        setStats(gami?.stats || null);
      })
      .catch(() => {
        if (cancelled) return;
        setBadges([]);
        setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "earned") return badges.filter((b) => b.earned);
    if (filter === "locked") return badges.filter((b) => !b.earned);
    return badges;
  }, [badges, filter]);

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <MainAppPageLayout
      headerTitle="Rewards"
      profileInitials={initials}
      title="Rewards"
      subtitle={loading ? "Loading your rewards…" : `${earnedCount} badge${earnedCount === 1 ? "" : "s"} earned`}
    >
      <div className="flex flex-col gap-5">
        <GamificationStats stats={stats} />
        {!loading ? <PointsLegend defaultCollapsed /> : null}

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition border cursor-pointer ${
                filter === f.id
                  ? "border-(--mint-600) bg-(--mint-50) text-(--mint-800)"
                  : "border-theme bg-surface hover:bg-surface-muted text-base-theme"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-surface rounded-2xl border border-theme p-8 text-center text-muted">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-theme p-8 text-center">
            <p className="font-bold text-base mb-1">No badges to show</p>
            <p className="text-sm text-muted">Try a different filter or keep studying to unlock rewards.</p>
          </div>
        ) : (
          <BadgeGrid badges={filtered} />
        )}
      </div>
    </MainAppPageLayout>
  );
};

export default Rewards;

