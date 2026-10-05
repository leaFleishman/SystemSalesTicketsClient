import { useState } from "react";
import { extractErrorMessage } from "../api/client";
import * as eventsApi from "../api/events";
import { toDateTimeLocalValue } from "../utils/format";

// Edit dialog for an existing event (PUT /api/Event/{id}).
export default function EventFormModal({ event, onClose, onSaved }) {
  const initialDate = toDateTimeLocalValue(event.date);
  const [form, setForm] = useState({
    name: event.name,
    date: initialDate,
    price: String(event.price),
    numberOfSeats: String(event.numberOfSeats),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      // If the user didn't touch the date, send the original value back
      // untouched so the server doesn't see a (seconds-level) date change.
      const date = form.date === initialDate ? event.date : new Date(form.date).toISOString();
      const updated = await eventsApi.updateEvent(event.id, {
        name: form.name.trim(),
        date,
        price: Number(form.price),
        numberOfSeats: Number(form.numberOfSeats),
      });
      onSaved(updated);
    } catch (err) {
      setError(extractErrorMessage(err, "עדכון האירוע נכשל."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-event-title">
      <form className="modal-card modal-card--wide" onSubmit={handleSubmit}>
        <h3 id="edit-event-title">עריכת אירוע</h3>
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="field">
          <label htmlFor="edit-name">שם האירוע</label>
          <input id="edit-name" value={form.name} onChange={update("name")} minLength={3} maxLength={50} required />
        </div>
        <div className="field">
          <label htmlFor="edit-date">תאריך ושעה</label>
          <input id="edit-date" type="datetime-local" value={form.date} onChange={update("date")} required />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="edit-price">מחיר (₪)</label>
            <input id="edit-price" type="number" min={0} step="0.01" value={form.price} onChange={update("price")} required />
          </div>
          <div className="field">
            <label htmlFor="edit-seats">מספר מקומות</label>
            <input id="edit-seats" type="number" min={1} value={form.numberOfSeats} onChange={update("numberOfSeats")} required />
            <span className="field-hint">לא ניתן להקטין מתחת למספר הכרטיסים שכבר הוזמנו.</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "שומר..." : "שמירת שינויים"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={onClose} disabled={saving}>
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}
