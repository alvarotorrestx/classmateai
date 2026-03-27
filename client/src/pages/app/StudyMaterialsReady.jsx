import { Link, useParams, useLocation } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import flashcardIcon from "../../assets/icons/core/flashcard.svg";
import quizIcon from "../../assets/icons/core/quiz.svg";

const StudyMaterialsReady = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const studySetId = location.state?.studySetId;

  return (
    <InnerAppPageLayout>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-(--mint-600) mx-auto mb-5 flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="mb-2">Study Materials Generated</h3>
        <p className="text-sm text-gray-400">
          Your notes have been transformed into interactive learning materials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border-2 border-(--mint-200) p-6 flex flex-col items-start gap-2">
          <div className="w-12 h-12"><img src={flashcardIcon} alt="Flashcards" /></div>
          <p className="text-(--mint-700) font-semibold mt-1">Flashcards</p>
          <p className="text-sm text-gray-400">Ready to review</p>
          <Link
            to={studySetId ? `/flashcards/${studySetId}` : `/courses/${courseId}`}
            className="mt-2 bg-(--mint-600) text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
          >
            Review Flashcards
          </Link>
        </div>

        <div className="bg-white rounded-2xl border-2 border-(--mint-200) p-6 flex flex-col items-start gap-2">
          <div className="w-12 h-12"><img src={quizIcon} alt="Quiz" /></div>
          <p className="text-(--mint-700) font-semibold mt-1">Practice Quiz</p>
          <p className="text-sm text-gray-400">Questions ready</p>
          <Link
            to={
              studySetId
                ? `/quizzes/${courseId}/session/${studySetId}`
                : `/quizzes/${courseId}`
            }
            className="mt-2 bg-(--mint-600) text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
          >
            Take Quiz
          </Link>
        </div>
      </div>

      <div className="text-center">
        <Link
          to={`/courses/${courseId}/upload`}
          className="bg-(--mint-600) text-white rounded-xl px-8 py-3 text-sm font-semibold hover:bg-(--mint-700) transition inline-block"
        >
          Upload more notes
        </Link>
      </div>
    </InnerAppPageLayout>
  );
};

export default StudyMaterialsReady;
