import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getEventByName } from "../api/events";
import { getSeatsForEvent } from "../api/eventSeats";
import { createOrder } from "../api/orders";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";

import "../theme.css";

// Normalizes the event shapes returned by the API.
const normalizeEvent = (raw) => {
  let value = raw;
  for (let i = 0; i < 3; i += 1) {
    if (Array.isArray(value)) {
      value = value[0];
    } else if (
      value &&
      typeof value === "object" &&
      findIdKey(value) === undefined &&
      (value.data || value.event || value.Event || value.result)
    ) {
      value = value.data ?? value.event ?? value.Event ?? value.result;
    } else {
      break;
    }
  }
  return value;
};

function findIdKey(obj) {
  if (!obj || typeof obj !== "object") return undefined;
  const keys = Object.keys(obj);
  return (
    keys.find((key) => /^event[_-]?id$/i.test(key)) ??
    keys.find((key) => /^id$/i.test(key))
  );
}

const getEventId = (event) => {
  const key = findIdKey(event);
  return key === undefined ? undefined : event[key];
};

// Supports both camelCase and PascalCase JSON properties.
const isCancelledEvent = (event) => {
  const value =
    event?.isCancelled ??
    event?.IsCancelled ??
    event?.isCanceled ??
    event?.IsCanceled;

  return value === true || value === 1 || String(value).toLowerCase() === "true";
};

const CANCELLATION_MESSAGE = "האירוע בוטל ולא ניתן להזמין אליו כרטיסים.";

function EventDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, userId } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [rowFilter, setRowFilter] = useState("");
  const [mapBox, setMapBox] = useState({ w: 0, h: 0 });
  const observerRef = useRef(null);

  const mapAreaRef = useCallback((node) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    const update = () => {
      setMapBox({ w: node.clientWidth, h: node.clientHeight });
    };

    update();
    if (typeof ResizeObserver !== "undefined") {
      observerRef.current = new ResizeObserver(update);
      observerRef.current.observe(node);
    }
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setBookingError("");

      if (!name) throw new Error("Event name is missing");

      const response = await getEventByName(name);
      const eventData = normalizeEvent(response);
      if (!eventData) throw new Error("Event was not found");

      setEvent(eventData);
      setSelectedSeat(null);

      // Do not fetch seats for cancelled events.
      if (isCancelledEvent(eventData)) {
        setSeats([]);
        return;
      }

      const eventId = getEventId(eventData);
      if (eventId === undefined || eventId === null) {
        console.error("Unexpected event payload:", eventData);
        throw new Error(
          "Event ID is missing (received fields: " +
            (typeof eventData === "object"
              ? Object.keys(eventData).join(", ")
              : typeof eventData) +
            ")"
        );
      }

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
  };

  useEffect(() => {
    load();
    // Keep the same behavior as the existing page: reload when the event URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const getSeatId = (seat) => seat.seatId ?? seat.SeatId;
  const getRow = (seat) => seat.row ?? seat.Row;
  const getLine = (seat) => seat.line ?? seat.Line;
  const isAvailable = (seat) => seat.isAvailable ?? seat.IsAvailable ?? false;

  const handleSeatClick = (seat) => {
    if (isCancelledEvent(event) || !isAvailable(seat)) return;
    setBookingError("");

    if (selectedSeat && getSeatId(selectedSeat) === getSeatId(seat)) {
      setSelectedSeat(null);
      return;
    }
    setSelectedSeat(seat);
  };

  const handleBooking = async () => {
    if (!selectedSeat || !event || booking) return;

    if (isCancelledEvent(event)) {
      setSeats([]);
      setSelectedSeat(null);
      setBookingError(CANCELLATION_MESSAGE);
      toast.error(CANCELLATION_MESSAGE);
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: {
            pathname: `/events/${encodeURIComponent(name)}`,
          },
        },
      });
      return;
    }

    try {
      setBooking(true);
      setBookingError("");

      const order = await createOrder({
        eventId: getEventId(event),
        seatId: getSeatId(selectedSeat),
        userId: userId ?? undefined,
      });

      navigate("/order-confirmation", {
        state: {
          order: order || {},
          event,
          seat: selectedSeat,
        },
      });
    } catch (err) {
      console.error("Failed to create order:", err);

      const serverMessage = extractErrorMessage(err, "");
      let latestEvent = null;

      // The event could have been cancelled after this page loaded.
      // Re-check the event before interpreting a 409 as a seat conflict.
      try {
        latestEvent = normalizeEvent(await getEventByName(name));
      } catch (refreshError) {
        console.warn("Could not refresh event after booking failure:", refreshError);
      }

      const cancellationReportedByServer =
        /cancelled|canceled|בוטל|בוטלה|בוטלו/i.test(serverMessage);
      const eventIsNowCancelled = isCancelledEvent(latestEvent);

      if (cancellationReportedByServer || eventIsNowCancelled) {
        if (latestEvent) setEvent(latestEvent);
        else {
          setEvent((current) =>
            current ? { ...current, isCancelled: true, IsCancelled: true } : current
          );
        }
        setSeats([]);
        setSelectedSeat(null);
        setBookingError(CANCELLATION_MESSAGE);
        toast.error(CANCELLATION_MESSAGE);
      } else if (err.response?.status === 409) {
        setBookingError("המושב נתפס על ידי משתמש אחר. המושבים עודכנו.");
        toast.error("המושב כבר הוזמן על ידי משתמש אחר");
        await load();
        setSelectedSeat(null);
      } else {
        setBookingError(
          extractErrorMessage(err, "אירעה שגיאה בעת הזמנת המושב")
        );
      }
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="state-card">
          <div className="spinner" />
          <p>טוען את פרטי האירוע...</p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="page">
        <div className="state-card error-state">
          <h2>לא ניתן להציג את האירוע</h2>
          <p>{error || "האירוע לא נמצא"}</p>
        </div>
      </main>
    );
  }

  if (isCancelledEvent(event)) {
    const cancellationReason = event.cancellationReason ?? event.CancellationReason;
    return (
      <main className="page">
        <div className="state-card error-state">
          <h2>האירוע בוטל</h2>
          <p>{cancellationReason || CANCELLATION_MESSAGE}</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/")}
          >
            חזרה לאירועים
          </button>
        </div>
      </main>
    );
  }

  const orderedSeats = Number(event.numberOfSeats ?? event.NumberOfSeats);
  const totalSeats =
    Number.isFinite(orderedSeats) && orderedSeats > 0 ? orderedSeats : seats.length;
  const soldTickets = seats.filter((seat) => !isAvailable(seat)).length;
  const availableTickets = Math.max(totalSeats - soldTickets, 0);
  const soldPercent =
    totalSeats > 0
      ? Math.min(Math.round((soldTickets / totalSeats) * 100), 100)
      : 0;

  const DONUT_R = 38;
  const DONUT_C = 2 * Math.PI * DONUT_R;
  const eventDate = new Date(event.date ?? event.Date);
  const eventDateText = isNaN(eventDate) ? "" : eventDate.toLocaleDateString("he-IL");

  const rows = [...new Set(seats.map(getRow))]
    .filter((row) => row !== undefined && row !== null)
    .sort((a, b) => Number(a) - Number(b));

  // Lay out seats as arcs around the stage.
  const createSeatLayout = (seatList) => {
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
      const count = rowSeats.length;
      const radius = Math.max(
        prevRadius + ROW_GAP,
        ((count - 1) * SEAT_GAP) / MAX_SPAN
      );
      prevRadius = radius;
      const span =
        count > 1 ? Math.min(MAX_SPAN, ((count - 1) * SEAT_GAP) / radius) : 0;

      rowSeats.forEach((seat, index) => {
        const angle =
          count > 1
            ? Math.PI / 2 + span / 2 - (index * span) / (count - 1)
            : Math.PI / 2;
        raw.push({
          seat,
          x: radius * Math.cos(angle) * X_STRETCH,
          y: radius * Math.sin(angle) * Y_SQUASH,
        });
      });
    });

    if (raw.length === 0) {
      return { positions: new Map(), width: 600, height: 200 };
    }

    const minX = Math.min(...raw.map((point) => point.x));
    const maxX = Math.max(...raw.map((point) => point.x));
    const minY = Math.min(...raw.map((point) => point.y));
    const maxY = Math.max(...raw.map((point) => point.y));
    const width = Math.max(600, maxX - minX + SEAT_SIZE + PADDING * 2);
    const height = maxY - minY + SEAT_SIZE + PADDING;
    const positions = new Map();

    raw.forEach(({ seat, x, y }) => {
      positions.set(getSeatId(seat), { x: width / 2 + x, y: y - minY + 4 });
    });

    return { positions, width, height };
  };

  const seatLayout = createSeatLayout(seats);
  const mapScale =
    mapBox.w > 0 && mapBox.h > 0
      ? Math.min(mapBox.w / seatLayout.width, mapBox.h / seatLayout.height, 1.25)
      : 1;
  const filteredSeats = rowFilter
    ? seats.filter((seat) => String(getRow(seat)) === String(rowFilter))
    : seats;
  const positionedSeats = filteredSeats.map((seat) => ({
    seat,
    ...(seatLayout.positions.get(getSeatId(seat)) ?? { x: 0, y: 0 }),
  }));

  return (
    <main className="page event-detail-page">
      <section className="event-detail-layout">
        <div className="seat-panel">
          <div className="seat-panel-header">
            <div className="seat-header-main">
              <h1 className="event-title">{event.name ?? event.Name}</h1>
              <div className="event-chips">
                {eventDateText && <span className="event-chip">{eventDateText}</span>}
                <span className="event-chip">₪{event.price ?? event.Price}</span>
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

            <div
              className="occupancy-card"
              aria-label={`${soldTickets} מתוך ${totalSeats} מושבים הוזמנו`}
            >
              <svg className="occupancy-donut" viewBox="0 0 100 100" role="img">
                <circle className="occupancy-track" cx="50" cy="50" r={DONUT_R} />
                <circle
                  className="occupancy-fill"
                  cx="50"
                  cy="50"
                  r={DONUT_R}
                  strokeDasharray={`${(soldPercent / 100) * DONUT_C} ${DONUT_C}`}
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="48" className="occupancy-percent">
                  {soldPercent}%
                </text>
                <text x="50" y="63" className="occupancy-caption">
                  הוזמנו
                </text>
              </svg>
              <div className="occupancy-text">
                <strong>
                  {soldTickets}<small> / {totalSeats}</small>
                </strong>
                <span>מושבים הוזמנו</span>
                <div className="occupancy-legend">
                  <span><i className="legend-seat available" />פנוי ({availableTickets})</span>
                  <span><i className="legend-seat selected" />נבחר</span>
                  <span><i className="legend-seat taken" />תפוס</span>
                </div>
              </div>
            </div>
          </div>

          <div className="auditorium">
            <div className="stage"><span>STAGE</span></div>
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
                  {positionedSeats.map(({ seat, x, y }) => {
                    const seatId = getSeatId(seat);
                    const available = isAvailable(seat);
                    const selected =
                      selectedSeat && getSeatId(selectedSeat) === seatId;

                    return (
                      <button
                        key={seatId}
                        type="button"
                        className={[
                          "seat",
                          !available ? "taken" : "",
                          selected ? "selected" : "",
                        ].filter(Boolean).join(" ")}
                        style={{ left: `${x}px`, top: `${y}px` }}
                        disabled={!available || isCancelledEvent(event)}
                        onClick={() => handleSeatClick(seat)}
                        title={
                          available
                            ? `שורה ${getRow(seat)}, מושב ${getLine(seat)}`
                            : "מושב תפוס"
                        }
                        aria-label={`שורה ${getRow(seat)}, מושב ${getLine(seat)}`}
                      >
                        {getLine(seat)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {bookingError && (
            <div className="booking-error">{String(bookingError)}</div>
          )}

          <div className="booking-bar">
            <div>
              {selectedSeat ? (
                <>
                  <span>המושב שנבחר</span>
                  <strong>
                    שורה {getRow(selectedSeat)} · מושב {getLine(selectedSeat)}
                  </strong>
                </>
              ) : (
                <>
                  <span>בחרי מושב מהמפה</span>
                  <strong>לא נבחר מושב</strong>
                </>
              )}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!selectedSeat || booking || isCancelledEvent(event)}
              onClick={handleBooking}
            >
              {booking ? "מבצע הזמנה..." : "הזמן כרטיס"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default EventDetail;
