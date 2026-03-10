import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainAppPageLayout from "../../components/layout/MainAppPageLayout";
import useAuth from "../../hooks/useAuth";
import { getNotes, getAllStudySets } from "../../services/noteService";

const StatCard = ({ label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
    <p className="text-xs text-gray-400 font-medium">{label}</p>
    <p className="text-2xl font-bold text-(--text-emphasis)">{value}</p>
    {sub && <p className="text-xs text-(--mint-600) font-medium">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const { auth } = useAuth();
  const [courses, setCourses] = useState([]);
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);

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
    Promise.all([getNotes(), getAllStudySets()])
      .then(([notes, sets]) => {
        setCourses(notes);
        setStudySets(sets);
      })
      .catch(() => {})
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
        <StatCard label="Study Streak" value="0" sub="days" />
      </div>

      {/* Your Courses */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xl font-bold">Your Courses</p>
        <Link
          to="/courses/new"
          className="border border-(--mint-600) text-(--mint-700) rounded-xl px-4 py-2 text-sm font-semibold hover:bg-(--mint-50) transition"
        >
          + New Course
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-(--mint-600) border-t-transparent animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
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
          <p className="text-sm text-gray-400 mb-5">
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
          {courses.map((course) => {
            const counts = setByNoteId[course.id] || { flashcards: 0, quizzes: 0 };
            return (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition block"
              >
                {/* Title + badge */}
                <div className="flex items-start justify-between mb-1">
                  <p className="font-bold text-base leading-snug">{course.title}</p>
                  <span className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold bg-(--mint-100) text-(--mint-800)">
                    Active
                  </span>
                </div>

                {/* Date */}
                <p className="text-xs text-gray-400 mb-3">
                  Added{" "}
                  {new Date(course.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>

                {/* Flashcards + Quizzes row */}
                <div className="flex gap-4 mb-3 text-sm text-gray-500">
                  <span>
                    <span className="font-semibold text-(--text-emphasis)">{counts.flashcards}</span> flashcards
                  </span>
                  <span>
                    <span className="font-semibold text-(--text-emphasis)">{counts.quizzes}</span> questions
                  </span>
                </div>

                {/* Mastery progress bar — placeholder until quiz scores are tracked */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Mastery</span>
                  <span className="font-semibold text-(--text-emphasis)">—%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-(--mint-500) rounded-full" style={{ width: "0%" }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </MainAppPageLayout>
  );
};

export default Dashboard;
