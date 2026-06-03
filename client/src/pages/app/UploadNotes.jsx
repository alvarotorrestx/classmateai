import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { createNote, getNote, extractTextFromFile, addContentToNote } from "../../services/noteService";
import { useToast } from "../../context/ToastContext";
import { LEGACY_DOC_MESSAGE, MAX_UPLOAD_BYTES, OVERSIZE_MESSAGE, SUPPORTED_UPLOAD_LABEL, UNSUPPORTED_TYPE_MESSAGE } from "../../utils/uploadLimits";

const ACCEPTED = ".txt,.md,.pdf,.pptx,.docx";
const PLAIN_TEXT_TYPES = ["text/plain", "text/markdown", "text/x-markdown"];

const UploadNotes = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const isExistingCourse = courseId && courseId !== "new";
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [courseTitle, setCourseTitle] = useState(location.state?.title || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!location.state?.title && isExistingCourse) {
      getNote(courseId)
        .then((n) => setCourseTitle(n.title))
        .catch(() => {});
    }
  }, [courseId, isExistingCourse, location.state?.title]);

  const readFileAsText = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const resolveUploadError = (err) => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string" && detail) return detail;
    if (err?.message === OVERSIZE_MESSAGE) return OVERSIZE_MESSAGE;
    return "Failed to process file. Please try again.";
  };

  const processFile = async (file) => {
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(OVERSIZE_MESSAGE);
      return;
    }

    const name = file.name.toLowerCase();
    if (name.endsWith(".doc") && !name.endsWith(".docx")) {
      setError(LEGACY_DOC_MESSAGE);
      return;
    }

    const isPlain = PLAIN_TEXT_TYPES.includes(file.type) || name.endsWith(".txt") || name.endsWith(".md");
    const isPdf = name.endsWith(".pdf");
    const isPptx = name.endsWith(".pptx");
    const isDocx = name.endsWith(".docx");

    if (!isPlain && !isPdf && !isPptx && !isDocx) {
      setError(UNSUPPORTED_TYPE_MESSAGE);
      return;
    }

    setLoading(true);
    setError("");

    try {
      let content;
      if (isPlain) {
        setLoadingMsg("Reading file…");
        content = await readFileAsText(file);
      } else {
        if (isPdf) setLoadingMsg("Extracting text from PDF…");
        else if (isPptx) setLoadingMsg("Extracting text from PowerPoint…");
        else setLoadingMsg("Extracting text from Word document…");
        content = await extractTextFromFile(file);
      }

      if (!content || !content.trim()) {
        setError("No text could be extracted from this file. Please try a different file.");
        return;
      }

      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < 150) {
        setError(
          `Not enough content to generate a study set. Your file contains only ${wordCount} word${wordCount !== 1 ? "s" : ""} — please upload at least 150 words of notes, such as a full lecture handout or chapter summary.`
        );
        return;
      }

      if (isExistingCourse) {
        setLoadingMsg("Generating study materials…");
        await addContentToNote(courseId, content);
        navigate(`/courses/${courseId}`);
      } else {
        setLoadingMsg("Uploading…");
        const title = courseTitle || "My Notes";
        const note = await createNote(title, content);
        addToast("Course created");
        navigate(`/courses/${note.id}/processing`);
      }
    } catch (err) {
      setError(resolveUploadError(err));
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!loading) processFile(e.dataTransfer.files[0]);
  };

  const handleFile = (e) => {
    processFile(e.target.files[0]);
  };

  return (
    <InnerAppPageLayout headerTitle={isExistingCourse ? "Add More Notes" : "Upload Notes"}>
      <h3 className="mb-1">{isExistingCourse ? "Add More Notes" : "Upload Lecture Notes"}</h3>
      <p className="text-sm text-muted mb-6">
        {courseTitle
          ? `${courseTitle} · ${isExistingCourse ? "New content will generate fresh flashcards and update your study guide" : "Your notes will be transformed into flashcards and quizzes"}`
          : "Your notes will be transformed into flashcards and quizzes"}
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-theme bg-surface px-4 py-3 text-sm font-semibold text-error">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!loading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-12 flex flex-col items-center gap-4 transition ${
          loading
            ? "opacity-60 cursor-not-allowed"
            : dragging
            ? "cursor-pointer border-(--mint-600) bg-(--mint-100) text-(--mint-900)"
            : "cursor-pointer border-(--mint-300) bg-(--surface-muted)"
        }`}
        onClick={() => !loading && inputRef.current?.click()}
      >
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-(--mint-600) flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-(--mint-700)">
            <rect x="3" y="3" width="18" height="18" rx="3" ry="3" fill="var(--mint-600)" stroke="none" />
            <path d="M12 8v8M8 12l4-4 4 4" stroke="white" />
          </svg>
        </div>

        {loading ? (
          <>
            <div className="w-6 h-6 rounded-full border-2 border-(--mint-600) border-t-transparent animate-spin" />
            <p className="text-lg font-bold text-center">{loadingMsg}</p>
            <p className="text-sm text-muted">This may take a minute — please don't close this tab</p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold text-center">Drag and drop your file here</p>
            <p className="text-sm text-muted">or click to browse files</p>
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
          accept={ACCEPTED}
          className="hidden"
          disabled={loading}
          onChange={handleFile}
        />

        <p className="text-xs text-muted text-center mt-1">{SUPPORTED_UPLOAD_LABEL}</p>

        <div className="flex flex-wrap justify-center gap-3 mt-1">
          {["PDF", "PPTX", "TXT", "MD", "DOCX"].map((fmt) => (
            <span key={fmt} className="text-xs font-semibold text-(--mint-700) bg-(--mint-100) rounded-lg px-2.5 py-1">
              {fmt}
            </span>
          ))}
        </div>
      </div>
    </InnerAppPageLayout>
  );
};

export default UploadNotes;
