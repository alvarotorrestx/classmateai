/** Max file size for lecture note uploads (under Vercel ~4.5 MB request body limit). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const MAX_UPLOAD_LABEL = "4 MB";

export const OVERSIZE_MESSAGE =
  "This file is too large to upload. Please use a file under 4 MB or try again.";

export const SUPPORTED_UPLOAD_LABEL =
  "Supported: PDF, PPTX, TXT, MD, DOCX (up to 4 MB)";

export const LEGACY_DOC_MESSAGE =
  "Legacy .doc files are not supported. Please save as .docx and try again.";

export const UNSUPPORTED_TYPE_MESSAGE =
  "Unsupported file type. Please upload a PDF, PPTX, TXT, MD, or DOCX file.";
