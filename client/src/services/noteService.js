import api from "./api";
import { apiUrl } from "../utils/apiBaseUrl";
import { cachedFetch, invalidate, invalidateByPrefix } from "../utils/requestCache";

// ─── TTLs ────────────────────────────────────────────────────────────────────
const TTL_NOTES      = 60_000;   // note list rarely changes mid-session
const TTL_STUDY_SETS = 60_000;   // same
const TTL_STUDY_SET  = 60_000;   // single study set (full content)

// ─── Cache key helpers ────────────────────────────────────────────────────────
const KEY_NOTES           = "notes";
const KEY_ALL_STUDY_SETS  = "study-sets";
const keyStudySets  = (noteId)     => `study-sets:${noteId}`;
const keyStudySet   = (studySetId) => `study-set:${studySetId}`;
const keyNote       = (noteId)     => `note:${noteId}`;

// ─── READ — cached ────────────────────────────────────────────────────────────

export const getNotes = () =>
  cachedFetch(KEY_NOTES, () => api.get("/notes").then((r) => r.data), TTL_NOTES);

export const getAllStudySets = () =>
  cachedFetch(KEY_ALL_STUDY_SETS, () => api.get("/study-sets").then((r) => r.data), TTL_STUDY_SETS);

export const getStudySets = (noteId) =>
  cachedFetch(keyStudySets(noteId), () => api.get(`/notes/${noteId}/study-sets`).then((r) => r.data), TTL_STUDY_SETS);

export const getStudySet = (studySetId) =>
  cachedFetch(keyStudySet(studySetId), () => api.get(`/study-sets/${studySetId}`).then((r) => r.data), TTL_STUDY_SET);

export const getNote = (noteId) =>
  cachedFetch(keyNote(noteId), () => api.get(`/notes/${noteId}`).then((r) => r.data), TTL_NOTES);

export const getCourseStudyGuide = (noteId) =>
  api.get(`/notes/${noteId}/study-guide`).then((r) => r.data);

export const getFlashcards = (studySetId) =>
  api.get(`/study-sets/${studySetId}/flashcards`).then((r) => r.data);

export const getQuiz = (studySetId) =>
  api.get(`/study-sets/${studySetId}/quiz`).then((r) => r.data);

// ─── WRITE — invalidate on success ───────────────────────────────────────────

export const createNote = async (title, content) => {
  const data = await api.post("/notes", { title, content }).then((r) => r.data);
  invalidate(KEY_NOTES);
  return data;
};

export const deleteNote = async (noteId, { deleteCourse = true, deleteFlashcards = true, deleteQuizzes = true } = {}) => {
  await api.delete(`/notes/${noteId}`, {
    params: {
      delete_course: deleteCourse,
      delete_flashcards: deleteFlashcards,
      delete_quizzes: deleteQuizzes,
    },
  });
  invalidate(KEY_NOTES, keyNote(noteId));
  invalidateByPrefix("study-sets");
};

export const generateStudyMaterials = async (noteId) => {
  const data = await api.post(`/notes/${noteId}/generate`).then((r) => r.data);
  invalidateByPrefix("study-sets");
  return data;
};

export const addContentToNote = async (noteId, content) => {
  const data = await api.post(`/notes/${noteId}/add-content`, { content }).then((r) => r.data);
  invalidate(KEY_NOTES, keyNote(noteId));
  invalidateByPrefix("study-sets");
  return data;
};

export const generateNewFlashcards = async (noteId, studySetId = null) => {
  const data = await api.post(`/notes/${noteId}/generate/flashcards`, null, {
    params: studySetId ? { study_set_id: studySetId } : {},
  }).then((r) => r.data);
  invalidateByPrefix("study-sets");
  return data;
};

export const generateNewQuiz = async (noteId, studySetId = null) => {
  const data = await api.post(`/notes/${noteId}/generate/quiz`, null, {
    params: studySetId ? { study_set_id: studySetId } : {},
  }).then((r) => r.data);
  invalidateByPrefix("study-sets");
  return data;
};

export const deleteStudySet = async (studySetId) => {
  await api.delete(`/study-sets/${studySetId}`);
  invalidate(keyStudySet(studySetId));
  invalidateByPrefix("study-sets");
};

export const deleteStudySetFlashcards = async (studySetId) => {
  await api.delete(`/study-sets/${studySetId}/flashcards`);
  invalidate(keyStudySet(studySetId));
  invalidateByPrefix("study-sets");
};

export const deleteStudySetQuiz = async (studySetId) => {
  await api.delete(`/study-sets/${studySetId}/quiz`);
  invalidate(keyStudySet(studySetId));
  invalidateByPrefix("study-sets");
};

// ─── FILE UPLOAD — never cached ──────────────────────────────────────────────

export const extractTextFromFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  // Use fetch instead of axios — axios overrides the multipart/form-data boundary.
  const response = await fetch(apiUrl("/extract-text"), {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body.detail || "File extraction failed");
    err.response = { data: body };
    throw err;
  }
  return (await response.json()).text;
};
