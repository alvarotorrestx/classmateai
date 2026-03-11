import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainAppPageLayout from "../../components/layout/MainAppPageLayout";
import useAuth from "../../hooks/useAuth";
import { getNotes, getAllStudySets } from "../../services/noteService";
import DeleteCourseModal from "../../components/modals/DeleteCourseModal";
import { getQuizHistory } from "../../hooks/useQuizHistory";

const AllCourses = () => {
  const { auth } = useAuth();
  const [courses, setCourses] = useState([]);
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fullName = auth?.user?.full_name || "Student";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setLoading(true);
    Promise.all([getNotes(), getAllStudySets()])
      .then(([notes, sets]) => {
        setCourses(notes);
        setStudySets(sets);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const setByNoteId = {};
  for (const s of studySets) {
    if (!setByNoteId[s.note_id]) {
      setByNoteId[s.note_id] = { flashcards: 0, quizzes: 0 };
    }
    setByNoteId[s.note_id].flashcards += s.flashcards.length;
    setByNoteId[s.note_id].quizzes += s.quiz_questions.length;
  }

  // Best quiz score per course
  const quizHistory = getQuizHistory();
  const bestScoreByCourse = {};
  for (const entry of quizHistory) {
    if (!entry.courseId) continue;
    const existing = bestScoreByCourse[entry.courseId];
    if (!existing || entry.scorePercent > existing) {
      bestScoreByCourse[entry.courseId] = entry.scorePercent;
    }
  }

  const sortedCourses = [...courses].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <MainAppPageLayout
      headerTitle="Courses"
      profileInitials={initials}
      title="Your Courses"
      subtitle={
        courses.length > 0
          ? `${courses.length} course${courses.length !== 1 ? "s" : ""} total`
          : "No courses yet. Create one to get started."
      }
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xl font-bold">All Courses</p>
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
      ) : sortedCourses.length === 0 ? (
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
          {sortedCourses.map((course) => {
            const counts = setByNoteId[course.id] || { flashcards: 0, quizzes: 0 };
            const decksForCourse = studySets.filter((s) => s.note_id === course.id);
            const mastery = bestScoreByCourse[course.id];
            return (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition block"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-bold text-base leading-snug">{course.title}</p>
                  <div className="flex items-center justify-end shrink-0 relative h-8 w-20">
                    <span className="absolute right-0 rounded-full px-2 py-0.5 text-xs font-semibold bg-(--mint-100) text-(--mint-800) transition-transform duration-200 ease-out group-hover:-translate-x-9">
                      Active
                    </span>
                    <button
                      type="button"
                      title="Delete course or study materials"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget({ note: course, decks: decksForCourse });
                      }}
                      className="absolute right-0 w-8 h-8 rounded-lg flex items-center justify-center text-red-400 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 hover:bg-red-50 hover:text-red-600 transition duration-200 ease-out cursor-pointer"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-3">
                  Added{" "}
                  {new Date(course.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>

                <div className="flex gap-4 mb-3 text-sm text-gray-500">
                  <span>
                    <span className="font-semibold text-(--text-emphasis)">{counts.flashcards}</span> flashcards
                  </span>
                  <span>
                    <span className="font-semibold text-(--text-emphasis)">{counts.quizzes}</span> questions
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Mastery</span>
                  <span className="font-semibold text-(--text-emphasis)">
                    {typeof mastery === "number" ? `${mastery}%` : "—%"}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
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

      {deleteTarget?.note && (
        <DeleteCourseModal
          note={deleteTarget.note}
          decks={deleteTarget.decks}
          onCancel={() => setDeleteTarget(null)}
          onSuccess={({ courseDeleted }) => {
            setDeleteTarget(null);
            // if course wasn't deleted, still refresh counts after partial deletion
            refresh();
          }}
        />
      )}
    </MainAppPageLayout>
  );
};

export default AllCourses;
