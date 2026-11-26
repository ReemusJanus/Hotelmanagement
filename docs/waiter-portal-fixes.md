# Waiter portal fixes — staging, 10 November 2026

Deployed to https://stg.hms.byteberrytech.com. Production was not modified.

## Root causes and changes

1. Confirmed reservations blocked ordering but had no transactional seating transition. Added a reservation detail/check-in panel and tenant-scoped check-in API. Table-first row locks serialize seating, cancellation and order creation. The order retains its booking ID and authenticated waiter identity. Duplicate check-ins are idempotent; concurrent orders cannot claim the same table. Reserved tables remain protected from walk-ins. Completed historical reservations no longer block later bookings.
2. The shared waiter main area did not stretch its content to the viewport. It now uses a flex column with flexible content and a normal-flow footer. A mobile calendar width issue discovered during verification was also corrected. No fixed or absolute footer positioning.
3. Amount elements inherited decorative typography. Monetary elements now use the existing sans-serif font and tabular numerals; printable receipts use sans-serif as well. Currency calculations, taxes and rounding remain unchanged.

## Approved reservation policy

Default early check-in allowance is zero minutes. Check-in is allowed during the reservation's existing time period, ending at its end time. No automatic no-show cancellation. Optional `settings.reservation_early_minutes` accepts 0–120 minutes; no new settings UI was introduced. Cancellation remains admin-only and only for confirmed reservations. Waiters do not receive a new cancel/no-show permission.

After payment, tables enter the existing cleaning workflow. On release, applicable reservations restore reserved status; otherwise the table becomes available. Reservation and order history are retained.

## Files

- `backend/src/reservations.js`: transactional check-in/cancellation helpers.
- `backend/src/controllers/tenant.controller.js`: booking metadata, conflicts, order association and safe table lifecycle.
- `backend/src/routes/portal.routes.js`: check-in endpoint.
- `backend/src/database.js`: reservation eligibility and active booking projections.
- `backend/src/schema.js`: idempotent additive schema migration.
- `backend/test/reservation-checkin.test.js`: real PostgreSQL lifecycle/concurrency tests.
- `frontend/src/App.jsx`: reservation panel, booking details, linked ordering, seated label and amount classes.
- `frontend/src/responsive.css`: shared waiter footer, responsive reservation panel and monetary typography.

## Database changes

Startup migration adds `settings.reservation_early_minutes`, `bookings.guest_count`, `bookings.notes`, `bookings.seated_at`, `bookings.seated_by`, `restaurant_tables.active_booking_id`, and `orders.booking_id`. Foreign keys preserve associations. A partial unique index permits only one non-completed order per booking. All six staging tenant/base schemas were verified to contain the seven fields. No temporary test schemas remain.

## Validation

- Backend and frontend production builds passed.
- Real PostgreSQL reservation suite: 13 passed, zero failures. Temporary schemas were used and removed. Covers metadata, overlapping/cross-midnight reservations, early/expired/cancelled rejection, cross-tenant and role rejection, concurrent check-in and order creation, cancellation races, kitchen/juicer completion, billing/payment, cleaning/release and history retention.
- Focused routing, order-edit lock, security and frontend API regression suites: 19 passed, zero failures.
- Chromium: 27 layout combinations (320/768/1440px × empty/few/many records × Overview/Tables/My Orders). Footer flow and document width checked.
- Reservation detail → check-in → linked order UI checked at all three widths.
- Daily order cards, ₹1,250 formatting and print-media amount typography checked at all widths with few/many records.
- Staging backend HTTPS health and Nginx configuration passed. Frontend checks use the deployed assets with intercepted synthetic API responses; real hotel orders were not created for testing.

No physical iOS/Android device testing was performed. The tests above are focused regression coverage, not a full application security or launch-readiness audit. Existing build chunk-size and dependency-audit warnings remain outside this change.

## Backup and rollback

Before deployment, a validated custom-format PostgreSQL dump, previous backend bundle, frontend archive and Nginx configuration were saved under `/var/backups/hotel-management/waiter-fixes-20261110/` on staging. Backend activation included a health check and code rollback on failure. Nginx configuration and existing media routing were preserved. Schema additions are backward compatible; rolling application code back does not require dropping reservation history.

Screenshots and test output are in `docs/waiter-portal-fixes/`.
