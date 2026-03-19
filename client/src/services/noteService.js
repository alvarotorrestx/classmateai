import api from "./api";

export const getNotes = () => api.get("/notes").then((r) => r.data);

export const createNote = (title, content) =>
  api.post("/notes", { title, content }).then((r) => r.data);

export const getNote = (noteId) =>
  api.get(`/notes/${noteId}`).then((r) => r.data);

export const getAllStudySets = () =>
  api.get("/study-sets").then((r) => r.data);

export const getStudySet = (studySetId) =>
  api.get(`/study-sets/${studySetId}`).then((r) => r.data);

export const getStudySets = (noteId) =>
  api.get(`/notes/${noteId}/study-sets`).then((r) => r.data);

export const generateStudyMaterials = (noteId) =>
  api.post(`/notes/${noteId}/generate`).then((r) => r.data);

export const generateNewFlashcards = (noteId, studySetId = null) =>
  api.post(`/notes/${noteId}/generate/flashcards`, null, {
    params: studySetId ? { study_set_id: studySetId } : {},
  }).then((r) => r.data);

export const generateNewQuiz = (noteId, studySetId = null) =>
  api.post(`/notes/${noteId}/generate/quiz`, null, {
    params: studySetId ? { study_set_id: studySetId } : {},
  }).then((r) => r.data);

export const deleteStudySet = (studySetId) =>
  api.delete(`/study-sets/${studySetId}`);

export const getFlashcards = (studySetId) =>
  api.get(`/study-sets/${studySetId}/flashcards`).then((r) => r.data);

export const getQuiz = (studySetId) =>
  api.get(`/study-sets/${studySetId}/quiz`).then((r) => r.data);

export const deleteStudySetFlashcards = (studySetId) =>
  api.delete(`/study-sets/${studySetId}/flashcards`);

export const deleteStudySetQuiz = (studySetId) =>
  api.delete(`/study-sets/${studySetId}/quiz`);

export const extractTextFromFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  // Use fetch instead of the axios instance — axios's default Content-Type: application/json
  // header overrides the multipart/form-data boundary that the browser needs to set automatically.
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/extract-text`,
    { method: "POST", credentials: "include", body: formData }
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body.detail || "File extraction failed");
    err.response = { data: body };
    throw err;
  }
  return (await response.json()).text;
};

export const deleteNote = (noteId, { deleteCourse = true, deleteFlashcards = true, deleteQuizzes = true } = {}) =>
  api.delete(`/notes/${noteId}`, {
    params: {
      delete_course: deleteCourse,
      delete_flashcards: deleteFlashcards,
      delete_quizzes: deleteQuizzes,
    },
  });
