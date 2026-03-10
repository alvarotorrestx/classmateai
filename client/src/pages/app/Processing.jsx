import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";
import { generateStudyMaterials } from "../../services/noteService";

const STEPS = [
  "Extracted text from notes",
  "Identified key concepts",
  "Generating flashcards...",
  "Generating quiz questions...",
];

const Processing = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [doneSteps, setDoneSteps] = useState(0);
  const [error, setError] = useState(null);
  const studySetRef = useRef(null);
  const hasFired = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode's double-invoke in development
    if (hasFired.current) return;
    hasFired.current = true;

    let cancelled = false;
    let currentProgress = 0;
    let intervalId;

    // Start AI generation call immediately
    generateStudyMaterials(courseId)
      .then((data) => {
        if (!cancelled) studySetRef.current = data;
      })
      .catch(() => {
        if (!cancelled) setError("Failed to generate study materials. Please try again.");
      });

    // Animate: 0->90 slowly (waiting for API), then 90->100 fast once API resolves
    intervalId = setInterval(() => {
      if (cancelled) return;
      const apiDone = studySetRef.current !== null;
      const maxProg = apiDone ? 100 : 90;
      const step = apiDone && currentProgress >= 90 ? 3 : 1;

      currentProgress = Math.min(currentProgress + step, maxProg);
      setProgress(currentProgress);
      setDoneSteps(Math.floor((currentProgress / 100) * STEPS.length));

      if (currentProgress >= 100 && studySetRef.current) {
        clearInterval(intervalId);
        setTimeout(() => {
          if (!cancelled) {
            navigate(`/courses/${courseId}/ready`, {
              state: { studySetId: studySetRef.current.id },
            });
          }
        }, 400);
      }
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [courseId, navigate]);

  if (error) {
    return (
      <InnerAppPageLayout>
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h3 className="mb-2">Generation Failed</h3>
            <p className="text-sm text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-(--mint-600) text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </InnerAppPageLayout>
    );
  }

  return (
    <InnerAppPageLayout>
      <div className="max-w-lg mx-auto text-center">
        <h3 className="mb-2">Analyzing Your Notes...</h3>
        <p className="text-sm text-gray-400 mb-8">This usually takes 30 - 60 seconds</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 text-left">
          <p className="text-sm font-semibold text-(--mint-700) mb-3">Generating study materials</p>
          <div className="h-2 w-full rounded-full bg-gray-100 mb-2">
            <div
              className="h-2 rounded-full bg-(--mint-600) transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {STEPS.map((step, i) => {
            const done = i < doneSteps;
            return (
              <div
                key={step}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold text-left transition ${
                  done ? "border-(--mint-600) text-(--mint-700)" : "border-gray-100 text-gray-400"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full shrink-0 transition-colors ${
                    done ? "bg-(--mint-600)" : "bg-gray-200"
                  }`}
                />
                {step}
              </div>
            );
          })}
        </div>
      </div>
    </InnerAppPageLayout>
  );
};

export default Processing;
