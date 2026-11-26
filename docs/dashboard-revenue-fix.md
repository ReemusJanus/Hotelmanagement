# Dashboard revenue accuracy fix — 9 November 2026

## Root cause and evidence
The web AdminOverview displayed `money(revenue || 28460)`, a literal `12.4%` growth note, and `[52,69,45,77,62,91,83]` chart heights. Its revenue variable summed any non-zero order total across available history, regardless of status or business date. This explains the reported new-company values; they were sample presentation data, not evidence of another tenant's sales being returned.

A read-only transaction against staging confirmed company **Knockout** had **0 orders**, **0 inventory rows** and **0 completed/paid sales today** in Asia/Kolkata. No customer or financial rows were altered.

## Widget audit
| Widget | Previous source/problem | Corrected source |
|---|---|---|
| Today's revenue | Undated client order sum, with 28460 fallback | Tenant database SUM of completed, paid orders by completion day |
| Growth | Literal 12.4% | Today/yesterday aggregate; zero denominator handled explicitly |
| Seven-day chart | Literal bar heights and weekday labels | Seven business dates including zero dates |
| Occupied tables | Tenant state; count already scoped | Tenant database counts active tables with occupied status |
| Active orders | Negative status filter, excluded served | Explicit active lifecycle allowlist, including served awaiting billing |
| Low stock | Tenant inventory; new-company provisioning could copy zero-quantity stock | Actual tenant inventory quantity <= threshold; no automatic stock copy for new companies |
| Live operations | Counted reserved/cleaning as occupied; divided by zero | Occupied / total active tables, 0% when total is zero |
| Live orders | First six orders regardless of status | Only active tenant orders; explicit empty state |

## Revenue and timezone rules
`backend/src/dashboard.js` uses the existing tenant-scoped PostgreSQL pool/search_path. The query joins each of seven local calendar dates to orders with `status='completed' AND payment_status='paid'`, using inclusive local midnight and exclusive next midnight on `completed_at`. It sums persisted finalized order totals once, without joining payment/invoice rows. Date boundaries use PostgreSQL time-zone conversion, including DST.

An optional `settings.timezone` IANA identifier is editable in Business & Billing. NULL/empty preserves the configured database session timezone (`DB_TIMEZONE`, existing default Asia/Kolkata). Currency formatting uses settings.currency. The business day remains midnight-to-midnight; no custom rollover-hour setting existed.

Growth is `(today-yesterday)/yesterday*100`. No previous revenue and positive current revenue displays “New sales”; both zero displays “No previous sales”; zero today with positive yesterday gives -100%.

The existing order schema has no cancelled/voided/refunded states, refund ledger or partial-refund workflow. The allowlist excludes other statuses if introduced, but this change does not implement net-refund accounting. Synthetic tests relax constraints only in disposable test schemas to verify excluded states. Existing payment and bill-number calculations are unchanged.

## Isolation and state
The existing main server validates the signed session and maps it to a tenant. Tenant context and state-cache keys now explicitly require the verified session companyDatabase; header-only fallback is removed. Cache entries remain tenant-keyed and successful mutations invalidate them. Financial dashboard output is removed for non-admin roles.

Frontend login/logout invalidates outstanding requests, clears prior data, and checks the returned tenant identity before accepting a response. Responses from older requests/account sessions are ignored. Initial failures show an error and Retry; refresh failures label retained data as the last successful update. WebSocket events and the existing polling fallback trigger refresh.

## Files and migration
Frontend: `frontend/src/App.jsx`, `frontend/src/responsive.css`.
Backend: `backend/src/dashboard.js`, `backend/src/controllers/tenant.controller.js`, `backend/src/controllers/master.controller.js`, `backend/src/middleware/tenant.js`, `backend/src/database.js`, `backend/src/schema.js`.
Tests: `backend/test/dashboard.test.js`.
Migration: `migrations/staging/04-dashboard-timezone.sql` (additive, no new tables).

New-company provisioning retains its existing menu template behavior but no longer copies inventory from the default company. Existing inventory/financial records are untouched. The explicitly labelled public landing-page sample chart is not an authenticated dashboard and is unchanged.

## Verification
- Ten focused PostgreSQL/controller/multipart/regression tests passed with no skips: revenue, zero data, boundaries, growth, tenant/cache isolation, paid/unpaid states, unsupported states, empty tables/inventory, logos, bill numbering and preparation edit locks.
- Browser fixture checks passed at 390, 768 and 1440 px: zero values and zero-height bars, initial failure/retry, live revenue update, stale-data failure notice, refresh, logout/login into another company, no runtime errors or horizontal overflow.
- Frontend production build and backend bundle verified using isolated build scripts.
- Staging totals were inspected read-only. Browser tests used synthetic API responses; no test orders were written to staging.

Not deployed yet. Back up, apply the additive timezone migration (or allow normal schema initialization), deploy backend before frontend, then smoke-test authenticated staging accounts. Existing release-readiness concerns unrelated to this fix remain separate. The native Expo dashboard is a different implementation and is not changed by this web dashboard fix.
