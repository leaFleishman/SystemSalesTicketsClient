import axios from "axios";

// In dev, Vite proxies "/api" to the .NET backend (see vite.config.js) so
// no CORS setup is required. For a production build behind a reverse
// proxy you can override this with VITE_API_BASE.
const baseURL = import.meta.env.VITE_API_BASE || "/api";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

let onUnauthorized = null;
export function registerUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("sst_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

// The API's error shapes are inconsistent (plain strings from Conflict()/
// NotFound(), ModelState dictionaries from validation, or the generic
// { message, statusCode } from the exception middleware) — normalize them
// into a single readable string for the UI.
export function extractErrorMessage(error, fallback = "משהו השתבש, נסו שוב.") {
  const data = error?.response?.data;

  if (!data) return error?.message ? String(error.message) : fallback;
  if (typeof data === "string") return data;
  if (typeof data !== "object") return String(data);
  if (typeof data.message === "string" && data.message) return data.message;

  // ASP.NET validation problem details: { title, status, errors: { Field: [msg] } }
  if (data.errors && typeof data.errors === "object") {
    const msgs = Object.entries(data.errors).flatMap(([field, v]) =>
      (Array.isArray(v) ? v : [v]).map((m) => (field && !/^\$|^$/.test(field) ? `${field}: ${m}` : String(m)))
    );
    if (msgs.length) return msgs.join(" · ");
  }
  if (typeof data.title === "string" && data.title) return data.title;
  if (typeof data.detail === "string" && data.detail) return data.detail;
  return fallback;
}
