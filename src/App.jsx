import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import SessionExpiryModal from "./components/SessionExpiryModal";
import { ProtectedRoute, RoleRoute } from "./components/RouteGuards";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import EventDetail from "./pages/EventDetail";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminSeats from "./pages/admin/AdminSeats";
import AdminEventSeats from "./pages/admin/AdminEventSeats";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <SessionExpiryModal />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Home />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/events/:name" element={<EventDetail />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/my-orders" element={<MyOrders />} />

          <Route element={<RoleRoute roles={["Manager"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="events" replace />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="seats" element={<AdminSeats />} />
              <Route path="event-seats" element={<AdminEventSeats />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUserDetail />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
