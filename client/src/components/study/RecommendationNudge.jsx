import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

// Component for the recommendation nudge floating button
// Accepts either:
//   recommendations={[...]}  — array, enables prev/next cycling
//   recommendation={...}     — single object (legacy, backward-compat)
const RecommendationNudge = ({ recommendations, recommendation }) => {
  // Normalize to array
  const items = recommendations ?? (recommendation ? [recommendation] : []);

  const [activeIndex, setActiveIndex] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const rootRef = useRef(null);

  const showPanel = pinned || hovered;

  // Reset when the recommendation set changes
  useEffect(() => {
    setActiveIndex(0);
    setPinned(false);
    setHovered(false);
  }, [items.length]);

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

  if (items.length === 0) return null;

  const active = items[Math.min(activeIndex, items.length - 1)];
  const isQuiz = active.type === "quiz";
  const hasMultiple = items.length > 1;

  const goPrev = (e) => {
    e.stopPropagation();
    setActiveIndex((i) => (i - 1 + items.length) % items.length);
  };
  const goNext = (e) => {
    e.stopPropagation();
    setActiveIndex((i) => (i + 1) % items.length);
  };

  return (
    <div
      ref={rootRef}
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showPanel && (
        <div
          className="w-[min(20rem,calc(100vw-3rem))] rounded-2xl border border-theme/40 bg-surface/65 backdrop-blur-md shadow-lg shadow-black/10 p-4 text-left transition-opacity duration-200"
          style={{ opacity: pinned ? 0.92 : 0.78 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-(--mint-700)/90 mb-1">
            {isQuiz ? "Quiz recommendation" : "Flashcards recommendation"}
          </p>
          <p className="font-bold text-sm text-(--text-emphasis)/90 mb-1 line-clamp-2">
            {active.courseTitle}
          </p>
          <p className="text-xs text-muted/95 mb-3 line-clamp-4 leading-relaxed">
            {active.reason}
          </p>
          <Link
            to={active.href}
            onClick={closePinned}
            className="inline-flex items-center justify-center w-full rounded-xl bg-(--mint-600)/90 text-white text-sm font-semibold py-2.5 hover:bg-(--mint-700) transition backdrop-blur-sm"
          >
            {isQuiz ? "Start quiz →" : "Study flashcards →"}
          </Link>

          {hasMultiple && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-theme/30">
              <button
                type="button"
                onClick={goPrev}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-muted transition text-muted hover:text-base-theme cursor-pointer text-lg leading-none"
                aria-label="Previous recommendation"
              >
                ‹
              </button>
              <span className="text-xs text-muted font-medium">
                {activeIndex + 1} of {items.length}
              </span>
              <button
                type="button"
                onClick={goNext}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-muted transition text-muted hover:text-base-theme cursor-pointer text-lg leading-none"
                aria-label="Next recommendation"
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setPinned((p) => !p)}
        className="recommendation-nudge-fab rounded-full w-16 h-16 shadow-xl bg-(--mint-600) text-white flex items-center justify-center text-2xl font-semibold hover:bg-(--mint-700) hover:scale-105 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--mint-400) focus-visible:ring-offset-2 ring-2 ring-white/70"
        aria-expanded={showPanel}
        aria-label={pinned ? "Close suggestion" : "Open study suggestion"}
        title="Suggested for you — hover or click"
      >
        ✨
      </button>
    </div>
  );
};

export default RecommendationNudge;
