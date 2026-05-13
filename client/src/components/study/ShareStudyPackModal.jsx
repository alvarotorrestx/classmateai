import { useEffect, useMemo, useRef } from "react";
import Button from "../ui/Button";

const ShareStudyPackModal = ({
  open,
  onClose,
  busy = false,
  shareUrl = "",
  onCreateLink,
  onCopyLink,
  onShareViaEmail,
}) => {
  const backdropRef = useRef(null);
  const inputRef = useRef(null);

  const hasUrl = Boolean(shareUrl);

  const titleId = useMemo(
    () => `share-study-pack-title-${Math.random().toString(16).slice(2)}`,
    []
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (busy) return;
      onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onClose]);

  useEffect(() => {
    if (!open) return;
    // Focus/select URL when available to make copy easy
    if (hasUrl) {
      requestAnimationFrame(() => {
        inputRef.current?.focus?.();
        inputRef.current?.select?.();
      });
    }
  }, [open, hasUrl]);

  if (!open) return null;

  const handleBackdropMouseDown = (e) => {
    if (busy) return;
    if (e.target === backdropRef.current) onClose?.();
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
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p id={titleId} className="font-bold text-base text-(--text-emphasis) leading-snug">
              Share study pack
            </p>
            <p className="text-sm text-muted mt-1">
              Create a link that lets someone preview and import this study pack into their own account.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-9 h-9 rounded-lg hover:bg-surface-muted transition flex items-center justify-center cursor-pointer disabled:opacity-50"
            aria-label="Close share modal"
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6L18 18M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {hasUrl ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-(--mint-700)">
                Share link
              </label>
              <input
                ref={inputRef}
                value={shareUrl}
                readOnly
                inputMode="url"
                className="w-full rounded-xl border border-theme bg-surface px-4 py-3 text-sm text-base-theme shadow-sm outline-none focus:border-(--mint-400) focus:ring-2 focus:ring-(--mint-200)"
                onFocus={(e) => e.target.select()}
                aria-label="Share URL"
              />
              <p className="text-xs text-muted">
                Anyone with this link can preview the notes. Importing requires login.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={onCreateLink}
                disabled={busy}
                className="w-full sm:w-auto"
              >
                {busy ? "Working…" : "Recreate link"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onCopyLink}
                disabled={busy}
                className="w-full sm:w-auto"
              >
                Copy link
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onShareViaEmail}
                disabled={busy}
                className="w-full sm:w-auto"
              >
                Share via email
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              variant="primary"
              onClick={onCreateLink}
              disabled={busy}
              className="w-full"
            >
              {busy ? "Creating…" : "Create share link"}
            </Button>
            <p className="text-xs text-muted">
              We only create a link when you click “Create share link”.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareStudyPackModal;

