import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getEventByName } from "../api/events";
import { getSeatsForEvent } from "../api/eventSeats";
import { createOrder } from "../api/orders";
import { extractErrorMessage } from "../api/client";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatPrice } from "../utils/format";

/* ---------------- helpers ---------------- */

// The API may return the event as the object itself, an array, or { data }.
const findIdKey = (obj) => {
  if (!obj || typeof obj !== "object") return undefined;
  const keys = Object.keys(obj);
  return (
    keys.find((k) => /^event[_-]?id$/i.test(k)) ??
    keys.find((k) => /^id$/i.test(k))
  );
};

const normalizeEvent = (raw) => {
  let e = raw;
  for (let i = 0; i < 3; i++) {
    if (Array.isArray(e)) e = e[0];
    else if (e && typeof e === "object" && findIdKey(e) === undefined && (e.data || e.event || e.result)) {
      e = e.data ?? e.event ?? e.result;
    } else break;
  }
  return e;
};

const getEventId = (e) => {
  const key = findIdKey(e);
  return key === undefined ? undefined : e[key];
};

const getSeatId = (s) => s.seatId ?? s.SeatId ?? s.id ?? s.Id;
const getRow = (s) => s.row ?? s.Row;
const getLine = (s) => s.line ?? s.Line;
const isAvailable = (s) => s.isAvailable ?? s.IsAvailable ?? false;

/*
 * Visual placement only: each row is an arc around the stage
 * (a wide, shallow semi-circle). Booking logic never depends on it.
 */
function createSeatLayout(seatList) {
  const SEAT_GAP = 40;
  const ROW_GAP = 50;
  const INNER_RADIUS = 340;
  const MAX_SPAN = Math.PI * 0.5;
  const X_STRETCH = 1.5;
  const Y_SQUASH = 0.75;
  const SEAT_SIZE = 34;
  const PADDING = 30;

  const byRow = new Map();
  seatList.forEach((seat) => {
    const key = String(getRow(seat));
    if (!byRow.has(key)) byRow.set(key, []);
    byRow.get(key).push(seat);
  });

  const rowKeys = [...byRow.keys()].sort((a, b) => Number(a) - Number(b));

  const raw = [];
  let prevRadius = INNER_RADIUS - ROW_GAP;

  rowKeys.forEach((key) => {
    const rowSeats = byRow
      .get(key)
      .slice()
      .sort((a, b) => Number(getLine(a)) - Number(getLine(b)));
    const n = rowSeats.length;

    const radius = Math.max(prevRadius + ROW_GAP, ((n - 1) * SEAT_GAP) / MAX_SPAN);
    prevRadius = radius;

    const span = n > 1 ? Math.min(MAX_SPAN, ((n - 1) * SEAT_GAP) / radius) : 0;

    rowSeats.forEach((seat, i) => {
      const angle = n > 1 ? Math.PI / 2 + span / 2 - (i * span) / (n - 1) : Math.PI / 2;
      raw.push({
        seat,
        x: radius * Math.cos(angle) * X_STRETCH,
        y: radius * Math.sin(angle) * Y_SQUASH,
      });
    });
  });

  if (raw.length === 0) return { positions: new Map(), width: 600, height: 200 };

  const xs = raw.map((p) => p.x);
  const ys = raw.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = Math.max(600, maxX - minX + SEAT_SIZE + PADDING * 2);
  const height = maxY - minY + SEAT_SIZE + PADDING;

  const positions = new Map();
  raw.forEach(({ seat, x, y }) => {
    const px = width / 2 + x;
    const py = y - minY + 4;
    // light wave: seats appear outward from the stage (top centre)
    const delay = Math.round(py * 1.1 + Math.abs(px - width / 2) * 0.15);
    positions.set(getSeatId(seat), { x: px, y: py, delay });
  });

  return { positions, width, height };
}

const DONUT_R = 38;
const DONUT_C = 2 * Math.PI * DONUT_R;

/* ---------------- component ---------------- */

