import { apiClient } from "./client";

export async function getEvents(pageNumber = 1, pageSize = 20) {
  const res = await apiClient.get("/Event", { params: { pageNumber, pageSize } });
  return res.data;
}

export function getEventByName(name) {
  return apiClient
    .get(`/Event/${encodeURIComponent(name)}`)
    .then((res) => res.data);
}

export function createEvent(event) {
  return apiClient.post("/Event", event).then((res) => res.data);
}
