import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page err-page">
      <div className="err-code" aria-hidden="true">404</div>
      <h1>הדף לא נמצא</h1>
      <p>הדף שחיפשתם לא קיים או שהוסר. אולי הכרטיס שחיפשתם נמצא במקום אחר.</p>
      <div className="err-actions">
        <Link to="/" className="btn btn-primary">
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}
