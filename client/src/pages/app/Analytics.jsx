import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";

const Analytics = () => {
  const weeklyData = [];
  const topicsData = [];

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

          {weeklyData.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center justify-center text-center" style={{ height: "180px" }}>
              <p className="text-sm text-gray-400">No quiz data yet</p>
              <p className="text-xs text-gray-300 mt-1">Complete quizzes to see your performance</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-end gap-1.5" style={{ height: "144px" }}>
                {weeklyData.map((d) => {
                  const maxScore = Math.max(...weeklyData.map((x) => x.score));
                  return (
                    <div
                      key={d.day}
                      className="flex-1 rounded-t-md bg-(--mint-300)"
                      style={{ height: `${(d.score / maxScore) * 144}px` }}
                    />
                  );
                })}
              </div>
              <div className="flex gap-1.5 mt-2">
                {weeklyData.map((d) => (
                  <div
                    key={d.day}
                    className="flex-1 text-center text-xs text-gray-400"
                  >
                    {d.day}
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
              <p className="text-xs text-gray-300 mt-1">Study flashcards and take quizzes to track mastery</p>
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
