import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { getStudySet, getNote } from "../../services/noteService";
import { reviewFlashcard } from "../../services/progressService";

const Flashcards = () => {
  const { deckId } = useParams();
  const [cards, setCards] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [courseId, setCourseId] = useState(null);
  const [finished, setFinished] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionStartRef = useRef(null);
  const reviewedIdsRef = useRef(new Set());

  useEffect(() => {
    getStudySet(deckId)
      .then((set) => {
        setCourseId(set.note_id);
        if (set.note_id) {
          getNote(set.note_id).then((note) => setCourseTitle(note.title)).catch(() => {});
        } else if (set.label) {
          setCourseTitle(set.label);
        }
        const sorted = [...set.flashcards].sort((a, b) => a.display_order - b.display_order);
        setCards(sorted);
        sessionStartRef.current = Date.now();
        reviewedIdsRef.current = new Set();
        setFinished(false);
        setSessionSeconds(0);
      })
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [deckId]);

  const card = cards[index];

  const go = (nextIndex) => {
    // Advancing past the last card ends the session
    if (nextIndex >= cards.length) {
      setFlipped(false);
      const started = sessionStartRef.current;
      if (started) {
        const seconds = Math.max(0, Math.round((Date.now() - started) / 1000));
        setSessionSeconds(seconds);
      }
      setFinished(true);
      return;
    }

    setFlipped(false);
    setTimeout(() => setIndex(nextIndex), 50);
  };

  const markReviewed = (flashcard) => {
    if (!flashcard) return;
    if (reviewedIdsRef.current.has(flashcard.id)) return;
    reviewedIdsRef.current.add(flashcard.id);
    reviewFlashcard(flashcard.id, 3).catch(() => {});
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

  // Completion screen once the user has finished the deck
  if (finished) {
    const minutes = sessionSeconds ? Math.max(1, Math.round(sessionSeconds / 60)) : 0;
    const reviewedCount = reviewedIdsRef.current.size;

    return (
      <InnerAppPageLayout>
        <div className="max-w-lg mx-auto text-center">
          <p className="text-xl font-bold mb-1">
            {courseTitle || "Flashcards complete"}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            You&apos;ve reached the end of this deck.
          </p>

          <div className="bg-white rounded-2xl border-2 border-(--mint-200) p-8 mb-6">
            <p className="text-base font-semibold mb-2">Nice work!</p>
            <p className="text-sm text-gray-500">
              {reviewedCount > 0 && (
                <>
                  You reviewed <span className="font-semibold">{reviewedCount}</span>{" "}
                  card{reviewedCount !== 1 ? "s" : ""}.
                </>
              )}
              {minutes > 0 && (
                <>
                  {" "}
                  Estimated study time:{" "}
                  <span className="font-semibold">
                    {minutes} minute{minutes !== 1 ? "s" : ""}
                  </span>
                  .
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to={
                courseId
                  ? `/quizzes/${courseId}/session/${deckId}`
                  : "/quizzes"
              }
              className="bg-(--mint-600) text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition text-center"
            >
              Take Quiz
            </Link>
            <Link
              to="/dashboard"
              className="border border-(--mint-600) text-(--mint-700) rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-50) transition text-center"
            >
              Go to Dashboard
            </Link>
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
          onClick={() => {
            setFlipped(!flipped);
            if (!flipped) {
              markReviewed(card);
            }
          }}
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
            className="bg-(--mint-600) text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
          >
            {index === cards.length - 1 ? "Finish" : "Next >"}
          </button>
        </div>
      </div>
    </InnerAppPageLayout>
  );
};

export default Flashcards;
