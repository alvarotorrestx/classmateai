import { useMemo } from "react";
import { Link } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { getQuizHistory } from "../../hooks/useQuizHistory";
import { getCurrentStudyStreakDays, getTotalStudySeconds, formatStudyDuration } from "../../hooks/useStudyMetrics";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Analytics = () => {
  const { streakDays, totalStudyLabel } = useMemo(
    () => ({
      streakDays: getCurrentStudyStreakDays(),
      totalStudyLabel: formatStudyDuration(getTotalStudySeconds()),
    }),
    []
  );

  const { weeklyData, topicsData } = useMemo(() => {
    const history = getQuizHistory();
    const now = new Date();

    // Build last 7 days (oldest → newest)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return { date: d, label: DAY_LABELS[d.getDay()], scores: [] };
    });

    const weekStart = days[0].date;

    for (const entry of history) {
      const taken = new Date(entry.takenAt);
      if (taken < weekStart) continue;
      taken.setHours(0, 0, 0, 0);
      const day = days.find((d) => d.date.getTime() === taken.getTime());
      if (day) day.scores.push(entry.scorePercent);
    }

    const weekly = days.map((d) => ({
      label: d.label,
      score: d.scores.length
        ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length)
        : null,
      count: d.scores.length,
    }));

    // Topics mastery: best score per course across all history
    const bestByCourse = {};
    for (const entry of history) {
      const key = entry.courseId;
      if (!key) continue;
      if (!bestByCourse[key] || entry.scorePercent > bestByCourse[key].scorePercent) {
        bestByCourse[key] = entry;
      }
    }
    const topics = Object.values(bestByCourse)
      .map((e) => ({
        topic: e.courseTitle || "Unknown Course",
        mastery: e.scorePercent,
        courseId: e.courseId,
        quizId: e.quizId,
        isMastered: e.scorePercent === 100,
      }))
      .sort((a, b) => {
        // Mastered (100%) first, then by score descending
        if (a.isMastered && !b.isMastered) return -1;
        if (!a.isMastered && b.isMastered) return 1;
        return b.mastery - a.mastery;
      });

    return { weeklyData: weekly, topicsData: topics };
  }, []);

  return (
    <InnerAppPageLayout>
      <h3 className="mb-1">Performance Analytics</h3>
      <p className="text-sm text-muted mb-8">
        Track your progress and identify areas for improvement
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-surface rounded-2xl border-2 border-(--mint-200) p-5">
          <p className="text-(--mint-700) font-bold text-base mb-0.5">Study streak</p>
          <p className="text-xs text-muted italic mb-4">
            Consecutive local days with a finished flashcard deck or quiz
          </p>
          <p className="text-4xl font-bold text-(--text-emphasis) tabular-nums">{streakDays}</p>
          <p className="text-sm text-muted mt-1">days in a row</p>
        </div>
        <div className="bg-surface rounded-2xl border-2 border-(--mint-200) p-5">
          <p className="text-(--mint-700) font-bold text-base mb-0.5">Total study time</p>
          <p className="text-xs text-muted italic mb-4">
            Time from completed flashcard decks and quizzes (this device)
          </p>
          <p className="text-4xl font-bold text-(--text-emphasis) tabular-nums">{totalStudyLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly bar chart */}
        <div className="bg-surface rounded-2xl border-2 border-(--mint-200) p-5">
          <p className="text-(--mint-700) font-bold text-base mb-0.5">
            Weekly Quiz Performance
          </p>
          <p className="text-xs text-muted italic mb-4">Average score by day</p>

          {weeklyData.every((d) => d.score === null) ? (
            <div className="bg-surface-muted rounded-xl p-8 flex flex-col items-center justify-center text-center" style={{ height: "180px" }}>
              <p className="text-sm text-muted">No quiz data yet</p>
              <p className="text-xs text-muted mt-1 opacity-90">Complete quizzes to see your performance</p>
            </div>
          ) : (
            <div className="bg-surface-muted rounded-xl p-4">
              <div className="flex gap-2 items-stretch">
                {/* Y-axis: 0–100% */}
                <div
                  className="flex flex-col justify-between text-xs text-muted font-medium tabular-nums shrink-0 pr-1"
                  style={{ height: "144px" }}
                >
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>
                {/* Bar chart */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-end gap-1.5" style={{ height: "144px" }}>
                    {weeklyData.map((d) => {
                      const barHeight = d.score !== null
                        ? Math.max((d.score / 100) * 128, 6)
                        : 0;
                      const barColor =
                        d.score === null ? null
                          : d.score >= 80 ? "bg-green-400"
                            : d.score >= 60 ? "bg-(--mint-400)"
                              : "bg-red-400";
                      return (
                        <div
                          key={d.label}
                          className="flex-1 flex flex-col items-center justify-end group relative"
                          style={{ height: "144px" }}
                        >
                          {d.score !== null && (
                            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                              <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                {d.score}% · {d.count} quiz{d.count !== 1 ? "zes" : ""}
                              </div>
                            </div>
                          )}
                          {d.score !== null && (
                            <span className="text-xs font-semibold text-(--text-emphasis) mb-0.5 tabular-nums">
                              {d.score}%
                            </span>
                          )}
                          <div
                            className={`w-full rounded-t-md transition-all ${barColor ?? "bg-surface-muted"}`}
                            style={{ height: d.score !== null ? `${barHeight}px` : "4px", opacity: d.score !== null ? 1 : 0.3 }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Day labels */}
                  <div className="flex gap-1.5 mt-2">
                    {weeklyData.map((d) => (
                      <div key={d.label} className="flex-1 text-center text-xs text-muted">
                        {d.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Topics mastery */}
        <div className="bg-surface rounded-2xl border-2 border-(--mint-200) p-5">
          <p className="text-(--mint-700) font-bold text-base mb-0.5">Topics Mastery</p>
          <p className="text-xs text-muted italic mb-4">Best quiz score per course — tap to open course or retake</p>

          {topicsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center" style={{ height: "144px" }}>
              <p className="text-sm text-muted">No mastery data yet</p>
              <p className="text-xs text-muted mt-1 opacity-90">Take quizzes to see your best score per course</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {topicsData.map((t) => (
                <div key={t.courseId || t.topic}>
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-(--text-emphasis) truncate">
                      {t.topic}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.isMastered && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700">
                          Mastered
                        </span>
                      )}
                      <span className="text-sm font-semibold tabular-nums">
                        {t.mastery}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-muted overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${t.isMastered ? "bg-green-500" : t.mastery >= 60 ? "bg-(--mint-600)" : "bg-(--warning)"
                        }`}
                      style={{ width: `${t.mastery}%` }}
                    />
                  </div>
                  {t.courseId && (
                    <div className="flex gap-3 mt-1.5">
                      <Link
                        to={`/courses/${t.courseId}`}
                        className="text-xs font-medium text-(--mint-700) hover:underline"
                      >
                        Open course
                      </Link>
                      {t.quizId && (
                        <Link
                          to={`/quizzes/${t.courseId}/session/${t.quizId}`}
                          className="text-xs font-medium text-(--mint-700) hover:underline"
                        >
                          Retake quiz
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </InnerAppPageLayout>
  );
};

export default Analytics;
