import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    emoji: "👋",
    title: "Welcome to ClassmateAI!",
    subtitle: "Your AI-powered study companion",
    description:
      "ClassmateAI turns your lecture notes into a complete study toolkit — flashcards, quizzes, summaries, and more — in seconds. Let's take a quick tour of everything available to you.",
    tip: null,
  },
  {
    emoji: "📚",
    title: "Courses",
    subtitle: "Start here — upload your notes",
    description:
      "A Course is a set of notes for one subject or lecture. Upload a PDF, PowerPoint, or plain text file and ClassmateAI will read through it and generate all your study materials automatically.",
    tip: "You can add more content to a course at any time — great for notes that span multiple lectures.",
    highlights: [
      { icon: "📄", label: "PDF, PPTX, or TXT files up to 20 MB" },
      { icon: "🤖", label: "AI generates flashcards, a quiz, summary, and study guide" },
      { icon: "➕", label: "Add new uploads to an existing course any time" },
    ],
  },
  {
    emoji: "🃏",
    title: "Flashcards",
    subtitle: "Study one card at a time",
    description:
      "Every course gets a deck of flashcards. Flip through them at your own pace — when you reveal the answer, rate your confidence so ClassmateAI knows what to suggest next.",
    tip: "You can regenerate a fresh set of flashcards for any course from the course page.",
    highlights: [
      { icon: "👆", label: "Tap to flip and reveal the answer" },
      { icon: "🟢", label: "Rate confidence: Easy, Got it, or Still learning" },
      { icon: "🔄", label: "Generate new cards any time for fresh practice" },
    ],
  },
  {
    emoji: "📝",
    title: "Quizzes",
    subtitle: "Test your knowledge",
    description:
      "Each course also gets a multiple-choice quiz. Work through the questions, get instant feedback on each answer, and see your final score at the end.",
    tip: "Your quiz scores are saved and used to personalise the study recommendations on your Dashboard.",
    highlights: [
      { icon: "❓", label: "Multiple-choice questions with explanations" },
      { icon: "✅", label: "Instant right/wrong feedback after each answer" },
      { icon: "📊", label: "Score history tracked across every session" },
    ],
  },
  {
    emoji: "📊",
    title: "Analytics",
    subtitle: "See how you're improving",
    description:
      "Analytics shows your quiz performance over the last 7 days, a breakdown of your strongest and weakest topics, plus your total study time and current streak.",
    tip: null,
    highlights: [
      { icon: "📈", label: "Weekly quiz score chart" },
      { icon: "🏆", label: "Best score per course at a glance" },
      { icon: "⏱️", label: "Total study time and streak days" },
    ],
  },
  {
    emoji: "🏅",
    title: "Rewards",
    subtitle: "Earn points and badges",
    description:
      "Every time you study you earn points — reviewing flashcards, answering quiz questions, and completing full quiz sessions all count. Reach milestones to unlock badges.",
    tip: "Keep your streak alive by studying every day — even one flashcard session counts!",
    highlights: [
      { icon: "⚡", label: "10 pts per flashcard review" },
      { icon: "🎯", label: "15 pts per quiz answer, 25 pts per completed quiz" },
      { icon: "🔥", label: "Maintain a streak by studying every day" },
    ],
  },
  {
    emoji: "🚀",
    title: "You're all set!",
    subtitle: "Ready to start studying?",
    description:
      "Head to Courses and upload your first set of notes. ClassmateAI will handle the rest — your flashcards and quiz will be ready in under a minute.",
    tip: "You can always replay this tutorial from the account menu in the top-right corner.",
    cta: "Create my first course",
    ctaHref: "/courses/new",
  },
];

const ProgressDots = ({ total, current }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className="rounded-full transition-all duration-300"
        style={{
          width: i === current ? "20px" : "6px",
          height: "6px",
          background: i === current ? "var(--mint-600)" : "var(--border)",
        }}
      />
    ))}
  </div>
);

const TutorialModal = ({ onDismiss }) => {
  const [step, setStep] = useState(0);
  const backdropRef = useRef(null);
  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (!isLast) setStep((s) => s + 1);
  };

  const prev = () => {
    if (!isFirst) setStep((s) => s - 1);
  };

  // Escape key to close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onDismiss]);

  const handleBackdrop = (e) => {
    if (e.target === backdropRef.current) onDismiss();
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 px-4"
    >
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 w-full" style={{ background: "var(--mint-600)" }} />

        {/* Content */}
        <div className="p-7">
          {/* Close button */}
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={onDismiss}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-muted transition cursor-pointer"
              aria-label="Close tutorial"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6L18 18M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Emoji + heading */}
          <div className="flex flex-col items-center text-center mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-sm"
              style={{ background: "var(--mint-100)" }}
            >
              {current.emoji}
            </div>
            <h3 className="font-bold text-xl text-(--text-emphasis) mb-1">{current.title}</h3>
            <p className="text-sm font-semibold text-(--mint-700)">{current.subtitle}</p>
          </div>

          {/* Description */}
          <p className="text-sm text-muted leading-relaxed text-center mb-5">
            {current.description}
          </p>

          {/* Highlight items */}
          {current.highlights && (
            <div className="flex flex-col gap-2 mb-5">
              {current.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                  style={{ background: "var(--surface-muted)" }}
                >
                  <span className="text-lg shrink-0">{h.icon}</span>
                  <span className="text-sm font-medium text-(--text-emphasis)">{h.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tip */}
          {current.tip && (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5"
              style={{ background: "var(--mint-100)" }}
            >
              <span className="text-base shrink-0 mt-0.5">💡</span>
              <p className="text-xs font-medium text-(--mint-900) leading-relaxed">{current.tip}</p>
            </div>
          )}

          {/* CTA for last step */}
          {current.cta && (
            <a
              href={current.ctaHref}
              onClick={onDismiss}
              className="block w-full text-center rounded-xl py-3 text-sm font-semibold text-white mb-5 transition hover:opacity-90"
              style={{ background: "var(--mint-600)" }}
            >
              {current.cta} →
            </a>
          )}
        </div>

        {/* Footer: dots + navigation */}
        <div
          className="flex items-center justify-between px-7 py-4 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <ProgressDots total={STEPS.length} current={step} />

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={prev}
                className="px-4 py-2 rounded-xl text-sm font-semibold border transition cursor-pointer text-(--text) hover:bg-surface-muted"
                style={{ borderColor: "var(--border)" }}
              >
                Back
              </button>
            )}

            {!isLast ? (
              <button
                type="button"
                onClick={next}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 cursor-pointer"
                style={{ background: "var(--mint-600)" }}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={onDismiss}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 cursor-pointer"
                style={{ background: "var(--mint-600)" }}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
