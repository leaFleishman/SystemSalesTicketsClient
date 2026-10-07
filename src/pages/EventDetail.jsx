import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getEventByName } from "../api/events";
import { getSeatsForEvent } from "../api/eventSeats";
import { createOrder } from "../api/orders";

import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

import "../theme.css";

function EventDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [rowFilter, setRowFilter] = useState("");

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

      const eventData = await getEventByName(name);

      if (!eventData) {
        throw new Error("Event was not found");
      }

      setEvent(eventData);

      const eventId =
        eventData.eventId ??
        eventData.EventId;

      if (!eventId) {
        throw new Error("Event ID is missing");
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

    if (!user) {
      navigate("/login", {
        state: {
          from: `/events/${encodeURIComponent(
            name
          )}`,
        },
      });

      return;
    }

    try {
      setBooking(true);
      setBookingError("");

      const eventId =
        event.eventId ??
        event.EventId;

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
            order,
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

        toast.warning(
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
   * מיקום ויזואלי של המושבים בלבד.
   * הלוגיקה של האירוע וה־API אינה תלויה בעיצוב.
   */
  const visualRowSizes = [
    6,
    10,
    12,
    14,
    16,
    18,
    20,
    22,
    24,
    28,
  ];

  const createSeatPositions = (
    seatList
  ) => {
    const positions = [];

    const mapWidth = 900;
    const mapHeight = 470;
    const centerX = mapWidth / 2;
    const rowHeight = 39;

    visualRowSizes.forEach(
      (count, rowIndex) => {
        const y =
          20 +
          rowIndex * rowHeight;

        const totalWidth =
          count * 29;

        const startX =
          centerX -
          totalWidth / 2 +
          14.5;

        for (
          let i = 0;
          i < count;
          i++
        ) {
          positions.push({
            x:
              startX +
              i * 29,
            y,
          });
        }
      }
    );

    return seatList.map(
      (seat, index) => ({
        seat,
        x:
          positions[index]?.x ??
          centerX,
        y:
          positions[index]?.y ??
          mapHeight - 20,
      })
    );
  };

  const filteredSeats = rowFilter
    ? seats.filter(
        (seat) =>
          String(
            getRow(seat)
          ) ===
          String(rowFilter)
      )
    : seats;

  const positionedSeats =
    createSeatPositions(
      filteredSeats
    );

  return (
    <main className="page event-detail-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            EVENT
          </span>

          <h1>
            {event.name ??
              event.Name}
          </h1>
        </div>
      </div>

      <section className="event-detail-layout">
        <div className="event-info-panel">
          <div className="event-info">
            <h2>
              {event.name ??
                event.Name}
            </h2>

            <div className="event-info-row">
              <span>תאריך</span>

              <strong>
                {new Date(
                  event.date ??
                    event.Date
                ).toLocaleDateString(
                  "he-IL"
                )}
              </strong>
            </div>

            <div className="event-info-row">
              <span>
                מחיר כרטיס
              </span>

              <strong>
                ₪
                {event.price ??
                  event.Price}
              </strong>
            </div>

            <div className="event-info-row">
              <span>מקומות</span>

              <strong>
                {totalSeats}
              </strong>
            </div>

            <div className="event-info-row">
              <span>נמכרו</span>

              <strong>
                {soldTickets}
              </strong>
            </div>

            <div className="event-info-row">
              <span>נותרו</span>

              <strong className="available-number">
                {availableTickets}
              </strong>
            </div>
          </div>

          <div className="seat-legend">
            <div>
              <span className="legend-seat available" />
              <span>
                פנוי
              </span>
            </div>

            <div>
              <span className="legend-seat selected" />
              <span>
                נבחר
              </span>
            </div>

            <div>
              <span className="legend-seat taken" />
              <span>
                תפוס
              </span>
            </div>
          </div>
        </div>

        <div className="seat-panel">
          <div className="seat-panel-header">
            <div>
              <span className="eyebrow">
                SEAT MAP
              </span>

              <h2>
                בחירת מושב
              </h2>
            </div>

            <select
              value={rowFilter}
              onChange={(e) =>
                setRowFilter(
                  e.target.value
                )
              }
              className="row-filter"
            >
              <option value="">
                כל השורות
              </option>

              {rows.map((row) => (
                <option
                  key={row}
                  value={row}
                >
                  שורה {row}
                </option>
              ))}
            </select>
          </div>

          <div className="auditorium">
            <div className="stage">
              <span>
                STAGE
              </span>
            </div>

            <div className="seat-map-wrapper">
              <div className="seat-map">
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