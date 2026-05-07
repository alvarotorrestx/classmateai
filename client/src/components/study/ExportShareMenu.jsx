import { useEffect, useRef, useState } from "react";

const DownloadIcon = ({ className = "" }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ShareIcon = ({ className = "" }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const Chevron = ({ open }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform ${open ? "rotate-180" : ""}`}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const MenuItem = ({ icon, label, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full text-left px-4 py-2 text-sm font-medium text-base-theme hover:bg-surface-muted transition flex items-center gap-2.5 disabled:opacity-50 disabled:hover:bg-transparent"
  >
    {icon}
    {label}
  </button>
);

const ExportShareMenu = ({
  disabled = false,
  busy = false,
  statusText = "",
  exportItems = [],
  onExport,
  onShare,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label = busy ? (statusText || "Working…") : "Export / Share";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || busy}
        className="border border-theme text-base-theme rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-surface-muted transition disabled:opacity-50 flex items-center gap-2"
      >
        {busy ? (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <DownloadIcon />
        )}
        {label}
        {!busy ? <Chevron open={open} /> : null}
      </button>

      {open && !busy ? (
        <div className="absolute left-0 bottom-full mb-2 w-64 rounded-xl border border-theme bg-surface shadow-lg py-1.5 z-20">
          {exportItems.map((it, idx) => (
            <div key={it.id || it.type || idx}>
              {it.divider ? <div className="my-1 border-t border-theme" /> : null}
              <MenuItem
                icon={<DownloadIcon className="text-muted shrink-0" />}
                label={it.label}
                disabled={disabled || it.disabled}
                onClick={() => {
                  setOpen(false);
                  onExport?.(it.type);
                }}
              />
            </div>
          ))}

          <div className="my-1 border-t border-theme" />
          <MenuItem
            icon={<ShareIcon className="text-muted shrink-0" />}
            label="Share study pack"
            disabled={disabled}
            onClick={() => {
              setOpen(false);
              onShare?.();
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default ExportShareMenu;

