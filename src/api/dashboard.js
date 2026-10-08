import { apiClient } from "./client";
import { getSeatsForEvent } from "./eventSeats";

export async function getDashboard() {
  // The timestamp param + no-cache header make sure the browser / any proxy
  // never serves a cached copy of the dashboard numbers.
  const response = await apiClient.get("/AdminDashboard", {
    params: { _: Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return withRealSeatCounts(response.data);
}

// The server computes "available" as event.numberOfSeats - sold (e.g. 1000),
// but the booking screen counts the seats really linked to the event (e.g.
// 170). Use the same source as the booking screen so both always agree.
async function withRealSeatCounts(data) {
  const events = data?.upcomingEvents;
  if (!Array.isArray(events) || events.length === 0) return data;

  let delta = 0;
  const fixed = await Promise.all(
    events.map(async (ev) => {
      try {
        const seats = await getSeatsForEvent(ev.id);
        if (!Array.isArray(seats)) return ev;
        const available = seats.filter((s) => (s.isAvailable ?? s.IsAvailable) === true).length;
        const sold = seats.length - available;
        delta += available - Number(ev.availableSeats || 0);
        return { ...ev, availableSeats: available, ticketsSold: sold };
      } catch {
        return ev; // keep server numbers if the seat call fails
      }
    })
  );

  return {
    ...data,
    upcomingEvents: fixed,
    availableSeats: Number(data.availableSeats || 0) + delta,
  };
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
