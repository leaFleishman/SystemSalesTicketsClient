import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

const ic = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const tabs = [
  {
    to: "/admin",
    label: "לוח בקרה",
    hint: "תמונת מצב של המערכת",
    end: true,
    icon: (
      <svg {...ic}>
        <rect x="3" y="3" width="7" height="9" rx="2" />
        <rect x="14" y="3" width="7" height="5" rx="2" />
        <rect x="14" y="12" width="7" height="9" rx="2" />
        <rect x="3" y="16" width="7" height="5" rx="2" />
      </svg>
    ),
  },
  {
    to: "/admin/events",
    label: "אירועים",
    hint: "הוספה, עריכה וביטול של אירועים",
    icon: (
      <svg {...ic}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    ),
  },
  {
    to: "/admin/seats",
    label: "מושבים",
    hint: "ניהול מאגר המושבים",
    icon: (
      <svg {...ic}>
        <path d="M5 11V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" />
        <path d="M3 13a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v6H3z" />
      </svg>
    ),
  },
  {
    to: "/admin/event-seats",
    label: "שיוך מושבים",
    hint: "שיוך מושבים לאירועים",
    icon: (
      <svg {...ic}>
        <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
        <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
      </svg>
    ),
  },
  {
    to: "/admin/orders",
    label: "הזמנות",
    hint: "כל ההזמנות במערכת",
    icon: (
      <svg {...ic}>
        <path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3z" />
        <path d="M14 6v12" strokeDasharray="2 3" />
      </svg>
    ),
  },
  {
    to: "/admin/users",
    label: "משתמשים",
    hint: "ניהול משתמשים והרשאות",
    icon: (
      <svg {...ic}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const current =
    [...tabs].reverse().find((t) => (t.end ? pathname === t.to : pathname.startsWith(t.to))) || tabs[0];

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-side-head">
          <div className="eyebrow">ניהול מערכת</div>
          <p>פאנל הניהול</p>
        </div>

        <nav className="admin-nav" aria-label="ניווט ניהול">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}
            >
              <span className="admin-nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>

        <Link to="/" className="admin-back">
          <svg {...ic} width="16" height="16">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          חזרה לאתר
        </Link>
      </aside>

      <section className="admin-main">
        <header className="admin-main-head">
          <h1>{current.label}</h1>
          <p>{current.hint}</p>
        </header>
        <Outlet />
      </section>
    </div>
  );
}
