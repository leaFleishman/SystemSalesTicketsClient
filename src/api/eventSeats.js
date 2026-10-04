import { apiClient } from "./client";

// Returns the seats actually linked to a specific event, with their real
// seatId and current availability — this is what the booking screen and
// the admin seat-linking screen use instead of guessing ids.
export function getSeatsForEvent(eventId) {
  return apiClient.get(`/EventSeat/event/${eventId}`).then((res) => res.data);
}

// Links an existing (global) seat to an existing event so it becomes
// bookable for that event. Manager-only.
export function addEventSeat({ eventId, seatId }) {
  return apiClient.post("/EventSeat", { eventId, seatId }).then((res) => res.data);
}

// Removes a seat's association with an event. Manager-only. The server
// answers 409 if the seat already has an order for this event.
export function removeEventSeat({ eventId, seatId }) {
  return apiClient.delete(`/EventSeat/event/${eventId}/seat/${seatId}`);
}

// Links every seat not yet linked to this event, in one request. Manager-only.
export function linkAllSeatsToEvent(eventId) {
  return apiClient.post(`/EventSeat/event/${eventId}/link-all`).then((res) => res.data);
}
