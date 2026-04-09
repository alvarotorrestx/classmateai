import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import RecommendationNudge from "../../components/study/RecommendationNudge";
import { getAllStudySets, getNotes, deleteStudySetQuiz } from "../../services/noteService";
import { getQuizHistory } from "../../hooks/useQuizHistory";
import { getStudyRecommendations, getTopRecommendationByType } from "../../utils/studyRecommendations";
import { QuizListSkeleton } from "../../components/loading/PageSkeletons";
import { useToast } from "../../context/ToastContext";

const TrashIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const AllQuizzes = () => {
  const [sets, setSets] = useState([]);
  const [allStudySets, setAllStudySets] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteMap, setNoteMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    setHistory(getQuizHistory());
    Promise.all([getAllStudySets(), getNotes()])
      .then(([data, notesList]) => {
        setNotes(notesList);
        setAllStudySets(data);
        setNoteMap(Object.fromEntries(notesList.map((n) => [n.id, n.title])));
        setSets(data.filter((s) => s.quiz_questions.length > 0));
      })
      .catch(() => setSets([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (setId) => {
    setDeletingId(setId);
    try {
      await deleteStudySetQuiz(setId);
      setConfirmingId(null);
      setSets((prev) => prev.filter((s) => s.id !== setId));
      addToast("Quiz questions deleted");
    } catch {
      addToast("Failed to delete. Please try again.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const setTitle = (set) =>
    (set.note_id && noteMap[set.note_id]) || set.label || "Deleted Course";

  const recommendations = getStudyRecommendations({
    notes,
    studySets: allStudySets,
    quizHistory: getQuizHistory(),
  });
  const quizNudge =
    !loading && sets.length > 0
      ? getTopRecommendationByType(recommendations, "quiz")
      : null;

  return (
    <InnerAppPageLayout>
      <h3 className="mb-1">Quizzes</h3>
      <p className="text-sm text-muted mb-8">All your available quizzes</p>

      {loading ? (
        <QuizListSkeleton count={5} />
      ) : sets.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-theme shadow-sm p-10 flex flex-col items-center justify-center text-center">
          <p className="font-bold text-base mb-1">No quizzes yet</p>
          <p className="text-sm text-muted mb-5">
            Upload lecture notes to a course to generate quizzes
          </p>
          <Link
            to="/dashboard"
            className="bg-(--mint-600) text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sets.map((set) => (
            <div key={set.id} className="group relative bg-surface rounded-2xl border border-theme shadow-sm p-5">
              {confirmingId === set.id ? (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="text-xs text-muted font-medium">Delete quiz?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="text-xs text-muted hover:text-base-theme font-medium px-2 py-1 rounded-lg hover:bg-surface-muted transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(set.id)}
                    disabled={deletingId === set.id}
                    className="text-xs text-white bg-red-500 hover:bg-red-600 font-semibold px-2 py-1 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {deletingId === set.id && (
                      <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    )}
                    Delete
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  title="Delete quiz"
                  onClick={() => setConfirmingId(set.id)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                >
                  <TrashIcon />
                </button>
              )}

              <p className="font-bold text-base mb-1">{setTitle(set)}</p>
              <p className="text-sm text-muted mb-4">{set.quiz_questions.length} questions</p>
              <Link
                to={set.note_id ? `/quizzes/${set.note_id}/session/${set.id}` : `/quizzes`}
                className="border border-(--mint-600) text-(--mint-700) rounded-xl px-5 py-2 text-sm font-semibold hover:bg-(--mint-50) transition"
              >
                Start Quiz →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Quiz History */}
      {history.length > 0 && (
        <div className="mt-10">
          <p className="text-xl font-bold mb-4">Recent Results</p>
          <div className="flex flex-col gap-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="bg-surface rounded-2xl border border-theme shadow-sm p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {entry.courseTitle || "Unknown Course"}
                    {entry.quizLabel ? (
                      <span className="text-muted font-normal"> — {entry.quizLabel}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(entry.takenAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="flex gap-3 mt-1.5 text-xs">
                    <span className="text-green-600 font-medium">{entry.correct} correct</span>
                    <span className="text-red-500 font-medium">{entry.total - entry.correct} incorrect</span>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-center">
                  <p
                    className={`text-2xl font-bold ${entry.scorePercent >= 80
                        ? "text-green-600"
                        : entry.scorePercent >= 60
                          ? "text-(--mint-600)"
                          : "text-red-500"
                      }`}
                  >
                    {entry.scorePercent}%
                  </p>
                  <Link
                    to={`/quizzes/${entry.courseId}/session/${entry.quizId}`}
                    className="text-xs text-(--mint-700) font-medium hover:underline mt-1"
                  >
                    Retake →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <RecommendationNudge recommendation={quizNudge} />
    </InnerAppPageLayout>
  );
};

export default AllQuizzes;