import { apiClient } from "./client";

export function createOrder({ eventId, seatId, userId }) {
  return apiClient.post("/Order", { eventId, seatId, userId }).then((res) => res.data);
}

export function getAllOrders(pageNumber = 1, pageSize = 20) {
  return apiClient.get("/Order", { params: { pageNumber, pageSize } }).then((res) => res.data);
}

export function getOrderById(id) {
  return apiClient.get(`/Order/${id}`).then((res) => res.data);
}

// The logged-in customer's own bookings (identity comes from the JWT).
export function getMyOrders() {
  return apiClient.get("/Order/my").then((res) => res.data);
}

// Cancels one of the customer's bookings. The server only allows this
// more than 24 hours before the event (409 otherwise).
export function cancelOrder(id) {
  return apiClient.delete(`/Order/${id}`).then((res) => res.data);
}
