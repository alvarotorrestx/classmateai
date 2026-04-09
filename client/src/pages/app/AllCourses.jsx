import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainAppPageLayout from "../../components/layout/MainAppPageLayout";
import useAuth from "../../hooks/useAuth";
import { getNotes, getAllStudySets, deleteNote } from "../../services/noteService";
import DeleteCourseModal from "../../components/modals/DeleteCourseModal";
import { getQuizHistory } from "../../hooks/useQuizHistory";
import { CourseGridSkeleton } from "../../components/loading/PageSkeletons";
import { useToast } from "../../context/ToastContext";

const AllCourses = () => {
  const { auth } = useAuth();
  const [courses, setCourses] = useState([]);
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { addToast } = useToast();
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

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setBulkConfirm(false);
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === courses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(courses.map((c) => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const count = selectedIds.size;
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          deleteNote(id, { deleteCourse: true, deleteFlashcards: true, deleteQuizzes: true })
        )
      );
      exitSelectMode();
      refresh();
      addToast(`${count} course${count !== 1 ? "s" : ""} deleted`);
    } catch {
      setBulkDeleting(false);
      setBulkConfirm(false);
      addToast("Failed to delete. Please try again.", "error");
    }
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
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              {sortedCourses.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-sm font-semibold text-muted hover:text-base-theme px-3 py-2 transition"
                >
                  {selectedIds.size === courses.length ? "Deselect All" : "Select All"}
                </button>
              )}
              <button
                onClick={exitSelectMode}
                className="border border-theme rounded-xl px-4 py-2 text-sm font-semibold hover:bg-surface-muted transition"
              >
                Cancel
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setBulkConfirm(true)}
                  className="bg-red-500 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-red-600 transition"
                >
                  Delete {selectedIds.size} Course{selectedIds.size !== 1 ? "s" : ""}
                </button>
              )}
            </>
          ) : (
            <>
              {sortedCourses.length > 0 && (
                <button
                  onClick={() => setSelectMode(true)}
                  className="border border-theme rounded-xl px-4 py-2 text-sm font-semibold hover:bg-surface-muted transition"
                >
                  Select
                </button>
              )}
              <Link
                to="/courses/new"
                className="border border-(--mint-600) text-(--mint-700) rounded-xl px-4 py-2 text-sm font-semibold hover:bg-(--mint-50) transition"
              >
                + New Course
              </Link>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <CourseGridSkeleton count={6} />
      ) : sortedCourses.length === 0 ? (
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
          {sortedCourses.map((course) => {
            const counts = setByNoteId[course.id] || { flashcards: 0, quizzes: 0 };
            const decksForCourse = studySets.filter((s) => s.note_id === course.id);
            const mastery = bestScoreByCourse[course.id];
            const isSelected = selectedIds.has(course.id);

            const cardContent = (
              <>
                <div className="flex items-start justify-between mb-1">
                  <p className="font-bold text-base leading-snug">{course.title}</p>
                  {selectMode ? (
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                        isSelected ? "border-red-500 bg-red-500" : "border-theme"
                      }`}
                    >
                      {isSelected && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="1.8"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  ) : (
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
                  )}
                </div>

                <p className="text-xs text-muted mb-3">
                  Added{" "}
                  {new Date(course.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>

                <div className="flex gap-4 mb-3 text-sm text-muted">
                  <span>
                    <span className="font-semibold text-(--text-emphasis)">{counts.flashcards}</span> flashcards
                  </span>
                  <span>
                    <span className="font-semibold text-(--text-emphasis)">{counts.quizzes}</span> questions
                  </span>
                </div>

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
              </>
            );

            if (selectMode) {
              return (
                <div
                  key={course.id}
                  onClick={() => toggleSelected(course.id)}
                  className={`group bg-surface rounded-2xl border-2 shadow-sm p-4 cursor-pointer transition ${
                    isSelected ? "border-red-400 bg-red-50/30" : "border-theme hover:shadow-md"
                  }`}
                >
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="group bg-surface rounded-2xl border border-theme shadow-sm p-4 block transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-(--mint-300)"
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      )}

      {/* Single-course delete modal */}
      {deleteTarget?.note && (
        <DeleteCourseModal
          note={deleteTarget.note}
          decks={deleteTarget.decks}
          onCancel={() => setDeleteTarget(null)}
          onSuccess={({ courseDeleted, flashcardsDeleted, quizzesDeleted }) => {
            setDeleteTarget(null);
            refresh();
            if (courseDeleted) addToast("Course deleted");
            else if (flashcardsDeleted && quizzesDeleted) addToast("Flashcards and quiz questions deleted");
            else if (flashcardsDeleted) addToast("Flashcards deleted");
            else if (quizzesDeleted) addToast("Quiz questions deleted");
          }}
        />
      )}

      {/* Bulk delete confirmation modal */}
      {bulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 text-red-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-base text-(--text-emphasis) leading-snug">
                  Delete {selectedIds.size} course{selectedIds.size !== 1 ? "s" : ""}?
                </p>
                <p className="text-sm text-muted mt-0.5">
                  This will permanently delete the selected courses along with all their flashcards and quiz questions. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setBulkConfirm(false)}
                disabled={bulkDeleting}
                className="border border-theme text-(--text) rounded-xl px-5 py-2 text-sm font-semibold hover:bg-surface-muted transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="bg-red-500 text-white rounded-xl px-5 py-2 text-sm font-semibold hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {bulkDeleting && (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </MainAppPageLayout>
  );
};

export default AllCourses;
