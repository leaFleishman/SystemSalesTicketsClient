import { useEffect, useMemo } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { formatDate, formatDateTime, formatPrice } from "../utils/format";

const STORAGE_KEY = "sst_last_confirmation";

// The API may answer with different casings / shapes, and may even return an
// empty body, so every field is read defensively and falls back to the event
// and seat that the booking page passed along.
const pick = (obj, ...keys) => {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
};

function readStored() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export default function OrderConfirmation() {
  const location = useLocation();

  const data = useMemo(() => {
    const st = location.state;
    if (st && (st.order || st.event || st.seat)) {
      return { order: st.order || {}, event: st.event, seat: st.seat };
    }
    return readStored();
  }, [location.state]);

  // keep it so a refresh of this page still shows the confirmation
  useEffect(() => {
    if (location.state && data) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* storage unavailable: fine */
      }
    }
  }, [location.state, data]);

  if (!data) {
    return <Navigate to="/" replace />;
  }

  const order = data.order || {};
  const eventDto = pick(order, "eventDTO", "eventDto", "event") || data.event || {};
  const seatDto = pick(order, "seatDTO", "seatDto", "seat") || data.seat || {};

  const orderId = pick(order, "id", "Id", "orderId", "OrderId");
  const eventName = pick(order, "eventName", "EventName") || pick(eventDto, "name", "Name");
  const eventDate = pick(eventDto, "date", "Date");
  const price = pick(eventDto, "price", "Price");
  const row = pick(seatDto, "row", "Row");
  const line = pick(seatDto, "line", "Line");
  const orderDate = pick(order, "orderDate", "OrderDate") || new Date().toISOString();

  return (
    <div className="page page--narrow confirm-page">
      <div className="confirm-ticket">
        <div className="confirm-ticket-top">
          <div className="checkmark">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path className="check-path" d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </div>
          <h1>ההזמנה אושרה</h1>
          {orderId !== undefined && <p>מספר הזמנה #{orderId}</p>}
        </div>

        <div className="confirm-ticket-body">
          {eventName && (
            <div className="confirm-row">
              <span>אירוע</span>
              <span>{eventName}</span>
            </div>
          )}
          {eventDate && (
            <div className="confirm-row">
              <span>תאריך</span>
              <span>{formatDate(eventDate)}</span>
            </div>
          )}
          {(row !== undefined || line !== undefined) && (
            <div className="confirm-row">
              <span>מושב</span>
              <span>
                שורה {row ?? "—"} · מושב {line ?? "—"}
              </span>
            </div>
          )}
          {price !== undefined && (
            <div className="confirm-row">
              <span>מחיר</span>
              <span>{formatPrice(price)}</span>
            </div>
          )}
          <div className="confirm-row">
            <span>מועד ההזמנה</span>
            <span>{formatDateTime(orderDate)}</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-24 confirm-actions">
        <Link to="/my-orders" className="btn btn-primary">
          ההזמנות שלי
        </Link>
        <Link to="/" className="btn btn-secondary">
          חזרה לאירועים
        </Link>
      </div>
    </div>
  );
}
