import { apiClient } from "./client";

export async function getSeats(pageNumber = 1, pageSize = 100) {
  const res = await apiClient.get("/Seat", { params: { pageNumber, pageSize } });
  return res.data;
}

export function getSeatById(id) {
  return apiClient.get(`/Seat/${id}`).then((res) => res.data);
}

export function createSeat(seat) {
  return apiClient.post("/Seat", seat).then((res) => res.data);
}

export function deleteSeat(id) {
  return apiClient.delete(`/Seat/${id}`).then((res) => res.data);
}
