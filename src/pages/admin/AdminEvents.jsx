import { useEffect, useState } from "react";
import * as eventsApi from "../../api/events";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";
import { formatDate, formatPrice } from "../../utils/format";
import { useToast } from "../../context/ToastContext";

const emptyForm = { name: "", date: "", price: "", numberOfSeats: "" };

export default function AdminEvents() {
  const toast = useToast();
  const [page, setPage] = useState({ data: [], pageNumber: 1, totalPages: 0 });
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    eventsApi
      .getEvents(pageNumber, 10)
      .then(setPage)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [pageNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await eventsApi.createEvent({
        name: form.name,
        date: new Date(form.date).toISOString(),
        price: Number(form.price),
        numberOfSeats: Number(form.numberOfSeats),
      });
      toast.success("האירוע נוסף בהצלחה.");
      setForm(emptyForm);
      setPageNumber(1);
      load();
    } catch (err) {
      setFormError(extractErrorMessage(err, "הוספת האירוע נכשלה."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack-16">
      <div className="panel">
        <div className="panel-header">
          <h2>אירוע חדש</h2>
        </div>
        <div className="panel-body">
          {formError && <div className="alert alert-danger">{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="ev-name">שם האירוע</label>
                <input id="ev-name" value={form.name} onChange={update("name")} minLength={3} maxLength={50} required />
              </div>
              <div className="field">
                <label htmlFor="ev-date">תאריך</label>
                <input id="ev-date" type="datetime-local" value={form.date} onChange={update("date")} required />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="ev-price">מחיר (₪)</label>
                <input id="ev-price" type="number" min={0} step="0.01" value={form.price} onChange={update("price")} required />
              </div>
              <div className="field">
                <label htmlFor="ev-seats">מספר מקומות</label>
                <input id="ev-seats" type="number" min={1} value={form.numberOfSeats} onChange={update("numberOfSeats")} required />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "מוסיף..." : "הוספת אירוע"}
            </button>
          </form>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>כל האירועים</h2>
        </div>
        <div className="panel-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {loading ? (
            <Spinner />
          ) : page.data.length === 0 ? (
            <EmptyState title="אין עדיין אירועים" description="הוסיפו אירוע חדש בטופס שמעל." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>תאריך</th>
                    <th>מחיר</th>
                    <th>מקומות</th>
                  </tr>
                </thead>
                <tbody>
                  {page.data.map((ev) => (
                    <tr key={ev.id}>
                      <td>{ev.name}</td>
                      <td>{formatDate(ev.date)}</td>
                      <td>{formatPrice(ev.price)}</td>
                      <td>{ev.numberOfSeats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            pageNumber={page.pageNumber}
            totalPages={page.totalPages}
            hasNextPage={page.hasNextPage}
            hasPreviousPage={page.hasPreviousPage}
            onChange={setPageNumber}
          />
        </div>
      </div>
    </div>
  );
}
