import { Link } from "react-router-dom";

const POINTS = [
  "בחירת מושב חופשית על מפת האולם",
  "הזמנה מאובטחת ואישור מיידי",
  "ביטול פשוט עד 24 שעות לפני האירוע",
];

// Split-screen layout shared by the login and register pages.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-split">
      <aside className="auth-aside" aria-hidden="false">
        <Link to="/" className="auth-aside-brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>כרטיסים</span>
        </Link>

        <div className="auth-aside-body">
          <h2>
            הערב הבא שלכם
            <br />
            <em>מתחיל כאן</em>
          </h2>
          <ul className="auth-points">
            {POINTS.map((p) => (
              <li key={p}>
                <span className="auth-point-dot" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-aside-ticket" aria-hidden="true">
          <div className="aat-top">
            <small>כרטיס כניסה</small>
            <strong>שורה C · מושב 12</strong>
          </div>
          <div className="aat-bar" />
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-panel">
          <div className="auth-header">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="form-card">{children}</div>
          {footer && <p className="auth-switch">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
