import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { getQuiz, getStudySet, getNote } from "../../services/noteService";
import { saveQuizResult } from "../../hooks/useQuizHistory";

const LETTERS = ["A", "B", "C", "D"];

const QuizSession = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [quizMeta, setQuizMeta] = useState({ quizLabel: null, courseTitle: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    Promise.all([
      getQuiz(quizId),
      getStudySet(quizId).catch(() => null),
      getNote(courseId).catch(() => null),
    ])
      .then(([questions, set, note]) => {
        const sorted = [...questions].sort(
          (a, b) => a.display_order - b.display_order
        );
        setQuestions(sorted);
        setQuizMeta({
          quizLabel: set?.label || null,
          courseTitle: note?.title || null,
        });
      })
      .catch(() => setError("Failed to load quiz. Please try again."))
      .finally(() => setLoading(false));
  }, [quizId, courseId]);

  const saveAndGo = (direction) => {
    const updated = { ...answers };
    if (selected !== null) updated[current] = selected;
    setAnswers(updated);
    const next = current + direction;
    setSelected(updated[next] ?? null);
    setCurrent(next);
  };

  const handleFinish = () => {
    const updated = { ...answers };
    if (selected !== null) updated[current] = selected;
    setAnswers(updated);
    setFinished(true);

    const total = questions.length;
    const correct = questions.filter((q, i) => updated[i] === q.correct_index).length;
    saveQuizResult({
      id: crypto.randomUUID(),
      quizId,
      courseId,
      quizLabel: quizMeta.quizLabel,
      courseTitle: quizMeta.courseTitle,
      correct,
      total,
      scorePercent: Math.round((correct / total) * 100),
      takenAt: new Date().toISOString(),
    });
  };

  const handleRetake = () => {
    setAnswers({});
    setSelected(null);
    setCurrent(0);
    setFinished(false);
  };

  if (loading) {
    return (
      <InnerAppPageLayout>
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-(--mint-600) border-t-transparent animate-spin" />
        </div>
      </InnerAppPageLayout>
    );
  }

  if (error) {
    return (
      <InnerAppPageLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <p className="text-red-500 font-semibold mb-4">{error}</p>
          <button
            onClick={() => navigate(`/quizzes/${courseId}`)}
            className="border border-(--mint-600) text-(--mint-700) rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-(--mint-50) transition"
          >
            Back to Quizzes
          </button>
        </div>
      </InnerAppPageLayout>
    );
  }

  if (questions.length === 0) {
    return (
      <InnerAppPageLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <p className="font-bold text-base mb-2">No questions available</p>
          <p className="text-sm text-gray-400 mb-6">
            This quiz does not have any questions yet.
          </p>
          <button
            onClick={() => navigate(`/quizzes/${courseId}`)}
            className="border border-(--mint-600) text-(--mint-700) rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-(--mint-50) transition"
          >
            Back to Quizzes
          </button>
        </div>
      </InnerAppPageLayout>
    );
  }

  if (finished) {
    const total = questions.length;
    const correct = questions.filter(
      (q, i) => answers[i] === q.correct_index
    ).length;
    const skipped = questions.filter((_, i) => answers[i] === undefined).length;
    const incorrect = total - correct - skipped;
    const scorePercent = Math.round((correct / total) * 100);

    const reviewQuestions = questions.map((q, i) => ({
      q,
      i,
      isCorrect: answers[i] === q.correct_index,
    }));

    return (
      <InnerAppPageLayout>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-(--mint-100) flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="text-(--mint-600)"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="mb-1">Quiz Complete!</h3>
            <p className="text-sm text-gray-400">Here's how you did</p>
          </div>

          {/* Score card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 flex flex-col items-center">
            <p className="text-5xl font-bold text-(--mint-600) mb-1">{scorePercent}%</p>
            <p className="text-sm text-gray-400 mb-5">{correct} of {total} correct</p>
            <div className="w-full flex gap-4">
              <div className="flex-1 bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{correct}</p>
                <p className="text-xs text-green-700 font-medium mt-0.5">Correct</p>
              </div>
              <div className="flex-1 bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-500">{incorrect}</p>
                <p className="text-xs text-red-600 font-medium mt-0.5">Incorrect</p>
              </div>
              {skipped > 0 && (
                <div className="flex-1 bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-400">{skipped}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Skipped</p>
                </div>
              )}
            </div>
          </div>

          {/* Full review */}
          <div className="mb-6">
            <p className="font-bold text-base mb-3">Review All Answers</p>
            <div className="flex flex-col gap-4">
              {reviewQuestions.map(({ q, i, isCorrect }) => (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border-2 shadow-sm p-5 ${
                    isCorrect ? "border-green-100" : "border-red-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-sm font-semibold text-(--text-emphasis)">
                      Q{i + 1}. {q.question}
                    </p>
                    <span
                      className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  {/* User's answer — only show separately if wrong */}
                  {!isCorrect && (
                    answers[i] !== undefined ? (
                      <div className="flex items-start gap-3 mb-2">
                        <span className="mt-0.5 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {LETTERS[answers[i]]}
                        </span>
                        <div>
                          <p className="text-xs text-red-500 font-medium">Your answer</p>
                          <p className="text-sm text-gray-700">{q.options[answers[i]]}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mb-2 italic">Not answered</p>
                    )
                  )}

                  {/* Correct answer */}
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {LETTERS[q.correct_index]}
                    </span>
                    <div>
                      <p className="text-xs text-green-600 font-medium">
                        {isCorrect ? "Your answer" : "Correct answer"}
                      </p>
                      <p className="text-sm text-gray-700">{q.options[q.correct_index]}</p>
                    </div>
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <p className="mt-3 text-xs text-gray-400 border-t border-gray-100 pt-3">
                      {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="border border-(--mint-600) text-(--mint-700) rounded-xl px-6 py-3 font-semibold text-sm hover:bg-(--mint-50) transition"
            >
              Back to Course
            </button>
            <button
              onClick={handleRetake}
              className="bg-(--mint-600) text-white rounded-xl px-6 py-3 font-semibold text-sm hover:bg-(--mint-700) transition"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </InnerAppPageLayout>
    );
  }

  const question = questions[current];
  const isLast = current === questions.length - 1;
  const isFirst = current === 0;

  return (
    <InnerAppPageLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-400">
            Question{" "}
            <span className="font-semibold text-black">{current + 1}</span> of{" "}
            <span className="font-semibold text-black">{questions.length}</span>
          </p>
          <p className="text-sm text-gray-400">
            Answered:{" "}
            <span className="font-semibold text-black">
              {Object.keys(answers).length +
                (selected !== null && answers[current] === undefined ? 1 : 0)}
            </span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
          <div
            className="bg-(--mint-500) h-1.5 rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <p className="text-(--mint-700) font-semibold text-sm mb-3">
            Question {current + 1}
          </p>
          <p className="text-lg font-bold leading-snug">{question.question}</p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 mb-8">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex items-center gap-4 text-left w-full rounded-2xl border-2 px-5 py-4 font-medium text-sm transition ${
                selected === i
                  ? "border-(--mint-600) bg-(--mint-50) text-(--mint-700)"
                  : "border-gray-100 bg-white hover:border-(--mint-300) hover:bg-(--mint-50)"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  selected === i
                    ? "bg-(--mint-600) text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {LETTERS[i]}
              </span>
              <span>{option}</span>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-3">
          <button
            onClick={() => saveAndGo(-1)}
            disabled={isFirst}
            className="border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition"
          >
            &lt; Previous
          </button>

          <div className="flex gap-3">
            {!isLast && (
              <button
                onClick={() => saveAndGo(1)}
                className="border border-(--mint-600) text-(--mint-700) rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-50) transition"
              >
                Next &gt;
              </button>
            )}
            <button
              onClick={handleFinish}
              className="bg-(--mint-600) text-white rounded-xl px-8 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
            >
              Finish Quiz
            </button>
          </div>
        </div>
      </div>
    </InnerAppPageLayout>
  );
};

export default QuizSession;
