const BRAND_COLORS = ["#00cc99", "#00a67d", "#66e0c2", "#ffd078", "#ffffff"];

export async function fireQuizCompletionConfetti() {
  if (typeof window === "undefined") return;

  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch {
    // ignore
  }

  try {
    const { default: confetti } = await import("canvas-confetti");
    confetti({
      particleCount: 140,
      spread: 150,
      startVelocity: 28,
      origin: { y: 0.55 },
      colors: BRAND_COLORS,
      disableForReducedMotion: true,
    });
  } catch {
    // ignore load/runtime errors
  }
}
