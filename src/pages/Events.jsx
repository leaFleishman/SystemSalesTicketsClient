import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as eventsApi from "../api/events";
import { extractErrorMessage } from "../api/client";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import { formatDate, formatPrice } from "../utils/format";
import { useAuth } from "../context/AuthContext";

export default function Events() {
  const { isManager } = useAuth();
  const [page, setPage] = useState({ data: [], pageNumber: 1, totalPages: 0 });
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    eventsApi
      .getEvents(pageNumber, 12)
      .then((data) => {
        if (!cancelled) setPage(data);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err, "לא ניתן לטעון את רשימת האירועים."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">אירועים קרובים</div>
          <h1>מה מתרחש עכשיו</h1>
          <p>בחרו אירוע כדי לראות פרטים ולהזמין מושב</p>
        </div>
        {isManager && (
          <Link to="/admin/events" className="btn btn-secondary">
            ניהול אירועים
          </Link>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <Spinner />
      ) : page.data.length === 0 ? (
        <EmptyState title="אין אירועים כרגע" description="ברגע שיתווספו אירועים חדשים הם יופיעו כאן." />
      ) : (
        <>
          <div className="evt-grid">
            {page.data.map((ev, i) => {
              const d = new Date(ev.date);
              const valid = !Number.isNaN(d.getTime());
              const weekday = valid ? d.toLocaleDateString("he-IL", { weekday: "long" }) : "";
              const time = valid ? d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : "";
              return (
                <Link
                  to={`/events/${encodeURIComponent(ev.name)}`}
                  key={ev.id}
                  className={`evt-card${ev.isCancelled ? " evt-card--cancelled" : ""}`}
                  style={{ "--i": i }}
                >
                  <span className="evt-ornament" aria-hidden="true" />

                  <div className="evt-date">
                    <span className="evt-weekday">{weekday}</span>
                    <span className="evt-day">{valid ? d.getDate() : "—"}</span>
                    <span className="evt-month">
                      {valid ? d.toLocaleDateString("he-IL", { month: "long" }) : ""}
                    </span>
                  </div>

                  <div className="evt-body">
                    <div className="evt-kicker">
                      {ev.isCancelled ? (
                        <span className="evt-cancelled">האירוע בוטל</span>
                      ) : (
                        <span>{time ? `בשעה ${time}` : "אירוע"}</span>
                      )}
                    </div>
                    <h3 className="evt-title">{ev.name}</h3>
                    <div className="evt-meta">
                      <span>
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
                        {formatDate(ev.date)}
                      </span>
                      <span>
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" /><path d="M3 13a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v6H3z" /></svg>
                        {ev.numberOfSeats} מקומות
                      </span>
                    </div>
                  </div>

                  <div className="evt-foot">
                    <div className="evt-price">
                      <small>החל מ־</small>
                      <strong>{formatPrice(ev.price)}</strong>
                    </div>
                    <span className="evt-cta">
                      {ev.isCancelled ? "לפרטים" : "בחירת מושב"}
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <Pagination
            pageNumber={page.pageNumber}
            totalPages={page.totalPages}
            hasNextPage={page.hasNextPage}
            hasPreviousPage={page.hasPreviousPage}
            onChange={setPageNumber}
          />
        </>
      )}
    </div>
  );
}
