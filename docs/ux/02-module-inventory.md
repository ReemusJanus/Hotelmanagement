# Module inventory

Discovery snapshot: 7 October 2026. **Source analysis, not live acceptance testing.** Application source was not modified. `IMPLEMENTED` means a source-backed implementation exists, not that production behavior was verified.

## Access and profile

| Property | Finding |
| --- | --- |
| id | access |
| name | Access and profile |
| purpose | PIN authentication, identity and profile editing |
| frontendExists | True |
| backendExists | True |
| entities | ["users", "master_users", "company_users"] |
| roles | ["admin", "waiter", "chef", "juicer", "superadmin", "applicant"] |
| mainScreens | ["Login", "MasterLogin", "ProfileEditor"] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:274](../../frontend/src/App.jsx#L274); [frontend/src/App.jsx:863](../../frontend/src/App.jsx#L863); [frontend/src/App.jsx:1105](../../frontend/src/App.jsx#L1105); [mobile/App.js:36](../../mobile/App.js#L36)

## Company registration and activation

| Property | Finding |
| --- | --- |
| id | onboarding |
| name | Company registration and activation |
| purpose | Request a subscription, review it and activate a tenant |
| frontendExists | True |
| backendExists | True |
| entities | ["company_registration_requests", "companies", "tenant_subscriptions", "notification_outbox"] |
| roles | ["applicant", "superadmin"] |
| mainScreens | ["PublicCompanyRegistration", "ApplicantOnboarding", "MasterRegistrationDetail"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:375](../../frontend/src/App.jsx#L375); [frontend/src/App.jsx:382](../../frontend/src/App.jsx#L382); [frontend/src/App.jsx:623](../../frontend/src/App.jsx#L623)

## Company administration

| Property | Finding |
| --- | --- |
| id | master |
| name | Company administration |
| purpose | Operate tenant companies, logins, module access and SaaS invoices |
| frontendExists | True |
| backendExists | True |
| entities | ["companies", "company_users", "saas_invoices", "module_pricing", "usage_logins"] |
| roles | ["superadmin"] |
| mainScreens | ["SuperAdminApp", "MasterUsers", "MasterBilling", "CompanyControls", "MasterMobile"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:392](../../frontend/src/App.jsx#L392); [frontend/src/App.jsx:708](../../frontend/src/App.jsx#L708); [frontend/src/App.jsx:713](../../frontend/src/App.jsx#L713); [frontend/src/App.jsx:846](../../frontend/src/App.jsx#L846); [mobile/App.js:45](../../mobile/App.js#L45)

## Operational dashboards

| Property | Finding |
| --- | --- |
| id | overview |
| name | Operational dashboards |
| purpose | Summarize floor, production, sales and staff |
| frontendExists | True |
| backendExists | True |
| entities | ["orders", "restaurant_tables", "users", "staff_attendance", "inventory"] |
| roles | ["admin", "waiter", "chef", "juicer"] |
| mainScreens | ["AdminOverview", "RoleOverview", "PremiumDashboard"] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:1202](../../frontend/src/App.jsx#L1202); [frontend/src/App.jsx:4874](../../frontend/src/App.jsx#L4874); [mobile/App.js:50](../../mobile/App.js#L50); [mobile/PremiumDashboard.js:20](../../mobile/PremiumDashboard.js#L20)

## Restaurant floor

| Property | Finding |
| --- | --- |
| id | tables |
| name | Restaurant floor |
| purpose | Create tables, inspect active service and change table state |
| frontendExists | True |
| backendExists | True |
| entities | ["restaurant_tables", "orders", "order_items"] |
| roles | ["admin", "waiter"] |
| mainScreens | ["AdminTables", "TableDrawer", "OrderModal", "TableList"] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:1355](../../frontend/src/App.jsx#L1355); [frontend/src/App.jsx:5119](../../frontend/src/App.jsx#L5119); [mobile/App.js:54](../../mobile/App.js#L54); [mobile/App.js:63](../../mobile/App.js#L63); [mobile/App.js:66](../../mobile/App.js#L66)

## Table bookings

| Property | Finding |
| --- | --- |
| id | bookings |
| name | Table bookings |
| purpose | Reserve a restaurant table for a dated time interval and phone contact |
| frontendExists | True |
| backendExists | True |
| entities | ["bookings", "restaurant_tables", "notification_outbox"] |
| roles | ["admin"] |
| mainScreens | ["Bookings", "BookingModal", "AdminBookings", "AdminBookingEditor"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:4979](../../frontend/src/App.jsx#L4979); [frontend/src/App.jsx:5053](../../frontend/src/App.jsx#L5053); [mobile/AdminModules.js:44](../../mobile/AdminModules.js#L44); [mobile/AdminModules.js:52](../../mobile/AdminModules.js#L52)

## Dine-in orders and billing

| Property | Finding |
| --- | --- |
| id | orders |
| name | Dine-in orders and billing |
| purpose | Take orders and additional rounds, coordinate handoff and settle bills |
| frontendExists | True |
| backendExists | True |
| entities | ["orders", "order_items", "menu_items", "restaurant_tables"] |
| roles | ["admin", "waiter", "chef", "juicer"] |
| mainScreens | ["AdminOrders", "WaiterOrders", "OrderBuilder", "Bill", "AdminBillPopup", "AdminBillingModal"] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:1822](../../frontend/src/App.jsx#L1822); [frontend/src/App.jsx:5033](../../frontend/src/App.jsx#L5033); [frontend/src/App.jsx:5333](../../frontend/src/App.jsx#L5333); [frontend/src/App.jsx:5657](../../frontend/src/App.jsx#L5657); [frontend/src/App.jsx:5730](../../frontend/src/App.jsx#L5730); [mobile/App.js:59](../../mobile/App.js#L59); [mobile/AdminModules.js:61](../../mobile/AdminModules.js#L61)

## Parcel orders

| Property | Finding |
| --- | --- |
| id | parcels |
| name | Parcel orders |
| purpose | Create takeaway orders, record payment and coordinate collection |
| frontendExists | True |
| backendExists | True |
| entities | ["orders", "order_items", "menu_items"] |
| roles | ["admin", "chef", "juicer"] |
| mainScreens | ["ParcelPanel", "ParcelBuilder", "ParcelHandoffModal", "ParcelPaymentModal", "AdminParcels"] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:2222](../../frontend/src/App.jsx#L2222); [frontend/src/App.jsx:2382](../../frontend/src/App.jsx#L2382); [frontend/src/App.jsx:2516](../../frontend/src/App.jsx#L2516); [frontend/src/App.jsx:2546](../../frontend/src/App.jsx#L2546); [mobile/AdminModules.js:67](../../mobile/AdminModules.js#L67)

## Menu and combos

| Property | Finding |
| --- | --- |
| id | menu |
| name | Menu and combos |
| purpose | Manage dishes, images, prices, availability and combo composition |
| frontendExists | True |
| backendExists | True |
| entities | ["menu_items", "combo_components"] |
| roles | ["admin", "chef", "juicer"] |
| mainScreens | ["MenuManager", "DishEditor", "ComboEditor", "ChefDishes", "AdminMenuManager", "MenuEditor"] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:1894](../../frontend/src/App.jsx#L1894); [frontend/src/App.jsx:2018](../../frontend/src/App.jsx#L2018); [frontend/src/App.jsx:2102](../../frontend/src/App.jsx#L2102); [frontend/src/App.jsx:6004](../../frontend/src/App.jsx#L6004); [mobile/App.js:85](../../mobile/App.js#L85); [mobile/AdminModules.js:76](../../mobile/AdminModules.js#L76); [mobile/AdminModules.js:78](../../mobile/AdminModules.js#L78)

## Kitchen and juice production

| Property | Finding |
| --- | --- |
| id | production |
| name | Kitchen and juice production |
| purpose | Prepare tickets and mark batches ready |
| frontendExists | True |
| backendExists | True |
| entities | ["orders", "order_items", "menu_items"] |
| roles | ["chef", "juicer"] |
| mainScreens | ["Chef", "Juicer", "ChefScreen", "JuicerScreen", "KitchenTicket"] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:5829](../../frontend/src/App.jsx#L5829); [frontend/src/App.jsx:5976](../../frontend/src/App.jsx#L5976); [frontend/src/App.jsx:6206](../../frontend/src/App.jsx#L6206); [mobile/App.js:83](../../mobile/App.js#L83); [mobile/App.js:84](../../mobile/App.js#L84); [mobile/App.js:87](../../mobile/App.js#L87)

## Inventory and kitchen requests

| Property | Finding |
| --- | --- |
| id | stock |
| name | Inventory and kitchen requests |
| purpose | Track stock movements, minimums, planning and chef purchase requests |
| frontendExists | True |
| backendExists | True |
| entities | ["inventory", "inventory_transactions", "stock_requests"] |
| roles | ["admin", "chef"] |
| mainScreens | ["Stock", "StockEditor", "StockMovement", "ChefStockBooking", "ChefStockRequestModal", "AdminStock"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:2739](../../frontend/src/App.jsx#L2739); [frontend/src/App.jsx:3039](../../frontend/src/App.jsx#L3039); [frontend/src/App.jsx:3145](../../frontend/src/App.jsx#L3145); [frontend/src/App.jsx:5957](../../frontend/src/App.jsx#L5957); [frontend/src/App.jsx:5970](../../frontend/src/App.jsx#L5970); [mobile/AdminModules.js:80](../../mobile/AdminModules.js#L80); [mobile/AdminModules.js:84](../../mobile/AdminModules.js#L84); [mobile/AdminModules.js:85](../../mobile/AdminModules.js#L85)

## Finance and suppliers

| Property | Finding |
| --- | --- |
| id | finance |
| name | Finance and suppliers |
| purpose | Review daily closing, ledger, purchases, balances and reports |
| frontendExists | True |
| backendExists | True |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |
| roles | ["admin"] |
| mainScreens | ["DailyFinance", "DailyFinanceDetails", "MonthlyRevenueReport", "SupplierPurchaseForm", "DealerPaymentForm", "FinanceDay"] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:3513](../../frontend/src/App.jsx#L3513); [frontend/src/App.jsx:3678](../../frontend/src/App.jsx#L3678); [frontend/src/App.jsx:3706](../../frontend/src/App.jsx#L3706); [frontend/src/App.jsx:4164](../../frontend/src/App.jsx#L4164); [frontend/src/App.jsx:4306](../../frontend/src/App.jsx#L4306); [mobile/AdminModules.js:91](../../mobile/AdminModules.js#L91)

## Staff and attendance

| Property | Finding |
| --- | --- |
| id | staff |
| name | Staff and attendance |
| purpose | Manage login accounts, kitchen roster, compensation fields and shifts |
| frontendExists | True |
| backendExists | True |
| entities | ["users", "kitchen_staff", "staff_attendance"] |
| roles | ["admin", "chef", "waiter", "juicer"] |
| mainScreens | ["StaffManagement", "StaffEditor", "ChefManagement", "KitchenStaffEditor", "Attendance", "AdminPeople"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:4424](../../frontend/src/App.jsx#L4424); [frontend/src/App.jsx:4680](../../frontend/src/App.jsx#L4680); [frontend/src/App.jsx:6024](../../frontend/src/App.jsx#L6024); [frontend/src/App.jsx:6095](../../frontend/src/App.jsx#L6095); [mobile/App.js:47](../../mobile/App.js#L47); [mobile/AdminModules.js:96](../../mobile/AdminModules.js#L96); [mobile/AdminModules.js:97](../../mobile/AdminModules.js#L97)

## Business settings

| Property | Finding |
| --- | --- |
| id | settings |
| name | Business settings |
| purpose | Edit business identity; native also exposes charge configuration |
| frontendExists | True |
| backendExists | True |
| entities | ["settings"] |
| roles | ["admin"] |
| mainScreens | ["SettingsPanel", "AdminSettings"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:4815](../../frontend/src/App.jsx#L4815); [mobile/AdminModules.js:110](../../mobile/AdminModules.js#L110)

## Messages and feedback

| Property | Finding |
| --- | --- |
| id | notifications |
| name | Messages and feedback |
| purpose | Booking/onboarding delivery attempts plus local notices |
| frontendExists | True |
| backendExists | True |
| entities | ["notification_outbox"] |
| roles | ["admin", "applicant", "superadmin"] |
| mainScreens | ["PublicCompanyRegistration", "BookingModal", "Shell"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:375](../../frontend/src/App.jsx#L375); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044); [frontend/src/App.jsx:5053](../../frontend/src/App.jsx#L5053)

## Unsupported hotel concepts

Hotel rooms, Room types, Room rates, Stay reservations, Guest profiles/CRM, Guest identification documents, Guest check-in/check-out, Room housekeeping, Maintenance tasks, Amenities: NOT_FOUND. See the product overview for the search scope. No room/stay workflows have been recommended as existing capabilities.

## Cross-module relationships

| Module | Related modules through shared entities |
| --- | --- |
| Access and profile | master, overview, staff |
| Company registration and activation | master, bookings, notifications |
| Company administration | access, onboarding |
| Operational dashboards | access, tables, bookings, orders, parcels, production, stock, finance, staff |
| Restaurant floor | overview, bookings, orders, parcels, production, finance |
| Table bookings | onboarding, overview, tables, orders, notifications |
| Dine-in orders and billing | overview, tables, bookings, parcels, menu, production, finance |
| Parcel orders | overview, tables, orders, menu, production, finance |
| Menu and combos | orders, parcels, production |
| Kitchen and juice production | overview, tables, orders, parcels, menu, finance |
| Inventory and kitchen requests | overview |
| Finance and suppliers | overview, tables, orders, parcels, production |
| Staff and attendance | access, overview |
| Business settings |  |
| Messages and feedback | onboarding, bookings |


