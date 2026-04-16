import api from "./api";

export async function getMyGamification() {
  const res = await api.get("/users/me/gamification");
  return res.data;
}

export async function getBadges() {
  const res = await api.get("/badges");
  return res.data;
}

export async function completeQuizSession(studySetId) {
  const res = await api.post("/quiz-sessions/complete", { study_set_id: studySetId });
  return res.data;
}

