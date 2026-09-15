import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";

export default function NotFound() {
  return (
    <div className="page">
      <EmptyState
        title="404 · הדף לא נמצא"
        description="הדף שחיפשתם לא קיים או שהוסר."
        action={
          <Link to="/" className="btn btn-primary">
            חזרה לדף הבית
          </Link>
        }
      />
    </div>
  );
}
