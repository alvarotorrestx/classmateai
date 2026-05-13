import { sessionClient } from "./api";

// Auth endpoints must use sessionClient (no 401 interceptor) so a failed login
// doesn't trigger a token-refresh attempt and swallow the real error message.

export const registerUser = async ({ full_name, email, password, redirect }) => {
  const payload = { full_name, email, password };
  if (redirect) payload.redirect = redirect;
  const response = await sessionClient.post("/auth/register", payload);
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await sessionClient.post("/auth/login", {
    email,
    password,
  });
  return response.data;
};

export const resendVerification = async (email) => {
  const response = await sessionClient.post("/auth/resend-verification", { email });
  return response.data;
};