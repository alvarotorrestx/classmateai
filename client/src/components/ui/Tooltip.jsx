import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * Tooltip — renders via a portal so it isn't clipped by parent overflow:hidden.
 *
 * Usage:
 *   <Tooltip content="Explanation text here">
 *     <SomeButton />
 *   </Tooltip>
 *
 * Or without children (renders a default "?" trigger button):
 *   <Tooltip content="Explanation text here" />
 */
const Tooltip = ({ content, children }) => {
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);

  const openTooltip = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left + r.width / 2 });
  }, []);

  const closeTooltip = useCallback(() => setPos(null), []);

  const toggleTooltip = useCallback(() => {
    if (pos) closeTooltip();
    else openTooltip();
  }, [pos, openTooltip, closeTooltip]);

  const trigger = children ? (
    <div
      ref={triggerRef}
      onMouseEnter={openTooltip}
      onMouseLeave={closeTooltip}
      onFocus={openTooltip}
      onBlur={closeTooltip}
      onClick={toggleTooltip}
    >
      {children}
    </div>
  ) : (
    <button
      ref={triggerRef}
      type="button"
      onMouseEnter={openTooltip}
      onMouseLeave={closeTooltip}
      onFocus={openTooltip}
      onBlur={closeTooltip}
      onClick={toggleTooltip}
      className="w-5 h-5 rounded-full bg-(--mint-200) text-(--mint-800) text-xs font-bold flex items-center justify-center hover:bg-(--mint-300) transition shrink-0 cursor-pointer select-none"
      aria-label="More information"
    >
      ?
    </button>
  );

  return (
    <>
      {trigger}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transform: "translateX(-50%)",
            }}
            className="w-60 bg-(--brand) text-white text-xs rounded-xl px-3 py-2.5 shadow-lg z-[9999] leading-relaxed pointer-events-none"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
