import { useEffect, useId, useRef } from "react";

const SubmitQuizConfirmModal = ({ open, submitting = false, onCancel, onConfirm }) => {
  const backdropRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (submitting) return;
      onCancel?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, submitting, onCancel]);

  if (!open) return null;

  const handleBackdropMouseDown = (e) => {
    if (submitting) return;
    if (e.target === backdropRef.current) onCancel?.();
  };

  const handleConfirm = () => {
    if (submitting) return;
    onConfirm?.();
  };

  return (
    <div
      ref={backdropRef}
      onMouseDown={handleBackdropMouseDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-(--mint-100) flex items-center justify-center shrink-0 mt-0.5 text-(--mint-700)">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
          <div>
            <p id={titleId} className="font-bold text-base text-(--text-emphasis) leading-snug">
              Are you sure you want to submit this quiz?
            </p>
            <p className="text-sm text-muted mt-1">
              Once submitted, your answers will be graded and cannot be changed.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="border border-theme text-base-theme rounded-xl px-5 py-2 text-sm font-semibold hover:bg-surface-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-(--mint-600) text-white rounded-xl px-5 py-2 text-sm font-semibold hover:bg-(--mint-700) transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && (
              <span
                className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"
                aria-hidden
              />
            )}
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitQuizConfirmModal;
