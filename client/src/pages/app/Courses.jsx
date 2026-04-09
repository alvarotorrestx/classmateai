import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import {
  getNote,
  getStudySets,
  generateNewFlashcards,
  generateNewQuiz,
  deleteStudySet,
  getCourseStudyGuide,
} from "../../services/noteService";
import { DeckGridSkeleton, StudyGuideSkeleton } from "../../components/loading/PageSkeletons";
import { useToast } from "../../context/ToastContext";

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// Modal for choosing where to generate flashcards/quizzes
const GenerateModal = ({ type, decks, onConfirm, onCancel, generating }) => {
  const [selectedSetId, setSelectedSetId] = useState("new");

  const label = type === "flashcards" ? "Flashcard Deck" : "Quiz Deck";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <p className="font-bold text-base text-(--text-emphasis) mb-1">Generate New {label}</p>
        <p className="text-sm text-gray-400 mb-5">Where would you like to add the new content?</p>

        <div className="flex flex-col gap-2 mb-6">
          <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
            selectedSetId === "new" ? "border-(--mint-600) bg-(--mint-50)" : "border-gray-100 hover:border-gray-200"
          }`}>
            <input
              type="radio"
              name="setChoice"
              value="new"
              checked={selectedSetId === "new"}
              onChange={() => setSelectedSetId("new")}
              className="accent-(--mint-600)"
            />
            <div>
              <p className="text-sm font-semibold">New Study Set</p>
              <p className="text-xs text-gray-400">Creates a separate deck</p>
            </div>
          </label>

          {decks.map((deck, i) => (
            <label key={deck.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
              selectedSetId === deck.id ? "border-(--mint-600) bg-(--mint-50)" : "border-gray-100 hover:border-gray-200"
            }`}>
              <input
                type="radio"
                name="setChoice"
                value={deck.id}
                checked={selectedSetId === deck.id}
                onChange={() => setSelectedSetId(deck.id)}
                className="accent-(--mint-600)"
              />
              <div>
                <p className="text-sm font-semibold">{deck.label || `Study Set ${i + 1}`}</p>
                <p className="text-xs text-gray-400">
                  {deck.flashcards.length} flashcards · {deck.quiz_questions.length} quiz questions
                </p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={generating}
            className="border border-gray-200 text-(--text) rounded-xl px-5 py-2 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedSetId === "new" ? null : selectedSetId)}
            disabled={generating}
            className="bg-(--mint-600) text-white rounded-xl px-5 py-2 text-sm font-semibold hover:bg-(--mint-700) transition disabled:opacity-50 flex items-center gap-2"
          >
            {generating && (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            {generating ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Courses = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [note,          setNote]          = useState(null);
  const [decks,         setDecks]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [confirmingId,  setConfirmingId]  = useState(null);
  const [deletingId,    setDeletingId]    = useState(null);
  const [generateModal, setGenerateModal] = useState(null); // null | 'flashcards' | 'quiz'
  const [generating,    setGenerating]    = useState(false);
  const [studyGuide,    setStudyGuide]    = useState(null);  // null | string | false (false = not found)
  const [guideOpen,     setGuideOpen]     = useState(false);
  const [guideLoading,  setGuideLoading]  = useState(false);

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

  const handleDeleteDeck = async (deckId) => {
    setDeletingId(deckId);
    try {
      await deleteStudySet(deckId);
      setConfirmingId(null);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      addToast("Study set deleted");
    } catch {
      addToast("Failed to delete. Please try again.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStudyGuide = async () => {
    if (guideOpen) {
      setGuideOpen(false);
      return;
    }
    setGuideOpen(true);
    if (studyGuide !== null) return; // already loaded
    setGuideLoading(true);
    try {
      const data = await getCourseStudyGuide(courseId);
      setStudyGuide(data.content);
    } catch {
      setStudyGuide(false);
    } finally {
      setGuideLoading(false);
    }
  };

  const handleGenerate = async (studySetId) => {
    setGenerating(true);
    try {
      if (generateModal === "flashcards") {
        await generateNewFlashcards(courseId, studySetId);
        addToast("New flashcards added!");
      } else {
        await generateNewQuiz(courseId, studySetId);
        addToast("New quiz questions added!");
      }
      setGenerateModal(null);
      fetchData();
    } catch {
      addToast("Generation failed. Please try again.", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <InnerAppPageLayout>
      <div className="flex items-start justify-between mb-1 gap-4">
        <h3 className="leading-snug">{note?.title || "Course Materials"}</h3>
      </div>

      <p className="text-sm text-gray-400 mb-8">Choose a deck to study</p>

      {loading ? (
        <DeckGridSkeleton count={3} />
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
              className={`group relative rounded-2xl border-2 p-5 flex flex-col bg-white ${
                i === 0 ? "border-(--mint-600)" : "border-gray-100"
              }`}
            >
              {/* Inline delete confirm */}
              {confirmingId === deck.id ? (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Delete set?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDeck(deck.id)}
                    disabled={deletingId === deck.id}
                    className="text-xs text-white bg-red-500 hover:bg-red-600 font-semibold px-2 py-1 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {deletingId === deck.id && (
                      <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    )}
                    Delete
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  title="Delete study set"
                  onClick={() => setConfirmingId(deck.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                >
                  <TrashIcon />
                </button>
              )}

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
        <button
          type="button"
          onClick={() => setGenerateModal("flashcards")}
          className="border border-gray-200 text-gray-600 rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 transition"
        >
          New Flashcard Deck
        </button>
        <button
          type="button"
          onClick={() => setGenerateModal("quiz")}
          className="border border-gray-200 text-gray-600 rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 transition"
        >
          New Quiz Deck
        </button>
      </div>

      {/* Course Study Guide */}
      <div className="mt-8">
        <button
          type="button"
          onClick={toggleStudyGuide}
          className="w-full flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-(--mint-100) flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-(--mint-700)">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <span className="font-semibold text-sm">Course Study Guide</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`text-gray-400 transition-transform ${guideOpen ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {guideOpen && (
          <div className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {guideLoading ? (
              <StudyGuideSkeleton />
            ) : studyGuide === false ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No study guide yet — upload notes to generate one.
              </p>
            ) : (
              <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                {studyGuide}
              </pre>
            )}
          </div>
        )}
      </div>

      {generateModal && (
        <GenerateModal
          type={generateModal}
          decks={decks}
          generating={generating}
          onConfirm={handleGenerate}
          onCancel={() => setGenerateModal(null)}
        />
      )}
    </InnerAppPageLayout>
  );
};

export default Courses;