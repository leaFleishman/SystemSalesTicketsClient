import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../api/client";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(sessionStorage.getItem("sst_logout_reason") || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem("sst_logout_reason");
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const dest = location.state?.from?.pathname || "/";
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("אימייל או סיסמה שגויים.");
      } else {
        setError(extractErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div className="auth-header">
          <h1>ברוכים השבים</h1>
          <p>התחברו כדי לצפות באירועים ולהזמין כרטיסים</p>
        </div>

        <div className="form-card">
          {notice && <div className="alert alert-info">{notice}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">אימייל</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">סיסמה</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? "מתחבר..." : "התחברות"}
            </button>
          </form>
        </div>

        <p className="auth-switch">
          אין לכם חשבון? <Link to="/register">הרשמה</Link>
        </p>
      </div>
    </div>
  );
}
