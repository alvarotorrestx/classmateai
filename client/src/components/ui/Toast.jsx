const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Toast = ({ id, message, type, onRemove }) => {
  const styles = {
    success: {
      border: "border-l-[var(--mint-500)]",
      icon: <CheckIcon />,
      iconColor: "text-(--mint-600)",
    },
    error: {
      border: "border-l-red-400",
      icon: <ErrorIcon />,
      iconColor: "text-red-500",
    },
    info: {
      border: "border-l-blue-400",
      icon: <InfoIcon />,
      iconColor: "text-blue-500",
    },
  };

  const { border, icon, iconColor } = styles[type] || styles.success;

  return (
    <div className={`toast-item flex items-start gap-3 bg-white rounded-2xl border border-gray-100 border-l-4 ${border} shadow-lg px-4 py-3 w-72`}>
      <span className={`shrink-0 mt-0.5 ${iconColor}`}>{icon}</span>
      <p className="text-sm font-medium text-(--text-emphasis) flex-1 leading-snug">{message}</p>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="shrink-0 text-gray-300 hover:text-gray-500 transition mt-0.5 cursor-pointer"
        aria-label="Dismiss"
      >
        <XIcon />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default Toast;
