import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { getNote, getStudySets } from "../../services/noteService";

const Courses = () => {
  const { courseId } = useParams();
  const [note, setNote] = useState(null);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getNote(courseId), getStudySets(courseId)])
      .then(([noteData, studySets]) => {
        setNote(noteData);
        setDecks(studySets);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  return (
    <InnerAppPageLayout>
      <h3 className="mb-1">{note?.title || "Course Materials"}</h3>
      <p className="text-sm text-gray-400 mb-8">Choose a deck to study</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-(--mint-600) border-t-transparent animate-spin" />
        </div>
      ) : decks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-(--mint-100) flex items-center justify-center mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-(--mint-600)">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M8 4v16M16 4v16" />
            </svg>
          </div>
          <p className="font-bold text-base mb-1">No decks yet</p>
          <p className="text-sm text-gray-400 mb-5">
            Upload your lecture notes to generate flashcard decks
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {decks.map((deck, i) => (
            <div
              key={deck.id}
              className={`rounded-2xl border-2 p-5 flex flex-col bg-white ${
                i === 0 ? "border-(--mint-600)" : "border-gray-100"
              }`}
            >
              <p className="font-bold text-base mb-1">
                {deck.label || `Study Set ${i + 1}`}
              </p>
              <div className="flex flex-wrap gap-x-4 text-sm text-gray-500 mb-5">
                <span>
                  <span className="font-semibold text-black">{deck.flashcards.length}</span> flashcards
                </span>
                <span>
                  <span className="font-semibold text-black">{deck.quiz_questions.length}</span> quiz questions
                </span>
              </div>
              <Link
                to={`/flashcards/${deck.id}`}
                className={`mt-auto text-center rounded-xl px-4 py-2.5 font-semibold text-sm transition ${
                  i === 0
                    ? "bg-(--mint-600) text-white hover:bg-(--mint-700)"
                    : "border border-(--mint-600) text-(--mint-700) hover:bg-(--mint-50)"
                }`}
              >
                Study Now
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/quizzes/${courseId}`}
          className="border border-(--mint-600) text-(--mint-700) rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-50) transition"
        >
          View Quizzes
        </Link>
        <Link
          to={`/courses/${courseId}/upload`}
          state={{ title: note?.title }}
          className="bg-(--mint-600) text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
        >
          Upload Notes
        </Link>
      </div>
    </InnerAppPageLayout>
  );
};

export default Courses;
