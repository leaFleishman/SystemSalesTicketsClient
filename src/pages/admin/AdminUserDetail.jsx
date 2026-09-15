import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as usersApi from "../../api/users";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../context/ToastContext";
import { roleLabel } from "../../utils/format";

export default function AdminUserDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [promoting, setPromoting] = useState(false);

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

        <div className="mt-24">
          <button className="btn btn-primary" onClick={handlePromote} disabled={promoting}>
            {promoting ? "מקדם..." : "קידום לתפקיד מנהל"}
          </button>
        </div>
      </div>
    </div>
  );
}
