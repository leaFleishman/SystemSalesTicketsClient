import { useEffect, useState } from "react";
import * as eventsApi from "../../api/events";
import * as seatsApi from "../../api/seats";
import * as eventSeatsApi from "../../api/eventSeats";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../context/ToastContext";

export default function AdminEventSeats() {
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [allSeats, setAllSeats] = useState([]);
  const [linkedSeats, setLinkedSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkingId, setLinkingId] = useState(null);
  const [linkingAll, setLinkingAll] = useState(false);

  // Load the event list once for the dropdown.
  useEffect(() => {
    setEventsLoading(true);
    eventsApi
      .getEvents(1, 100)
      .then((page) => {
        setEvents(page.data);
        if (page.data.length > 0) setSelectedEventId(String(page.data[0].id));
      })
      .catch((err) => toast.error(extractErrorMessage(err, "לא ניתן לטעון את רשימת האירועים.")))
      .finally(() => setEventsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSeats = () => {
    if (!selectedEventId) return;
    setSeatsLoading(true);
    setError("");
    Promise.all([seatsApi.getSeats(1, 200), eventSeatsApi.getSeatsForEvent(Number(selectedEventId))])
      .then(([seatsPage, eventSeats]) => {
        setAllSeats(seatsPage.data);
        setLinkedSeats(eventSeats || []);
      })
      .catch((err) => setError(extractErrorMessage(err, "לא ניתן לטעון את המושבים.")))
      .finally(() => setSeatsLoading(false));
  };

  useEffect(loadSeats, [selectedEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const linkedSeatIds = new Set(linkedSeats.map((es) => es.seatId));
  const unlinkedSeats = allSeats.filter((seat) => !linkedSeatIds.has(seat.id));

  const handleLink = async (seat) => {
    setLinkingId(seat.id);
    try {
      await eventSeatsApi.addEventSeat({ eventId: Number(selectedEventId), seatId: seat.id });
      toast.success(`המושב ${seat.row}-${seat.line} שויך לאירוע.`);
      loadSeats();
    } catch (err) {
      toast.error(extractErrorMessage(err, "שיוך המושב לאירוע נכשל."));
    } finally {
      setLinkingId(null);
    }
  };

  const handleLinkAll = async () => {
    setLinkingAll(true);
    try {
      const result = await eventSeatsApi.linkAllSeatsToEvent(Number(selectedEventId));
      toast.success(
        result.linkedCount > 0
          ? `${result.linkedCount} מושבים שויכו לאירוע.`
          : "כל המושבים כבר היו משויכים לאירוע."
      );
      loadSeats();
    } catch (err) {
      toast.error(extractErrorMessage(err, "שיוך כל המושבים נכשל."));
    } finally {
      setLinkingAll(false);
    }
  };

  if (eventsLoading) return <Spinner />;

  if (events.length === 0) {
    return <EmptyState title="אין עדיין אירועים" description="צרו אירוע בלשונית 'אירועים' לפני שיוך מושבים." />;
  }

  return (
    <div className="stack-16">
      <div className="panel">
        <div className="panel-header">
          <h2>שיוך מושבים לאירוע</h2>
        </div>
        <div className="panel-body">
          <p className="field-hint" style={{ marginBottom: 16 }}>
            כאן מוסיפים מושבים קיימים לאירוע. מושב שנוצר אחרי שהאירוע כבר קיים אינו משויך אליו אוטומטית —
            יש לשייך אותו כאן כדי שיהיה ניתן להזמין אותו.
          </p>
          <div className="field" style={{ maxWidth: 320 }}>
            <label htmlFor="event-select">אירוע</label>
            <select id="event-select" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {seatsLoading ? (
        <Spinner />
      ) : (
        <div className="field-row" style={{ alignItems: "flex-start" }}>
          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <h2>משויכים לאירוע ({linkedSeats.length})</h2>
            </div>
            <div className="panel-body">
              {linkedSeats.length === 0 ? (
                <EmptyState title="אין עדיין מושבים משויכים" description="שייכו מושבים מהרשימה שמימין." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>מזהה</th>
                        <th>שורה</th>
                        <th>טור</th>
                        <th>סטטוס</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedSeats.map((es) => (
                        <tr key={es.seatId}>
                          <td>{es.seatId}</td>
                          <td>{es.row}</td>
                          <td>{es.line}</td>
                          <td>
                            <span className={`badge ${es.isAvailable ? "badge-success" : "badge-neutral"}`}>
                              {es.isAvailable ? "פנוי" : "תפוס"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <h2>מושבים לא משויכים ({unlinkedSeats.length})</h2>
              {unlinkedSeats.length > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={handleLinkAll} disabled={linkingAll}>
                  {linkingAll ? "משייך הכל..." : "שייך את כל המושבים"}
                </button>
              )}
            </div>
            <div className="panel-body">
              {unlinkedSeats.length === 0 ? (
                <EmptyState title="כל המושבים משויכים" description="אין מושבים נוספים לשייך לאירוע זה." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>מזהה</th>
                        <th>שורה</th>
                        <th>טור</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {unlinkedSeats.map((seat) => (
                        <tr key={seat.id}>
                          <td>{seat.id}</td>
                          <td>{seat.row}</td>
                          <td>{seat.line}</td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleLink(seat)}
                              disabled={linkingId === seat.id}
                            >
                              {linkingId === seat.id ? "משייך..." : "שייך לאירוע"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
