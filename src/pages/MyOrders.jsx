import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as ordersApi from "../api/orders";
import { extractErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import CancelOrderModal from "../components/CancelOrderModal";
import { useToast } from "../context/ToastContext";
import { formatDateTime, formatPrice } from "../utils/format";

// The server sends UTC; treat a zone-less string as UTC as well.
function toMs(value) {
  const str = String(value);
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(str) ? str : `${str}Z`).getTime();
}

// "Can cancel" is decided by the server (canCancel); we additionally re-check the
// deadline against the clock so a page left open overnight doesn't offer a stale button.
// The server re-validates on every cancel request, so this is only a UX nicety.
function canCancelNow(order) {
  return order.canCancel && Date.now() < toMs(order.cancellationDeadline);
}

function StatusBadge({ order }) {
  if (order.eventIsCancelled) return <span className="badge badge-danger">האירוע בוטל</span>;
  if (toMs(order.eventDate) <= Date.now()) return <span className="badge badge-neutral">האירוע הסתיים</span>;
  return <span className="badge badge-success">פעילה</span>;
}

export default function MyOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toCancel, setToCancel] = useState(null);

  useEffect(() => {
    let ignore = false;
    ordersApi
      .getMyOrders()
      .then((data) => !ignore && setOrders(data || []))
      .catch((err) => !ignore && setError(extractErrorMessage(err, "לא ניתן לטעון את ההזמנות.")))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  const handleCancelled = (order) => {
    setOrders((prev) => prev.filter((o) => o.orderId !== order.orderId));
    setToCancel(null);
    toast.success("ההזמנה בוטלה והמושב שוחרר.");
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">החשבון שלי</div>
          <h1>ההזמנות שלי</h1>
          <p>ניתן לבטל הזמנה עד 24 שעות לפני תחילת האירוע.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <Spinner />
      ) : orders.length === 0 && !error ? (
        <EmptyState
          title="עדיין אין לך הזמנות"
          description="הזמנות שתבצע יופיעו כאן."
          action={
            <Link to="/" className="btn btn-primary">
              לאירועים
            </Link>
          }
        />
      ) : (
        <div className="pass-list">
          {orders.map((order, i) => {
            const d = new Date(toMs(order.eventDate));
            const valid = !Number.isNaN(d.getTime());
            const past = valid && d.getTime() <= Date.now();
            const state = order.eventIsCancelled ? " pass--cancelled" : past ? " pass--past" : "";
            return (
              <article className={`pass${state}`} key={order.orderId} style={{ "--i": i }}>
                <div className="pass-date">
                  <span className="pass-day">{valid ? d.getDate() : "—"}</span>
                  <span className="pass-month">
                    {valid ? d.toLocaleDateString("he-IL", { month: "long" }) : ""}
                  </span>
                </div>

                <div className="pass-body">
                  <div className="pass-top">
                    <span className="pass-no">הזמנה #{order.orderId}</span>
                    <StatusBadge order={order} />
                  </div>
                  <h3>{order.eventName}</h3>
                  <div className="pass-meta">
                    <span>{formatDateTime(order.eventDate)}</span>
                    <span>
                      שורה {order.row} · טור {order.line}
                    </span>
                    <span className="pass-price">{formatPrice(order.price)}</span>
                  </div>
                </div>

                <div className="pass-action">
                  {canCancelNow(order) ? (
                    <button className="btn btn-danger btn-sm" onClick={() => setToCancel(order)}>
                      ביטול הזמנה
                    </button>
                  ) : (
                    !order.eventIsCancelled && (
                      <span
                        className="field-hint"
                        title={`המועד האחרון לביטול: ${formatDateTime(order.cancellationDeadline)}`}
                      >
                        לא ניתן לבטל
                      </span>
                    )
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {toCancel && (
        <CancelOrderModal order={toCancel} onClose={() => setToCancel(null)} onCancelled={handleCancelled} />
      )}
    </div>
  );
}
