import { apiClient } from "./client";

export function login(email, password) {
  return apiClient
    .post("/Auth", { email, password })
    .then((res) => res.data);
}

export function register({ userName, phone, email, password }) {
  return apiClient
    .post("/User", { userName, phone, email, password })
    .then((res) => res.data);
}
