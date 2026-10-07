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

    const clearRowFilter = () => {
        setRowFilter("");
        setSelectedSeat(null);
        setBookingError("");
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

    const totalSeats = event.numberOfSeats ?? seats.length;

    const soldTickets = seats.filter(
        (seat) => !seat.isAvailable
    ).length;

    const availableTickets = Math.max(
        totalSeats - soldTickets,
        0
    );

    const filteredSeats = seats.filter((seat) => {
        if (!rowFilter.trim()) return true;

        return (
            String(seat.row).trim() ===
            rowFilter.trim()
        );
    });

    const rows = Object.entries(
        filteredSeats.reduce((acc, seat) => {
            (acc[seat.row] = acc[seat.row] || []).push(seat);
            return acc;
        }, {})
    )
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([row, list]) => [
            row,
            list.sort(
                (a, b) =>
                    Number(a.line) - Number(b.line)
            ),
        ]);

    const soldPct = totalSeats
        ? Math.min(
            100,
            Math.round(
                (soldTickets / totalSeats) * 100
            )
        )
        : 0;

    return (
        <div className="page">
            <div className="event-hero">
                <div>
                    <h1>{event.name}</h1>

                    <div className="chips">
                        <span className="chip">
                            {formatDate(event.date)}
                        </span>

                        <span className="chip">
                            {formatPrice(event.price)} לכרטיס
                        </span>

                        <span className="chip">
                            {totalSeats} מקומות
                        </span>
                    </div>
                </div>

                <div className="event-hero-stats">
                    <strong>{availableTickets}</strong>

                    <small>מושבים פנויים</small>

                    <div className="meter">
                        <i
                            style={{
                                width: `${soldPct}%`,
                            }}
                        />
                    </div>

                    <small>
                        {soldTickets} כרטיסים נקנו מתוך{" "}
                        {totalSeats}
                    </small>
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
                            <div className="seat-tools">
                                <div className="field">
                                    <label htmlFor="row-filter">
                                        שורה
                                    </label>

                                    <input
                                        id="row-filter"
                                        type="text"
                                        inputMode="numeric"
                                        value={rowFilter}
                                        onChange={(e) => {
                                            setRowFilter(
                                                e.target.value
                                            );
                                            setSelectedSeat(null);
                                            setBookingError("");
                                        }}
                                        placeholder="כל השורות"
                                    />
                                </div>

                                {rowFilter && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={clearRowFilter}
                                    >
                                        ניקוי
                                    </button>
                                )}

                                <div
                                    className="legend"
                                    aria-hidden="true"
                                >
                                    <span>
                                        <i /> פנוי
                                    </span>

                                    <span>
                                        <i className="taken" /> תפוס
                                    </span>

                                    <span>
                                        <i className="sel" /> נבחר
                                    </span>
                                </div>
                            </div>

                            {filteredSeats.length === 0 ? (
                                <EmptyState
                                    title="לא נמצאו מושבים בשורה הזו"
                                    description="נסו מספר שורה אחר או נקו את הסינון כדי לראות את כל המושבים."
                                />
                            ) : (
                                <>
                                    <div className="stage">
                                        במה
                                    </div>

                                    <div className="seat-map">
                                        {rows.map(
                                            ([row, list]) => (
                                                <div
                                                    className="seat-row"
                                                    key={row}
                                                >
                                                    <span className="seat-row-label">
                                                        {row}
                                                    </span>

                                                    <div className="seat-row-seats">
                                                        {list.map(
                                                            (
                                                                seat,
                                                                index
                                                            ) => {
                                                                const isTaken =
                                                                    !seat.isAvailable;

                                                                const isSelected =
                                                                    selectedSeat?.seatId ===
                                                                    seat.seatId;

                                                                const seatLabel = `שורה ${seat.row} טור ${seat.line}`;

                                                                /*
                                                                 * Position of the seat
                                                                 * along the curved row.
                                                                 *
                                                                 * 17 seats are distributed
                                                                 * symmetrically around the
                                                                 * center of the row.
                                                                 */
                                                                const center =
                                                                    (list.length -
                                                                        1) /
                                                                    2;

                                                                const distance =
                                                                    index -
                                                                    center;

                                                                const normalized =
                                                                    center ===
                                                                        0
                                                                        ? 0
                                                                        : distance /
                                                                        center;

                                                                const curve =
                                                                    22 +
                                                                    Math.abs(
                                                                        normalized
                                                                    ) *
                                                                    55;

                                                                const angle =
                                                                    normalized *
                                                                    13;

                                                                const seatStyle =
                                                                {
                                                                    "--seat-y": `${curve}px`,
                                                                    "--seat-angle": `${angle}deg`,
                                                                };

                                                                return (
                                                                    <button
                                                                        key={
                                                                            seat.seatId
                                                                        }
                                                                        type="button"
                                                                        className={`seat${isTaken
                                                                                ? " taken"
                                                                                : ""
                                                                            }${isSelected
                                                                                ? " selected"
                                                                                : ""
                                                                            }`}
                                                                        style={
                                                                            seatStyle
                                                                        }
                                                                        onClick={() =>
                                                                            handleSelectSeat(
                                                                                seat
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            event.isCancelled ||
                                                                            isTaken
                                                                        }
                                                                        title={
                                                                            isTaken
                                                                                ? `${seatLabel} · תפוס`
                                                                                : seatLabel
                                                                        }
                                                                        aria-label={
                                                                            isTaken
                                                                                ? `${seatLabel}, תפוס`
                                                                                : seatLabel
                                                                        }
                                                                        aria-pressed={
                                                                            isSelected
                                                                        }
                                                                    >
                                                                        {isTaken
                                                                            ? "✕"
                                                                            : seat.line}
                                                                    </button>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </>
                            )}

                            {selectedSeat &&
                                !event.isCancelled && (
                                    <div className="book-bar">
                                        <div>
                                            <b>
                                                שורה{" "}
                                                {
                                                    selectedSeat.row
                                                }{" "}
                                                · טור{" "}
                                                {
                                                    selectedSeat.line
                                                }
                                            </b>

                                            <small>
                                                {formatPrice(
                                                    event.price
                                                )}{" "}
                                                לכרטיס
                                            </small>
                                        </div>

                                        <div
                                            className="stack-8"
                                            style={{
                                                alignItems:
                                                    "flex-end",
                                            }}
                                        >
                                            {bookingError && (
                                                <div
                                                    className="alert alert-danger"
                                                    style={{
                                                        margin: 0,
                                                    }}
                                                >
                                                    {
                                                        bookingError
                                                    }
                                                </div>
                                            )}

                                            <button
                                                className="btn btn-primary"
                                                onClick={
                                                    handleBook
                                                }
                                                disabled={
                                                    booking
                                                }
                                            >
                                                {booking
                                                    ? "מבצע הזמנה..."
                                                    : "הזמנת המושב"}
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