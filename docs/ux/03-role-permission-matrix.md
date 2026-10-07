# Roles, permissions and operational personas

Discovery snapshot: 7 October 2026. **Source analysis, not live acceptance testing.** Application source was not modified. `IMPLEMENTED` means a source-backed implementation exists, not that production behavior was verified.

| Feature | admin | waiter | chef | juicer | superadmin | applicant | Scope |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tenant dashboard | YES | YES | YES | YES | NO | NO | Role-specific content; mobile staff land on attendance |
| Manage table definitions | YES | NO | NO | NO | NO | NO | Admin create/delete; status also Waiter |
| Change table status | YES | YES | NO | NO | NO | NO | Guarded API; occupied derived from orders |
| Create/cancel table booking | YES | NO | NO | NO | NO | NO | Admin only |
| Create/add dine-in items | NO | YES | NO | NO | NO | NO | Waiter only API |
| Record order payment | YES | NO | NO | NO | NO | NO | Admin settlement |
| Prepare food/juice | NO | NO | YES | YES | NO | NO | Production scope differs by menu item type |
| Menu maintenance | YES | NO | PARTIAL | PARTIAL | NO | NO | Staff availability only |
| Stock and requests | YES | NO | PARTIAL | NO | NO | NO | Chef requests; Admin movements and request resolution |
| Finance management | YES | NO | NO | NO | NO | NO | UI and write guards; state payload broader |
| Manage staff | YES | NO | PARTIAL | NO | PARTIAL | NO | Chef kitchen roster/juicer; master company logins |
| Self attendance | NO | PARTIAL | PARTIAL | PARTIAL | NO | NO | Native accessible; web dormant |
| Company approval/controls | NO | NO | NO | NO | YES | NO | Web master |
| Apply/activate company | NO | NO | NO | NO | NO | YES | Public application and applicant state |
| Settings UI | YES | NO | NO | NO | NO | NO | Role endpoint lacks matching admin guard |
| Profile edit | YES | YES | YES | YES | UNCLEAR | NO | Tenant web profile; native parity limited |


