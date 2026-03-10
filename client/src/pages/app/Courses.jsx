import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { getNote, getStudySets, deleteNote } from "../../services/noteService";

// ── Shared checkbox component ────────────────────────────────────────────────
const CheckItem = ({ checked, onChange, label, description }) => (
  <label className="flex items-start gap-3 cursor-pointer select-none group">
    <span
      className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
        checked ? "border-red-500 bg-red-500" : "border-gray-300 group-hover:border-red-300"
      }`}
      onClick={() => onChange(!checked)}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
    <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <div>
      <p className={`text-sm font-medium transition ${checked ? "text-(--text-emphasis)" : "text-gray-500"}`}>
        {label}
      </p>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
  </label>
);

// ── Delete modal ─────────────────────────────────────────────────────────────
const DeleteCourseModal = ({ note, decks, onCancel, onSuccess }) => {
  const totalFlashcards = decks.reduce((sum, d) => sum + d.flashcards.length, 0);
  const totalQuizzes    = decks.reduce((sum, d) => sum + d.quiz_questions.length, 0);

  const [deleteCourse,     setDeleteCourse]     = useState(false);
  const [deleteFlashcards, setDeleteFlashcards] = useState(false);
  const [deleteQuizzes,    setDeleteQuizzes]    = useState(false);
  const [deleting,         setDeleting]         = useState(false);
  const [error,            setError]            = useState(null);

  const nothingSelected = !deleteCourse && !deleteFlashcards && !deleteQuizzes;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteNote(note.id, {
        deleteCourse,
        deleteFlashcards,
        deleteQuizzes,
      });
      onSuccess({ courseDeleted: deleteCourse });
    } catch {
      setError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-base text-(--text-emphasis) leading-snug">
              Delete from &ldquo;{note.title}&rdquo;
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              Choose what to delete. Unchecked items will be kept.
            </p>
          </div>
        </div>

        {/* Checkboxes */}
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          Select what to delete
        </p>

        <div className="flex flex-col gap-4 mb-6">
          <CheckItem
            checked={deleteCourse}
            onChange={setDeleteCourse}
            label="Course"
            description="Removes the course. Unchecked flashcards/quizzes will still be accessible."
          />
          {totalFlashcards > 0 && (
            <CheckItem
              checked={deleteFlashcards}
              onChange={setDeleteFlashcards}
              label={`Flashcards — ${totalFlashcards} card${totalFlashcards !== 1 ? "s" : ""}`}
              description="Permanently removes all flashcards for this course."
            />
          )}
          {totalQuizzes > 0 && (
            <CheckItem
              checked={deleteQuizzes}
              onChange={setDeleteQuizzes}
              label={`Quiz questions — ${totalQuizzes} question${totalQuizzes !== 1 ? "s" : ""}`}
              description="Permanently removes all quiz questions for this course."
            />
          )}
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="border border-gray-200 text-(--text) rounded-xl px-5 py-2 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={nothingSelected || deleting}
            className="bg-red-500 text-white rounded-xl px-5 py-2 text-sm font-semibold hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleting && (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const Courses = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [note,            setNote]            = useState(null);
  const [decks,           setDecks]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([getNote(courseId), getStudySets(courseId)])
      .then(([noteData, studySets]) => {
        setNote(noteData);
        setDecks(studySets);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [courseId]);

  const handleDeleteSuccess = ({ courseDeleted }) => {
    if (courseDeleted) {
      navigate("/dashboard");
    } else {
      setShowDeleteModal(false);
      fetchData(); // refresh counts after partial deletion
    }
  };

  return (
    <InnerAppPageLayout>
      {/* Title row */}
      <div className="flex items-start justify-between mb-1 gap-4">
        <h3 className="leading-snug">{note?.title || "Course Materials"}</h3>
        {note && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            title="Delete course or study materials"
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </div>

      <p className="text-sm text-gray-400 mb-8">Choose a deck to study</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-(--mint-600) border-t-transparent animate-spin" />
        </div>
      ) : decks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-(--mint-100) flex items-center justify-center mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-(--mint-600)">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M8 4v16M16 4v16" />
            </svg>
          </div>
          <p className="font-bold text-base mb-1">No decks yet</p>
          <p className="text-sm text-gray-400 mb-5">
            Upload your lecture notes to generate flashcard decks
          </p>
          <Link
            to={`/courses/${courseId}/upload`}
            state={{ title: note?.title }}
            className="bg-(--mint-600) text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
          >
            Upload Notes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {decks.map((deck, i) => (
            <div
              key={deck.id}
              className={`rounded-2xl border-2 p-5 flex flex-col bg-white ${
                i === 0 ? "border-(--mint-600)" : "border-gray-100"
              }`}
            >
              <p className="font-bold text-base mb-1">
                {deck.label || `Study Set ${i + 1}`}
              </p>
              <div className="flex flex-wrap gap-x-4 text-sm text-gray-500 mb-5">
                <span>
                  <span className="font-semibold text-black">{deck.flashcards.length}</span> flashcards
                </span>
                <span>
                  <span className="font-semibold text-black">{deck.quiz_questions.length}</span> quiz questions
                </span>
              </div>
              <Link
                to={`/flashcards/${deck.id}`}
                className={`mt-auto text-center rounded-xl px-4 py-2.5 font-semibold text-sm transition ${
                  i === 0
                    ? "bg-(--mint-600) text-white hover:bg-(--mint-700)"
                    : "border border-(--mint-600) text-(--mint-700) hover:bg-(--mint-50)"
                }`}
              >
                Study Now
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/quizzes/${courseId}`}
          className="border border-(--mint-600) text-(--mint-700) rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-50) transition"
        >
          View Quizzes
        </Link>
        <Link
          to={`/courses/${courseId}/upload`}
          state={{ title: note?.title }}
          className="bg-(--mint-600) text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
        >
          Upload Notes
        </Link>
      </div>

      {showDeleteModal && note && (
        <DeleteCourseModal
          note={note}
          decks={decks}
          onCancel={() => setShowDeleteModal(false)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </InnerAppPageLayout>
  );
};

export default Courses;
