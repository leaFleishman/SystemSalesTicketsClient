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

// Tells every open dashboard (this tab and other tabs) that numbers changed
// - called after a booking / cancellation succeeds.
const KEY = "sst_dashboard_dirty";
export function notifyDashboardChanged() {
  try {
    localStorage.setItem(KEY, String(Date.now())); // fires "storage" in OTHER tabs
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("sst-dashboard-dirty")); // same tab
}

export function subscribeDashboardChanges(fn) {
  const onStorage = (e) => {
    if (e.key === KEY) fn();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("sst-dashboard-dirty", fn);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("sst-dashboard-dirty", fn);
  };
}
