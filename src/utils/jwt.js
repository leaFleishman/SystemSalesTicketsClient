import { jwtDecode } from "jwt-decode";

// The API signs tokens using System.Security.Claims.ClaimTypes, which
// serialize to long XML-schema URNs rather than short names like "role".
// Note: ClaimTypes.Role does NOT follow the xmlsoap.org/2005 pattern that
// Name/NameIdentifier use — it's its own schema, on a different domain
// and year (schemas.microsoft.com/2008), so it needs its own constant.
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const ID_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

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
  const raw = payload[ID_CLAIM] || payload.nameid || payload.sub || null;
  return raw ? Number(raw) : null;
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
