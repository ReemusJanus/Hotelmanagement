# Waiter cancellation — local fix, 14 November 2026

**Not deployed.** Staging and production are unchanged.

## Root cause

Removing the final item returned HTTP 200 and cleared the table's order ID. The open TableDrawer remained in history mode and passed an undefined order to WaiterOrderRounds. Chrome reported `Cannot read properties of undefined (reading 'items')`; React emptied the application root. This was reproduced locally using the existing API response contract. The repository had item removal controls; an explicit whole-order Cancel Order action is now provided too.

## Fix

The drawer safely handles a missing order. Whole-order and item cancellations require confirmation, accept an optional reason, prevent duplicate submissions and show errors inline. Full cancellation returns to Tables; partial cancellation keeps the remaining order open.

The backend uses tenant-scoped transactions and verified active waiter/admin roles. It retains fully cancelled orders and snapshots partial removals with actor, time, reason, item names, quantities and prices. Only unstarted rounds can be cancelled. Paid, served, handed-off and closed orders are protected. Separate unstarted rounds remain editable while another round is preparing. Reservation tables retain their seated guest. Billing calculations, prices, invoice numbering and unrelated orders are unchanged.

The existing cache invalidation and live notifications update waiter, kitchen and juicer portals. Cancelled tickets cannot restart preparation and do not count as active orders or block new reservations.

## Files

- Frontend: `frontend/src/App.jsx`, `api.js`, `frontend/test/cancellation.browser.cjs`.
- Backend: new `backend/src/order-cancellation.js`; `controllers/tenant.controller.js`, `routes/portal.routes.js`, `schema.js`, `database.js`, `production-workflow.js`, `reservations.js`, `controllers/master.controller.js`.
- Native compatibility: `mobile/App.js` excludes cancelled production tickets; no device testing performed.
- Tests: `backend/test/order-cancellation.test.js`, `cancellation-live.test.js`, `fixtures/cancellation-loader.mjs`, `order-edit-lock.test.js`.

## Validation

Combined final suite: **45 passed, 0 failed, 8 unrelated opt-in integration tests skipped**. Cancellation database and live API tests were enabled. Tests cover create/cancel, last-item removal, partial cancellation, mixed-round preparation locks, paid/protected states, permissions, tenant boundaries, rollback, concurrent preparation, idempotency and reservation preservation.

Real local signed-login/API/WebSocket testing confirms cancellation delivery to waiter, chef and juicer clients. Object storage was stubbed and Redis disabled; real single-process WebSocket delivery was exercised. Remote logs and Redis fan-out were not tested.

Eleven Chrome scenarios passed: whole, last-item, partial, server rejection, network failure, invalid response, live refresh, phone, tablet, kitchen queue and juicer queue. No blank screens or uncaught render exceptions. Rapid double confirmation made one request. Frontend/backend build-only checks passed.

[Before](waiter-cancellation/before.png) · [After](waiter-cancellation/after.png) · [Browser results](waiter-cancellation/browser.log) · [API results](waiter-cancellation/live-api.log)

The existing tenant migration adds cancelled status/timestamp, an audit table/index and adjusts active-booking uniqueness. It must run before the new frontend is used. Only disposable local databases were modified. Old deleted items cannot be reconstructed. Staging acceptance remains pending because deployment was explicitly disabled.
