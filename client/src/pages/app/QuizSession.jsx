import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { getQuiz } from "../../services/noteService";

const LETTERS = ["A", "B", "C", "D"];

const QuizSession = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    getQuiz(quizId)
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => a.display_order - b.display_order
        );
        setQuestions(sorted);
      })
      .catch(() => setError("Failed to load quiz. Please try again."))
      .finally(() => setLoading(false));
  }, [quizId]);

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
    const answeredCount = Object.keys(answers).length;
    const total = questions.length;
    return (
      <InnerAppPageLayout>
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-(--mint-100) flex items-center justify-center mx-auto mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-(--mint-600)"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="mb-2">Quiz Complete!</h3>
          <p className="text-sm text-gray-400 mb-8">
            You answered{" "}
            <span className="font-semibold text-black">{answeredCount}</span> of{" "}
            <span className="font-semibold text-black">{total}</span> questions
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
            <p className="text-4xl font-bold text-(--mint-600) mb-1">
              {answeredCount}/{total}
            </p>
            <p className="text-sm text-gray-400">Questions answered</p>
          </div>

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

          {isLast ? (
            <button
              onClick={handleFinish}
              className="bg-(--mint-600) text-white rounded-xl px-8 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
            >
              Finish Quiz
            </button>
          ) : (
            <button
              onClick={() => saveAndGo(1)}
              className="bg-(--mint-600) text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
            >
              Next &gt;
            </button>
          )}
        </div>
      </div>
    </InnerAppPageLayout>
  );
};

export default QuizSession;