The matrix describes exposed tasks and explicit write guards. It is not a claim of complete backend data isolation. Settings, upload/report endpoints, module-path checks and shared state need engineering review; hiding a menu does not enforce permission. Role evidence: [frontend/src/App.jsx:94](../../frontend/src/App.jsx#L94); [frontend/src/App.jsx:1006](../../frontend/src/App.jsx#L1006); [frontend/src/App.jsx:1044](../../frontend/src/App.jsx#L1044); [backend/src/server.js:59](../../backend/src/server.js#L59); [backend/src/database.js:40](../../backend/src/database.js#L40); [backend/src/master-server.js:1](../../backend/src/master-server.js#L1)

## admin

Goal: Keep restaurant operations and cash records coordinated.

Daily responsibilities: Monitor floor; create parcels and bookings; settle bills; update stock and suppliers; manage staff.

Most used modules: access, overview, tables, bookings, orders, parcels, menu, stock, finance, staff, settings, notifications.

Current pain points: Ten ungrouped web links; bookings cannot be seated; web/native settings differ.

Accessible screen IDs: W-ProfileEditor, W-Admin, W-AdminOverview, W-AdminTables, W-AdminTableDetails, W-TableEditor, W-OperationsCalendar, W-AdminOrders, W-MenuManager, W-DishEditor, W-ComboEditor, W-ParcelPanel, W-ParcelHandoffModal, W-ParcelPaymentModal, W-ParcelBuilder, W-Stock, W-StockEditor, W-StockMovement, W-FinanceEntry, W-DailyFinance, W-FinanceCalendar, W-MonthlyRevenueReport, W-DailyFinanceDetails, W-SupplierPurchaseForm, W-DealerPaymentForm, W-StaffManagement, W-AdminKitchenTeam, W-StaffEditor, W-SettingsPanel, W-Bookings, W-BookingModal, W-AdminBillPopup, W-KitchenStaffEditor, M-AdminTables, M-MobileTableEditor, M-AdminBillingModal, M-OperationsCalendarMobile, M-AdminDrawer, M-AdminBookings, M-AdminBookingEditor, M-AdminParcelsDay, M-AdminOrders, M-AdminParcels, M-ParcelEditor, M-AdminMenuManager, M-MenuEditor, M-AdminStock, M-StockEditor, M-StockMovement, M-AdminFinance, M-FinanceDay, M-FinanceEntry, M-PurchaseEditor, M-DealerPayment, M-AdminPeople, M-StaffEditor, M-ChefEditor, M-AdminSettings, M-PremiumDashboard.

Restricted actions: all NO entries above; PARTIAL entries require the stated scope. These are operational personas derived from roles, not invented demographic personas.

## waiter

Goal: Move table service from order to paid bill.

Daily responsibilities: Choose table; submit rounds; collect/receive prepared items; request bill; record own shift on mobile.

Most used modules: access, overview, tables, orders, staff.

Current pain points: My Orders relies on name matching; web attendance hidden.

Accessible screen IDs: W-ProfileEditor, W-RoleOverview, W-Waiter, W-WaiterOrders, W-TableDrawer, W-OrderBuilder, W-Bill, M-Attendance, M-WaiterScreen, M-TableList, M-OrderModal, M-OrderList.

Restricted actions: all NO entries above; PARTIAL entries require the stated scope. These are operational personas derived from roles, not invented demographic personas.

## chef

Goal: Prepare food and coordinate kitchen resources.

Daily responsibilities: Review batches; start preparation; mark ready; toggle dishes; request stock on web; maintain roster.

Most used modules: access, overview, orders, parcels, menu, production, stock, staff.

Current pain points: Native roster/stock tools have reduced coverage.

Accessible screen IDs: W-ProfileEditor, W-RoleOverview, W-Chef, W-ChefStockBooking, W-ChefStockRequestModal, W-ChefDishes, W-ChefManagement, W-JuicerLoginEditor, W-KitchenStaffEditor, M-Attendance, M-ChefScreen, M-ChefDishes, M-ChefJuicerManagement.

Restricted actions: all NO entries above; PARTIAL entries require the stated scope. These are operational personas derived from roles, not invented demographic personas.

## juicer

Goal: Prepare and hand off juice items.

Daily responsibilities: Review juice queue; prepare; mark ready; control juice availability; record own shift.

Most used modules: access, overview, orders, parcels, menu, production, staff.

Current pain points: Ready web navigation uses kitchen gate; mobile parcel grouping differs.

Accessible screen IDs: W-ProfileEditor, W-RoleOverview, W-Juicer, W-ChefDishes, M-Attendance, M-JuicerScreen, M-ChefDishes.

Restricted actions: all NO entries above; PARTIAL entries require the stated scope. These are operational personas derived from roles, not invented demographic personas.

## superadmin

Goal: Operate the multi-company subscription network.

Daily responsibilities: Review applicants; inspect companies/users; manage access and SaaS invoices.

Most used modules: access, onboarding, master, notifications.

Current pain points: Technical database names and credentials visible; mobile is much narrower.

Accessible screen IDs: W-SuperAdminApp, W-MasterRegistrationRequests, W-MasterRegistrationDetail, W-MasterNetworkOverview, W-MasterActionModal, W-CompanyWorkspaceOverview, W-CompanyControls, W-MasterUsers, W-MasterPinModal, W-MasterBilling, W-MasterPricingSlab, M-MasterMobile.

Restricted actions: all NO entries above; PARTIAL entries require the stated scope. These are operational personas derived from roles, not invented demographic personas.

## applicant

Goal: Register and activate a company.

Daily responsibilities: Submit business/contact/package; await review; enter activation details; receive permanent credentials.

Most used modules: access, onboarding, notifications.

Current pain points: Payment and message wording suggests more integration than is implemented.

Accessible screen IDs: W-ApplicantOnboarding.

Restricted actions: all NO entries above; PARTIAL entries require the stated scope. These are operational personas derived from roles, not invented demographic personas.


