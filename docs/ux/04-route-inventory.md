# Route inventory and reachability

Discovery snapshot: 7 October 2026. **Source analysis, not live acceptance testing.** Application source was not modified. `IMPLEMENTED` means a source-backed implementation exists, not that production behavior was verified.

| URL | Page/component | Authentication | Role/permission | Parameters/children | Evidence |
| --- | --- | --- | --- | --- | --- |
| / | Landing / authenticated role workspace — PublicLanding / CompanyApp | Public; / also hosts authenticated workspace | anonymous, admin, waiter, chef, juicer, superadmin, applicant; none for public entry | None | [frontend/src/App.jsx:275](../../frontend/src/App.jsx#L275); [frontend/src/App.jsx:316](../../frontend/src/App.jsx#L316) |
| /login | Login — Login | Public; / also hosts authenticated workspace | anonymous; none for public entry | None | [frontend/src/App.jsx:275](../../frontend/src/App.jsx#L275); [frontend/src/App.jsx:316](../../frontend/src/App.jsx#L316) |
| /register | Registration — PublicCompanyRegistration | Public; / also hosts authenticated workspace | anonymous; none for public entry | None | [frontend/src/App.jsx:275](../../frontend/src/App.jsx#L275); [frontend/src/App.jsx:316](../../frontend/src/App.jsx#L316) |

Unknown signed-out paths fall back to landing. `VITE_PORTAL_ROLE=superadmin` mounts the master application directly. Successful login replaces the URL with `/`. Internal page keys, selected company IDs, calendar dates and editor IDs are state, not route parameters. Mobile uses local tab/modal state; a configured URI scheme does not establish screen deep links.

## Internal destinations (not URLs)

| Platform | Role/parent | State key | Visible label | Permission |
| --- | --- | --- | --- | --- |
| web | admin sidebar | overview | Overview | none |
| web | admin sidebar | tables | Tables | tables |
| web | admin sidebar | bookings | Table Bookings | bookings |
| web | admin sidebar | orders | Orders & Billing | billing |
| web | admin sidebar | parcels | Parcel Orders | parcels |
| web | admin sidebar | menu | Food & Photos | menu |
| web | admin sidebar | stock | Stock Management | stock |
| web | admin sidebar | finance | Finance Management | finance |
| web | admin sidebar | staff | Staff | staff |
| web | admin sidebar | settings | Settings | none |
| web | waiter sidebar | overview | Overview | none |
| web | waiter sidebar | floor | Tables | tables |
| web | waiter sidebar | orders | My Orders | billing |
| web | chef sidebar | overview | Overview | none |
| web | chef sidebar | team | Chef Management | staff |
| web | chef sidebar | stock-booking | Book Kitchen Stock | stock |
| web | chef sidebar | dishes | Dishes | menu |
| web | chef sidebar | kitchen | Table Orders | kitchen |
| web | chef sidebar | parcels | Parcel Queue | parcels |
| web | chef sidebar | ready | Ready to Serve | kitchen |
| web | juicer sidebar | overview | Overview | none |
| web | juicer sidebar | juices | Juices | juicer |
| web | juicer sidebar | queue | Table Orders | juicer |
| web | juicer sidebar | parcel-queue | Parcel Queue | juicer |
| web | juicer sidebar | ready | Ready Juices | kitchen |
| mobile | admin drawer/tabs | overview | Overview | Native module map (incomplete for staff keys) |
| mobile | admin drawer/tabs | tables | Tables | Native module map (incomplete for staff keys) |
| mobile | admin drawer/tabs | bookings | Table Bookings | Native module map (incomplete for staff keys) |
| mobile | admin drawer/tabs | orders | Orders & Billing | Native module map (incomplete for staff keys) |
| mobile | admin drawer/tabs | parcels | Parcel Orders | Native module map (incomplete for staff keys) |
| mobile | admin drawer/tabs | menu | Food & Photos | Native module map (incomplete for staff keys) |
| mobile | admin drawer/tabs | stock | Stock Management | Native module map (incomplete for staff keys) |
| mobile | admin drawer/tabs | finance | Finance Management | Native module map (incomplete for staff keys) |
| mobile | admin drawer/tabs | staff | Staff | Native module map (incomplete for staff keys) |
| mobile | admin drawer/tabs | settings | Settings | Native module map (incomplete for staff keys) |
| mobile | waiter drawer/tabs | attendance | Attendance | Native module map (incomplete for staff keys) |
| mobile | waiter drawer/tabs | tables | Tables | Native module map (incomplete for staff keys) |
| mobile | waiter drawer/tabs | orders | Orders | Native module map (incomplete for staff keys) |
| mobile | chef drawer/tabs | attendance | Attendance | Native module map (incomplete for staff keys) |
| mobile | chef drawer/tabs | team | Juicer | Native module map (incomplete for staff keys) |
| mobile | chef drawer/tabs | dishes | Dishes | Native module map (incomplete for staff keys) |
| mobile | chef drawer/tabs | kitchen | Dine-in | Native module map (incomplete for staff keys) |
| mobile | chef drawer/tabs | parcels | Parcels | Native module map (incomplete for staff keys) |
| mobile | juicer drawer/tabs | attendance | Attendance | Native module map (incomplete for staff keys) |
| mobile | juicer drawer/tabs | juices | Juices | Native module map (incomplete for staff keys) |
| mobile | juicer drawer/tabs | queue | Queue | Native module map (incomplete for staff keys) |
| mobile | juicer drawer/tabs | ready | Ready | Native module map (incomplete for staff keys) |

## Orphan and backend reconciliation

| Component | Classification | Source |
| --- | --- | --- |
| CompanyRegistration | Dormant/unlinked; do not design as a current destination | [frontend/src/App.jsx:912](../../frontend/src/App.jsx#L912) |
| FoodManager | Dormant/unlinked; do not design as a current destination | [frontend/src/App.jsx:1830](../../frontend/src/App.jsx#L1830) |
| Finance | Dormant/unlinked; do not design as a current destination | [frontend/src/App.jsx:3238](../../frontend/src/App.jsx#L3238) |
| Staff | Dormant/unlinked; do not design as a current destination | [frontend/src/App.jsx:4398](../../frontend/src/App.jsx#L4398) |
| AttendancePanel | Dormant/unlinked; do not design as a current destination | [frontend/src/AttendancePanel.jsx:5](../../frontend/src/AttendancePanel.jsx#L5) |
| RoleSelect | Dormant/unlinked; do not design as a current destination | [mobile/App.js:35](../../mobile/App.js#L35) |
| AdminOverview | Dormant/unlinked; do not design as a current destination | [mobile/App.js:50](../../mobile/App.js#L50) |
| AdminMenu | Dormant/unlinked; do not design as a current destination | [mobile/App.js:57](../../mobile/App.js#L57) |
| AdminStaff | Dormant/unlinked; do not design as a current destination | [mobile/App.js:58](../../mobile/App.js#L58) |

The root legacy app has local view keys, not modern portal routes. `/api/...` paths are backend resources, never frontend pages. Schema booking `seated` has no matching action. Header search/bell have no target. Administrative attendance APIs exist without a visible current web check-in control. Notification outbox and usage logs are supporting persistence, not standalone user screens. Full endpoint reconciliation and validation errors are in `ux-data.json.apiCatalogue`.

Evidence: [frontend/src/App.jsx:86](../../frontend/src/App.jsx#L86); [frontend/src/App.jsx:275](../../frontend/src/App.jsx#L275); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044); [mobile/App.js:43](../../mobile/App.js#L43); [mobile/app.config.js:1](../../mobile/app.config.js#L1); [backend/src/server.js:1](../../backend/src/server.js#L1)
