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

      <div className="panel">
        <div className="panel-body">
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
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>אירוע</th>
                    <th>תאריך ושעה</th>
                    <th>מושב</th>
                    <th>מחיר</th>
                    <th>סטטוס</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderId}>
                      <td>{order.orderId}</td>
                      <td>{order.eventName}</td>
                      <td>{formatDateTime(order.eventDate)}</td>
                      <td>
                        שורה {order.row} · טור {order.line}
                      </td>
                      <td>{formatPrice(order.price)}</td>
                      <td>
                        <StatusBadge order={order} />
                      </td>
                      <td>
                        {canCancelNow(order) ? (
                          <button className="btn btn-danger btn-sm" onClick={() => setToCancel(order)}>
                            ביטול הזמנה
                          </button>
                        ) : (
                          !order.eventIsCancelled && (
                            <span className="field-hint" title={`המועד האחרון לביטול: ${formatDateTime(order.cancellationDeadline)}`}>
                              לא ניתן לבטל
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toCancel && (
        <CancelOrderModal order={toCancel} onClose={() => setToCancel(null)} onCancelled={handleCancelled} />
      )}
    </div>
  );
}
