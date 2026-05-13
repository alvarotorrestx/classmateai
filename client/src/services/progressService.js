import api from "./api";

export const reviewFlashcard = (flashcardId, confidence = 3) =>
  api.post(`/flashcards/${flashcardId}/review`, { confidence }).then((r) => r.data);

