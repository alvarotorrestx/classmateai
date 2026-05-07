import { strToU8, zipSync } from "fflate";

export const safeFilename = (base, suffix, ext = "md") => {
  const slug = String(base || "export")
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return `${slug}_${suffix}.${ext}`;
};

export const triggerDownloadBlob = (filename, blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const triggerDownloadMarkdown = (filename, markdown) => {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  triggerDownloadBlob(filename, blob);
};

export const exportHeaderLines = (title, section, exportDateLabel) => [
  `# ${title} — ${section}`,
  `_Exported on ${exportDateLabel}_`,
  "",
  "---",
  "",
];

export const buildNotesMarkdown = ({ title, exportDateLabel, noteContent }) => {
  const lines = [
    ...exportHeaderLines(title, "Notes", exportDateLabel),
    "",
    String(noteContent || "").trim(),
    "",
  ];
  return lines.join("\n");
};

export const buildStudyGuideMarkdown = ({ title, exportDateLabel, guideContent }) => {
  const lines = [
    ...exportHeaderLines(title, "Study Guide", exportDateLabel),
    "",
    String(guideContent || "").trim(),
    "",
  ];
  return lines.join("\n");
};

export const buildFlashcardsMarkdown = ({ title, exportDateLabel, decks }) => {
  const allFlashcards = (decks || []).flatMap((d, i) =>
    (d.flashcards || []).map((fc) => ({
      ...fc,
      setLabel: d.label || `Study Set ${i + 1}`,
    }))
  );
  const lines = [...exportHeaderLines(title, "Flashcards", exportDateLabel), ""];
  let lastLabel = null;
  for (const fc of allFlashcards) {
    if (fc.setLabel !== lastLabel) {
      lines.push(`### ${fc.setLabel}`);
      lines.push("");
      lastLabel = fc.setLabel;
    }
    lines.push(`**${fc.front}**`);
    lines.push(fc.back);
    lines.push("");
  }
  return { markdown: lines.join("\n"), count: allFlashcards.length };
};

export const buildQuizMarkdown = ({ title, exportDateLabel, decks }) => {
  const allQuestions = (decks || []).flatMap((d, i) =>
    (d.quiz_questions || []).map((q) => ({
      ...q,
      setLabel: d.label || `Study Set ${i + 1}`,
    }))
  );
  const lines = [...exportHeaderLines(title, "Quiz Questions", exportDateLabel), ""];
  const letters = ["A", "B", "C", "D"];
  let lastLabel = null;
  let counter = 1;
  for (const q of allQuestions) {
    if (q.setLabel !== lastLabel) {
      lines.push(`### ${q.setLabel}`);
      lines.push("");
      lastLabel = q.setLabel;
      counter = 1;
    }
    lines.push(`**${counter}. ${q.question}**`);
    lines.push("");
    (q.options || []).forEach((opt, idx) => {
      const marker = idx === q.correct_index ? " ✓" : "";
      lines.push(`- ${letters[idx] || idx + 1}) ${opt}${marker}`);
    });
    if (q.explanation) {
      lines.push("");
      lines.push(`> ${q.explanation}`);
    }
    lines.push("");
    counter++;
  }
  return { markdown: lines.join("\n"), count: allQuestions.length };
};

export const buildCourseZipBlob = ({ filesByName }) => {
  const zipData = zipSync(
    Object.fromEntries(
      Object.entries(filesByName).map(([name, content]) => [name, strToU8(content)])
    )
  );
  return new Blob([zipData], { type: "application/zip" });
};

