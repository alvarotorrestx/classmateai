import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import RecommendationNudge from "../../components/study/RecommendationNudge";
import { getAllStudySets, getNotes, deleteStudySetFlashcards } from "../../services/noteService";
import { getQuizHistory } from "../../hooks/useQuizHistory";
import { getBestFlashcardNudge } from "../../utils/studyRecommendations";
import { DeckGridSkeleton } from "../../components/loading/PageSkeletons";

const TrashIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const AllFlashcards = () => {
  const [decks, setDecks] = useState([]);
  const [allStudySets, setAllStudySets] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteMap, setNoteMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    return Promise.all([getAllStudySets(), getNotes()])
      .then(([sets, notesList]) => {
        setNotes(notesList);
        setAllStudySets(sets);
        setNoteMap(Object.fromEntries(notesList.map((n) => [n.id, n.title])));
        setDecks(sets.filter((s) => s.flashcards.length > 0));
      })
      .catch(() => setDecks([]));
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleDelete = async (deckId) => {
    setDeletingId(deckId);
    try {
      await deleteStudySetFlashcards(deckId);
      setConfirmingId(null);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    } catch {
      // keep card visible on failure
    } finally {
      setDeletingId(null);
    }
  };

  const deckTitle = (deck) =>
    (deck.note_id && noteMap[deck.note_id]) || deck.label || "Deleted Course";

  const quizHistory = getQuizHistory();
  const flashNudge =
    !loading && decks.length > 0
      ? getBestFlashcardNudge({
          notes,
          studySets: allStudySets,
          quizHistory,
        })
      : null;

  return (
    <InnerAppPageLayout>
      <h3 className="mb-1">Flashcards</h3>
      <p className="text-sm text-gray-400 mb-8">All your flashcard decks</p>

      {loading ? (
        <DeckGridSkeleton count={6} />
      ) : decks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center text-center">
          <p className="font-bold text-base mb-1">No flashcard decks yet</p>
          <p className="text-sm text-gray-400 mb-5">
            Upload lecture notes to a course to generate flashcards
          </p>
          <Link
            to="/dashboard"
            className="bg-(--mint-600) text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <div key={deck.id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
              {confirmingId === deck.id ? (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Delete deck?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(deck.id)}
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
                  title="Delete flashcard deck"
                  onClick={() => setConfirmingId(deck.id)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                >
                  <TrashIcon />
                </button>
              )}

              <p className="font-bold text-base mb-1">{deckTitle(deck)}</p>
              <p className="text-sm text-gray-400 mb-5">{deck.flashcards.length} cards</p>
              <Link
                to={`/flashcards/${deck.id}`}
                className="mt-auto text-center bg-(--mint-600) text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
              >
                Study Now
              </Link>
            </div>
          ))}
        </div>
      )}

      <RecommendationNudge recommendation={flashNudge} />
    </InnerAppPageLayout>
  );
};

export default AllFlashcards;