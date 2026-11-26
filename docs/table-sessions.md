# Independent dine-in groups

Implemented locally; not deployed. Each order ID is a customer/group session ID. Existing order items, preparation rounds, charges, discounts, payments and bills remain scoped to that order. No financial formulas or historical order IDs were changed.

## Files

- `backend/src/table-sessions.js`: group creation, idempotency, table locking and occupancy reconciliation.
- `backend/src/schema.js`: additive nullable `orders.guest_count` and unique nullable `orders.session_key` migration through existing tenant schema initialization.
- `backend/src/database.js`: group metadata in tenant state.
- `backend/src/routes/portal.routes.js`: waiter session creation endpoint.
- `backend/src/controllers/tenant.controller.js`: group identity validation, serialized billing and table release after the last group.
- `backend/src/order-cancellation.js`: cancel one group without releasing other active groups; empty groups can be cancelled.
- `frontend/src/App.jsx`: waiter/admin group selection, creation, ordering and payment labels; kitchen/juicer group identity.
- `frontend/src/ThermalReceipt.jsx`: group ID and guest count for new-group receipts.
- `frontend/src/responsive.css`: responsive group cards.
- `backend/test/table-sessions.test.js`, `backend/test/order-cancellation.test.js`: group regressions and isolated cancellation fixtures.
- `frontend/test/table-sessions.browser.cjs`: browser regression fixture.

## Compatibility and concurrency

Table `order_id` remains a representative active order for compatibility. All active groups are resolved by `orders.table_id`. Closing one group chooses the next active group. New-group tables become available only after all groups finish, subject to current reservations. Legacy single-order payment retains its existing cleaning transition. Seated reservations remain exclusive; they cannot be shared with unrelated groups.

Table mutations lock the table before the order. Item changes, bill requests and payment totals serialize against the order lock. A repeated create request uses the same request key, preventing duplicate sessions. Tenant routing and role authorization remain in the existing middleware.

## Validation

- 65 automated tests passed, seven unrelated optional suites skipped. PostgreSQL tests used disposable local schemas, including real HTTP role routes; no customer records were modified.
- T01: A (2 guests) pays 100; B (3 guests) remains occupied, adds food, then pays 200. Distinct bill numbers, original paid totals and final table availability verified.
- Concurrent group creation and payment, duplicate retries, empty-session cancellation, invalid guests/roles, mismatched group/table IDs, reservation locks and existing paid-bill preservation verified.
- Existing cancellation, reservation, kitchen/juicer and signed-login/WebSocket regressions passed.
- Six Chromium browser checks passed: group creation/selection and Admin payment on desktop 1440x900, phone 390x844 and tablet 820x1180. Browser checks use fixture API responses; real PostgreSQL/API behavior is covered separately.
- Frontend and backend isolated build-only checks passed. Existing frontend chunk-size warning remains.
- No physical-device, native-app or staging deployment testing claimed. This change targets the web Waiter/Admin portals; the separate native application's group-selection UI is not changed.

Run backend tests with a disposable PostgreSQL database configured via DB_HOST, DB_PORT, DB_USER and DB_PASSWORD:

```sh
PG_GROUP_TEST=1 PG_RESERVATION_TEST=1 PG_CANCELLATION_TEST=1 PG_CANCELLATION_LIVE_TEST=1 node --test --test-concurrency=1 backend/test/*.test.js frontend/test/*.test.mjs
```

Run browser checks from repository root against the built frontend using TEST_URL, PLAYWRIGHT_MODULE and CHROME_PATH as needed:

```sh
node frontend/test/table-sessions.browser.cjs
```

Test files run sequentially because existing schema initialization has shared PostgreSQL DDL setup; concurrency within each workflow test remains enabled.
