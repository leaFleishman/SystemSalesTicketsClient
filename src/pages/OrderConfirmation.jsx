import { useMemo } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { formatDate, formatDateTime, formatPrice } from "../utils/format";

const COLORS = ["#ffc857", "#ff9f43", "#ff5d8f", "#8b6cff", "#4cd7ff", "#ffffff"];

// A short burst of confetti, once, when the booking is confirmed.
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }, () => ({
        "--x": `${Math.random() * 100}%`,
        "--w": `${7 + Math.random() * 8}px`,
        "--c": COLORS[Math.floor(Math.random() * COLORS.length)],
        "--d": `${0.25 + Math.random() * 0.9}s`,
        "--t": `${2.2 + Math.random() * 1.6}s`,
        "--s": `${(Math.random() - 0.5) * 260}px`,
        "--r": `${(Math.random() - 0.5) * 1080}deg`,
      })),
    []
  );

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((style, i) => (
        <i key={i} style={style} />
      ))}
    </div>
  );
}

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
      <Confetti />
      <div className="confirm-ticket">
        <div className="confirm-ticket-top">
          <div className="checkmark">✓</div>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 900 }}>ההזמנה אושרה</h1>
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
