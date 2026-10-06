```jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as eventsApi from "../api/events";
import * as eventSeatsApi from "../api/eventSeats";
import * as ordersApi from "../api/orders";
import { extractErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { formatDate, formatPrice } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

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

    const load = () => {
        let cancelled = false;

        setLoading(true);
        setError("");

        eventsApi
            .getEventByName(name)
            .then((eventData) => {
                if (cancelled) return;

                setEvent(eventData);
                return eventSeatsApi.getSeatsForEvent(eventData.id);
            })
            .then((eventSeats) => {
                if (cancelled) return;

                setSeats(eventSeats || []);
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(
                        extractErrorMessage(
                            err,
                            "לא ניתן לטעון את פרטי האירוע."
                        )
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    };

    useEffect(load, [name]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelectSeat = (seat) => {
        if (!seat.isAvailable || event?.isCancelled) return;

        setSelectedSeat(seat);
        setBookingError("");
    };

    const handleBook = async () => {
        if (event?.isCancelled) {
            setBookingError(
                "האירוע בוטל ולא ניתן להזמין אליו כרטיסים."
            );
            return;
        }

        if (!selectedSeat) {
            setBookingError("בחרו מושב תחילה.");
            return;
        }

        setBooking(true);
        setBookingError("");

        try {
            const result = await ordersApi.createOrder({
                eventId: selectedSeat.eventId,
                seatId: selectedSeat.seatId,
                userId,
            });

            toast.success("ההזמנה בוצעה בהצלחה!");

            navigate("/order-confirmation", {
                state: {
                    order: result,
                    eventName: event.name,
                },
            });
        } catch (err) {
            const status = err?.response?.status;

            if (status === 409) {
                setBookingError(
                    extractErrorMessage(
                        err,
                        "המושב הזה כבר תפוס. נסו מושב אחר."
                    )
                );

                load();
            } else if (status === 404) {
                setBookingError(
                    extractErrorMessage(
                        err,
                        "המושב לא נמצא. רעננו את הדף ונסו שוב."
                    )
                );
            } else {
                setBookingError(extractErrorMessage(err));
            }
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <Spinner />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="page">
                <EmptyState
                    title="האירוע לא נמצא"
                    description={error || "ייתכן שהאירוע הוסר."}
                />
            </div>
        );
    }

    // מספר המקומות הכולל באירוע
    const totalSeats = event.numberOfSeats ?? seats.length;

    // מספר הכרטיסים שכבר נקנו
    const soldTickets = seats.filter(
        (seat) => !seat.isAvailable
    ).length;

    // מספר המקומות הפנויים
    const availableTickets = Math.max(
        totalSeats - soldTickets,
        0
    );

    // סינון לפי שורה - רק מושבים פנויים
    const filteredSeats = seats.filter((seat) => {
        if (!seat.isAvailable) return false;

        if (!rowFilter.trim()) return true;

        return (
            String(seat.row).trim() ===
            rowFilter.trim()
        );
    });

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <div className="eyebrow">פרטי אירוע</div>

                    <h1>{event.name}</h1>

                    <p>
                        {formatDate(event.date)} ·{" "}
                        {totalSeats} מקומות ·{" "}
                        {formatPrice(event.price)} לכרטיס
                    </p>

                    <p>
                        <strong>{soldTickets}</strong>{" "}
                        כרטיסים נקנו מתוך{" "}
                        <strong>{totalSeats}</strong>
                        {" · "}
                        <strong>{availableTickets}</strong>{" "}
                        מקומות פנויים
                    </p>
                </div>
            </div>

            {event.isCancelled && (
                <div className="alert alert-danger">
                    <strong>האירוע בוטל.</strong>

                    {event.cancellationReason && (
                        <> {event.cancellationReason}</>
                    )}

                    <div>
                        לא ניתן להזמין כרטיסים לאירוע זה.
                    </div>
                </div>
            )}

            <div className="panel">
                <div className="panel-header">
                    <h2>בחירת מושב</h2>

                    <span className="badge badge-neutral">
                        {availableTickets} מושבים פנויים
                    </span>
                </div>

                <div className="panel-body">
                    {seats.length === 0 ? (
                        <EmptyState
                            title="אין עדיין מושבים משויכים לאירוע"
                            description="פנו למנהל המערכת כדי לשייך מושבים לאירוע לפני שניתן להזמין כרטיסים."
                        />
                    ) : (
                        <>
                            <div className="stack-16 mb-24">
                                <label htmlFor="row-filter">
                                    <strong>סינון לפי שורה</strong>
                                </label>

                                <input
                                    id="row-filter"
                                    type="text"
                                    inputMode="numeric"
                                    value={rowFilter}
                                    onChange={(e) => {
                                        setRowFilter(e.target.value);
                                        setSelectedSeat(null);
                                        setBookingError("");
                                    }}
                                    placeholder="הכניסו מספר שורה, למשל 5"
                                    className="input"
                                />
                            </div>

                            {filteredSeats.length === 0 ? (
                                <EmptyState
                                    title="אין מושבים פנויים בשורה הזו"
                                    description="נסו מספר שורה אחר או השאירו את השדה ריק."
                                />
                            ) : (
                                <div className="seat-grid">
                                    {filteredSeats.map((seat) => (
                                        <button
                                            key={seat.seatId}
                                            className={`seat - tile${
    selectedSeat?.seatId ===
        seat.seatId
        ? " selected"
        : ""
} `}
                                            onClick={() =>
                                                handleSelectSeat(seat)
                                            }
                                            type="button"
                                            disabled={
                                                !seat.isAvailable ||
                                                event.isCancelled
                                            }
                                        >
                                            <div className="seat-tile-label">
                                                {seat.row}-{seat.line}
                                            </div>

                                            <div className="seat-tile-sub">
                                                שורה · טור
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedSeat && !event.isCancelled && (
                                <div className="stack-16 mt-24">
                                    {bookingError && (
                                        <div className="alert alert-danger">
                                            {bookingError}
                                        </div>
                                    )}

                                    <div>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleBook}
                                            disabled={booking}
                                        >
                                            {booking
                                                ? "מבצע הזמנה..."
                                                : `הזמנת מושב ${ selectedSeat.row } -${ selectedSeat.line } `}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
```
