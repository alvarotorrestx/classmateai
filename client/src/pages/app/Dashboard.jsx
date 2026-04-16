import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainAppPageLayout from "../../components/layout/MainAppPageLayout";
import useAuth from "../../hooks/useAuth";
import { getNotes, getAllStudySets } from "../../services/noteService";
import { getQuizHistory } from "../../hooks/useQuizHistory";
import { getTotalStudySeconds, formatStudyDuration } from "../../hooks/useStudyMetrics";
import { getMyGamification } from "../../services/gamificationService";
import { hasStudyContent, getStudyRecommendations } from "../../utils/studyRecommendations";
import { DashboardSkeleton } from "../../components/loading/PageSkeletons";

const StatCard = ({ label, value, sub }) => (
  <div className="bg-surface rounded-2xl border border-theme shadow-sm p-4 flex flex-col gap-1">
    <p className="text-xs text-muted font-medium">{label}</p>
    <p className="text-2xl font-bold text-(--text-emphasis)">{value}</p>
    {sub && <p className="text-xs text-(--mint-600) font-medium">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const { auth } = useAuth();
  const [courses, setCourses] = useState([]);
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gamiStats, setGamiStats] = useState(null);

  const fullName = auth?.user?.full_name || "Student";
  const firstName = fullName.split(" ")[0];

  const hour = new Date().getHours();
  let greeting = "Welcome back";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    Promise.all([getNotes(), getAllStudySets(), getMyGamification()])
      .then(([notes, sets, gami]) => {
        setCourses(notes);
        setStudySets(sets);
        setGamiStats(gami?.stats || null);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const activeCourseCount = courses.length;
  const totalFlashcards = studySets.reduce((sum, s) => sum + s.flashcards.length, 0);
  const totalQuizQuestions = studySets.reduce((sum, s) => sum + s.quiz_questions.length, 0);

  // Build a map of note_id -> { flashcards, quiz_questions } for course cards
  const setByNoteId = {};
  for (const s of studySets) {
    if (!setByNoteId[s.note_id]) {
      setByNoteId[s.note_id] = { flashcards: 0, quizzes: 0 };
    }
    setByNoteId[s.note_id].flashcards += s.flashcards.length;
    setByNoteId[s.note_id].quizzes += s.quiz_questions.length;
  }

  const quizHistory = getQuizHistory();
  const studyRecommendations =
    !loading && hasStudyContent(courses, studySets)
      ? getStudyRecommendations({ notes: courses, studySets, quizHistory })
      : [];

  // Build best quiz score per course from local quiz history
  const bestScoreByCourse = {};
  for (const entry of quizHistory) {
    if (!entry.courseId) continue;
    const existing = bestScoreByCourse[entry.courseId];
    if (!existing || entry.scorePercent > existing) {
      bestScoreByCourse[entry.courseId] = entry.scorePercent;
    }
  }

  const totalStudySec = getTotalStudySeconds();
  const studyStreakDays = gamiStats?.current_streak_days ?? 0;
  const totalPoints = gamiStats?.total_points ?? 0;

  return (
    <MainAppPageLayout
      headerTitle={`Welcome Back, ${firstName}!`}
      profileInitials={initials}
      title={`${greeting}, ${firstName}!`}
      subtitle={
        activeCourseCount > 0
          ? `You have ${activeCourseCount} active course${activeCourseCount !== 1 ? "s" : ""}`
          : "Ready to study? Create your first course to get started."
      }
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Active Courses"
              value={activeCourseCount}
              sub={activeCourseCount > 0 ? `${activeCourseCount} total` : null}
            />
            <StatCard
              label="Flashcards"
              value={totalFlashcards || "—"}
              sub={totalFlashcards > 0 ? `across ${studySets.filter(s => s.flashcards.length > 0).length} deck${studySets.filter(s => s.flashcards.length > 0).length !== 1 ? "s" : ""}` : "Create a course first"}
            />
            <StatCard
              label="Quiz Questions"
              value={totalQuizQuestions || "—"}
              sub={totalQuizQuestions > 0 ? "ready to practice" : "No quizzes yet"}
            />
            <StatCard
              label="Study Streak"
          value={studyStreakDays + " days"}
              sub={
                totalStudySec > 0
                  ? `${formatStudyDuration(totalStudySec)} total`
              : totalPoints > 0
                ? `${totalPoints} pts`
                : "Finish a deck or quiz"
              }
            />
          </div>

          {/* Suggested for you cards based on the notes, study sets, and quiz history */}
          {!loading &&
            hasStudyContent(courses, studySets) &&
            studyRecommendations.length > 0 && (
              <div className="mb-6">
                <p className="text-xl font-bold mb-3">Suggested for you</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {studyRecommendations.map((rec, i) => (
                    <Link
                      key={`${rec.type}-${rec.courseId}-${i}`}
                      to={rec.href}
                      className="bg-surface rounded-2xl border border-theme shadow-sm p-4 flex flex-col gap-2 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-(--mint-300)"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-(--mint-700)">
                        {rec.type === "quiz" ? "Quiz" : "Flashcards"}
                      </span>
                      <span className="font-bold text-base text-(--text-emphasis) line-clamp-2">
                        {rec.courseTitle}
                      </span>
                      <span className="text-sm text-muted line-clamp-3 flex-1">
                        {rec.reason}
                      </span>
                      <span className="text-sm font-semibold text-(--mint-700) mt-1">
                        {rec.type === "quiz" ? "Start quiz →" : "Study flashcards →"}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          {/* Your Courses */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xl font-bold">Recent Courses</p>
            <div className="flex gap-2">
              {courses.length > 0 && (
                <Link
                  to="/courses"
                  className="text-sm font-medium text-(--mint-700) hover:underline"
                >
                  View All
                </Link>
              )}
              <Link
                to="/courses/new"
                className="border border-(--mint-600) text-(--mint-700) rounded-xl px-4 py-2 text-sm font-semibold hover:bg-(--mint-50) transition"
              >
                + New Course
              </Link>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-theme shadow-sm p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-(--mint-100) flex items-center justify-center mb-4">
                <svg
                  width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className="text-(--mint-600)"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <p className="font-bold text-base mb-1">No courses yet</p>
              <p className="text-sm text-muted mb-5">
                Create your first course and upload your notes to get started
              </p>
              <Link
                to="/courses/new"
                className="bg-(--mint-600) text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
              >
                + New Course
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...courses]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 3)
                .map((course) => {
                  const counts = setByNoteId[course.id] || { flashcards: 0, quizzes: 0 };
                  const mastery = bestScoreByCourse[course.id];
                  return (
                    <Link
                      key={course.id}
                      to={`/courses/${course.id}`}
                      className="bg-surface rounded-2xl border border-theme shadow-sm p-4 block
                  transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-(--mint-300)">
                      {/* Title + badge */}
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-bold text-base leading-snug">{course.title}</p>
                        <span className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold bg-(--mint-100) text-(--mint-800)">
                          Active
                        </span>
                      </div>

                      {/* Date */}
                      <p className="text-xs text-muted mb-3">
                        Added{" "}
                        {new Date(course.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>

                      {/* Flashcards + Quizzes row */}
                      <div className="flex gap-4 mb-3 text-sm text-muted">
                        <span>
                          <span className="font-semibold text-(--text-emphasis)">{counts.flashcards}</span> flashcards
                        </span>
                        <span>
                          <span className="font-semibold text-(--text-emphasis)">{counts.quizzes}</span> questions
                        </span>
                      </div>

                      {/* Mastery progress bar — placeholder until quiz scores are tracked */}
                      <div className="flex items-center justify-between text-xs text-muted mb-1">
                        <span>Mastery</span>
                        <span className="font-semibold text-(--text-emphasis)">
                          {typeof mastery === "number" ? `${mastery}%` : "—%"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-(--mint-500) rounded-full"
                          style={{ width: typeof mastery === "number" ? `${mastery}%` : "0%" }}
                        />
                      </div>
                    </Link>
                  );
                })}
            </div>
          )}
        </>
      )}
    </MainAppPageLayout>
  );
};

export default Dashboard;
