import { apiClient } from "./client";

// --- Known backend quirk -------------------------------------------------
// GET /api/User (list) returns UserDTO { userName, phone, email } — no id,
// even though GET /api/User/{id} and PUT /api/User?id= both need one. Same
// inferred-id workaround as events/seats/orders (see src/api/seats.js).
// --------------------------------------------------------------------------
export async function getAllUsers(pageNumber = 1, pageSize = 20) {
  const res = await apiClient.get("/User", { params: { pageNumber, pageSize } });
  const data = res.data;
  const offset = (data.pageNumber - 1) * data.pageSize;
  return {
    ...data,
    data: data.data.map((user, i) => ({ ...user, inferredId: offset + i + 1 })),
  };
}

export function getUserById(id) {
  return apiClient.get(`/User/${id}`).then((res) => res.data);
}

export function makeUserManager(id) {
  return apiClient.put("/User", null, { params: { id } }).then((res) => res.data);
}

// Only the original administrator may call this; the server enforces it.
export function makeUserRegular(id) {
  return apiClient.put("/User/demote", null, { params: { id } }).then((res) => res.data);
}
