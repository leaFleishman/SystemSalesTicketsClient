import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as usersApi from "../../api/users";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";

export default function AdminUsers() {
  const [page, setPage] = useState({ data: [], pageNumber: 1, totalPages: 0 });
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    usersApi
      .getAllUsers(pageNumber, 15)
      .then(setPage)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [pageNumber]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>כל המשתמשים</h2>
      </div>
      <div className="panel-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {loading ? (
          <Spinner />
        ) : page.data.length === 0 ? (
          <EmptyState title="אין עדיין משתמשים" description="משתמשים שנרשמו יופיעו כאן." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>שם</th>
                  <th>טלפון</th>
                  <th>אימייל</th>
                  <th>סטטוס</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {page.data.map((user) => (
                  <tr key={user.inferredId}>
                    <td>{user.inferredId}</td>
                    <td>{user.userName}</td>
                    <td>{user.phone}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.isBlocked ? "badge-danger" : "badge-success"}`}>
                        {user.isBlocked ? "חסום" : "פעיל"}
                      </span>
                    </td>
                    <td>
                      <Link className="btn btn-secondary btn-sm" to={`/admin/users/${user.inferredId}`}>
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
