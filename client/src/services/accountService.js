import api, { sessionClient } from "./api";

export const requestEmailChange = async ({ new_email, current_password }) => {
  const response = await api.post("/users/me/email-change/request", {
    new_email,
    current_password,
  });
  return response.data;
};

export const verifyEmailChange = async (token) => {
  const response = await sessionClient.post("/users/me/email-change/verify", { token });
  return response.data;
};

export const fetchSession = async () => {
  const response = await sessionClient.get("/auth/session");
  return response.data;
};

