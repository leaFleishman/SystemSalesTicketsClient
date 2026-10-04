import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as usersApi from "../../api/users";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { roleLabel } from "../../utils/format";

// Must match "OriginalAdmin:Email" on the server (the server is what actually enforces it).
const ORIGINAL_ADMIN_EMAIL = (import.meta.env.VITE_ORIGINAL_ADMIN_EMAIL || "admin@example.com").toLowerCase();

export default function AdminUserDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { session, userId } = useAuth();
  const isOriginalAdmin = (session?.name || "").trim().toLowerCase() === ORIGINAL_ADMIN_EMAIL;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [demoting, setDemoting] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    usersApi
      .getUserById(id)
      .then(setUser)
      .catch((err) => setError(extractErrorMessage(err, "לא ניתן לטעון את פרטי המשתמש.")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const updated = await usersApi.makeUserManager(id);
      toast.success("המשתמש קודם לתפקיד מנהל.");
      setUser((u) => ({ ...u, ...updated }));
    } catch (err) {
      toast.error(extractErrorMessage(err, "קידום המשתמש נכשל."));
    } finally {
      setPromoting(false);
    }
  };

  const handleDemote = async () => {
    if (!window.confirm("להחזיר את המנהל למשתמש רגיל?")) return;
    setDemoting(true);
    try {
      await usersApi.makeUserRegular(id);
      toast.success("המנהל הוחזר למשתמש רגיל.");
      setUser((u) => ({ ...u, role: "User" }));
    } catch (err) {
      toast.error(extractErrorMessage(err, "הורדת התפקיד נכשלה."));
    } finally {
      setDemoting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error || !user) return <EmptyState title="המשתמש לא נמצא" description={error} />;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>משתמש #{user.id || id}</h2>
        <Link className="btn btn-secondary btn-sm" to="/admin/users">
          חזרה לרשימה
        </Link>
      </div>
      <div className="panel-body stack-8">
        <div className="confirm-row">
          <span>שם</span>
          <span>{user.userName}</span>
        </div>
        <div className="confirm-row">
          <span>טלפון</span>
          <span>{user.phone}</span>
        </div>
        <div className="confirm-row">
          <span>אימייל</span>
          <span>{user.email}</span>
        </div>
        {user.role && (
          <div className="confirm-row">
            <span>תפקיד</span>
            <span className="badge badge-primary">{roleLabel(user.role)}</span>
          </div>
        )}

        <div className="mt-24" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={handlePromote} disabled={promoting}>
            {promoting ? "מקדם..." : "קידום לתפקיד מנהל"}
          </button>
          {isOriginalAdmin && user.role === "Manager" && Number(id) !== userId && (
            <button className="btn btn-danger" onClick={handleDemote} disabled={demoting}>
              {demoting ? "מבצע..." : "החזרה למשתמש רגיל"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
