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
const ORIGINAL_ADMIN_EMAIL = (
    import.meta.env.VITE_ORIGINAL_ADMIN_EMAIL || "admin@example.com"
).toLowerCase();

export default function AdminUserDetail() {
    const { id } = useParams();
    const toast = useToast();
    const { session, userId } = useAuth();

    const isOriginalAdmin =
        (session?.name || "").trim().toLowerCase() === ORIGINAL_ADMIN_EMAIL;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [promoting, setPromoting] = useState(false);
    const [demoting, setDemoting] = useState(false);
    const [togglingBlock, setTogglingBlock] = useState(false);

    const load = () => {
        setLoading(true);
        setError("");

        usersApi
            .getUserById(id)
            .then(setUser)
            .catch((err) =>
                setError(
                    extractErrorMessage(
                        err,
                        "לא ניתן לטעון את פרטי המשתמש."
                    )
                )
            )
            .finally(() => setLoading(false));
    };

    useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePromote = async () => {
        setPromoting(true);

        try {
            const updated = await usersApi.makeUserManager(id);

            toast.success("המשתמש קודם לתפקיד מנהל.");

            setUser((u) => ({
                ...u,
                ...updated,
                role: "Manager",
            }));
        } catch (err) {
            toast.error(
                extractErrorMessage(err, "קידום המשתמש נכשל.")
            );
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

            setUser((u) => ({
                ...u,
                role: "User",
            }));
        } catch (err) {
            toast.error(
                extractErrorMessage(err, "הורדת התפקיד נכשלה.")
            );
        } finally {
            setDemoting(false);
        }
    };

    const handleToggleBlock = async () => {
        const blocking = !user.isBlocked;

        const question = blocking
            ? "לחסום את המשתמש? הוא לא יוכל להתחבר."
            : "להפעיל מחדש את המשתמש?";

        if (!window.confirm(question)) return;

        setTogglingBlock(true);

        try {
            const updated = blocking
                ? await usersApi.blockUser(id)
                : await usersApi.unblockUser(id);

            toast.success(
                blocking
                    ? "המשתמש נחסם."
                    : "המשתמש הופעל מחדש."
            );

            setUser((u) => ({
                ...u,
                isBlocked: updated?.isBlocked ?? blocking,
            }));
        } catch (err) {
            toast.error(
                extractErrorMessage(
                    err,
                    blocking
                        ? "חסימת המשתמש נכשלה."
                        : "הפעלת המשתמש נכשלה."
                )
            );
        } finally {
            setTogglingBlock(false);
        }
    };

    if (loading) return <Spinner />;

    if (error || !user) {
        return (
            <EmptyState
                title="המשתמש לא נמצא"
                description={error}
            />
        );
    }

    const initial = (user.userName || "?").trim().charAt(0).toUpperCase();
    const canPromote = user.role !== "Manager";
    const canDemote =
        isOriginalAdmin && user.role === "Manager" && Number(id) !== userId;
    const canBlock =
        Number(id) !== userId && (user.role !== "Manager" || isOriginalAdmin);

    return (
        <div className="profile">
            <aside className="profile-card">
                <div className="profile-avatar">{initial}</div>
                <h2>{user.userName}</h2>
                <p className="profile-id">משתמש #{user.id || id}</p>

                <div className="profile-badges">
                    {user.role && (
                        <span className="badge badge-primary">
                            {roleLabel(user.role)}
                        </span>
                    )}
                    <span
                        className={`badge ${user.isBlocked ? "badge-danger" : "badge-success"}`}
                    >
                        {user.isBlocked ? "חסום" : "פעיל"}
                    </span>
                </div>

                <Link className="btn btn-secondary btn-sm btn-block" to="/admin/users">
                    חזרה לרשימה
                </Link>
            </aside>

            <div className="profile-main">
                <div className="panel">
                    <div className="panel-header">
                        <h2>פרטי המשתמש</h2>
                    </div>

                    <div className="detail-list">
                        <div className="detail-row">
                            <span>שם</span>
                            <span>{user.userName}</span>
                        </div>
                        <div className="detail-row">
                            <span>טלפון</span>
                            <span dir="ltr">{user.phone}</span>
                        </div>
                        <div className="detail-row">
                            <span>אימייל</span>
                            <span dir="ltr">{user.email}</span>
                        </div>
                        {user.role && (
                            <div className="detail-row">
                                <span>תפקיד</span>
                                <span>{roleLabel(user.role)}</span>
                            </div>
                        )}
                        <div className="detail-row">
                            <span>סטטוס</span>
                            <span>{user.isBlocked ? "חסום" : "פעיל"}</span>
                        </div>
                    </div>
                </div>

                {(canPromote || canDemote || canBlock) && (
                    <div className="panel">
                        <div className="panel-header">
                            <h2>פעולות</h2>
                        </div>
                        <div className="panel-body profile-actions">
                            {/* מוצג רק אם המשתמש עדיין אינו מנהל */}
                            {canPromote && (
                                <button
                                    className="btn btn-primary"
                                    onClick={handlePromote}
                                    disabled={promoting}
                                >
                                    {promoting ? "מקדם..." : "קידום לתפקיד מנהל"}
                                </button>
                            )}

                            {/* רק מנהל מקורי יכול להחזיר מנהל למשתמש רגיל */}
                            {canDemote && (
                                <button
                                    className="btn btn-danger"
                                    onClick={handleDemote}
                                    disabled={demoting}
                                >
                                    {demoting ? "מבצע..." : "החזרה למשתמש רגיל"}
                                </button>
                            )}

                            {/* חסימה/הפעלה */}
                            {canBlock && (
                                <button
                                    className={`btn ${user.isBlocked ? "btn-secondary" : "btn-danger"}`}
                                    onClick={handleToggleBlock}
                                    disabled={togglingBlock}
                                >
                                    {togglingBlock
                                        ? "מבצע..."
                                        : user.isBlocked
                                            ? "הפעלה מחדש"
                                            : "חסימת משתמש"}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
