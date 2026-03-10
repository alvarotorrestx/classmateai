import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { getAllStudySets, getNotes } from "../../services/noteService";

const AllQuizzes = () => {
  const [sets, setSets] = useState([]);
  const [noteMap, setNoteMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllStudySets(), getNotes()])
      .then(([data, notes]) => {
        const map = Object.fromEntries(notes.map((n) => [n.id, n.title]));
        setNoteMap(map);
        setSets(data.filter((s) => s.quiz_questions.length > 0));
      })
      .catch(() => setSets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <InnerAppPageLayout>
      <h3 className="mb-1">Quizzes</h3>
      <p className="text-sm text-gray-400 mb-8">All your available quizzes</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-(--mint-600) border-t-transparent animate-spin" />
        </div>
      ) : sets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center text-center">
          <p className="font-bold text-base mb-1">No quizzes yet</p>
          <p className="text-sm text-gray-400 mb-5">
            Upload lecture notes to a course to generate quizzes
          </p>
          <Link
            to="/dashboard"
            className="bg-(--mint-600) text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sets.map((set, i) => (
            <div key={set.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-bold text-base mb-1">{(set.note_id && noteMap[set.note_id]) || set.label || "Deleted Course"}</p>
              <p className="text-sm text-gray-400 mb-4">
                {set.quiz_questions.length} questions
              </p>
              <Link
                to={`/quizzes/${set.note_id}/session/${set.id}`}
                className="border border-(--mint-600) text-(--mint-700) rounded-xl px-5 py-2 text-sm font-semibold hover:bg-(--mint-50) transition"
              >
                Start Quiz →
              </Link>
            </div>
          ))}
        </div>
      )}
    </InnerAppPageLayout>
  );
};

export default AllQuizzes;