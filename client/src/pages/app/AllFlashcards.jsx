import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { getAllStudySets, getNotes } from "../../services/noteService";

const AllFlashcards = () => {
  const [decks, setDecks] = useState([]);
  const [noteMap, setNoteMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllStudySets(), getNotes()])
      .then(([sets, notes]) => {
        const map = Object.fromEntries(notes.map((n) => [n.id, n.title]));
        setNoteMap(map);
        setDecks(sets.filter((s) => s.flashcards.length > 0));
      })
      .catch(() => setDecks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <InnerAppPageLayout>
      <h3 className="mb-1">Flashcards</h3>
      <p className="text-sm text-gray-400 mb-8">All your flashcard decks</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-(--mint-600) border-t-transparent animate-spin" />
        </div>
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
          {decks.map((deck, i) => (
            <div key={deck.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
              <p className="font-bold text-base mb-1">{(deck.note_id && noteMap[deck.note_id]) || deck.label || "Deleted Course"}</p>
              <p className="text-sm text-gray-400 mb-5">
                {deck.flashcards.length} cards
              </p>
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
    </InnerAppPageLayout>
  );
};

export default AllFlashcards;