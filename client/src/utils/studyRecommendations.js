// Checks if there is any study content in the notes or study sets
export function hasStudyContent(notes, studySets) {
  if (!Array.isArray(notes) || notes.length === 0) return false;
  if (!Array.isArray(studySets) || studySets.length === 0) return false;
  return studySets.some(
    (s) =>
      (Array.isArray(s.flashcards) && s.flashcards.length > 0) ||
      (Array.isArray(s.quiz_questions) && s.quiz_questions.length > 0)
  );
}

function aggregateHistory(quizHistory) {
  const byCourse = {};
  for (const e of quizHistory || []) {
    if (!e?.courseId) continue;
    const t = new Date(e.takenAt).getTime();
    if (!byCourse[e.courseId]) {
      byCourse[e.courseId] = {
        best: e.scorePercent,
        last: t,
        count: 1,
      };
    } else {
      const cur = byCourse[e.courseId];
      cur.best = Math.max(cur.best, e.scorePercent);
      cur.last = Math.max(cur.last, t);
      cur.count += 1;
    }
  }
  return byCourse;
}

// Determines the priority of a quiz based on the best score
function quizPriority(bestScore) {
  if (bestScore == null) return 3;
  if (bestScore < 60) return 0;
  if (bestScore < 80) return 1;
  if (bestScore < 100) return 2;
  return 4;
}

// Generates study recommendations based on the notes, study sets, and quiz history
export function getStudyRecommendations({ notes, studySets, quizHistory }) {
  if (!hasStudyContent(notes, studySets)) return [];

  const byCourse = aggregateHistory(quizHistory);
  const rows = [];

  for (const note of notes) {
    const setsForNote = studySets.filter((s) => s.note_id === note.id);
    const quizSet = setsForNote.find((s) => s.quiz_questions?.length > 0);
    const flashSet = setsForNote.find((s) => s.flashcards?.length > 0);
    if (!quizSet && !flashSet) continue;

    const agg = byCourse[note.id];
    const bestScore = agg ? agg.best : null;
    const lastQuiz = agg?.last ?? 0;

    let sortKey;
    if (quizSet) {
      sortKey = quizPriority(bestScore);
    } else if (flashSet) {
      sortKey = 5;
    } else {
      continue;
    }

    rows.push({
      note,
      quizSet,
      flashSet,
      bestScore,
      lastQuiz,
      sortKey,
    });
  }

  if (rows.length === 0) return [];

  rows.sort((a, b) => {
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
    if (a.bestScore != null && b.bestScore != null && a.bestScore !== b.bestScore) {
      return a.bestScore - b.bestScore;
    }
    return a.lastQuiz - b.lastQuiz;
  });

  const out = [];
  const used = new Set();

  const addQuiz = (row) => {
    if (!row.quizSet || used.has(row.note.id)) return;
    used.add(row.note.id);
    const reason =
      row.bestScore == null
        ? "You haven't taken a quiz for this course yet."
        : row.bestScore < 60
          ? `Latest best score is ${row.bestScore}% — try another quiz to improve.`
          : row.bestScore < 80
            ? `Room to grow — best score ${row.bestScore}%.`
            : `Polish your mastery — best score ${row.bestScore}%.`;
    out.push({
      type: "quiz",
      courseId: row.note.id,
      courseTitle: row.note.title,
      studySetId: row.quizSet.id,
      reason,
      href: `/quizzes/${row.note.id}/session/${row.quizSet.id}`,
    });
  };

  const addFlash = (row) => {
    if (!row.flashSet || used.has(row.note.id)) return;
    used.add(row.note.id);
    out.push({
      type: "flashcards",
      courseId: row.note.id,
      courseTitle: row.note.title,
      studySetId: row.flashSet.id,
      reason:
        row.sortKey === 4
          ? "Great quiz scores — review flashcards to lock in concepts."
          : "Review flashcards to reinforce what you've learned.",
      href: `/flashcards/${row.flashSet.id}`,
    });
  };

  for (const row of rows) {
    if (out.length >= 3) break;
    if (row.sortKey <= 3 && row.quizSet) addQuiz(row);
  }

  for (const row of rows) {
    if (out.length >= 3) break;
    if (row.sortKey === 4 && row.flashSet) addFlash(row);
  }

  for (const row of rows) {
    if (out.length >= 3) break;
    if (row.sortKey === 5) addFlash(row);
  }

  return out.slice(0, 3);
}

// Returns the top recommendation by type - quiz or flashcards
export function getTopRecommendationByType(recommendations, type) {
  if (!Array.isArray(recommendations)) return null;
  return recommendations.find((r) => r.type === type) || null;
}

// Returns the best flashcard nudge for the All Flashcards page - based on the notes, study sets, and quiz history
export function getBestFlashcardNudge({ notes, studySets, quizHistory }) {
  if (!hasStudyContent(notes, studySets)) return null;

  const byCourse = aggregateHistory(quizHistory);
  const candidates = [];

  for (const note of notes) {
    const setsForNote = studySets.filter((s) => s.note_id === note.id);
    const flashSet = setsForNote.find((s) => s.flashcards?.length > 0);
    if (!flashSet) continue;

    const quizSet = setsForNote.find((s) => s.quiz_questions?.length > 0);
    const agg = byCourse[note.id];
    const bestScore = agg ? agg.best : null;
    const lastQuiz = agg?.last ?? 0;

    let tier;
    let reason;

    if (!quizSet) {
      tier = 4;
      reason = "Review flashcards to reinforce what you've learned.";
    } else if (bestScore == null) {
      tier = 2;
      reason = "Review flashcards before your first quiz.";
    } else if (bestScore < 60) {
      tier = 0;
      reason = `Best quiz ${bestScore}% — review flashcards to improve.`;
    } else if (bestScore < 80) {
      tier = 1;
      reason = `Best quiz ${bestScore}% — flashcards can help you level up.`;
    } else if (bestScore < 100) {
      tier = 3;
      reason = "Solid scores — keep concepts fresh with flashcards.";
    } else {
      tier = 3;
      reason = "Great quiz scores — lock in concepts with flashcards.";
    }

    candidates.push({ note, flashSet, tier, bestScore, lastQuiz, reason });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.bestScore != null && b.bestScore != null && a.bestScore !== b.bestScore) {
      return a.bestScore - b.bestScore;
    }
    return a.lastQuiz - b.lastQuiz;
  });

  const top = candidates[0];
  return {
    type: "flashcards",
    courseId: top.note.id,
    courseTitle: top.note.title,
    studySetId: top.flashSet.id,
    reason: top.reason,
    href: `/flashcards/${top.flashSet.id}`,
  };
}
