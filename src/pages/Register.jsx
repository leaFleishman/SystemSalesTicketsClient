import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../api/auth";
import { extractErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ userName: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register(form);
      toast.success("החשבון נוצר בהצלחה. אפשר להתחבר עכשיו.");
      navigate("/login");
    } catch (err) {
      setError(extractErrorMessage(err, "ההרשמה נכשלה. בדקו את הפרטים ונסו שוב."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="יצירת חשבון"
      subtitle="הרשמה מהירה כדי להתחיל להזמין כרטיסים"
      footer={
        <>
          כבר יש לכם חשבון? <Link to="/login">התחברות</Link>
        </>
      }
    >
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="userName">שם מלא</label>
          <input id="userName" value={form.userName} onChange={update("userName")} minLength={3} maxLength={50} required />
        </div>
        <div className="field">
          <label htmlFor="phone">טלפון</label>
          <input id="phone" value={form.phone} onChange={update("phone")} minLength={3} maxLength={50} required />
        </div>
        <div className="field">
          <label htmlFor="email">אימייל</label>
          <input id="email" type="email" autoComplete="username" value={form.email} onChange={update("email")} required />
        </div>
        <div className="field">
          <label htmlFor="password">סיסמה</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update("password")}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "נרשם..." : "הרשמה"}
        </button>
      </form>
    </AuthShell>
  );
}
