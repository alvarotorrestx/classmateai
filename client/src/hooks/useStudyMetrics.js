const STORAGE_KEY = "classmateai-study-activities";
const MAX_ACTIVITIES = 500;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { v: 1, activities: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.activities)) {
      return { v: 1, activities: [] };
    }
    return { v: 1, activities: parsed.activities };
  } catch {
    return { v: 1, activities: [] };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.error("Failed to save study metrics to localStorage");
  }
}

function localDateKey(isoOrDate) {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysToKey(key, deltaDays) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return localDateKey(dt);
}

export function recordStudyActivity(payload) {
  const { type, durationSec, courseId, deckId, quizId } = payload;
  if (type !== "flashcards" && type !== "quiz") return;
  const sec = Math.max(0, Math.round(Number(durationSec) || 0));
  const at = payload.at || new Date().toISOString();

  const state = loadState();
  const entry = {
    id: crypto.randomUUID(),
    at,
    type,
    durationSec: sec,
    ...(courseId ? { courseId } : {}),
    ...(deckId ? { deckId } : {}),
    ...(quizId ? { quizId } : {}),
  };
  state.activities = [entry, ...state.activities].slice(0, MAX_ACTIVITIES);
  saveState(state);
}

export function getStudyActivities() {
  return loadState().activities;
}

export function getTotalStudySeconds() {
  return getStudyActivities().reduce((sum, a) => sum + (a.durationSec || 0), 0);
}

export function getCurrentStudyStreakDays() {
  const activities = getStudyActivities();
  if (!activities.length) return 0;

  const daysWithActivity = new Set();
  for (const a of activities) {
    if (!a.at) continue;
    daysWithActivity.add(localDateKey(a.at));
  }

  const todayKey = localDateKey(new Date());
  const yesterdayKey = addDaysToKey(todayKey, -1);

  let anchor = null;
  if (daysWithActivity.has(todayKey)) anchor = todayKey;
  else if (daysWithActivity.has(yesterdayKey)) anchor = yesterdayKey;
  else return 0;

  let count = 0;
  let key = anchor;
  while (daysWithActivity.has(key)) {
    count += 1;
    key = addDaysToKey(key, -1);
  }
  return count;
}

export function formatStudyDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return remM ? `${h}h ${remM}m` : `${h}h`;
}
