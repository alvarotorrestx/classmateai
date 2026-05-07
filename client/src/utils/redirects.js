export const getSafeRedirect = (search, fallback = "/dashboard") => {
  try {
    const params = new URLSearchParams(search || "");
    const redirect = params.get("redirect"); // URLSearchParams returns a decoded value
    if (!redirect) return fallback;

    const value = String(redirect).trim();
    if (!value.startsWith("/")) return fallback;
    if (value.startsWith("//")) return fallback;
    if (value.includes("http:") || value.includes("https:")) return fallback;
    return value;
  } catch {
    return fallback;
  }
};

