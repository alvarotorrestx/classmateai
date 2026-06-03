import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { getNote, getStudySets } from "../../services/noteService";
import { QuizListSkeleton } from "../../components/loading/PageSkeletons";

const Quizzes = () => {
  const { courseId } = useParams();
  const [note, setNote] = useState(null);
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getNote(courseId), getStudySets(courseId)])
      .then(([noteData, sets]) => {
        setNote(noteData);
        setStudySets(sets);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  return (
    <InnerAppPageLayout headerTitle="Quizzes">
      <h3 className="mb-1">Available Quizzes</h3>
      <p className="text-sm text-muted mb-8">{note?.title || "Test your knowledge"}</p>

      {loading ? (
        <QuizListSkeleton />
      ) : studySets.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-theme shadow-sm p-10 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-(--mint-100) flex items-center justify-center mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-(--mint-600)">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
          </div>
          <p className="font-bold text-base mb-1">No quizzes yet</p>
          <p className="text-sm text-muted mb-5">
            Upload lecture notes to generate practice quizzes for this course
          </p>
          <Link
            to={`/courses/${courseId}/upload`}
            state={{ title: note?.title }}
            className="bg-(--mint-600) text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
          >
            Upload Notes
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {studySets.map((set, i) => (
            <div key={set.id} className="bg-surface rounded-2xl border border-theme shadow-sm p-5">
              <p className="font-bold text-base mb-1">{set.label || `Quiz ${i + 1}`}</p>
              <p className="text-sm text-muted mb-1">
                {set.quiz_questions.length} questions
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <Link
                  to={`/quizzes/${courseId}/session/${set.id}`}
                  className="border border-(--mint-600) text-(--mint-700) rounded-xl px-5 py-2 text-sm font-semibold hover:bg-(--mint-50) transition"
                >
                  Start Quiz →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </InnerAppPageLayout>
  );
};

export default Quizzes;
