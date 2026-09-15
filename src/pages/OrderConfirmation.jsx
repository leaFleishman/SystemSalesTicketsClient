import { Link, Navigate, useLocation } from "react-router-dom";
import { formatDate, formatDateTime, formatPrice } from "../utils/format";

export default function OrderConfirmation() {
  const location = useLocation();
  const order = location.state?.order;

  if (!order) {
    return <Navigate to="/" replace />;
  }

  const eventDto = order.eventDTO;
  const seatDto = order.seatDTO;

  return (
    <div className="page page--narrow">
      <div className="confirm-ticket">
        <div className="confirm-ticket-top">
          <div className="checkmark">✓</div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700 }}>ההזמנה אושרה</h1>
          <p style={{ opacity: 0.85, marginTop: 6, fontSize: "0.9rem" }}>מספר הזמנה #{order.id}</p>
        </div>
        <div className="confirm-ticket-body">
          <div className="confirm-row">
            <span>אירוע</span>
            <span>{order.eventName || eventDto?.name}</span>
          </div>
          {eventDto?.date && (
            <div className="confirm-row">
              <span>תאריך</span>
              <span>{formatDate(eventDto.date)}</span>
            </div>
          )}
          {seatDto && (
            <div className="confirm-row">
              <span>מושב</span>
              <span>
                שורה {seatDto.row} · טור {seatDto.line}
              </span>
            </div>
          )}
          {eventDto?.price != null && (
            <div className="confirm-row">
              <span>מחיר</span>
              <span>{formatPrice(eventDto.price)}</span>
            </div>
          )}
          <div className="confirm-row">
            <span>מועד ההזמנה</span>
            <span>{formatDateTime(order.orderDate)}</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-24">
        <Link to="/" className="btn btn-secondary">
          חזרה לאירועים
        </Link>
      </div>
    </div>
  );
}
