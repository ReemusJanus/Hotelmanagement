# Current navigation architecture

Discovery snapshot: 7 October 2026. **Source analysis, not live acceptance testing.** Application source was not modified. `IMPLEMENTED` means a source-backed implementation exists, not that production behavior was verified.

| Platform | Parent | Label | Key (not URL) | Icon | Visibility/permission | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| web | admin sidebar | Overview | overview | LayoutDashboard | Role matches and mapped user.modules value is not false; none | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | admin sidebar | Tables | tables | Armchair | Role matches and mapped user.modules value is not false; tables | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | admin sidebar | Table Bookings | bookings | CalendarDays | Role matches and mapped user.modules value is not false; bookings | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | admin sidebar | Orders & Billing | orders | ReceiptText | Role matches and mapped user.modules value is not false; billing | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | admin sidebar | Parcel Orders | parcels | Package | Role matches and mapped user.modules value is not false; parcels | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | admin sidebar | Food & Photos | menu | UtensilsCrossed | Role matches and mapped user.modules value is not false; menu | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | admin sidebar | Stock Management | stock | Boxes | Role matches and mapped user.modules value is not false; stock | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | admin sidebar | Finance Management | finance | Wallet | Role matches and mapped user.modules value is not false; finance | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | admin sidebar | Staff | staff | Users | Role matches and mapped user.modules value is not false; staff | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | admin sidebar | Settings | settings | Settings | Role matches and mapped user.modules value is not false; none | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | waiter sidebar | Overview | overview | LayoutDashboard | Role matches and mapped user.modules value is not false; none | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | waiter sidebar | Tables | floor | Armchair | Role matches and mapped user.modules value is not false; tables | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | waiter sidebar | My Orders | orders | ReceiptText | Role matches and mapped user.modules value is not false; billing | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | chef sidebar | Overview | overview | LayoutDashboard | Role matches and mapped user.modules value is not false; none | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | chef sidebar | Chef Management | team | Users | Role matches and mapped user.modules value is not false; staff | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | chef sidebar | Book Kitchen Stock | stock-booking | Boxes | Role matches and mapped user.modules value is not false; stock | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | chef sidebar | Dishes | dishes | UtensilsCrossed | Role matches and mapped user.modules value is not false; menu | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | chef sidebar | Table Orders | kitchen | ChefHat | Role matches and mapped user.modules value is not false; kitchen | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | chef sidebar | Parcel Queue | parcels | Package | Role matches and mapped user.modules value is not false; parcels | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | chef sidebar | Ready to Serve | ready | CheckCircle2 | Role matches and mapped user.modules value is not false; kitchen | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | juicer sidebar | Overview | overview | LayoutDashboard | Role matches and mapped user.modules value is not false; none | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | juicer sidebar | Juices | juices | CupSoda | Role matches and mapped user.modules value is not false; juicer | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | juicer sidebar | Table Orders | queue | Armchair | Role matches and mapped user.modules value is not false; juicer | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | juicer sidebar | Parcel Queue | parcel-queue | Package | Role matches and mapped user.modules value is not false; juicer | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| web | juicer sidebar | Ready Juices | ready | CheckCircle2 | Role matches and mapped user.modules value is not false; kitchen | [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044) |
| mobile | admin drawer/tabs | Overview | overview | analytics-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | admin drawer/tabs | Tables | tables | grid-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | admin drawer/tabs | Table Bookings | bookings | calendar-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | admin drawer/tabs | Orders & Billing | orders | receipt-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | admin drawer/tabs | Parcel Orders | parcels | cube-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | admin drawer/tabs | Food & Photos | menu | fast-food-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | admin drawer/tabs | Stock Management | stock | layers-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | admin drawer/tabs | Finance Management | finance | wallet-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | admin drawer/tabs | Staff | staff | people-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | admin drawer/tabs | Settings | settings | settings-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | waiter drawer/tabs | Attendance | attendance | time-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | waiter drawer/tabs | Tables | tables | grid-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | waiter drawer/tabs | Orders | orders | receipt-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | chef drawer/tabs | Attendance | attendance | time-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | chef drawer/tabs | Juicer | team | people-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | chef drawer/tabs | Dishes | dishes | fast-food-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | chef drawer/tabs | Dine-in | kitchen | restaurant-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | chef drawer/tabs | Parcels | parcels | cube-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | juicer drawer/tabs | Attendance | attendance | time-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | juicer drawer/tabs | Juices | juices | cafe-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | juicer drawer/tabs | Queue | queue | receipt-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |
| mobile | juicer drawer/tabs | Ready | ready | checkmark-circle-outline | Role tab list; admin dock subset overview/tables/orders/parcels/staff; Native module map (incomplete for staff keys) | [mobile/App.js:43](../../mobile/App.js#L43); [mobile/AdminModules.js:14](../../mobile/AdminModules.js#L14) |

## Header, nested navigation and contextual entry

Web header: profile opens ProfileEditor; logout clears session; Search anything input and bell are PLACEHOLDER. No breadcrumb system identified. Master: Companies directory → selected company → Overview / Users / SaaS Billing / Controls; pending request opens registration review. Orders/bookings/parcels/finance use calendar → day → cards/detail, with local back controls. Menu uses dishes/combos. Stock uses inventory/activity/planning. Staff uses team/kitchen/history. Finance day uses daily/purchases/ledger/analytics.

Native Admin drawer groups daily operations, business and workspace; dock exposes Overview, Tables, Orders, Parcels and Staff. Other staff land on Attendance and use role tabs. Native entry is landing → login → portal. Sheet/Modal actions are contextual, not separate routes. Web and native navigation are not identical.

Evidence: [frontend/src/App.jsx:392](../../frontend/src/App.jsx#L392); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044); [frontend/src/App.jsx:1894](../../frontend/src/App.jsx#L1894); [frontend/src/App.jsx:2739](../../frontend/src/App.jsx#L2739); [frontend/src/App.jsx:3706](../../frontend/src/App.jsx#L3706); [frontend/src/App.jsx:4424](../../frontend/src/App.jsx#L4424); [mobile/App.js:43](../../mobile/App.js#L43); [mobile/PremiumDashboard.js:1](../../mobile/PremiumDashboard.js#L1)

## Search and persistence

| Surface | Current behavior |
| --- | --- |
| Global search | PLACEHOLDER; input has no search handler |
| Master directory | Company/database/admin text query plus active/suspended filter |
| Stock | Name/category query with category and stock-health filters; activity movement filter |
| Chef stock | Name/category query before request |
| Chef dishes | Query/category controls as recorded in screen inventory |
| Calendars | Month/date navigation for bookings, orders, parcels and finance |
| Menu/booking contacts | No universal guest, room or reservation search |
| Persistence | Internal useState filters generally reset on unmount/reload; no URL serialization |
| Permission awareness | Lists derive from loaded role state; no separate permission-aware global results system |



## Responsive web behavior and native queue distinction

At widths below 800px the master sidebar is hidden by CSS; no equivalent master drawer is present in SuperAdminApp. The company directory remains a content entry, but persistent company navigation is lost. This is a source-based responsive limitation, not a device-tested conclusion. Tenant shell media rules separately adapt navigation and page spacing. Native Juicer **Queue** mixes non-ready production tickets across order types; Ready filters ready tickets. It does not expose a separate parcel tab, but that does not mean parcel juice is excluded.

Evidence: [knockout.css:217](../../frontend/src/knockout.css#L217), [knockout.css:472](../../frontend/src/knockout.css#L472), [SuperAdminApp:392](../../frontend/src/App.jsx#L392), [JuicerScreen:84](../../mobile/App.js#L84).
