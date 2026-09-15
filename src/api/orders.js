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
