import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("auth");
  if (stored) {
    try {
      const { accessToken } = JSON.parse(stored);
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    } catch (_) {}
  }
  return config;
});

export default api;
