import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/admin/events", label: "אירועים" },
  { to: "/admin/seats", label: "מושבים" },
  { to: "/admin/event-seats", label: "שיוך מושבים" },
  { to: "/admin/orders", label: "הזמנות" },
  { to: "/admin/users", label: "משתמשים" },
];

export default function AdminLayout() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">ניהול מערכת</div>
          <h1>לוח בקרה</h1>
          <p>ניהול אירועים, מושבים, הזמנות ומשתמשים</p>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
