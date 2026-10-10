# UX problems and architecture risks

Discovery snapshot: 7 October 2026. **Source analysis, not live acceptance testing.** Application source was not modified. `IMPLEMENTED` means a source-backed implementation exists, not that production behavior was verified.

Severity reflects operational impact inferred from source. No usability sessions were conducted. CRITICAL is reserved for demonstrated system-wide catastrophic impact; no such severity is asserted from this static review. Recommendations below are not implemented.

## UX-01 — Booking cannot progress to seated service

| Aspect | Finding |
| --- | --- |
| severity | HIGH |
| affectedScreen | Bookings, Waiter table order |
| affectedUsers | Roles using affected screens |
| why | Confirmed interval locks order creation; seated status has no reachable transition. |
| recommendation | Design an explicit booking arrival/seating handoff after product/backend decision; not an existing feature. |

Evidence: [backend/src/server.js:86](../../backend/src/server.js#L86); [frontend/src/App.jsx:4979](../../frontend/src/App.jsx#L4979)

## UX-02 — Activation implies a verified payment

| Aspect | Finding |
| --- | --- |
| severity | HIGH |
| affectedScreen | Applicant onboarding |
| affectedUsers | Roles using affected screens |
| why | A text reference is accepted without a verified gateway result. |
| recommendation | Distinguish recording a reference from payment verification and activation policy. |

Evidence: [frontend/src/App.jsx:382](../../frontend/src/App.jsx#L382); [backend/src/master-server.js:1](../../backend/src/master-server.js#L1)

## UX-03 — UI module visibility is not complete authorization

| Aspect | Finding |
| --- | --- |
| severity | HIGH |
| affectedScreen | Shell and native tabs |
| affectedUsers | Roles using affected screens |
| why | Some order/parcel paths lack module mapping; role API settings/report/upload guards differ from UI. |
| recommendation | Align backend permissions before treating hidden navigation as access control. |

Evidence: [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044); [backend/src/server.js:1](../../backend/src/server.js#L1); [backend/src/master-server.js:1](../../backend/src/master-server.js#L1); [mobile/App.js:43](../../mobile/App.js#L43)

## UX-04 — Financial information and credentials have broad exposure

| Aspect | Finding |
| --- | --- |
| severity | HIGH |
| affectedScreen | State and company user screens |
| affectedUsers | Roles using affected screens |
| why | Shared state includes finance data; master user views expose PINs. |
| recommendation | Define least-privilege data and credential presentation with engineering. |

Evidence: [backend/src/database.js:1](../../backend/src/database.js#L1); [frontend/src/App.jsx:713](../../frontend/src/App.jsx#L713); [mobile/App.js:45](../../mobile/App.js#L45)

## UX-05 — Settings imply inactive billing charges

| Aspect | Finding |
| --- | --- |
| severity | HIGH |
| affectedScreen | Native Settings and bills |
| affectedUsers | Roles using affected screens |
| why | Charge fields are editable while server bill tax/service totals are zero; web hides fields. |
| recommendation | Use one agreed billing policy and show only operative settings. |

Evidence: [mobile/AdminModules.js:110](../../mobile/AdminModules.js#L110); [frontend/src/App.jsx:4815](../../frontend/src/App.jsx#L4815); [backend/src/server.js:1](../../backend/src/server.js#L1)

## UX-06 — Calendar implies a complete history

| Aspect | Finding |
| --- | --- |
| severity | HIGH |
| affectedScreen | Orders, Finance, Bookings |
| affectedUsers | Roles using affected screens |
| why | State feed bounds orders and filters bookings; old/cancelled data can appear empty. |
| recommendation | Show retention and loading scope; design server-backed history before promising it. |

Evidence: [backend/src/database.js:1](../../backend/src/database.js#L1); [frontend/src/App.jsx:1822](../../frontend/src/App.jsx#L1822); [frontend/src/App.jsx:4979](../../frontend/src/App.jsx#L4979)

## UX-07 — My Orders is attributed by name

| Aspect | Finding |
| --- | --- |
| severity | HIGH |
| affectedScreen | Waiter overview/orders |
| affectedUsers | Roles using affected screens |
| why | First-name matching can merge users or omit mobile-created Mobile Waiter orders. |
| recommendation | Use stable staff attribution; show current ownership criteria until fixed. |

Evidence: [frontend/src/App.jsx:4874](../../frontend/src/App.jsx#L4874); [frontend/src/App.jsx:5033](../../frontend/src/App.jsx#L5033); [mobile/App.js:66](../../mobile/App.js#L66)

## UX-08 — Web attendance is unreachable

| Aspect | Finding |
| --- | --- |
| severity | MEDIUM |
| affectedScreen | Waiter/Chef/Juicer navigation |
| affectedUsers | Roles using affected screens |
| why | A full attendance component exists but sidebar entries are disabled. |
| recommendation | Decide parity and add a deliberate staff entry in future design. |

Evidence: [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/AttendancePanel.jsx:5](../../frontend/src/AttendancePanel.jsx#L5)

## UX-09 — Global search and bell are decorative

| Aspect | Finding |
| --- | --- |
| severity | MEDIUM |
| affectedScreen | Web Shell |
| affectedUsers | Roles using affected screens |
| why | No interaction handler implements search or notification inbox. |
| recommendation | Remove affordance from current-state prototypes or clearly scope future implementation. |

Evidence: [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044)

## UX-10 — Native and web login paths differ

| Aspect | Finding |
| --- | --- |
| severity | MEDIUM |
| affectedScreen | Native Login |
| affectedUsers | Roles using affected screens |
| why | Native requires Hotel ID and six-digit PIN; master/applicant flows differ. |
| recommendation | Design explicit supported identity paths and recovery states. |

Evidence: [mobile/App.js:36](../../mobile/App.js#L36); [frontend/src/App.jsx:274](../../frontend/src/App.jsx#L274)

## UX-11 — Ready Juices uses kitchen permission

| Aspect | Finding |
| --- | --- |
| severity | MEDIUM |
| affectedScreen | Juicer sidebar |
| affectedUsers | Roles using affected screens |
| why | The shared ready key maps to kitchen. |
| recommendation | Use role-aware feature gating and explicit denied/disabled states. |

Evidence: [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044)

## UX-12 — Authenticated navigation has no deep links

| Aspect | Finding |
| --- | --- |
| severity | MEDIUM |
| affectedScreen | All portals |
| affectedUsers | Roles using affected screens |
| why | Reload/back/history cannot reliably restore selected screen, date or company. |
| recommendation | Define route/state persistence in future IA; do not document invented URLs as current. |

Evidence: [frontend/src/App.jsx:275](../../frontend/src/App.jsx#L275); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044); [mobile/App.js:43](../../mobile/App.js#L43)

## UX-13 — Navigation labels/grouping diverge

| Aspect | Finding |
| --- | --- |
| severity | MEDIUM |
| affectedScreen | Admin and Chef portals |
| affectedUsers | Roles using affected screens |
| why | Ten flat web links, grouped mobile drawer; Chef Management vs native Juicer. |
| recommendation | Group by daily operations, resources and administration with task-consistent labels. |

Evidence: [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [mobile/PremiumDashboard.js:1](../../mobile/PremiumDashboard.js#L1)

## UX-14 — Sent message is not verified delivery

| Aspect | Finding |
| --- | --- |
| severity | MEDIUM |
| affectedScreen | Registration and bookings |
| affectedUsers | Roles using affected screens |
| why | Queued notification can be presented as sent; no durable dispatch worker verified. |
| recommendation | Represent queued, sent and failed separately with truthful feedback. |

Evidence: [frontend/src/App.jsx:375](../../frontend/src/App.jsx#L375); [backend/src/server.js:62](../../backend/src/server.js#L62); [backend/src/master-server.js:1](../../backend/src/master-server.js#L1)

## UX-15 — Technical database names surface in company navigation

| Aspect | Finding |
| --- | --- |
| severity | MEDIUM |
| affectedScreen | Master selected company |
| affectedUsers | Roles using affected screens |
| why | Infrastructure identifiers compete with business identity. |
| recommendation | Put diagnostics behind support details; keep company identity primary. |

Evidence: [frontend/src/App.jsx:392](../../frontend/src/App.jsx#L392)

## UX-16 — Stock forecasting can be mistaken for automated purchasing

| Aspect | Finding |
| --- | --- |
| severity | MEDIUM |
| affectedScreen | Stock planning |
| affectedUsers | Roles using affected screens |
| why | Forecast uses recorded usage/waste and minimum thresholds; request resolution is separate. |
| recommendation | Show calculation basis, coverage and manual next actions. |

Evidence: [frontend/src/App.jsx:2739](../../frontend/src/App.jsx#L2739)

## UX-17 — Dormant alternate screens confuse maintenance

| Aspect | Finding |
| --- | --- |
| severity | LOW |
| affectedScreen | Legacy/unused components |
| affectedUsers | Roles using affected screens |
| why | Old Finance, Staff, FoodManager and native alternatives are not current navigation. |
| recommendation | Exclude dormant views from current redesign scope unless deliberately reactivated. |

Evidence: [frontend/src/App.jsx:1830](../../frontend/src/App.jsx#L1830); [frontend/src/App.jsx:3238](../../frontend/src/App.jsx#L3238); [frontend/src/App.jsx:4398](../../frontend/src/App.jsx#L4398); [mobile/App.js:50](../../mobile/App.js#L50)

## Feedback and destructive actions

Web uses local notice/error state and browser confirmations; native uses Alert dialogs and inline loading/saving state. Booking cancellation and destructive table/purchase/staff actions have confirmation paths; company deletion uses typed company-name confirmation. There is no uniform undo model. Do not infer that every DELETE has the same confirmation: use the per-screen handlers/action catalogue. Some profile-load errors are swallowed in favor of existing identity. The header bell is not an inbox.

Evidence: [frontend/src/App.jsx:647](../../frontend/src/App.jsx#L647); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044); [frontend/src/App.jsx:4979](../../frontend/src/App.jsx#L4979); [frontend/src/App.jsx:3706](../../frontend/src/App.jsx#L3706); [mobile/App.js:54](../../mobile/App.js#L54)
