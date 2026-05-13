const STORAGE_KEY = "quizHistory";
const MAX_ENTRIES = 20;

export const saveQuizResult = (entry) => {
  const existing = getQuizHistory();
  const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getQuizHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};