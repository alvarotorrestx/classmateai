import api from "./api";
import { cachedFetch, invalidate } from "../utils/requestCache";

const TTL_GAMIFICATION = 30_000;  // 30s — updates after studying but user won't notice sub-30s lag
const TTL_BADGES       = 120_000; // 2 min — badges rarely change

const KEY_GAMIFICATION = "gamification";
const KEY_BADGES       = "badges";

export async function getMyGamification() {
  return cachedFetch(KEY_GAMIFICATION, () => api.get("/users/me/gamification").then((r) => r.data), TTL_GAMIFICATION);
}

export async function getBadges() {
  return cachedFetch(KEY_BADGES, () => api.get("/badges").then((r) => r.data), TTL_BADGES);
}

export async function completeQuizSession(studySetId) {
  const res = await api.post("/quiz-sessions/complete", { study_set_id: studySetId });
  // Quiz completion updates points, streak, and badges — invalidate so next read is fresh.
  invalidate(KEY_GAMIFICATION, KEY_BADGES);
  return res.data;
}
