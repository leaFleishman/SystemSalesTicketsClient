import { jwtDecode } from "jwt-decode";

const ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

const ID_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

const NAME_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

export function decodeToken(token) {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

export function getRoleFromToken(token) {
  const payload = decodeToken(token);
  if (!payload) return null;

  return payload[ROLE_CLAIM] || payload.role || null;
}

export function getUserIdFromToken(token) {
  const payload = decodeToken(token);
  if (!payload) return null;

  const raw =
    payload[ID_CLAIM] ||
    payload.nameid ||
    payload.sub ||
    null;

  return raw ? Number(raw) : null;
}

export function getNameFromToken(token) {
  const payload = decodeToken(token);
  if (!payload) return "";

  return payload[NAME_CLAIM] || payload.name || "";
}

export function getExpiryMs(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;

  return payload.exp * 1000;
}

export function isTokenExpired(token) {
  const expiry = getExpiryMs(token);

  if (!expiry) return true;

  return Date.now() >= expiry;
}