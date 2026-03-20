import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

// Component for the recommendation nudge floating button
const RecommendationNudge = ({ recommendation }) => {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const rootRef = useRef(null);

  const showPanel = pinned || hovered;

  useEffect(() => {
    setPinned(false);
    setHovered(false);
  }, [recommendation?.href]);

  const closePinned = useCallback(() => setPinned(false), []);

  useEffect(() => {
    const onDoc = (e) => {
      if (!pinned) return;
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setPinned(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [pinned]);

  if (!recommendation) return null;

  const isQuiz = recommendation.type === "quiz";
  const label = isQuiz ? "Quiz recommendation" : "Flashcards recommendation";

  return (
    <div
      ref={rootRef}
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showPanel && (
        <div
          className="w-[min(20rem,calc(100vw-3rem))] rounded-2xl border border-gray-200/40 bg-white/65 backdrop-blur-md shadow-lg shadow-gray-400/15 p-4 text-left transition-opacity duration-200"
          style={{ opacity: pinned ? 0.92 : 0.78 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-(--mint-700)/90 mb-1">
            {label}
          </p>
          <p className="font-bold text-sm text-(--text-emphasis)/90 mb-1 line-clamp-2">
            {recommendation.courseTitle}
          </p>
          <p className="text-xs text-gray-500/95 mb-3 line-clamp-4 leading-relaxed">
            {recommendation.reason}
          </p>
          <Link
            to={recommendation.href}
            onClick={closePinned}
            className="inline-flex items-center justify-center w-full rounded-xl bg-(--mint-600)/90 text-white text-sm font-semibold py-2.5 hover:bg-(--mint-700) transition backdrop-blur-sm"
          >
            {isQuiz ? "Start quiz" : "Study flashcards"}
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={() => setPinned((p) => !p)}
        className="recommendation-nudge-fab rounded-full w-16 h-16 shadow-xl bg-(--mint-600) text-white flex items-center justify-center text-2xl font-semibold hover:bg-(--mint-700) hover:scale-105 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--mint-400) focus-visible:ring-offset-2 ring-2 ring-white/70"
        aria-expanded={showPanel}
        aria-label={pinned ? "Close suggestion" : `Open ${label} suggestion`}
        title="Suggested for you — hover or click"
      >
        ✨
      </button>
    </div>
  );
};

export default RecommendationNudge;
