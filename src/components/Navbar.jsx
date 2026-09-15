import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../utils/format";

export default function Navbar() {
  const { isAuthenticated, isManager, session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
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
            {isManager && (
              <NavLink to="/admin/events" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                ניהול
              </NavLink>
            )}
          </nav>
        )}

        {isAuthenticated ? (
          <div className="nav-user">
            <div>
              <div className="nav-user-name">{session.name}</div>
              <span className="nav-user-role">{roleLabel(session.role)}</span>
            </div>
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
          </div>
        )}
      </div>
    </header>
  );
}
