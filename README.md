# כרטיסים — SystemSalesTickets client

A React + Vite single-page app for the `SystemSalesTickets` .NET API: browse
events, pick a seat and book it as a customer, or manage events / seats /
orders / users as a Manager. Hebrew, RTL, no UI framework — hand-written CSS
design system in `src/index.css`.

## Setup

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

### Running against the API

The backend has **no CORS policy configured**, so the browser can't call it
directly from `localhost:5173`. Instead of touching the C# code, this
project proxies `/api` and `/health` through the Vite dev server (see
`vite.config.js`) — same-origin as far as the browser is concerned.

1. Run the API (`dotnet run` in `SystemSalesTickets/`, default profile
   `http://localhost:5153`).
2. Just run `npm run dev` — no extra config needed.

If you use the `https` launch profile instead (`https://localhost:7171`),
copy `.env.example` to `.env` and set:

```
VITE_API_PROXY_TARGET=https://localhost:7171
```

For a real deployment (not the dev proxy), either enable CORS in
`Program.cs` and set `VITE_API_BASE` to the API's public URL, or serve the
built frontend from the same origin/reverse proxy as the API.

### Test accounts

Register a normal account from the app itself (`/register`). New accounts
get the `Guest` role. To reach the admin panel, promote an account to
`Manager` — the only way to do that from this API is to already have a
Manager account call "promote to manager" on the target user, so you'll
need to seed one Manager directly in the database (or via the API's
`PasswordGenerator`/seed data if the project has any) to get started.

## Known backend limitations this frontend works around

While wiring this up, a few gaps in the API surfaced. None are frontend
bugs — they're documented here (and inline, next to the relevant code) so
they're easy to find if the backend gets fixed later.

- **List endpoints strip out IDs.** `GET /api/Event`, `GET /api/Seat`,
  `GET /api/Order` and `GET /api/User` all return DTOs that omit the
  entity's `Id` (`EventDTO`, `SeatDTO`, `OrderDTO`, `UserDTO`), even though
  placing an order, deleting a seat, or looking up a user by ID all require
  that same `Id`. This app works around it by **inferring the ID from each
  item's position in the ascending list** (see `src/api/events.js`,
  `seats.js`, `orders.js`, `users.js` — all have a comment marked "Known
  backend quirk"). This matches the database's real primary-key order on a
  freshly seeded system, but it's a guess, not a guarantee. The seat picker
  on the booking page lets people see and correct the guessed seat number
  before submitting, and every write action that depends on an inferred ID
  is called out with a small in-app notice.
  **Recommended real fix:** add `Id` to `EventDTO`, `SeatDTO`, `OrderDTO`,
  and `UserDTO`.

- **No per-event seat availability.** There's no endpoint that returns
  "seats available for event X" — only a global seat list and a booking
  endpoint that fails with `409 Conflict` if the seat's already taken for
  that event. The booking page reflects this: seats aren't shown as
  booked/free up front, you find out when you try to book. A `GET
  /api/Event/{id}/seats` (or similar, returning `EventSeatDTO`) would fix
  this properly.

- **Regular users can't see their own past orders.** `GET /api/Order` and
  `GET /api/Order/{id}` are both `Manager`-only, and there's no
  "my orders" endpoint. This app shows a one-time order confirmation right
  after booking, but there's currently no way for a customer to look up a
  past order afterwards.

- **JWTs expire after 6 minutes with no refresh token.** This app shows a
  warning modal ~45 seconds before expiry and logs out automatically when
  the token dies, since the only recovery is a fresh login.

## Editing and cancelling events (Manager)

In **Admin → Events** each row has two actions, backed by `PUT /api/Event/{id}`
and `PUT /api/Event/{id}/cancel`:

- **עריכה** — edit name / date / price / number of seats. The server's
  rejections (cancelled or past event, seats below the tickets already
  ordered, duplicate name or date) are shown inside the dialog.
- **ביטול אירוע** — confirmation dialog with an optional reason (max 500
  chars). The result toast reports how many ticket holders were emailed.

Cancelled events show a "בוטל" badge in the admin table and on the public
list, and the event page shows the reason and blocks seat booking.
Cancelled or past events cannot be edited or cancelled again.

## Project structure

```
src/
  api/            thin wrappers around each controller (auth, events, seats, orders, users)
  components/     Navbar, route guards, pagination, spinner, toasts, session modal
  context/        AuthContext (JWT/session), ToastContext
  pages/          customer-facing pages
  pages/admin/    Manager-only admin panel (tabs: events / seats / orders / users)
  utils/          JWT decoding, date/currency/role formatting (he-IL)
```

## Roles

- **Guest / User** — can browse events and book a seat (the API doesn't
  currently distinguish Guest vs User in the controllers beyond `Manager`).
- **Manager** — everything above, plus the `/admin` panel: create events,
  create/delete seats, view all orders, view/promote users.
