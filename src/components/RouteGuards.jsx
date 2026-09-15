import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

export function RoleRoute({ roles }) {
  const { role } = useAuth();

  if (!roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
