import { useState } from "react";

const STORAGE_KEY = "classmateai_tutorial_seen";

export function useTutorial() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "true";
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const reopen = () => setOpen(true);

  return { tutorialOpen: open, dismissTutorial: dismiss, reopenTutorial: reopen };
}
