import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as ordersApi from "../../api/orders";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import { formatDateTime, formatDate, formatPrice } from "../../utils/format";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    ordersApi
      .getOrderById(id)
      .then(setOrder)
      .catch((err) => setError(extractErrorMessage(err, "לא ניתן לטעון את פרטי ההזמנה.")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;

  if (error || !order) {
    return <EmptyState title="ההזמנה לא נמצאה" description={error} />;
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>הזמנה #{order.id}</h2>
        <Link className="btn btn-secondary btn-sm" to="/admin/orders">
          חזרה לרשימה
        </Link>
      </div>
      <div className="panel-body stack-8">
        <div className="confirm-row">
          <span>אירוע</span>
          <span>{order.eventName || order.eventDTO?.name}</span>
        </div>
        {order.eventDTO?.date && (
          <div className="confirm-row">
            <span>תאריך אירוע</span>
            <span>{formatDate(order.eventDTO.date)}</span>
          </div>
        )}
        {order.eventDTO?.price != null && (
          <div className="confirm-row">
            <span>מחיר</span>
            <span>{formatPrice(order.eventDTO.price)}</span>
          </div>
        )}
        {order.seatDTO && (
          <div className="confirm-row">
            <span>מושב</span>
            <span>
              שורה {order.seatDTO.row} · טור {order.seatDTO.line}
            </span>
          </div>
        )}
        <div className="confirm-row">
          <span>מועד ההזמנה</span>
          <span>{formatDateTime(order.orderDate)}</span>
        </div>
        {order.message && (
          <div className="confirm-row">
            <span>הודעה</span>
            <span>{order.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
