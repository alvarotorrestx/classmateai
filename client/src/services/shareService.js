import api, { sessionClient } from "./api";

export const createShareLink = async ({ resource_type, resource_id }) => {
  const response = await api.post("/shares", { resource_type, resource_id });
  return response.data;
};

export const getSharePreview = async (token) => {
  const response = await sessionClient.get(`/shares/${token}`);
  return response.data;
};

export const importShare = async (token) => {
  const response = await api.post(`/shares/${token}/import`);
  return response.data;
};

