import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getEventByName } from "../api/events";
import { getSeatsForEvent } from "../api/eventSeats";
import { createOrder } from "../api/orders";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

import "../theme.css";

// The API (or the api/events helper) may return the event in different shapes:
// the object itself, an array, an axios response ({ data }), or { event }.
const normalizeEvent = (raw) => {
  let e = raw;

  for (let i = 0; i < 3; i++) {
    if (Array.isArray(e)) {
      e = e[0];
    } else if (
      e &&
      typeof e === "object" &&
      findIdKey(e) === undefined &&
      (e.data || e.event || e.Event || e.result)
    ) {
      e = e.data ?? e.event ?? e.Event ?? e.result;
    } else {
      break;
    }
  }

  return e;
};

// matches eventId / EventId / event_id / EventID / id / Id / ID
function findIdKey(obj) {
  if (!obj || typeof obj !== "object") return undefined;

  const keys = Object.keys(obj);

  return (
    keys.find((k) => /^event[_-]?id$/i.test(k)) ??
    keys.find((k) => /^id$/i.test(k))
  );
}

const getEventId = (e) => {
  const key = findIdKey(e);
  return key === undefined ? undefined : e[key];
};

function EventDetail() {
const { name } = useParams();
  const navigate = useNavigate();
  // NOTE: AuthContext exposes `isAuthenticated` / `session`, not `user`.
  // Reading a non-existent `user` made every booking attempt bounce to /login
  // (and from there straight back to the events list).
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [rowFilter, setRowFilter] = useState("");

  // measure the free area for the seat map so it always fits without scrolling
  const [mapBox, setMapBox] = useState({ w: 0, h: 0 });
  const observerRef = useRef(null);

  const mapAreaRef = useCallback((node) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) return;

    const update = () =>
      setMapBox({
        w: node.clientWidth,
        h: node.clientHeight,
      });

    update();

    observerRef.current = new ResizeObserver(update);
    observerRef.current.observe(node);
  }, []);

  useEffect(() => {
    load();
  }, [name]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setBookingError("");

      if (!name) {
        throw new Error("Event name is missing");
      }

      const response = await getEventByName(name);

      const eventData = normalizeEvent(response);

      if (!eventData) {
        throw new Error("Event was not found");
      }

      setEvent(eventData);

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

      const seatsData =
        await getSeatsForEvent(eventId);

      setSeats(
        Array.isArray(seatsData)
          ? seatsData
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load event:",
        err
      );

      setEvent(null);
      setSeats([]);

      setError(
        err.response?.data ||
          err.message ||
          "לא ניתן לטעון את פרטי האירוע"
      );
    } finally {
      setLoading(false);
    }
  };

  const getSeatId = (seat) =>
    seat.seatId ?? seat.SeatId;

  const getRow = (seat) =>
    seat.row ?? seat.Row;

  const getLine = (seat) =>
    seat.line ?? seat.Line;

  const isAvailable = (seat) =>
    seat.isAvailable ??
    seat.IsAvailable ??
    false;

  const handleSeatClick = (seat) => {
    if (!isAvailable(seat)) {
      return;
    }

    setBookingError("");

    if (
      selectedSeat &&
      getSeatId(selectedSeat) ===
        getSeatId(seat)
    ) {
      setSelectedSeat(null);
      return;
    }

    setSelectedSeat(seat);
  };

  const handleBooking = async () => {
    if (!selectedSeat || !event) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: {
            pathname: `/events/${encodeURIComponent(
              name
            )}`,
          },
        },
      });

      return;
    }

    try {
      setBooking(true);
      setBookingError("");

      const eventId = getEventId(event);

      const seatId =
        getSeatId(selectedSeat);

      const order =
        await createOrder({
          eventId,
          seatId,
        });

      navigate(
        "/order-confirmation",
        {
          state: {
            order: order || {},
            event,
            seat: selectedSeat,
          },
        }
      );
    } catch (err) {
      console.error(
        "Failed to create order:",
        err
      );

      if (
        err.response?.status === 409
      ) {
        setBookingError(
          "המושב נתפס על ידי משתמש אחר. המושבים עודכנו."
        );

        toast.error(
          "המושב כבר הוזמן על ידי משתמש אחר"
        );

        await load();
        setSelectedSeat(null);
      } else {
        setBookingError(
          err.response?.data?.message ||
            err.response?.data ||
            "אירעה שגיאה בעת הזמנת המושב"
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
          <p>
            טוען את פרטי האירוע...
          </p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="page">
        <div className="state-card error-state">
          <h2>
            לא ניתן להציג את האירוע
          </h2>
          <p>
            {error ||
              "האירוע לא נמצא"}
          </p>
        </div>
      </main>
    );
  }

  const totalSeats = seats.length;

  const availableTickets =
    seats.filter(isAvailable).length;

  const soldTickets =
    totalSeats - availableTickets;

  const soldPercent =
    totalSeats > 0
      ? Math.round((soldTickets / totalSeats) * 100)
      : 0;

  const DONUT_R = 38;
  const DONUT_C = 2 * Math.PI * DONUT_R;

  const eventDate = new Date(event.date ?? event.Date);
  const eventDateText = isNaN(eventDate)
    ? ""
    : eventDate.toLocaleDateString("he-IL");

  const rows = [
    ...new Set(
      seats.map(getRow)
    ),
  ]
    .filter(
      (row) =>
        row !== undefined &&
        row !== null
    )
    .sort(
      (a, b) =>
        Number(a) - Number(b)
    );

  /*
   * מיקום ויזואלי של המושבים בלבד (חצי עיגול סביב הבמה).
   * כל שורה היא קשת; הרדיוס גדל עם מספר השורה.
   * הלוגיקה של האירוע וה־API אינה תלויה בעיצוב.
   */
  const createSeatLayout = (seatList) => {
    const SEAT_GAP = 40; // מרחק בין מושבים לאורך הקשת
    const ROW_GAP = 50; // מרחק בין שורות
    const INNER_RADIUS = 340; // רדיוס גדול = קשת שטוחה יותר
    const MAX_SPAN = Math.PI * 0.5; // זווית פתיחה מקסימלית (~90°)
    const X_STRETCH = 1.5; // מתיחה לרוחב
    const Y_SQUASH = 0.75; // כיווץ לגובה
    const SEAT_SIZE = 34;
    const PADDING = 30;

    const byRow = new Map();

    seatList.forEach((seat) => {
      const key = String(getRow(seat));
      if (!byRow.has(key)) byRow.set(key, []);
      byRow.get(key).push(seat);
    });

    const rowKeys = [...byRow.keys()].sort(
      (a, b) => Number(a) - Number(b)
    );

    const raw = [];
    let prevRadius = INNER_RADIUS - ROW_GAP;

    rowKeys.forEach((key) => {
      const rowSeats = byRow
        .get(key)
        .slice()
        .sort((a, b) => Number(getLine(a)) - Number(getLine(b)));

      const n = rowSeats.length;

      // הרדיוס מספיק גדול כדי שכל המושבים בשורה ייכנסו בלי חפיפה
      const radius = Math.max(
        prevRadius + ROW_GAP,
        ((n - 1) * SEAT_GAP) / MAX_SPAN
      );
      prevRadius = radius;

      const span =
        n > 1
          ? Math.min(MAX_SPAN, ((n - 1) * SEAT_GAP) / radius)
          : 0;

      rowSeats.forEach((seat, i) => {
        const angle =
          n > 1
            ? Math.PI / 2 + span / 2 - (i * span) / (n - 1)
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

    const minX = Math.min(...raw.map((p) => p.x));
    const maxX = Math.max(...raw.map((p) => p.x));
    const minY = Math.min(...raw.map((p) => p.y));
    const maxY = Math.max(...raw.map((p) => p.y));

    const width = Math.max(
      600,
      maxX - minX + SEAT_SIZE + PADDING * 2
    );
    const height = maxY - minY + SEAT_SIZE + PADDING;

    const positions = new Map();

    raw.forEach(({ seat, x, y }) => {
      positions.set(getSeatId(seat), {
        x: width / 2 + x,
        y: y - minY + 4,
      });
    });

    return { positions, width, height };
  };

  const seatLayout = createSeatLayout(seats);

  const mapScale =
    mapBox.w > 0 && mapBox.h > 0
      ? Math.min(
          mapBox.w / seatLayout.width,
          mapBox.h / seatLayout.height,
          1.25
        )
      : 1;

  const filteredSeats = rowFilter
    ? seats.filter(
        (seat) =>
          String(
            getRow(seat)
          ) ===
          String(rowFilter)
      )
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
              <h1 className="event-title">
                {event.name ?? event.Name}
              </h1>

              <div className="event-chips">
                {eventDateText && (
                  <span className="event-chip">
                    {eventDateText}
                  </span>
                )}

                <span className="event-chip">
                  ₪{event.price ?? event.Price}
                </span>
              </div>

              <input
                type="number"
                inputMode="numeric"
                min="1"
                className="row-filter"
                value={rowFilter}
                onChange={(e) =>
                  setRowFilter(e.target.value)
                }
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
              <svg
                className="occupancy-donut"
                viewBox="0 0 100 100"
                role="img"
              >
                <circle
                  className="occupancy-track"
                  cx="50"
                  cy="50"
                  r={DONUT_R}
                />

                <circle
                  className="occupancy-fill"
                  cx="50"
                  cy="50"
                  r={DONUT_R}
                  strokeDasharray={`${
                    (soldPercent / 100) * DONUT_C
                  } ${DONUT_C}`}
                  transform="rotate(-90 50 50)"
                />

                <text
                  x="50"
                  y="48"
                  className="occupancy-percent"
                >
                  {soldPercent}%
                </text>

                <text
                  x="50"
                  y="63"
                  className="occupancy-caption"
                >
                  הוזמנו
                </text>
              </svg>

              <div className="occupancy-text">
                <strong>
                  {soldTickets}
                  <small> / {totalSeats}</small>
                </strong>

                <span>
                  מושבים הוזמנו
                </span>

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

          <div className="auditorium">
            <div className="stage">
              <span>
                STAGE
              </span>
            </div>

            <div
              className="seat-map-wrapper"
              ref={mapAreaRef}
            >
              {rowFilter && positionedSeats.length === 0 && (
                <div className="no-row">
                  לא נמצאה שורה {rowFilter}
                </div>
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
                {positionedSeats.map(
                  ({
                    seat,
                    x,
                    y,
                  }) => {
                    const seatId =
                      getSeatId(
                        seat
                      );

                    const available =
                      isAvailable(
                        seat
                      );

                    const selected =
                      selectedSeat &&
                      getSeatId(
                        selectedSeat
                      ) ===
                        seatId;

                    return (
                      <button
                        key={seatId}
                        type="button"
                        className={[
                          "seat",
                          !available
                            ? "taken"
                            : "",
                          selected
                            ? "selected"
                            : "",
                        ]
                          .filter(
                            Boolean
                          )
                          .join(" ")}
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                        }}
                        disabled={
                          !available
                        }
                        onClick={() =>
                          handleSeatClick(
                            seat
                          )
                        }
                        title={
                          available
                            ? `שורה ${getRow(
                                seat
                              )}, מושב ${getLine(
                                seat
                              )}`
                            : "מושב תפוס"
                        }
                        aria-label={`שורה ${getRow(
                          seat
                        )}, מושב ${getLine(
                          seat
                        )}`}
                      >
                        {getLine(
                          seat
                        )}
                      </button>
                    );
                  }
                )}
              </div>
              </div>
            </div>
          </div>

          {bookingError && (
            <div className="booking-error">
              {bookingError}
            </div>
          )}

          <div className="booking-bar">
            <div>
              {selectedSeat ? (
                <>
                  <span>
                    המושב שנבחר
                  </span>

                  <strong>
                    שורה{" "}
                    {getRow(
                      selectedSeat
                    )}{" "}
                    · מושב{" "}
                    {getLine(
                      selectedSeat
                    )}
                  </strong>
                </>
              ) : (
                <>
                  <span>
                    בחרי מושב מהמפה
                  </span>

                  <strong>
                    לא נבחר מושב
                  </strong>
                </>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={
                !selectedSeat ||
                booking
              }
              onClick={
                handleBooking
              }
            >
              {booking
                ? "מבצע הזמנה..."
                : "הזמן כרטיס"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default EventDetail;