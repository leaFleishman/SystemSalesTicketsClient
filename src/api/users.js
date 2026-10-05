import { apiClient } from "./client";

// --- Known backend quirk -------------------------------------------------
// GET /api/User (list) now returns UserDTO { id, userName, phone, email, isBlocked }.
// The inferred-id fallback is kept only in case an older server (without id) is used.
// --------------------------------------------------------------------------
export async function getAllUsers(pageNumber = 1, pageSize = 20) {
  const res = await apiClient.get("/User", { params: { pageNumber, pageSize } });
  const data = res.data;
  const offset = (data.pageNumber - 1) * data.pageSize;
  return {
    ...data,
    data: data.data.map((user, i) => ({ ...user, inferredId: user.id ?? offset + i + 1 })),
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

// Manager only. Blocks the user: they can no longer log in and their token is rejected.
export function blockUser(id) {
  return apiClient.put("/User/block", null, { params: { id } }).then((res) => res.data);
}

// Manager only. Reactivates a blocked user.
export function unblockUser(id) {
  return apiClient.put("/User/unblock", null, { params: { id } }).then((res) => res.data);
}
