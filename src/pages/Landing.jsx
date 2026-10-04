import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-inner">
        <span className="landing-mark" aria-hidden="true" />
        <h1>כרטיסים לאירועים, בקליק אחד</h1>
        <p>גלו אירועים, בחרו מושבים והזמינו כרטיסים בקלות ובמהירות.</p>
        <div className="landing-actions">
          <Link to="/login" className="btn btn-primary">
            התחברות
          </Link>
          <Link to="/register" className="btn btn-secondary">
            הרשמה
          </Link>
        </div>
      </div>
    </div>
  );
}
