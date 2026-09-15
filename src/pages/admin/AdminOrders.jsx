import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as ordersApi from "../../api/orders";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";

export default function AdminOrders() {
  const [page, setPage] = useState({ data: [], pageNumber: 1, totalPages: 0 });
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    ordersApi
      .getAllOrders(pageNumber, 15)
      .then(setPage)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [pageNumber]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>כל ההזמנות</h2>
      </div>
      <div className="panel-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {loading ? (
          <Spinner />
        ) : page.data.length === 0 ? (
          <EmptyState title="אין עדיין הזמנות" description="הזמנות שיבוצעו על ידי לקוחות יופיעו כאן." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>מזהה אירוע</th>
                  <th>מזהה מושב</th>
                  <th>מזהה משתמש</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {page.data.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.eventId}</td>
                    <td>{order.seatId}</td>
                    <td>{order.userId}</td>
                    <td>
                      <Link className="btn btn-secondary btn-sm" to={`/admin/orders/${order.id}`}>
                        פרטים
                      </Link>
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
  );
}
