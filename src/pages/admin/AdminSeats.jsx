import { useEffect, useState } from "react";
import * as seatsApi from "../../api/seats";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";
import { useToast } from "../../context/ToastContext";

export default function AdminSeats() {
    const toast = useToast();

    const [page, setPage] = useState({
        data: [],
        pageNumber: 1,
        totalPages: 0,
    });

    const [pageNumber, setPageNumber] = useState(1);
    const [rowFilter, setRowFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [form, setForm] = useState({ row: "", line: "" });
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const load = () => {
        setLoading(true);
        setError("");

        seatsApi
            .getSeats(pageNumber, 12, rowFilter)
            .then(setPage)
            .catch((err) => setError(extractErrorMessage(err)))
            .finally(() => setLoading(false));
    };

    useEffect(load, [pageNumber, rowFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRowFilterChange = (e) => {
        setRowFilter(e.target.value);
        setPageNumber(1);
    };

    const clearRowFilter = () => {
        setRowFilter("");
        setPageNumber(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);

        try {
            await seatsApi.createSeat({
                row: Number(form.row),
                line: Number(form.line),
            });

            toast.success("המושב נוסף בהצלחה.");
            setForm({ row: "", line: "" });
            load();
        } catch (err) {
            setFormError(
                extractErrorMessage(err, "הוספת המושב נכשלה.")
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (seat) => {
        if (
            !window.confirm(
                `למחוק את המושב בשורה ${seat.row}, טור ${seat.line}?`
            )
        ) {
            return;
        }

        setDeletingId(seat.id);

        try {
            await seatsApi.deleteSeat(seat.id);
            toast.success("המושב נמחק.");
            load();
        } catch (err) {
            toast.error(
                extractErrorMessage(err, "מחיקת המושב נכשלה.")
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="stack-16">
            <div className="panel">
                <div className="panel-header">
                    <h2>מושב חדש</h2>
                </div>

                <div className="panel-body">
                    {formError && (
                        <div className="alert alert-danger">{formError}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="field-row">
                            <div className="field">
                                <label htmlFor="seat-row">שורה</label>
                                <input
                                    id="seat-row"
                                    type="number"
                                    min={1}
                                    value={form.row}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            row: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="seat-line">טור</label>
                                <input
                                    id="seat-line"
                                    type="number"
                                    min={1}
                                    value={form.line}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            line: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting ? "מוסיף..." : "הוספת מושב"}
                        </button>
                    </form>
                </div>
            </div>

            <div className="panel">
                <div className="panel-header">
                    <h2>כל המושבים</h2>
                </div>

                <div className="panel-body">
                    <div className="field">
                        <label htmlFor="seat-row-filter">
                            חיפוש לפי שורה
                        </label>

                        <div className="field-row">
                            <input
                                id="seat-row-filter"
                                type="number"
                                min={1}
                                value={rowFilter}
                                onChange={handleRowFilterChange}
                                placeholder="מספר שורה"
                            />

                            {rowFilter !== "" && (
                                <button
                                    className="btn btn-secondary"
                                    type="button"
                                    onClick={clearRowFilter}
                                >
                                    ניקוי
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger">{error}</div>
                    )}

                    {loading ? (
                        <Spinner />
                    ) : page.data.length === 0 ? (
                        <EmptyState
                            title="אין מושבים"
                            description={
                                rowFilter
                                    ? `לא נמצאו מושבים בשורה ${rowFilter}.`
                                    : "הוסיפו מושב חדש בטופס שמעל."
                            }
                        />
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>שורה</th>
                                        <th>טור</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {page.data.map((seat) => (
                                        <tr key={seat.id}>
                                            <td>{seat.id}</td>
                                            <td>{seat.row}</td>
                                            <td>{seat.line}</td>
                                            <td>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(seat)}
                                                    disabled={deletingId === seat.id}
                                                >
                                                    {deletingId === seat.id
                                                        ? "מוחק..."
                                                        : "מחיקה"}
                                                </button>
                                            </td>
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