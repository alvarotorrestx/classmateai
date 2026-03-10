import { useMemo } from "react";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { getQuizHistory } from "../../hooks/useQuizHistory";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Analytics = () => {
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
      .filter((e) => e.scorePercent === 100)
      .map((e) => ({
        topic: e.courseTitle || "Unknown Course",
        mastery: 100,
      }));

    return { weeklyData: weekly, topicsData: topics };
  }, []);

  return (
    <InnerAppPageLayout>
      <h3 className="mb-1">Performance Analytics</h3>
      <p className="text-sm text-gray-400 mb-8">
        Track your progress and identify areas for improvement
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly bar chart */}
        <div className="bg-white rounded-2xl border-2 border-(--mint-200) p-5">
          <p className="text-(--mint-700) font-bold text-base mb-0.5">
            Weekly Quiz Performance
          </p>
          <p className="text-xs text-gray-400 italic mb-4">Average score by day</p>

          {weeklyData.every((d) => d.score === null) ? (
            <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center justify-center text-center" style={{ height: "180px" }}>
              <p className="text-sm text-gray-400">No quiz data yet</p>
              <p className="text-xs text-gray-300 mt-1">Complete quizzes to see your performance</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4">
              {/* Bar chart */}
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
                      <div
                        className={`w-full rounded-t-md transition-all ${barColor ?? "bg-gray-200"}`}
                        style={{ height: d.score !== null ? `${barHeight}px` : "4px", opacity: d.score !== null ? 1 : 0.3 }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* Day labels */}
              <div className="flex gap-1.5 mt-2">
                {weeklyData.map((d) => (
                  <div key={d.label} className="flex-1 text-center text-xs text-gray-400">
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Topics mastery */}
        <div className="bg-white rounded-2xl border-2 border-(--mint-200) p-5">
          <p className="text-(--mint-700) font-bold text-base mb-0.5">Topics Mastery</p>
          <p className="text-xs text-gray-400 italic mb-4">Current Understanding</p>

          {topicsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center" style={{ height: "144px" }}>
              <p className="text-sm text-gray-400">No mastery data yet</p>
              <p className="text-xs text-gray-300 mt-1">Score 100% on a quiz to mark a course as mastered</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {topicsData.map((t) => (
                <div key={t.topic}>
                  <div className="flex justify-between text-sm italic mb-1">
                    <span>{t.topic}</span>
                    <span className="font-semibold not-italic">{t.mastery}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        t.warning ? "bg-(--warning)" : "bg-(--mint-600)"
                      }`}
                      style={{ width: `${t.mastery}%` }}
                    />
                  </div>
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
