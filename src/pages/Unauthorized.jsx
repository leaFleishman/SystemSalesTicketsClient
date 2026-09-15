import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";

export default function Unauthorized() {
  return (
    <div className="page">
      <EmptyState
        title="אין לכם הרשאה לצפות בדף זה"
        description="דף זה מיועד למנהלי המערכת בלבד."
        action={
          <Link to="/" className="btn btn-primary">
            חזרה לדף הבית
          </Link>
        }
      />
    </div>
  );
}
