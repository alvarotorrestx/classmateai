import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { createNote, getNote } from "../../services/noteService";

const UploadNotes = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [courseTitle, setCourseTitle] = useState(location.state?.title || "");
  const inputRef = useRef(null);

  // If no title in router state and this is an existing course, fetch it
  useEffect(() => {
    if (!location.state?.title && courseId !== "new") {
      getNote(courseId)
        .then((n) => setCourseTitle(n.title))
        .catch(() => {});
    }
  }, [courseId, location.state?.title]);

  const processFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      if (!content || !content.trim()) {
        setError("The file appears to be empty. Please choose a different file.");
        setLoading(false);
        return;
      }
      try {
        const title = courseTitle || "My Notes";
        const note = await createNote(title, content);
        navigate(`/courses/${note.id}/processing`);
      } catch {
        setError("Failed to upload notes. Please try again.");
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleFile = (e) => {
    processFile(e.target.files[0]);
  };

  return (
    <InnerAppPageLayout>
      <h3 className="mb-1">Upload Lecture Notes</h3>
      <p className="text-sm text-gray-400 mb-6">
        {courseTitle
          ? `${courseTitle} \xb7 Your notes will be transformed into flashcards and quizzes`
          : "Your notes will be transformed into flashcards and quizzes"}
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-12 flex flex-col items-center gap-4 transition ${
          loading
            ? "opacity-60 cursor-not-allowed"
            : dragging
            ? "cursor-pointer border-(--mint-600) bg-(--mint-100)"
            : "cursor-pointer border-(--mint-300) bg-(--mint-50)"
        }`}
        onClick={() => !loading && inputRef.current?.click()}
      >
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-(--mint-600) flex items-center justify-center">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-(--mint-700)"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" ry="3" fill="var(--mint-600)" stroke="none" />
            <path d="M12 8v8M8 12l4-4 4 4" stroke="white" />
          </svg>
        </div>

        {loading ? (
          <>
            <p className="text-lg font-bold text-center">Uploading...</p>
            <p className="text-sm text-gray-400">Please wait</p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold text-center">Drag and drop your notes here</p>
            <p className="text-sm text-gray-400">or click to browse files</p>
            <button
              type="button"
              disabled={loading}
              className="bg-(--mint-600) text-white rounded-xl px-8 py-3 font-semibold text-sm hover:bg-(--mint-700) transition disabled:opacity-50"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              Choose File
            </button>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md"
          className="hidden"
          onChange={handleFile}
        />
        <p className="text-xs text-gray-400">Supports TXT and MD files</p>
      </div>
    </InnerAppPageLayout>
  );
};

export default UploadNotes;
