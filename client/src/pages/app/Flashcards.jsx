import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { getFlashcards, getStudySet, getNote } from "../../services/noteService";

const Flashcards = () => {
  const { deckId } = useParams();
  const [cards, setCards] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    getStudySet(deckId)
      .then((set) => {
        getNote(set.note_id).then((note) => setCourseTitle(note.title)).catch(() => {});
        const sorted = [...set.flashcards].sort((a, b) => a.display_order - b.display_order);
        setCards(sorted);
      })
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [deckId]);

  const card = cards[index];

  const go = (nextIndex) => {
    setFlipped(false);
    setTimeout(() => setIndex(nextIndex), 50);
  };

  if (loading) {
    return (
      <InnerAppPageLayout>
        <div className="max-w-lg mx-auto flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-(--mint-600) border-t-transparent animate-spin" />
        </div>
      </InnerAppPageLayout>
    );
  }

  if (cards.length === 0) {
    return (
      <InnerAppPageLayout>
        <div className="max-w-lg mx-auto text-center">
          <p className="text-xl font-bold mb-1">{courseTitle || "Flashcards"}</p>
          <p className="text-sm text-gray-400 mb-8">Study your generated cards</p>
          <div className="bg-white rounded-2xl border-2 border-(--mint-200) p-12 flex flex-col items-center justify-center">
            <p className="font-bold text-base mb-1">No cards available</p>
            <p className="text-sm text-gray-400">This deck has no flashcards yet</p>
          </div>
        </div>
      </InnerAppPageLayout>
    );
  }

  return (
    <InnerAppPageLayout>
      <div className="max-w-lg mx-auto">
        <p className="text-xl font-bold text-center mb-1">{courseTitle || "Flashcards"}</p>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Card {index + 1} of {cards.length}
        </p>

        <div
          onClick={() => setFlipped(!flipped)}
          className="bg-white rounded-2xl border-2 border-(--mint-200) p-8 min-h-64 flex flex-col items-center justify-center cursor-pointer select-none text-center mb-6 transition-all"
        >
          {!flipped ? (
            <>
              <p className="text-(--mint-700) font-semibold text-sm mb-5">Question</p>
              <p className="text-lg font-bold leading-snug">{card.front}</p>
              <p className="text-xs text-gray-400 mt-5 italic">Click to reveal answer</p>
            </>
          ) : (
            <>
              <p className="text-(--mint-700) font-semibold text-sm mb-5">Answer</p>
              <p className="text-base leading-relaxed">{card.back}</p>
            </>
          )}
        </div>

        <div className="flex justify-between gap-3">
          <button
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition"
          >
            &lt; Previous
          </button>
          <button
            onClick={() => go(Math.min(index + 1, cards.length - 1))}
            className="border border-(--mint-600) text-(--mint-700) rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-50) transition"
          >
            Skip
          </button>
          <button
            onClick={() => go(index + 1)}
            disabled={index === cards.length - 1}
            className="bg-(--mint-600) text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition disabled:opacity-50"
          >
            Next &gt;
          </button>
        </div>
      </div>
    </InnerAppPageLayout>
  );
};

export default Flashcards;
