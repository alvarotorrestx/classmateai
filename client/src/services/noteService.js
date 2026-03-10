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

export const getFlashcards = (studySetId) =>
  api.get(`/study-sets/${studySetId}/flashcards`).then((r) => r.data);

export const getQuiz = (studySetId) =>
  api.get(`/study-sets/${studySetId}/quiz`).then((r) => r.data);

export const deleteNote = (noteId, { deleteCourse = true, deleteFlashcards = true, deleteQuizzes = true } = {}) =>
  api.delete(`/notes/${noteId}`, {
    params: {
      delete_course: deleteCourse,
      delete_flashcards: deleteFlashcards,
      delete_quizzes: deleteQuizzes,
    },
  });
