import axios from "axios";

import { API_BASE_URL } from "../utils/apiBaseUrl";

const baseURL = API_BASE_URL;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helps prevent 401 refresh/logout side effects
export const sessionClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Separate client for refresh to avoid interceptor recursion
const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let logoutHandler = null;

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (!config || !response) {
      return Promise.reject(error);
    }

    if (response.status !== 401) {
      return Promise.reject(error);
    }

    // Avoid infinite loops
    if (config._retry) {
      if (logoutHandler) {
        logoutHandler();
      }
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      // Attempt to refresh tokens
      await refreshClient.post("/auth/refresh");
      // Retry the original request with updated cookies
      return api(config);
    } catch (refreshError) {
      if (logoutHandler) {
        logoutHandler();
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;
