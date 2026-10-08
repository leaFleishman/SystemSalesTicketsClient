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

// The server computes "available" as event.numberOfSeats - sold, i.e. the
// quantity of seats actually ordered for the event. "Sold" is taken from the
// seats really linked to the event (same source as the booking screen), while
// the total stays the ordered quantity - NOT the number of linked seats
// (e.g. 170). So percentages = booked seats / ordered quantity.
async function withRealSeatCounts(data) {
  const events = data?.upcomingEvents;
  if (!Array.isArray(events) || events.length === 0) return data;

  let delta = 0;
  const fixed = await Promise.all(
    events.map(async (ev) => {
      try {
        const seats = await getSeatsForEvent(ev.id);
        if (!Array.isArray(seats)) return ev;
        const sold = seats.filter((s) => (s.isAvailable ?? s.IsAvailable) !== true).length;
        // ordered quantity: event.numberOfSeats if the API sends it, otherwise
        // the server's own sold + available (= numberOfSeats).
        const ordered = Number(ev.numberOfSeats ?? ev.NumberOfSeats);
        const serverTotal = Number(ev.ticketsSold || 0) + Number(ev.availableSeats || 0);
        const total = ordered > 0 ? ordered : serverTotal > 0 ? serverTotal : seats.length;
        const available = Math.max(total - sold, 0);
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
