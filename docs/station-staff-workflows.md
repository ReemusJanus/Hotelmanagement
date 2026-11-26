# Juicer workflow and Chef staff approvals

Implemented locally and deployed to https://stg.hms.byteberrytech.com. Final verification: 11 November 2026 (Asia/Kolkata). Production was not modified.

## Juicer root cause and fix

The Juicer UI did not provide a collection callback. Backend handoff accepted only the Chef role and updated every item in a round. Station ticket handoff displays also used all round items rather than station-specific items. The legacy whole-order endpoint updated order status without item handoffs.

`production-workflow.js` now validates and locks the order and relevant item records in a transaction. Preparation progresses from new to preparing to ready; collection changes the existing item `handoff_status` to collected. Kitchen and Juicer actions select only their assigned items using configured category routing. Optional item selection supports independent progress within a station. The legacy endpoint now uses the same validated item workflow.

No preparation schema migration was needed. Collected drinks remain collected after reload, appear in Preparation History, and leave the active queue. The waiter sees per-item collection status and separately confirms table receipt. Collection never finalizes billing. Parcel collection preserves Admin customer handoff/payment. Duplicate collection is idempotent and emits no duplicate event. Terminal orders are protected. An additional ordering round after table receipt resets operational preparation status while preserving previous item handoffs.

## Staff behavior and approval

Previously, Chef-created kitchen employees and Juicer accounts became active immediately; chefs could edit activation. Employee records had no portal account and the system assumed one Chef login.

Chef submissions now become inactive pending requests. The authenticated creator, not client-provided text, is recorded. Admin Staff Management shows requests and a pending count; chefs see their own requests. Only the hotel's active Admin can approve or reject. Rejection supports an optional reason and retains the record. Approved legacy staff remain approved and retain their original active/inactive state.

Per the user's explicit clarification, approving a new kitchen request atomically creates one linked Chef login and activates the employee. The Admin retrieves its PIN in Staff Accounts; approval responses and notifications do not contain PINs. Multiple Chef accounts are supported. Disabling/deleting linked employees disables their accounts; account edits also synchronize employment activation. Existing kitchen employees are not automatically assigned new credentials. Admin-created kitchen employee records preserve their previous behavior; new Chef-request approvals receive accounts.

Chef-created Juicer accounts remain inactive until approval. Database constraints prevent pending/rejected accounts from being active. Portal requests require an active approved tenant account, and the central login index is synchronized after approval and linked employment changes. Pending kitchen requests have no login account at all. Rejected requests cannot authenticate or be activated via generic edit APIs.

## Additive schema changes

`users` and `kitchen_staff` gain approval_status (approved by default for existing records), requested_by, reviewed_by, reviewed_at, rejection_reason and an inactive-unless-approved constraint. Kitchen employee deletion is soft deletion. `kitchen_staff.user_id` is a unique nullable foreign key linking an approved employee to its Chef account. No existing records were deleted or retroactively marked pending.

## Main files

- backend/src/production-workflow.js — station preparation/collection state transitions.
- backend/src/staff-approval.js — verified actors, request listing, atomic approval/rejection and Chef account creation.
- backend/src/controllers/tenant.controller.js — safe staff creation/edit/deletion, projections, linked account lifecycle, additional ordering rounds.
- backend/src/schema.js and backend/src/database.js — additive schema and state fields.
- backend/src/routes/portal.routes.js — review endpoint, approved-session check and mutation handling.
- backend/src/master-server.js — login-index synchronization and duplicate broadcast suppression.
- frontend/src/App.jsx — station item actions/history, waiter status, approval panels, notifications and multiple Chef account controls.
- frontend/src/responsive.css — approval layout and narrow-screen station controls.
- backend/test/station-staff.test.js — database integration tests.
- backend/test/reservation-checkin.test.js and production-routing.test.js — updated regression expectations for independent station handoff and explicit preparation steps.

## Validation

- Backend and frontend production builds passed.
- 26 PostgreSQL test results passed (station/staff suite plus reservation suite), zero failures. Temporary schemas only; removed afterward.
- 19 focused routing, edit-lock, security and API regression tests passed.
- Chromium browser workflow checks passed at 320, 768 and 1440 pixels: Juicer preparation/collection, history after reload, mixed-order waiter status, Chef request submission and Admin approval/rejection. These browser interactions use synthetic API fixtures and also passed against the deployed staging assets.
- Live deployed HTTP/WebSocket smoke test passed with a temporary tenant: station separation, refresh persistence, duplicate-event suppression, cross-hotel event isolation, role rejection, staff approval/rejection, linked Chef access and central login-index synchronization. All temporary tenant, order, staff and index records were removed.
- Nginx configuration and backend HTTPS health passed; Redis realtime is ready.

Physical iOS/Android devices and the separate React Native client were not tested or rebuilt. Existing dependency-audit and large-bundle build warnings remain; this is not a full application security audit. Preparation History uses the existing order-history retention window.

## Deployment safety

Backup: `/var/backups/hotel-management/station-staff-20261110/` on staging. Contains validated PostgreSQL dump, prior backend, frontend archive and Nginx configuration. Backend activation included health checks and rollback on startup failure. Nginx and existing media routing were preserved.

Do not roll back to the old application while new pending requests exist without a compatible rollback plan: old staff-edit endpoints did not enforce this approval policy. Database constraints remain in place to prevent activation bypass.

Screenshots and test logs are in `docs/station-staff-workflows/`.
