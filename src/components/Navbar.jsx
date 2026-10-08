import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../utils/format";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { isAuthenticated, isManager, session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>כרטיסים</span>
        </NavLink>

        {isAuthenticated && (
          <nav className="nav-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
              אירועים
            </NavLink>
            <NavLink to="/my-orders" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
              ההזמנות שלי
            </NavLink>
            {isManager && (
              <NavLink to="/admin/events" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                ניהול
              </NavLink>
            )}
          </nav>
        )}

        {isAuthenticated ? (
          <div className="nav-user">
            <div className="nav-user-info">
              <span className="avatar" aria-hidden="true">{(session.name || "?").trim().charAt(0).toUpperCase()}</span>
              <div>
                <div className="nav-user-name">{session.name}</div>
                <span className="nav-user-role">{roleLabel(session.role)}</span>
              </div>
            </div>
            <ThemeToggle />
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              התנתקות
            </button>
          </div>
        ) : (
          <div className="nav-links">
            <NavLink to="/login" className="nav-link">
              התחברות
            </NavLink>
            <NavLink to="/register" className="btn btn-primary btn-sm">
              הרשמה
            </NavLink>
            <ThemeToggle />
          </div>
        )}
      </div>
    </header>
  );
}
