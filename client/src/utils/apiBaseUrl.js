const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

/** Normalized API origin with no trailing slash (avoids `//path` when joining paths). */
export const API_BASE_URL = String(rawBaseUrl).trim().replace(/\/+$/, "");

/**
 * @param {string} path - Path beginning with "/" or without; normalized to exactly one leading slash.
 * @returns {string} Full URL, e.g. https://api.example.com/extract-text
 */
export function apiUrl(path) {
  const p = String(path ?? "").trim();
  const withSlash = p.startsWith("/") ? p : `/${p}`;
  return `${API_BASE_URL}${withSlash}`;
}
