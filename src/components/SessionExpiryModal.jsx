import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SessionExpiryModal() {
  const { expiringSoon, dismissExpiryWarning, logout } = useAuth();
  const navigate = useNavigate();

  if (!expiringSoon) return null;

  const handleReLogin = () => {
    dismissExpiryWarning();
    logout();
    navigate("/login");
  };

  return (
    <div className="modal-backdrop" role="alertdialog" aria-modal="true">
      <div className="modal-card">
        <h3>ההתחברות עומדת לפוג</h3>
        <p>מטעמי אבטחה ההתחברות למערכת תפוג בעוד רגע. שמרו על העבודה שלכם והתחברו מחדש כדי להמשיך.</p>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleReLogin}>
            להתחברות מחדש
          </button>
          <button className="btn btn-secondary" onClick={dismissExpiryWarning}>
            סגירה
          </button>
        </div>
      </div>
    </div>
  );
}
