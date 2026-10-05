import { useState } from "react";
import { extractErrorMessage } from "../api/client";
import * as eventsApi from "../api/events";
import { formatDateTime } from "../utils/format";

// Confirmation dialog for cancelling an event (PUT /api/Event/{id}/cancel).
export default function CancelEventModal({ event, onClose, onCancelled }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setError("");
    setBusy(true);
    try {
      const result = await eventsApi.cancelEvent(event.id, reason);
      onCancelled(result);
    } catch (err) {
      setError(extractErrorMessage(err, "ביטול האירוע נכשל."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="cancel-event-title">
      <div className="modal-card modal-card--wide">
        <h3 id="cancel-event-title">ביטול האירוע "{event.name}"</h3>
        <p>
          האירוע ({formatDateTime(event.date)}) יסומן כמבוטל, לא ניתן יהיה להזמין אליו כרטיסים חדשים,
          ולכל מי שכבר הזמין כרטיס יישלח מייל על הביטול. הפעולה אינה הפיכה.
        </p>
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="field">
          <label htmlFor="cancel-reason">סיבת הביטול (אופציונלי, תוצג ללקוחות)</label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <span className="field-hint">{reason.length}/500</span>
        </div>

        <div className="modal-actions">
          <button className="btn btn-danger" onClick={handleConfirm} disabled={busy}>
            {busy ? "מבטל..." : "אישור ביטול האירוע"}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>
            חזרה
          </button>
        </div>
      </div>
    </div>
  );
}
