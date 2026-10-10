# Business statuses and transitions

Discovery snapshot: 7 October 2026. **Source analysis, not live acceptance testing.** Application source was not modified. `IMPLEMENTED` means a source-backed implementation exists, not that production behavior was verified.

## users.role

Values: `admin`, `waiter`, `chef`, `juicer`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-PublicLanding, W-Login, W-MasterLogin, W-CompanyRegistration, W-ProfileEditor, W-Admin, W-AdminOverview, W-OperationsCalendar, W-Staff, W-StaffManagement, W-AdminKitchenTeam, W-StaffEditor, W-RoleOverview, W-Waiter, W-ChefManagement, W-JuicerLoginEditor, W-KitchenStaffEditor, W-AttendancePanel, M-NativeLanding, M-RoleSelect, M-Login, M-Attendance, M-AdminOverview, M-AdminStaff, M-WaiterScreen, M-ChefJuicerManagement, M-OperationsCalendarMobile, M-AdminDrawer, M-AdminPeople, M-StaffEditor, M-ChefEditor, M-PremiumDashboard

Evidence: [backend/src/database.js:40](../../backend/src/database.js#L40)

## users.pay_type

Values: `daily`, `monthly`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-PublicLanding, W-Login, W-MasterLogin, W-CompanyRegistration, W-ProfileEditor, W-Admin, W-AdminOverview, W-OperationsCalendar, W-Staff, W-StaffManagement, W-AdminKitchenTeam, W-StaffEditor, W-RoleOverview, W-Waiter, W-ChefManagement, W-JuicerLoginEditor, W-KitchenStaffEditor, W-AttendancePanel, M-NativeLanding, M-RoleSelect, M-Login, M-Attendance, M-AdminOverview, M-AdminStaff, M-WaiterScreen, M-ChefJuicerManagement, M-OperationsCalendarMobile, M-AdminDrawer, M-AdminPeople, M-StaffEditor, M-ChefEditor, M-PremiumDashboard

Evidence: [backend/src/database.js:40](../../backend/src/database.js#L40)

## kitchen_staff.pay_type

Values: `daily`, `monthly`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-Staff, W-StaffManagement, W-StaffEditor, W-ChefManagement, W-JuicerLoginEditor, W-KitchenStaffEditor, W-AttendancePanel, M-Attendance, M-AdminStaff, M-ChefJuicerManagement, M-AdminPeople, M-StaffEditor, M-ChefEditor

Evidence: [backend/src/database.js:41](../../backend/src/database.js#L41)

## restaurant_tables.status

Values: `available`, `occupied`, `reserved`, `cleaning`.

available/reserved/cleaning via guarded table action; order creation → occupied; settlement releases active order and sets cleaning. No guest stay involved.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-AdminOverview, W-AdminTables, W-AdminTableDetails, W-TableEditor, W-AdminOrders, W-RoleOverview, W-Bookings, W-WaiterOrders, W-TableDrawer, W-OrderBuilder, W-Bill, W-AdminBillPopup, M-AdminOverview, M-AdminTables, M-MobileTableEditor, M-AdminBillingModal, M-TableList, M-OrderModal, M-OrderList, M-AdminBookings, M-AdminBookingEditor, M-AdminOrders, M-PremiumDashboard

Evidence: [backend/src/database.js:43](../../backend/src/database.js#L43)

## orders.order_type

Values: `dine_in`, `parcel`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-AdminOverview, W-AdminTables, W-AdminTableDetails, W-TableEditor, W-AdminOrders, W-ParcelPanel, W-ParcelHandoffModal, W-ParcelPaymentModal, W-ParcelBuilder, W-Finance, W-FinanceEntry, W-DailyFinance, W-FinanceCalendar, W-MonthlyRevenueReport, W-DailyFinanceDetails, W-SupplierPurchaseForm, W-DealerPaymentForm, W-RoleOverview, W-WaiterOrders, W-TableDrawer, W-OrderBuilder, W-Bill, W-AdminBillPopup, W-Chef, W-Juicer, M-AdminOverview, M-AdminTables, M-MobileTableEditor, M-AdminBillingModal, M-TableList, M-OrderModal, M-OrderList, M-ChefScreen, M-JuicerScreen, M-AdminParcelsDay, M-AdminOrders, M-AdminParcels, M-ParcelEditor, M-AdminFinance, M-FinanceDay, M-FinanceEntry, M-PurchaseEditor, M-DealerPayment, M-PremiumDashboard

Evidence: [backend/src/database.js:46](../../backend/src/database.js#L46)

## orders.status

Values: `new`, `preparing`, `ready`, `collected`, `received`, `served`, `billing_requested`, `completed`.

new → preparing → ready through production; handoff collected/received; billing_requested → completed on Admin payment. served exists in enum but no dedicated transition found. Mixed item states aggregate at order level.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-AdminOverview, W-AdminTables, W-AdminTableDetails, W-TableEditor, W-AdminOrders, W-ParcelPanel, W-ParcelHandoffModal, W-ParcelPaymentModal, W-ParcelBuilder, W-Finance, W-FinanceEntry, W-DailyFinance, W-FinanceCalendar, W-MonthlyRevenueReport, W-DailyFinanceDetails, W-SupplierPurchaseForm, W-DealerPaymentForm, W-RoleOverview, W-WaiterOrders, W-TableDrawer, W-OrderBuilder, W-Bill, W-AdminBillPopup, W-Chef, W-Juicer, M-AdminOverview, M-AdminTables, M-MobileTableEditor, M-AdminBillingModal, M-TableList, M-OrderModal, M-OrderList, M-ChefScreen, M-JuicerScreen, M-AdminParcelsDay, M-AdminOrders, M-AdminParcels, M-ParcelEditor, M-AdminFinance, M-FinanceDay, M-FinanceEntry, M-PurchaseEditor, M-DealerPayment, M-PremiumDashboard

Evidence: [backend/src/database.js:46](../../backend/src/database.js#L46)

## orders.payment_status

Values: `unpaid`, `paid`.

unpaid → paid by Admin; no refund/reversal workflow found.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-AdminOverview, W-AdminTables, W-AdminTableDetails, W-TableEditor, W-AdminOrders, W-ParcelPanel, W-ParcelHandoffModal, W-ParcelPaymentModal, W-ParcelBuilder, W-Finance, W-FinanceEntry, W-DailyFinance, W-FinanceCalendar, W-MonthlyRevenueReport, W-DailyFinanceDetails, W-SupplierPurchaseForm, W-DealerPaymentForm, W-RoleOverview, W-WaiterOrders, W-TableDrawer, W-OrderBuilder, W-Bill, W-AdminBillPopup, W-Chef, W-Juicer, M-AdminOverview, M-AdminTables, M-MobileTableEditor, M-AdminBillingModal, M-TableList, M-OrderModal, M-OrderList, M-ChefScreen, M-JuicerScreen, M-AdminParcelsDay, M-AdminOrders, M-AdminParcels, M-ParcelEditor, M-AdminFinance, M-FinanceDay, M-FinanceEntry, M-PurchaseEditor, M-DealerPayment, M-PremiumDashboard

Evidence: [backend/src/database.js:46](../../backend/src/database.js#L46)

## order_items.production_status

Values: `new`, `preparing`, `ready`.

new → preparing → ready; role and item type constrain production.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-AdminTables, W-AdminTableDetails, W-TableEditor, W-AdminOrders, W-ParcelPanel, W-ParcelHandoffModal, W-ParcelPaymentModal, W-ParcelBuilder, W-WaiterOrders, W-TableDrawer, W-OrderBuilder, W-Bill, W-AdminBillPopup, W-Chef, W-Juicer, M-AdminTables, M-MobileTableEditor, M-AdminBillingModal, M-TableList, M-OrderModal, M-OrderList, M-ChefScreen, M-JuicerScreen, M-AdminParcelsDay, M-AdminOrders, M-AdminParcels, M-ParcelEditor

Evidence: [backend/src/database.js:47](../../backend/src/database.js#L47)

## order_items.handoff_status

Values: `pending`, `collected`, `received`.

pending → collected → received; batch/item handoff tracked independently from payment.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-AdminTables, W-AdminTableDetails, W-TableEditor, W-AdminOrders, W-ParcelPanel, W-ParcelHandoffModal, W-ParcelPaymentModal, W-ParcelBuilder, W-WaiterOrders, W-TableDrawer, W-OrderBuilder, W-Bill, W-AdminBillPopup, W-Chef, W-Juicer, M-AdminTables, M-MobileTableEditor, M-AdminBillingModal, M-TableList, M-OrderModal, M-OrderList, M-ChefScreen, M-JuicerScreen, M-AdminParcelsDay, M-AdminOrders, M-AdminParcels, M-ParcelEditor

Evidence: [backend/src/database.js:47](../../backend/src/database.js#L47)

## inventory_transactions.movement_type

Values: `purchase`, `usage`, `adjustment`, `waste`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-Stock, W-StockEditor, W-StockMovement, W-ChefStockBooking, W-ChefStockRequestModal, M-AdminStock, M-StockEditor, M-StockMovement

Evidence: [backend/src/database.js:49](../../backend/src/database.js#L49)

## stock_requests.status

Values: `pending`, `ordered`, `resolved`.

Admin may set pending/ordered/resolved; not a strictly enforced one-way state machine.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-Stock, W-StockEditor, W-StockMovement, W-ChefStockBooking, W-ChefStockRequestModal, M-AdminStock, M-StockEditor, M-StockMovement

Evidence: [backend/src/database.js:50](../../backend/src/database.js#L50)

## finance_entries.entry_type

Values: `income`, `expense`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-Finance, W-FinanceEntry, W-DailyFinance, W-FinanceCalendar, W-MonthlyRevenueReport, W-DailyFinanceDetails, W-SupplierPurchaseForm, W-DealerPaymentForm, M-AdminFinance, M-FinanceDay, M-FinanceEntry, M-PurchaseEditor, M-DealerPayment

Evidence: [backend/src/database.js:51](../../backend/src/database.js#L51)

## bookings.status

Values: `confirmed`, `seated`, `cancelled`.

confirmed → cancelled; seated is schema-only, no seating endpoint found.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-Bookings, M-AdminBookings, M-AdminBookingEditor

Evidence: [backend/src/database.js:54](../../backend/src/database.js#L54)

## bookings.notification_status

Values: `queued`, `sent`, `failed`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-Bookings, M-AdminBookings, M-AdminBookingEditor

Evidence: [backend/src/database.js:54](../../backend/src/database.js#L54)

## companies.status

Values: `active`, `suspended`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-ApplicantOnboarding, W-SuperAdminApp, W-MasterRegistrationRequests, W-MasterRegistrationDetail, W-MasterNetworkOverview, W-MasterActionModal, W-CompanyWorkspaceOverview, W-CompanyControls, W-MasterUsers, W-MasterPinModal, W-MasterBilling, W-MasterPricingSlab, M-MasterMobile

Evidence: [backend/src/master-server.js:90](../../backend/src/master-server.js#L90)

## company_users.role

Values: `admin`, `waiter`, `chef`, `juicer`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-PublicLanding, W-Login, W-SuperAdminApp, W-MasterRegistrationRequests, W-MasterNetworkOverview, W-MasterActionModal, W-CompanyWorkspaceOverview, W-CompanyControls, W-MasterUsers, W-MasterPinModal, W-MasterBilling, W-MasterPricingSlab, W-MasterLogin, W-CompanyRegistration, W-ProfileEditor, W-Admin, W-OperationsCalendar, W-AdminKitchenTeam, W-Waiter, M-NativeLanding, M-RoleSelect, M-Login, M-MasterMobile, M-WaiterScreen, M-OperationsCalendarMobile, M-AdminDrawer

Evidence: [backend/src/master-server.js:91](../../backend/src/master-server.js#L91)

## company_registration_requests.status

Values: `pending`, `approved`, `rejected`.

pending → approved or rejected; activation completion uses completed_at rather than another status value.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-ApplicantOnboarding, W-MasterRegistrationDetail

Evidence: [backend/src/master-server.js:96](../../backend/src/master-server.js#L96)

## saas_invoices.status

Values: `due`, `paid`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-SuperAdminApp, W-MasterRegistrationRequests, W-MasterNetworkOverview, W-MasterActionModal, W-CompanyWorkspaceOverview, W-CompanyControls, W-MasterUsers, W-MasterPinModal, W-MasterBilling, W-MasterPricingSlab, M-MasterMobile

Evidence: [backend/src/master-server.js:97](../../backend/src/master-server.js#L97)

## notification_outbox.channel

Values: `email`, `sms`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-PublicCompanyRegistration, W-ApplicantOnboarding, W-MasterRegistrationDetail, W-Bookings, W-BookingModal, M-AdminBookings, M-AdminBookingEditor

Evidence: [backend/src/master-server.js:98](../../backend/src/master-server.js#L98)

## notification_outbox.status

Values: `queued`, `sent`, `failed`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-PublicCompanyRegistration, W-ApplicantOnboarding, W-MasterRegistrationDetail, W-Bookings, W-BookingModal, M-AdminBookings, M-AdminBookingEditor

Evidence: [backend/src/master-server.js:98](../../backend/src/master-server.js#L98)

## tenant_subscriptions.status

Values: `active`, `grace`, `expired`.

See mutation API catalogue; schema enum alone does not prove a transition action.

UI: Text/badges/select controls where exposed; not every schema value has a reachable UI.

Used by: W-ApplicantOnboarding, W-MasterRegistrationDetail

Evidence: [backend/src/master-server.js:99](../../backend/src/master-server.js#L99)

## Non-enum states

User active/deleted, menu available, company module enablement and open/closed attendance are booleans/timestamps rather than enum workflows. Applicant completion uses completed_at. UI stock health is derived (out/low/healthy), not a persisted inventory status. A booking status, table status, item production status, handoff status and payment status must remain visually distinguishable.

Evidence: [backend/src/database.js:40](../../backend/src/database.js#L40); [frontend/src/App.jsx:2739](../../frontend/src/App.jsx#L2739); [frontend/src/App.jsx:382](../../frontend/src/App.jsx#L382)
