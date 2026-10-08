import { useEffect, useState } from "react";
import * as dashboardApi from "../../api/dashboard";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import { formatDateTime, formatPrice } from "../../utils/format";

const ic = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS = {
  events: (
    <svg {...ic}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  ),
  tickets: (
    <svg {...ic}>
      <path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3z" />
      <path d="M14 6v12" strokeDasharray="2 3" />
    </svg>
  ),
  revenue: (
    <svg {...ic}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  ),
  seats: (
    <svg {...ic}>
      <path d="M5 11V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" />
      <path d="M3 13a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v6H3z" />
    </svg>
  ),
};

function StatCard({ label, value, icon, index }: { label: string; value: any; icon: any; index: number }) {
  return (
    <div className="dashboard-stat" style={{ animationDelay: `${index * 0.07}s` }}>
      <span className="dashboard-stat-icon">{icon}</span>
      <div className="dashboard-stat-label">{label}</div>
      <div className="dashboard-stat-value">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // silent = background refresh: no spinner (which would unmount the table
  // and kill the bar animation) and no error screen if it fails - the last
  // good data stays on screen.
  async function loadDashboard(silent = false) {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const result = await dashboardApi.getDashboard();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, "טעינת לוח הבקרה נכשלה."));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    // Poll every 15s while the tab is visible.
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") loadDashboard(true);
    }, 15000);

    // Refresh right away when the manager returns to the tab.
    const onVisible = () => {
      if (document.visibilityState === "visible") loadDashboard(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
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
          onClick={() => loadDashboard()}
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
          index={0}
          icon={ICONS.events}
          label="אירועים פעילים"
          value={data.activeEvents}
        />

        <StatCard
          index={1}
          icon={ICONS.tickets}
          label="כרטיסים שנמכרו"
          value={data.ticketsSold}
        />

        <StatCard
          index={2}
          icon={ICONS.revenue}
          label="הכנסות"
          value={formatPrice(data.revenue)}
        />

        <StatCard
          index={3}
          icon={ICONS.seats}
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
              {lastUpdated && ` · עודכן ב-${lastUpdated.toLocaleTimeString("he-IL")}`}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadDashboard()}
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
                    <th>תפוסה</th>
                    <th>נמכרו</th>
                    <th>פנויים</th>
                  </tr>
                </thead>

                <tbody>
                  {data.upcomingEvents.map((event) => {
                    const total = Number(event.ticketsSold) + Number(event.availableSeats);
                    const pct = total > 0 ? Math.round((Number(event.ticketsSold) / total) * 100) : 0;
                    return (
                    <tr key={event.id}>
                      <td>{event.name}</td>

                      <td>
                        {formatDateTime(event.date)}
                      </td>

                      <td>
                        <div className="fill-bar" title={`${pct}%`}>
                          <i style={{ width: `${pct}%` }} />
                          <span>{pct}%</span>
                        </div>
                      </td>

                      <td>{event.ticketsSold}</td>

                      <td>{event.availableSeats}</td>
                    </tr>
                    );
                  })}
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