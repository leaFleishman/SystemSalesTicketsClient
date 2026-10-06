import { useState } from "react";
import { extractErrorMessage } from "../api/client";
import * as ordersApi from "../api/orders";
import { formatDateTime } from "../utils/format";

// Confirmation dialog for cancelling a booking (DELETE /api/Order/{id}).
export default function CancelOrderModal({ order, onClose, onCancelled }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setError("");
    setBusy(true);
    try {
      await ordersApi.cancelOrder(order.orderId);
      onCancelled(order);
    } catch (err) {
      setError(extractErrorMessage(err, "ביטול ההזמנה נכשל."));
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="cancel-order-title">
      <div className="modal-card">
        <h3 id="cancel-order-title">ביטול הזמנה #{order.orderId}</h3>
        <p>
          לבטל את ההזמנה לאירוע "{order.eventName}" ({formatDateTime(order.eventDate)}), שורה {order.row} · טור{" "}
          {order.line}? המושב ישוחרר והפעולה אינה הפיכה.
        </p>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={handleConfirm} disabled={busy}>
            {busy ? "מבטל..." : "אישור ביטול ההזמנה"}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>
            חזרה
          </button>
        </div>
      </div>
    </div>
  );
}
