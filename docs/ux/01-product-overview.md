# Product and technical overview

Discovery snapshot: 7 October 2026. **Source analysis, not live acceptance testing.** Application source was not modified. `IMPLEMENTED` means a source-backed implementation exists, not that production behavior was verified.

Multi-tenant restaurant operations with table service, parcels, inventory, finance, workforce and company subscriptions. Lodging PMS workflows were not found.

| Area | Finding |
| --- | --- |
| web | React 19, Vite 7, custom JSX/CSS, lucide icons, motion |
| mobile | Expo 57, React Native 0.86.3, StyleSheet, AsyncStorage; no Flutter |
| backend | Nest 11 bootstrap with Express route handlers, raw mysql2 queries |
| database | MariaDB; separate tenant databases and master registry; no ORM |
| authentication | PIN login and custom HMAC bearer sessions, 12-hour expiry; no JWT refresh/MFA found |
| state | React hooks plus browser session/local storage; native AsyncStorage; shared /state snapshots |
| infrastructure | Docker Compose, role APIs behind master routing, MariaDB, Redis and MinIO/S3 |
| realtime | WebSocket state invalidation and refresh, polling fallback in some clients |
| payments | Cash/Card-UPI recording and SaaS reference input; no verified payment gateway found |
| notifications | Local feedback plus outbound email/SMS/webhook code; delivery availability depends on configuration |

Evidence: [frontend/package.json:1](../../frontend/package.json#L1); [mobile/package.json:1](../../mobile/package.json#L1); [backend/package.json:1](../../backend/package.json#L1); [docker-compose.yml:1](../../docker-compose.yml#L1); [frontend/src/api.js:1](../../frontend/src/api.js#L1); [backend/src/database.js:1](../../backend/src/database.js#L1); [backend/src/master-server.js:1](../../backend/src/master-server.js#L1)

## Scope and terminology

A table is a restaurant service location. A booking reserves a table for a timed interval. An order contains production/handoff items and a bill. Employee check-in/out records attendance. None of these proves a hotel room, guest stay or housekeeping module.

| Feature | Status |
| --- | --- |
| Hotel rooms | NOT_FOUND |
| Room types | NOT_FOUND |
| Room rates | NOT_FOUND |
| Stay reservations | NOT_FOUND |
| Guest profiles/CRM | NOT_FOUND |
| Guest identification documents | NOT_FOUND |
| Guest check-in/check-out | NOT_FOUND |
| Room housekeeping | NOT_FOUND |
| Maintenance tasks | NOT_FOUND |
| Amenities | NOT_FOUND |
| Refund workflow | NOT_FOUND |
| Verified payment gateway | NOT_FOUND |
| Global search results | NOT_FOUND |
| Notification inbox | NOT_FOUND |
| Authenticated screen deep links | NOT_FOUND |


## Implementation labels

IMPLEMENTED: source-backed UI/API/data path. PARTIALLY_IMPLEMENTED: meaningful path with missing stages/parity. FRONTEND_ONLY: client-only or dormant view. BACKEND_ONLY: server capability without a verified entry. PLACEHOLDER: visual affordance without behavior. NOT_FOUND: searched but absent. UNCLEAR: evidence insufficient.

## Repository coverage

Active React web, native Expo app, root legacy browser app, API clients, backend role/master handlers, runtime schemas/seeds, storage/report/notification helpers, Docker configuration and dependency manifests were inspected. Generated builds, installed packages and duplicated generated documentation were not treated as authored functionality. The prior API/schema inventory was reused only after verifying unchanged source hashes.

Root `index.html`/`app.js` is a separate localStorage prototype (FRONTEND_ONLY), not the deployed React portal. Its dashboard, tables, billing, inventory, orders, reports and admin views must not be merged into the current sitemap.

Evidence: [app.js:1](../../app.js#L1); [index.html:1](../../index.html#L1)

## Report and export catalogue

| Report | Audience | Metrics | Dimensions/filter | Visualization/export | Data/limitation | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Daily finance CSV | Admin | Bill revenue, other income, general expenses, dealer payments, net cash | Selected date; bills by type/customer/payment/completion; ledger by category/reference; Selected finance day | Closing KPIs, paid bill and ledger tables; CSV browser download | Loaded orders, financeEntries, supplierPayments; filtered by completion/entry/payment date; State retention limits apply; not independently queried report history | [frontend/src/App.jsx:3785](../../frontend/src/App.jsx#L3785) |
| Monthly revenue CSV | Admin | Revenue, paid bill count, average bill, expenses + dealer outflow, net cash | Day in selected month and payment method; Finance calendar month | Daily revenue bars and payment mix; CSV browser download | Paid orders by completedAt; finance entries by entryDate; supplier payments by paymentDate; Bars have titles but no drill-down handler; loaded-state retention can omit earlier data | [frontend/src/App.jsx:3678](../../frontend/src/App.jsx#L3678) |
| 30-day finance analytics | Admin | Period income/outflow and operational financial summaries | Trailing days relative to selected finance date; Analytics tab and selected day, no independent custom range found | Finance analytic summaries/charts; No distinct analytics export identified; daily/monthly exports separate | Loaded finance/order/supplier state; Not a general report builder | [frontend/src/App.jsx:3706](../../frontend/src/App.jsx#L3706) |
| Bill receipt | Waiter/Admin | Item quantity/prices and payable total | Selected order/table or parcel; Order context | Receipt line items and totals; Browser print | Order/menu/settings on client and server bill responses; Client current menu price calculations can differ from server snapshot prices; tax/service policy differs from editable native settings | [frontend/src/App.jsx:5595](../../frontend/src/App.jsx#L5595); [frontend/src/App.jsx:5597](../../frontend/src/App.jsx#L5597) |
| SaaS invoice overview | Superadmin | Module charges, subtotal, tax, total, paid/due | Company and billing month; Master billing controls / selected company | Invoice rows and aggregate cards; No verified dedicated invoice PDF export | Master saas_invoices and module_pricing; Restaurant billing and SaaS invoicing are different charge systems | [frontend/src/App.jsx:846](../../frontend/src/App.jsx#L846) |
| Stored report API | API client; UI reachability not established for every endpoint | Submitted report object/file metadata | Report storage key; API parameters | No standalone current reports destination; Storage-backed API response; not evidence of a Reports screen | Backend report/storage handlers; BACKEND_ONLY where no current UI caller is verified | [backend/src/server.js:1](../../backend/src/server.js#L1) |



## Final validation and limits

- Repeated source-file search covered web entry/components, native entry/admin/dashboard components, API clients, role/master controllers, runtime schema/seeds, storage/realtime, styling and infrastructure.
- Reconciled three public URL states with local navigation keys; authenticated screens are not routes.
- Accounted for 159 authored component functions: 109 significant views and 50 shared helpers/shells. Dormant screens are explicitly excluded from current design scope.
- Retained 76 API endpoint contracts and 25 runtime entities. Compared orphan components, schema-only booking seated state, backend-only attendance/report capabilities and placeholder header controls.
- Validated all 16 Markdown files plus JSON, required JSON keys, unique screen IDs, source link targets and balanced diagram/code fences.
- Verified SHA-256 hashes for all 61 baselined non-generated source/config files: unchanged. Existing working-tree changes were preserved.
- No browser/native/device tests or production/provider checks were performed. Static extraction cannot verify layout usability, accessibility, delivery, payment settlement or actual deployment health; these remain UNCLEAR. Dynamic expressions are retained as evidence rather than invented labels or server behavior.

