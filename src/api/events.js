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

// Managers only. Body: { name, date, price, numberOfSeats }.
// Returns the updated EventDTO. Errors come back as plain-text messages
// (400 invalid, 404 not found, 409 cancelled / past / duplicate / seats below orders).
export function updateEvent(id, data) {
  return apiClient.put(`/Event/${id}`, data).then((res) => res.data);
}

// Managers only. Body is optional: { reason }.
// Returns { status, event, affectedOrders, notificationsSent }.
export function cancelEvent(id, reason) {
  const body = reason && reason.trim() ? { reason: reason.trim() } : {};
  return apiClient.put(`/Event/${id}/cancel`, body).then((res) => res.data);
}
