import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="page err-page">
      <div className="err-code" aria-hidden="true">403</div>
      <h1>אין לכם הרשאה לצפות בדף זה</h1>
      <p>דף זה מיועד למנהלי המערכת בלבד.</p>
      <div className="err-actions">
        <Link to="/" className="btn btn-primary">
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}
