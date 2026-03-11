import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { getAllStudySets, getNotes } from "../../services/noteService";
import DeleteCourseModal from "../../components/modals/DeleteCourseModal";

const AllFlashcards = () => {
  const [allSets, setAllSets] = useState([]);
  const [decks, setDecks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteMap, setNoteMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    Promise.all([getAllStudySets(), getNotes()])
      .then(([sets, notes]) => {
        const map = Object.fromEntries(notes.map((n) => [n.id, n.title]));
        setNotes(notes);
        setNoteMap(map);
        setAllSets(sets);
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
            <div key={deck.id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
              {/* Hover delete icon */}
              {deck.note_id && (
                <button
                  type="button"
                  title="Delete course or study materials"
                  onClick={() => {
                    const note = notes.find((n) => n.id === deck.note_id);
                    if (!note) return;
                    setDeleteTarget({
                      note,
                      decks: allSets.filter((s) => s.note_id === deck.note_id),
                    });
                  }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
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

      {deleteTarget?.note && (
        <DeleteCourseModal
          note={deleteTarget.note}
          decks={deleteTarget.decks}
          onCancel={() => setDeleteTarget(null)}
          onSuccess={() => {
            setDeleteTarget(null);
            setLoading(true);
            Promise.all([getAllStudySets(), getNotes()])
              .then(([sets, notes]) => {
                const map = Object.fromEntries(notes.map((n) => [n.id, n.title]));
                setNotes(notes);
                setNoteMap(map);
                setAllSets(sets);
                setDecks(sets.filter((s) => s.flashcards.length > 0));
              })
              .catch(() => {})
              .finally(() => setLoading(false));
          }}
        />
      )}
    </InnerAppPageLayout>
  );
};

export default AllFlashcards;