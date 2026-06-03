import { Link } from "react-router-dom";

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const FlashcardIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M8 4v16" />
  </svg>
);

const QuizIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r=".5" fill="currentColor" />
  </svg>
);

const GuideIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="8 21 12 17 16 21" />
    <line x1="12" y1="17" x2="12" y2="11" />
    <path d="M5 3H19V9A7 7 0 0 1 5 9Z" />
    <path d="M5 3C5 3 3 3 3 5C3 7 5 9 5 9" />
    <path d="M19 3C19 3 21 3 21 5C21 7 19 9 19 9" />
  </svg>
);

const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const BookOpenIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

// ── Feature card data ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <FlashcardIcon />,
    title: "Flashcards",
    description:
      "AI-generated front-and-back cards built directly from your lecture notes. Study at your own pace, flip and repeat.",
  },
  {
    icon: <QuizIcon />,
    title: "Practice Quizzes",
    description:
      "Multiple-choice questions with explanations. Know exactly why each answer is right or wrong.",
  },
  {
    icon: <GuideIcon />,
    title: "Study Guides",
    description:
      "A concise, structured summary of everything in your notes — great for the night before an exam.",
  },
  {
    icon: <TrophyIcon />,
    title: "Progress & Rewards",
    description:
      "Track study streaks, earn badges, and watch your points grow as you work through your courses.",
  },
];

// ── How it works steps ────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "1",
    icon: <UploadIcon />,
    title: "Upload your notes",
    description: "Drop in a PDF, PowerPoint, Word doc, or plain text file from any lecture or class.",
  },
  {
    number: "2",
    icon: <SparkleIcon />,
    title: "AI does the work",
    description:
      "ClassmateAI reads your notes and instantly generates flashcards, quiz questions, and a study guide.",
  },
  {
    number: "3",
    icon: <BookOpenIcon />,
    title: "Study and track",
    description:
      "Review flashcards, take quizzes, and monitor your progress across all your courses in one place.",
  },
];

// ── Main component ────────────────────────────────────────────────────────────

const Landing = () => {
  return (
    <div className="min-h-screen bg-(--surface) text-(--text)">

      {/* ── Sticky nav ── */}
      <nav className="sticky top-0 z-30 bg-brand px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-sm">
        <img
          src="/images/logo/logo.png"
          alt="ClassmateAI logo"
          className="w-15 h-12 rounded-md bg-white p-1 shrink-0"
        />
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/login"
            className="rounded-xl bg-(--mint-800) text-white px-4 py-2 sm:px-5 text-sm font-semibold hover:bg-(--mint-700) transition whitespace-nowrap"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-white text-(--mint-800) px-4 py-2 sm:px-5 text-sm font-semibold hover:bg-(--mint-50) transition whitespace-nowrap"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-(--mint-100) text-(--mint-800) px-4 py-1.5 text-sm font-semibold mb-6">
          <SparkleIcon />
          AI-powered study tools
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-5">
          Turn your lecture notes<br className="hidden sm:block" /> into a{" "}
          <span className="text-(--mint-600)">complete study kit</span>
        </h1>

        <p className="text-lg text-muted max-w-xl mx-auto mb-10">
          Upload your notes and ClassmateAI instantly generates flashcards, practice quizzes,
          and study guides — so you can spend less time making materials and more time actually learning.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="rounded-xl bg-(--mint-600) px-8 py-3.5 text-base font-bold text-white hover:bg-(--mint-700) transition shadow-md"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-theme px-8 py-3.5 text-base font-semibold text-base-theme hover:bg-surface-muted transition"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-surface-muted py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-muted mb-3">
            How it works
          </p>
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-12">
            From notes to study-ready in seconds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-(--mint-600) flex items-center justify-center text-white shadow-md">
                  {step.icon}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">
                    Step {step.number}
                  </p>
                  <p className="font-bold text-base mb-2">{step.title}</p>
                  <p className="text-sm text-muted leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-muted mb-3">
            Features
          </p>
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-12">
            Everything you need to study smarter
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-theme bg-surface p-6 flex gap-4 shadow-sm hover:border-(--mint-300) transition"
              >
                <div className="w-12 h-12 rounded-xl bg-(--mint-100) flex items-center justify-center text-(--mint-700) shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="font-bold text-base mb-1">{f.title}</p>
                  <p className="text-sm text-muted leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-(--brand) py-16 px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Ready to study smarter?
        </h2>
        <p className="text-(--mint-200) text-base mb-8 max-w-md mx-auto">
          Create a free account and upload your first set of notes in under a minute.
        </p>
        <Link
          to="/register"
          className="inline-block rounded-xl bg-white text-(--mint-800) px-10 py-3.5 text-base font-bold hover:bg-(--mint-50) transition shadow-md"
        >
          Get Started Free
        </Link>
        <p className="mt-5 text-sm text-(--mint-300)">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-white underline underline-offset-2 hover:text-(--mint-100) transition">
            Sign in
          </Link>
        </p>
      </section>

    </div>
  );
};

export default Landing;
