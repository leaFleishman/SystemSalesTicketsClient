import { apiClient } from "./client";

export async function getDashboard() {
  const response = await apiClient.get("/AdminDashboard");
  return response.data;
}