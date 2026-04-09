import { useMemo, useState } from "react";
import { deleteNote } from "../../services/noteService";

const CheckItem = ({ checked, onChange, label, description }) => (
  <label className="flex items-start gap-3 cursor-pointer select-none group">
    <span
      className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
        checked ? "border-red-500 bg-red-500" : "border-theme group-hover:border-red-300"
      }`}
      onClick={() => onChange(!checked)}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <polyline
            points="2 6 5 9 10 3"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
    <input
      type="checkbox"
      className="sr-only"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <div>
      <p className={`text-sm font-medium transition ${checked ? "text-(--text-emphasis)" : "text-muted"}`}>
        {label}
      </p>
      {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
    </div>
  </label>
);

const TrashIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const DeleteCourseModal = ({ note, decks = [], onCancel, onSuccess }) => {
  const { totalFlashcards, totalQuizzes } = useMemo(() => {
    const totalFlashcards = decks.reduce((sum, d) => sum + (d.flashcards?.length ?? 0), 0);
    const totalQuizzes = decks.reduce((sum, d) => sum + (d.quiz_questions?.length ?? 0), 0);
    return { totalFlashcards, totalQuizzes };
  }, [decks]);

  const [deleteCourse, setDeleteCourse] = useState(false);
  const [deleteFlashcards, setDeleteFlashcards] = useState(false);
  const [deleteQuizzes, setDeleteQuizzes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

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
      onSuccess?.({ courseDeleted: deleteCourse, flashcardsDeleted: deleteFlashcards, quizzesDeleted: deleteQuizzes });
    } catch {
      setError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 text-red-500">
            <TrashIcon />
          </div>
          <div>
            <p className="font-bold text-base text-(--text-emphasis) leading-snug">
              Delete from &ldquo;{note.title}&rdquo;
            </p>
            <p className="text-sm text-muted mt-0.5">
              Choose what to delete. Unchecked items will be kept.
            </p>
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">
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

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="border border-theme text-(--text) rounded-xl px-5 py-2 text-sm font-semibold hover:bg-surface-muted transition disabled:opacity-50"
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

export default DeleteCourseModal;