export default function EventDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [rowFilter, setRowFilter] = useState("");

  // measure the free area so the seat map always fits without scrolling
  const [mapBox, setMapBox] = useState({ w: 0, h: 0 });
  const observerRef = useRef(null);

  const mapAreaRef = useCallback((node) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    const update = () => setMapBox({ w: node.clientWidth, h: node.clientHeight });
    update();

    observerRef.current = new ResizeObserver(update);
    observerRef.current.observe(node);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setBookingError("");

      if (!name) throw new Error("חסר שם אירוע");

      const eventData = normalizeEvent(await getEventByName(name));
      if (!eventData) throw new Error("האירוע לא נמצא");

      const eventId = getEventId(eventData);
      if (eventId === undefined || eventId === null) {
        console.error("Unexpected event payload:", eventData);
        throw new Error("חסר מזהה אירוע בתשובת השרת");
      }

      setEvent(eventData);

      const seatsData = await getSeatsForEvent(eventId);
      setSeats(Array.isArray(seatsData) ? seatsData : []);
    } catch (err) {
      console.error("Failed to load event:", err);
      setEvent(null);
      setSeats([]);
      setError(extractErrorMessage(err, "לא ניתן לטעון את פרטי האירוע"));
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSeatClick = (seat) => {
    if (!isAvailable(seat)) return;
    setBookingError("");
    setSelectedSeat((cur) => (cur && getSeatId(cur) === getSeatId(seat) ? null : seat));
  };

  const handleBooking = async () => {
    if (!selectedSeat || !event) return;

    try {
      setBooking(true);
      setBookingError("");

      const order = await createOrder({
        eventId: getEventId(event),
        seatId: getSeatId(selectedSeat),
        userId,
      });

      navigate("/order-confirmation", { state: { order } });
    } catch (err) {
      console.error("Failed to create order:", err);

      if (err.response?.status === 409) {
        setBookingError(extractErrorMessage(err, "המושב נתפס על ידי משתמש אחר. המושבים עודכנו."));
        toast.error("המושב כבר הוזמן. בחרו מושב אחר.");
        setSelectedSeat(null);
        await load();
      } else {
        setBookingError(extractErrorMessage(err, "אירעה שגיאה בעת הזמנת המושב"));
      }
    } finally {
      setBooking(false);
    }
  };

  if (loading && !event) {
    return (
      <main className="page event-detail-page">
        <div className="state-card">
          <span className="spinner" />
          <p>טוען את פרטי האירוע...</p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="page event-detail-page">
        <div className="state-card error-state">
          <h2>לא ניתן להציג את האירוע</h2>
          <p>{error || "האירוע לא נמצא"}</p>
        </div>
      </main>
    );
  }

  /* ----- derived values ----- */
  const totalSeats = seats.length;
  const availableTickets = seats.filter(isAvailable).length;
  const soldTickets = totalSeats - availableTickets;
  const soldPercent = totalSeats > 0 ? Math.round((soldTickets / totalSeats) * 100) : 0;

  const eventDate = new Date(event.date ?? event.Date);
  const dateValid = !Number.isNaN(eventDate.getTime());
  const eventDateText = dateValid
    ? eventDate.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const isCancelled = Boolean(event.isCancelled ?? event.IsCancelled);
  const isPast = dateValid && eventDate.getTime() <= Date.now();
  const bookingClosed = isCancelled || isPast;

  const rows = [...new Set(seats.map(getRow))]
    .filter((r) => r !== undefined && r !== null)
    .sort((a, b) => Number(a) - Number(b));

  const seatLayout = createSeatLayout(seats);

  const mapScale =
    mapBox.w > 0 && mapBox.h > 0
      ? Math.min(mapBox.w / seatLayout.width, mapBox.h / seatLayout.height, 1.25)
      : 1;

  const filteredSeats = rowFilter
    ? seats.filter((s) => String(getRow(s)) === String(rowFilter))
    : seats;

  const positionedSeats = filteredSeats.map((seat) => ({
    seat,
    ...(seatLayout.positions.get(getSeatId(seat)) ?? { x: 0, y: 0, delay: 0 }),
  }));

  const price = event.price ?? event.Price;

  return (
    <main className="page event-detail-page">
      <section className="event-detail-layout">
        <div className="seat-panel">
          <div className="seat-panel-header">
            <div className="seat-header-main">
              <h1 className="event-title">{event.name ?? event.Name}</h1>

              <div className="event-chips">
                {eventDateText && <span className="event-chip">{eventDateText}</span>}
                {price != null && <span className="event-chip">{formatPrice(price)}</span>}
              </div>

              <input
                type="number"
                inputMode="numeric"
                min="1"
                className="row-filter"
                value={rowFilter}
                onChange={(e) => setRowFilter(e.target.value)}
                placeholder={
                  rows.length
                    ? `סינון לפי שורה (${rows[0]}–${rows[rows.length - 1]})`
                    : "סינון לפי שורה"
                }
                aria-label="סינון לפי שורה"
              />
            </div>

            <div className="occupancy-card" aria-label={`${soldTickets} מתוך ${totalSeats} מושבים הוזמנו`}>
              <svg className="occupancy-donut" viewBox="0 0 100 100" role="img">
                <defs>
                  <linearGradient id="occGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffc857" />
                    <stop offset="100%" stopColor="#ff5d8f" />
                  </linearGradient>
                </defs>
                <circle className="occupancy-track" cx="50" cy="50" r={DONUT_R} />
                <circle
                  className="occupancy-fill"
                  cx="50"
                  cy="50"
                  r={DONUT_R}
                  strokeDasharray={`${(soldPercent / 100) * DONUT_C} ${DONUT_C}`}
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="49" className="occupancy-percent">
                  {soldPercent}%
                </text>
                <text x="50" y="63" className="occupancy-caption">
                  הוזמנו
                </text>
              </svg>

              <div className="occupancy-text">
                <strong>
                  {soldTickets}
                  <small> / {totalSeats}</small>
                </strong>
                <span>מושבים הוזמנו</span>

                <div className="occupancy-legend">
                  <span>
                    <i className="legend-seat available" />
                    פנוי ({availableTickets})
                  </span>
                  <span>
                    <i className="legend-seat selected" />
                    נבחר
                  </span>
                  <span>
                    <i className="legend-seat taken" />
                    תפוס
                  </span>
                </div>
              </div>
            </div>
          </div>

          {bookingClosed && (
            <div className="event-banner">
              {isCancelled ? "האירוע בוטל — לא ניתן להזמין כרטיסים." : "האירוע הסתיים — ההזמנה סגורה."}
            </div>
          )}

          <div className="auditorium">
            <div className="stage">
              <span>הבמה</span>
            </div>

            <div className="seat-map-wrapper" ref={mapAreaRef}>
              {rowFilter && positionedSeats.length === 0 && (
                <div className="no-row">לא נמצאה שורה {rowFilter}</div>
              )}

              <div
                className="seat-map-scaler"
                style={{
                  width: `${seatLayout.width * mapScale}px`,
                  height: `${seatLayout.height * mapScale}px`,
                }}
              >
                <div
                  className="seat-map"
                  style={{
                    width: `${seatLayout.width}px`,
                    height: `${seatLayout.height}px`,
                    transform: `scale(${mapScale})`,
                  }}
                >
                  {positionedSeats.map(({ seat, x, y, delay }) => {
                    const seatId = getSeatId(seat);
                    const available = isAvailable(seat);
                    const selected = selectedSeat && getSeatId(selectedSeat) === seatId;
                    const clickable = available && !bookingClosed;

                    return (
                      <button
                        key={seatId}
                        type="button"
                        className={["seat", !available ? "taken" : "", selected ? "selected" : ""]
                          .filter(Boolean)
                          .join(" ")}
                        style={{ left: `${x}px`, top: `${y}px`, "--d": `${delay}ms` }}
                        disabled={!clickable}
                        onClick={() => handleSeatClick(seat)}
                        title={available ? `שורה ${getRow(seat)}, מושב ${getLine(seat)}` : "מושב תפוס"}
                        aria-label={`שורה ${getRow(seat)}, מושב ${getLine(seat)}${available ? "" : " (תפוס)"}`}
                        aria-pressed={Boolean(selected)}
                      >
                        {getLine(seat)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {bookingError && <div className="booking-error">{bookingError}</div>}

          <div className="booking-bar">
            <div>
              {selectedSeat ? (
                <>
                  <span>המושב שנבחר</span>
                  <strong key={getSeatId(selectedSeat)}>
                    שורה {getRow(selectedSeat)} · מושב {getLine(selectedSeat)}
                    {price != null && ` · ${formatPrice(price)}`}
                  </strong>
                </>
              ) : (
                <>
                  <span>בחרו מושב מהמפה</span>
                  <strong>לא נבחר מושב</strong>
                </>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={!selectedSeat || booking || bookingClosed}
              onClick={handleBooking}
            >
              {booking ? "מבצע הזמנה..." : "הזמנת כרטיס"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
