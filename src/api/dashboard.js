import { apiClient } from "./client";

export async function getDashboard() {
  // The timestamp param + no-cache header make sure the browser / any proxy
  // never serves a cached copy of the dashboard numbers.
  const response = await apiClient.get("/AdminDashboard", {
    params: { _: Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return response.data;
}
