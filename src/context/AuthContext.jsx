import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as authApi from "../api/auth";
import { registerUnauthorizedHandler } from "../api/client";
import { getExpiryMs, getRoleFromToken, getUserIdFromToken, isTokenExpired } from "../utils/jwt";

const AuthContext = createContext(null);

const TOKEN_KEY = "sst_token";
const NAME_KEY = "sst_name";
const WARNING_WINDOW_MS = 45 * 1000; // warn 45s before the (short, 6-minute) token expires

function readSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || isTokenExpired(token)) return null;
  return {
    token,
    role: getRoleFromToken(token),
    userId: getUserIdFromToken(token),
    name: localStorage.getItem(NAME_KEY) || "",
    expiresAt: getExpiryMs(token),
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const [expiringSoon, setExpiringSoon] = useState(false);
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const logout = useCallback((message) => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    clearTimers();
    setExpiringSoon(false);
    setSession(null);
    if (message) {
      sessionStorage.setItem("sst_logout_reason", message);
    }
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => logout("פג תוקף ההתחברות, נא להתחבר מחדש."));
  }, [logout]);

  useEffect(() => {
    clearTimers();
    setExpiringSoon(false);
    if (!session) return;

    const msUntilExpiry = session.expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      logout("פג תוקף ההתחברות, נא להתחבר מחדש.");
      return;
    }

    const msUntilWarning = Math.max(msUntilExpiry - WARNING_WINDOW_MS, 0);
    timers.current.push(setTimeout(() => setExpiringSoon(true), msUntilWarning));
    timers.current.push(setTimeout(() => logout("פג תוקף ההתחברות, נא להתחבר מחדש."), msUntilExpiry));

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  const login = useCallback(async (email, password) => {
    const { token } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(NAME_KEY, email);
    setSession({
      token,
      role: getRoleFromToken(token),
      userId: getUserIdFromToken(token),
      name: email,
      expiresAt: getExpiryMs(token),
    });
    return true;
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: !!session,
      isManager: session?.role === "Manager",
      role: session?.role || null,
      userId: session?.userId || null,
      login,
      logout,
      expiringSoon,
      dismissExpiryWarning: () => setExpiringSoon(false),
    }),
    [session, login, logout, expiringSoon]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
