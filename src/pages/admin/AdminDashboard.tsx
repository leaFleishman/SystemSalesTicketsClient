import { useEffect, useState } from "react";
import * as dashboardApi from "../../api/dashboard";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import { formatDateTime, formatPrice } from "../../utils/format";

function StatCard({ label, value }) {
  return (
    <div className="dashboard-stat">
      <div className="dashboard-stat-label">{label}</div>
      <div className="dashboard-stat-value">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const result = await dashboardApi.getDashboard();
      setData(result);
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          "טעינת לוח הבקרה נכשלה."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="panel">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger dashboard-error">
        <span>{error}</span>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadDashboard}
        >
          נסה שוב
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="stack-16">
      <div className="dashboard-grid">
        <StatCard
          label="אירועים פעילים"
          value={data.activeEvents}
        />

        <StatCard
          label="כרטיסים שנמכרו"
          value={data.ticketsSold}
        />

        <StatCard
          label="הכנסות"
          value={formatPrice(data.revenue)}
        />

        <StatCard
          label="מושבים פנויים"
          value={data.availableSeats}
        />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>אירועים קרובים</h2>

            <div className="field-hint">
              5 האירועים הקרובים ביותר
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadDashboard}
          >
            רענון
          </button>
        </div>

        <div className="panel-body">
          {data.upcomingEvents &&
          data.upcomingEvents.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>אירוע</th>
                    <th>תאריך</th>
                    <th>נמכרו</th>
                    <th>פנויים</th>
                  </tr>
                </thead>

                <tbody>
                  {data.upcomingEvents.map((event) => (
                    <tr key={event.id}>
                      <td>{event.name}</td>

                      <td>
                        {formatDateTime(event.date)}
                      </td>

                      <td>{event.ticketsSold}</td>

                      <td>{event.availableSeats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="state-block">
              <h3>אין אירועים קרובים</h3>

              <p>
                כרגע אין אירועים פעילים בעתיד.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}