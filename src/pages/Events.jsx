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
          <div className="ticket-grid">
            {page.data.map((ev) => (
              <Link
                to={`/events/${encodeURIComponent(ev.name)}`}
                key={ev.id}
                className={`ticket-card${ev.isCancelled ? " ticket-card--cancelled" : ""}`}
              >
                <div className="ticket-main">
                  <h3>{ev.name}</h3>
                  {ev.isCancelled && <span className="badge badge-danger">האירוע בוטל</span>}
                  <div className="ticket-meta">
                    <span>{formatDate(ev.date)}</span>
                    <span>{ev.numberOfSeats} מקומות</span>
                  </div>
                </div>
                <div className="ticket-stub">
                  <span className="ticket-price-label">מחיר</span>
                  <span className="ticket-price">{formatPrice(ev.price)}</span>
                </div>
              </Link>
            ))}
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
