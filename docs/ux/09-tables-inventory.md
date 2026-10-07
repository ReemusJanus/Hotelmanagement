# Tables, cards and lists

Discovery snapshot: 7 October 2026. **Source analysis, not live acceptance testing.** Application source was not modified. `IMPLEMENTED` means a source-backed implementation exists, not that production behavior was verified.

## T-W-Login — Login table/list

| Property | Finding |
| --- | --- |
| screen | W-Login |
| purpose | Web supports tenant Hotel ID + PIN and no-Hotel-ID master/applicant path. Native requires four-digit Hotel ID and six-digit PIN, so it does not expose the same login paths. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["e.target.value.replace(/\\D/g,\"\").slice(0,4)", "e.target.value.replace(/\\D/g, \"\").slice(0, 6)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:274](../../frontend/src/App.jsx#L274)

## T-W-SuperAdminApp — Super Admin App table/list

| Property | Finding |
| --- | --- |
| screen | W-SuperAdminApp |
| purpose | Network summary → company directory / registration requests → selected company tabs Overview, Users, SaaS Billing, Controls. No route changes for selection. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [{"line": 567, "tag": "input", "label": "Search company, database or admin", "type": "text", "value": "companySearch", "required": false, "defaultValue": "", "disabled": false, "condition": ["selectedCompany", "selectedRegistration"], "handler": "(event)=>setCompanySearch(event.target.value)"}] |
| filters | ["registrationRequests.filter((request)=>request.status===\"pending\")", "companies.filter((company) => { const matchesStatus = companyFilter === \"all\" \|\| company.status === companyFilter \|\| (companyFilter === \"attention\" && (!company.online \|\| company.lowStock > 0)); const query = companySearch.trim().toLowerCase(); return matchesStatus && (!query \|\| [company.companyName, company.databaseName, company.adminName].some((value) => String(value \|\| \"\").toLowerCase().includes(query))); })", "(data.invoices\|\|[]).filter((invoice)=>invoice.companyId===selectedCompany.id)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 528, "label": "Companies", "handler": "() => { setSelectedCompanyId(null);setSelectedRegistrationId(null); setCompanySection(\"overview\"); }", "disabled": false}, {"line": 534, "label": "users", "handler": "() => { setSelectedRegistrationId(null);setSelectedCompanyId(company.id); setCompanySection(\"overview\"); }", "disabled": false}, {"line": 545, "label": "Pending registrations", "handler": "()=>{setSelectedCompanyId(null);setSelectedRegistrationId(pendingRegistrations[0]?.id\|\|null)}", "disabled": false}, {"line": 549, "label": "Logout", "handler": "logoutMaster", "disabled": false}, {"line": 555, "label": "All companies", "handler": "() => setSelectedCompanyId(null)", "disabled": false}, {"line": 556, "label": "<icon/dynamic>", "handler": "()=>setCompanySection(id)", "disabled": false}, {"line": 568, "label": "<icon/dynamic>", "handler": "()=>setCompanyFilter(id)", "disabled": false}, {"line": 587, "label": "Open company workspace All details and controls", "handler": "() => { setSelectedRegistrationId(null);setSelectedCompanyId(company.id); setCompanySection(\"overview\"); }", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No companies found"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:392](../../frontend/src/App.jsx#L392)

## T-W-MasterRegistrationRequests — Master Registration Requests table/list

| Property | Finding |
| --- | --- |
| screen | W-MasterRegistrationRequests |
| purpose | Operate tenant companies, logins, module access and SaaS invoices through Master Registration Requests. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["requests.filter((request)=>request.status===\"pending\")", "requests.filter((request)=>request.status!==\"pending\").slice(0,5)", "requests.filter((request)=>request.status!==\"pending\")"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 620, "label": "· month Requested FIRST ADMINISTRATOR · Review details", "handler": "()=>open(request)", "disabled": false}, {"line": 620, "label": "·", "handler": "()=>open(request)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No registrations awaiting approval"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:618](../../frontend/src/App.jsx#L618)

## T-W-MasterNetworkOverview — Master Network Overview table/list

| Property | Finding |
| --- | --- |
| screen | W-MasterNetworkOverview |
| purpose | Operate tenant companies, logins, module access and SaaS invoices through Master Network Overview. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["new Date().toISOString().slice(0,7)", "(invoices\|\|[]).filter((invoice)=>invoice.billingMonth===currentMonth)", "companies.filter((company) => !company.online \|\| company.lowStock > 0 \|\| !company.adminLoginActive)", "currentInvoices.filter((invoice)=>invoice.status==='paid')", "companies.filter((company)=>company.status===\"active\")", "companies.filter((company)=>company.online)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:628](../../frontend/src/App.jsx#L628)

## T-W-CompanyWorkspaceOverview — Company Workspace Overview table/list

| Property | Finding |
| --- | --- |
| screen | W-CompanyWorkspaceOverview |
| purpose | Operate tenant companies, logins, module access and SaaS invoices through Company Workspace Overview. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 703, "label": "Company users Manage declared accounts", "handler": "openUsers", "disabled": false}, {"line": 703, "label": "SaaS billing Open module invoice and monthly report", "handler": "openRevenue", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:693](../../frontend/src/App.jsx#L693)

## T-W-MasterUsers — Master Users table/list

| Property | Finding |
| --- | --- |
| screen | W-MasterUsers |
| purpose | Operate tenant companies, logins, module access and SaaS invoices through Master Users. |
| columns | ["User", "Designation", "6-digit PIN", "Status", "Recovery"] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 759, "label": "Change PIN", "handler": "() => changePin({ company, user, isMaster })", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No company users yet"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:713](../../frontend/src/App.jsx#L713)

## T-W-MasterPinModal — Master Pin Modal table/list

| Property | Finding |
| --- | --- |
| screen | W-MasterPinModal |
| purpose | Operate tenant companies, logins, module access and SaaS invoices through Master Pin Modal. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["e.target.value.replace(/\\D/g, \"\").slice(0, 6)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 834, "label": "Cancel", "handler": "close", "disabled": "busy"}, {"line": 837, "label": "<icon/dynamic>", "handler": "", "disabled": "busy \|\| pin.length !== 6"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:776](../../frontend/src/App.jsx#L776)

## T-W-MasterBilling — Master Billing table/list

| Property | Finding |
| --- | --- |
| screen | W-MasterBilling |
| purpose | Operate tenant companies, logins, module access and SaaS invoices through Master Billing. |
| columns | ["Tenant", "Activated modules", "Subtotal", "GST", "Total", "Payment", "Hotel ID", "Monthly KnockOUT revenue"] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["[...new Set((invoices\|\|[]).map((invoice)=>invoice.billingMonth))].sort()", "new Date().toISOString().slice(0,7)", "(invoices\|\|[]).filter((invoice)=>invoice.billingMonth===month&&companies.some((company)=>company.id===invoice.companyId))", "rows.filter((row)=>row.status==='paid')", "rows.filter((row)=>row.status==='due')"] |
| sorting | ["[...new Set((invoices\|\|[]).map((invoice)=>invoice.billingMonth))].sort()"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 850, "label": "Export monthly report", "handler": "exportReport", "disabled": "!rows.length"}, {"line": 853, "label": "<icon/dynamic>", "handler": "()=>setStatus(invoice,invoice.status==='paid'?'due':'paid')", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No subscription invoices are available for this month."] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:846](../../frontend/src/App.jsx#L846)

## T-W-MasterLogin — Master Login table/list

| Property | Finding |
| --- | --- |
| screen | W-MasterLogin |
| purpose | PIN authentication, identity and profile editing through Master Login. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["e.target.value.replace(/\\D/g, \"\").slice(0, 6)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 904, "label": "<icon/dynamic>", "handler": "", "disabled": "busy \|\| pin.length !== 6"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:863](../../frontend/src/App.jsx#L863)

## T-W-ProfileEditor — Profile Editor table/list

| Property | Finding |
| --- | --- |
| screen | W-ProfileEditor |
| purpose | Name, phone, email and profile image edit. Web profile load failure falls back to session identity. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["form.name.split(\" \").map(part=>part[0]).join(\"\").slice(0,2)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 1109, "label": "<icon/dynamic>", "handler": "", "disabled": "busy"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:1105](../../frontend/src/App.jsx#L1105)

## T-W-Admin — Admin table/list

| Property | Finding |
| --- | --- |
| screen | W-Admin |
| purpose | PIN authentication, identity and profile editing through Admin. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["(data.stockRequests \|\| []).filter((request) => request.status !== \"resolved\")", "(data.inventory \|\| []).filter((item) => item.quantity <= item.min)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 1162, "label": "<icon/dynamic>", "handler": "()=>setPage(\"stock\")", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:1150](../../frontend/src/App.jsx#L1150)

## T-W-AdminOverview — Admin Overview table/list

| Property | Finding |
| --- | --- |
| screen | W-AdminOverview |
| purpose | Revenue and operational KPIs → occupancy/status graphic → recent orders and stock alerts. Metrics use loaded state rather than an unlimited historical dataset. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["data.orders.filter( (o) => ![\"completed\", \"served\"].includes(o.status), )", "data.orders .filter((o) => o.total)", "data.tables.filter((t) => t.status === \"occupied\")", "data.tables.filter((t) => t.status === \"reserved\")", "data.tables.filter((t) => t.status === \"cleaning\")", "active.filter((o) => o.status === \"ready\")", "data.inventory.filter((i) => i.quantity <= i.min)", "data.tables.filter((t) => t.status !== \"available\")", "data.tables.filter((t) => t.status === s)", "data.orders.slice(0, 6)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 1218, "label": "View all orders", "handler": "() => setPage(\"orders\")", "disabled": false}, {"line": 1294, "label": "View all →", "handler": "() => setPage(\"orders\")", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:1202](../../frontend/src/App.jsx#L1202)

## T-W-AdminTableDetails — Admin Table Details table/list

| Property | Finding |
| --- | --- |
| screen | W-AdminTableDetails |
| purpose | Create tables, inspect active service and change table state through Admin Table Details. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["[orderDepartmentProgress(order, data, false), orderDepartmentProgress(order, data, true)].filter(Boolean)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 1670, "label": "Bill / Print", "handler": "() => setBilling(true)", "disabled": false}, {"line": 1674, "label": "Pay bill", "handler": "() => setPaying(true)", "disabled": false}, {"line": 1692, "label": "Delete table", "handler": "remove", "disabled": "!!order"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:1590](../../frontend/src/App.jsx#L1590)

## T-W-OperationsCalendar — Operations Calendar table/list

| Property | Finding |
| --- | --- |
| screen | W-OperationsCalendar |
| purpose | PIN authentication, identity and profile editing through Operations Calendar. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["orders.filter((order) => dateKey(order.createdAt) === key)", "daily.filter((order) => order.paymentStatus === \"paid\")", "daily.filter((order) => order.status !== \"completed\")", "daily.slice(0, 3)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 1786, "label": "<icon/dynamic>", "handler": "() => setMonth(new Date(year, monthIndex - 1, 1))", "disabled": false}, {"line": 1787, "label": "Today", "handler": "() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))", "disabled": false}, {"line": 1788, "label": "<icon/dynamic>", "handler": "() => setMonth(new Date(year, monthIndex + 1, 1))", "disabled": false}, {"line": 1796, "label": "<icon/dynamic>", "handler": "() => onSelect(key)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No orders", " No orders"] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:1776](../../frontend/src/App.jsx#L1776)

## T-W-AdminOrders — Admin Orders table/list

| Property | Finding |
| --- | --- |
| screen | W-AdminOrders |
| purpose | Take orders and additional rounds, coordinate handoff and settle bills through Admin Orders. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["data.orders.filter((order) => dateKey(order.createdAt) === selectedDate)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 1826, "label": "Calendar", "handler": "() => setSelectedDate(null)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:1822](../../frontend/src/App.jsx#L1822)

## T-W-MenuManager — Menu Manager table/list

| Property | Finding |
| --- | --- |
| screen | W-MenuManager |
| purpose | Dishes / combos tabs → cards → editor. Combos reference menu items; image upload supported. No general text search found here. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["data.menu.filter((i) => tab === \"combos\" ? i.isCombo : !i.isCombo, )", "data.menu.filter((i) => !i.isCombo)", "data.menu.filter((i) => i.isCombo)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 1923, "label": "Add", "handler": "() => setEditor({ type: tab === \"combos\" ? \"combo\" : \"dish\", item: null, })", "disabled": false}, {"line": 1937, "label": "Dishes & Juices", "handler": "() => setTab(\"dishes\")", "disabled": false}, {"line": 1943, "label": "Combo Offers", "handler": "() => setTab(\"combos\")", "disabled": false}, {"line": 1978, "label": "Customize", "handler": "() => setEditor({ type: item.isCombo ? \"combo\" : \"dish\", item })", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:1894](../../frontend/src/App.jsx#L1894)

## T-W-ComboEditor — Combo Editor table/list

| Property | Finding |
| --- | --- |
| screen | W-ComboEditor |
| purpose | Manage dishes, images, prices, availability and combo composition through Combo Editor. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["p.filter((x) => x.menuId !== id)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 2187, "label": "·", "handler": "() => toggle(d.id)", "disabled": false}, {"line": 2214, "label": "<icon/dynamic>", "handler": "", "disabled": "!parts.length"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:2102](../../frontend/src/App.jsx#L2102)

## T-W-ParcelPanel — Parcel Panel table/list

| Property | Finding |
| --- | --- |
| screen | W-ParcelPanel |
| purpose | Calendar → selected day → parcel list. Create only for today; detail/handoff, prepayment and final payment are separate modal states. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["data.orders.filter((o) => o.orderType === \"parcel\")", "allParcels.filter((order) => dateKey(order.createdAt) === selectedDate)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 2270, "label": "Calendar", "handler": "() => setSelectedDate(null)", "disabled": false}, {"line": 2270, "label": "New parcel order", "handler": "() => setCreating(true)", "disabled": false}, {"line": 2318, "label": "Mark as paid now", "handler": "() => setPrepaying(o)", "disabled": false}, {"line": 2326, "label": "Complete parcel handoff", "handler": "() => setPaying(o)", "disabled": false}, {"line": 2335, "label": "View / print bill", "handler": "() => setPaying(o)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No parcel orders"] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:2222](../../frontend/src/App.jsx#L2222)

## T-W-ParcelBuilder — Parcel Builder table/list

| Property | Finding |
| --- | --- |
| screen | W-ParcelBuilder |
| purpose | Create takeaway orders, record payment and coordinate collection through Parcel Builder. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["c .map((i) => (i.menuId === id ? { ...i, qty: i.qty + delta } : i)) .filter((i) => i.qty > 0)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 2606, "label": "<icon/dynamic>", "handler": "() => add(m.id)", "disabled": "!m.available"}, {"line": 2631, "label": "<icon/dynamic>", "handler": "() => change(i.menuId, -1)", "disabled": false}, {"line": 2635, "label": "<icon/dynamic>", "handler": "() => change(i.menuId, 1)", "disabled": false}, {"line": 2658, "label": "Pay on handoff", "handler": "() => setPaymentMethod(\"\")", "disabled": false}, {"line": 2664, "label": "Cash paid", "handler": "() => setPaymentMethod(\"Cash\")", "disabled": false}, {"line": 2670, "label": "Card / UPI paid", "handler": "() => setPaymentMethod(\"Card / UPI\")", "disabled": false}, {"line": 2677, "label": "Send parcel to kitchen", "handler": "send", "disabled": "!cart.length \|\| !customer"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:2546](../../frontend/src/App.jsx#L2546)

## T-W-Stock — Stock table/list

| Property | Finding |
| --- | --- |
| screen | W-Stock |
| purpose | Inventory / activity / planning views. Name/category query, category and health filters combine. Forecast derives from recorded usage/waste, not automatic ingredient consumption. |
| columns | ["Date", "Stock item", "Movement", "Quantity", "Unit cost", "Note / Admin", "Item", "On hand", "30-day usage", "Days cover", "Suggested order", "Estimated cost", "<dynamic>"] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [{"line": 2892, "tag": "input", "label": "Search item or category…", "type": "text", "value": "query", "required": false, "defaultValue": "", "disabled": false, "condition": ["tab === \"inventory\""], "handler": "(e)=>setQuery(e.target.value)"}] |
| filters | ["data.inventory.filter((i) => i.quantity <= i.min)", "transactions .filter((x) => x.movementType === \"purchase\")", "transactions.filter((x) => new Date(x.createdAt).getTime() >= cutoff)", "recent .filter((x) => x.movementType === \"usage\")", "recent .filter((x) => x.movementType === \"waste\")", "transactions.filter((x) => dateKey(x.createdAt) === todayKey)", "todayMovements.filter((x) => x.movementType === \"purchase\")", "todayMovements.filter((x) => x.movementType === \"usage\")", "todayMovements.filter((x) => x.movementType === \"waste\")", "[...new Set(data.inventory.map((i) => i.category).filter(Boolean))].sort()", "data.inventory.map((i) => i.category).filter(Boolean)", "data.inventory.filter((item) => { const matchesText = `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()), matchesCategory = category === \"all\" \|\| item.category === category, state = item.quantity === 0 ? \"out\" : item.quantity <= item.min ? \"low\" : \"healthy\"; return matchesText && matchesCategory && (health === \"all\" \|\| health === state); })", "transactions.filter((x) => movementFilter === \"all\" ? true : x.movementType === movementFilter, )", "data.inventory .map((item) => { const consumed = recent .filter((x) => x.inventoryId === item.id && [\"usage\", \"waste\"].includes(x.movementType)) .reduce((s, x) => s + Math.abs(x.quantity), 0), dailyUse = consumed / 30, daysCover = dailyUse > 0 ? item.quantity / dailyUse : null, reorderQty = Math.max(0, item.min * 2 - item.quantity); return { ...item, consumed, dailyUse, daysCover, reorderQty, reorderCost: reorderQty * item.cost }; }) .sort((a, b) => (a.daysCover ?? 9999) - (b.daysCover ?? 9999))", "recent .filter((x) => x.inventoryId === item.id && [\"usage\", \"waste\"].includes(x.movementType))", "planning.filter((x) => x.quantity <= x.min \|\| (x.daysCover !== null && x.daysCover <= 7))", "new Date().toISOString().slice(0, 10)", "low.slice(0,3)"] |
| sorting | ["[...new Set(data.inventory.map((i) => i.category).filter(Boolean))].sort()", "data.inventory .map((item) => { const consumed = recent .filter((x) => x.inventoryId === item.id && [\"usage\", \"waste\"].includes(x.movementType)) .reduce((s, x) => s + Math.abs(x.quantity), 0), dailyUse = consumed / 30, daysCover = dailyUse > 0 ? item.quantity / dailyUse : null, reorderQty = Math.max(0, item.min * 2 - item.quantity); return { ...item, consumed, dailyUse, daysCover, reorderQty, reorderCost: reorderQty * item.cost }; }) .sort((a, b) => (a.daysCover ?? 9999) - (b.daysCover ?? 9999))"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 2809, "label": "Add stock item", "handler": "() => setEditing({})", "disabled": false}, {"line": 2866, "label": "<icon/dynamic>", "handler": "()=>setMoving(item)", "disabled": false}, {"line": 2868, "label": "Mark ordered", "handler": "()=>updateRequest(request,\"ordered\")", "disabled": false}, {"line": 2868, "label": "Resolve", "handler": "()=>updateRequest(request,\"resolved\")", "disabled": false}, {"line": 2870, "label": "Current inventory", "handler": "() => setTab(\"inventory\")", "disabled": false}, {"line": 2876, "label": "Movement history", "handler": "() => setTab(\"activity\")", "disabled": false}, {"line": 2882, "label": "Reorder & forecasting", "handler": "() => setTab(\"planning\")", "disabled": false}, {"line": 2937, "label": "Edit details", "handler": "() => setEditing(item)", "disabled": false}, {"line": 2938, "label": "Record movement", "handler": "() => setMoving(item)", "disabled": false}, {"line": 2951, "label": "<icon/dynamic>", "handler": "()=>setMovementFilter(x)", "disabled": false}, {"line": 2952, "label": "Export CSV", "handler": "exportMovements", "disabled": false}, {"line": 3012, "label": "Add stock", "handler": "()=>setMoving(item)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No matching stock items", "No stock movements yet", "No item currently needs a suggested reorder."] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:2739](../../frontend/src/App.jsx#L2739)

## T-W-StockEditor — Stock Editor table/list

| Property | Finding |
| --- | --- |
| screen | W-StockEditor |
| purpose | Track stock movements, minimums, planning and chef purchase requests through Stock Editor. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 3138, "label": "<icon/dynamic>", "handler": "", "disabled": "busy"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:3039](../../frontend/src/App.jsx#L3039)

## T-W-StockMovement — Stock Movement table/list

| Property | Finding |
| --- | --- |
| screen | W-StockMovement |
| purpose | Track stock movements, minimums, planning and chef purchase requests through Stock Movement. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 3231, "label": "Record movement", "handler": "", "disabled": "busy"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:3145](../../frontend/src/App.jsx#L3145)

## T-W-Finance — Finance table/list

| Property | Finding |
| --- | --- |
| screen | W-Finance |
| purpose | Review daily closing, ledger, purchases, balances and reports through Finance. |
| columns | ["Date", "Type", "Category / Description", "Payment", "Reference", "Amount", "<dynamic>"] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["data.orders .filter((o) => o.paymentStatus === \"paid\")", "entries .filter((x) => x.entryType === \"income\")", "entries .filter((x) => x.entryType === \"expense\")"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 3268, "label": "Add finance entry", "handler": "() => setCreating(true)", "disabled": false}, {"line": 3345, "label": "<icon/dynamic>", "handler": "() => remove(entry)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No finance entries"] |
| status | FRONTEND_ONLY |

Evidence: [frontend/src/App.jsx:3238](../../frontend/src/App.jsx#L3238)

## T-W-FinanceEntry — Finance Entry table/list

| Property | Finding |
| --- | --- |
| screen | W-FinanceEntry |
| purpose | Review daily closing, ledger, purchases, balances and reports through Finance Entry. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["new Date().toISOString().slice(0, 10)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 3499, "label": "Save finance entry", "handler": "", "disabled": "busy"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:3397](../../frontend/src/App.jsx#L3397)

## T-W-FinanceCalendar — Finance Calendar table/list

| Property | Finding |
| --- | --- |
| screen | W-FinanceCalendar |
| purpose | Review daily closing, ledger, purchases, balances and reports through Finance Calendar. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["data.orders.filter( (o) => o.paymentStatus === \"paid\" && dateKey(o.completedAt) === key, )", "entries .filter( (x) => x.entryType === \"expense\" && dateKey(x.entryDate) === key, )", "payments .filter((x) => dateKey(x.paymentDate) === key)", "purchases .filter((x) => dateKey(x.purchaseDate) === key)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 3601, "label": "<icon/dynamic>", "handler": "() => setMonth(new Date(year, monthIndex - 1, 1))", "disabled": false}, {"line": 3604, "label": "Today", "handler": "() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))", "disabled": false}, {"line": 3612, "label": "<icon/dynamic>", "handler": "() => setMonth(new Date(year, monthIndex + 1, 1))", "disabled": false}, {"line": 3631, "label": "<icon/dynamic>", "handler": "() => selectDate(key)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No records"] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:3525](../../frontend/src/App.jsx#L3525)

## T-W-MonthlyRevenueReport — Monthly Revenue Report table/list

| Property | Finding |
| --- | --- |
| screen | W-MonthlyRevenueReport |
| purpose | Review daily closing, ledger, purchases, balances and reports through Monthly Revenue Report. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["data.orders.filter((order) => order.paymentStatus === \"paid\" && dateKey(order.completedAt).startsWith(prefix))", "(data.financeEntries \|\| []).filter((entry) => dateKey(entry.entryDate).startsWith(prefix))", "(data.supplierPayments \|\| []).filter((payment) => dateKey(payment.paymentDate).startsWith(prefix))", "entries.filter((entry) => entry.entryType === \"income\")", "entries.filter((entry) => entry.entryType === \"expense\")", "orders.filter((order) => dateKey(order.completedAt) === key)", "day.key.slice(-2)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 3701, "label": "Export monthly CSV", "handler": "exportMonth", "disabled": false}, {"line": 3703, "label": "`${day.key}: ${money(day.total)} from ${day.bills} bills`", "handler": "", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No paid bills in this month."] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:3678](../../frontend/src/App.jsx#L3678)

## T-W-DailyFinanceDetails — Daily Finance Details table/list

| Property | Finding |
| --- | --- |
| screen | W-DailyFinanceDetails |
| purpose | Selected day → closing KPIs → daily / purchases / ledger / analytics tabs. Includes supplier balances, paid bills, transactions and trailing 30-day analytics. |
| columns | ["Bill", "Type / Table", "Customer", "Payment", "Completed", "Total", "Date / Invoice", "Shop or dealer", "Products / Description", "Purchase total", "Paid", "Still due", "Action", "Date", "Type", "Category", "Description", "Amount"] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["data.orders.filter( (o) => o.paymentStatus === \"paid\" && dateKey(o.completedAt) === date, )", "entries.filter((x) => dateKey(x.entryDate) === date)", "dailyEntries .filter((x) => x.entryType === \"expense\")", "dailyEntries .filter((x) => x.entryType === \"income\")", "purchases.filter((x) => dateKey(x.purchaseDate) === date)", "payments.filter((x) => dateKey(x.paymentDate) === date)", "payments .filter((x) => x.purchaseId === p.id)", "data.orders.filter((o) => o.paymentStatus === \"paid\" && inReportRange(o.completedAt))", "entries.filter((x) => inReportRange(`${dateKey(x.entryDate)}T12:00:00`) && dateKey(x.entryDate) >= dateKey(reportStart))", "payments.filter((x) => inReportRange(`${dateKey(x.paymentDate)}T12:00:00`) && dateKey(x.paymentDate) >= dateKey(reportStart))", "reportEntries.filter((x)=>x.entryType===\"income\")", "reportEntries.filter((x)=>x.entryType===\"expense\")", "Object.entries(reportOrders.reduce((acc,o)=>{const key=o.paymentMethod\|\|\"Unspecified\";acc[key]=(acc[key]\|\|0)+Number(o.total\|\|0);return acc},{})).sort((a,b)=>b[1]-a[1])", "Object.entries(reportEntries.filter((x)=>x.entryType===\"expense\").reduce((acc,x)=>{acc[x.category]=(acc[x.category]\|\|0)+x.amount;return acc},{})).sort((a,b)=>b[1]-a[1])", "reportOrders.filter((o)=>dateKey(o.completedAt)===key)", "reportEntries.filter((x)=>dateKey(x.entryDate)===key&&x.entryType===\"expense\")", "reportPayments.filter((x)=>dateKey(x.paymentDate)===key)"] |
| sorting | ["Object.entries(reportOrders.reduce((acc,o)=>{const key=o.paymentMethod\|\|\"Unspecified\";acc[key]=(acc[key]\|\|0)+Number(o.total\|\|0);return acc},{})).sort((a,b)=>b[1]-a[1])", "Object.entries(reportEntries.filter((x)=>x.entryType===\"expense\").reduce((acc,x)=>{acc[x.category]=(acc[x.category]\|\|0)+x.amount;return acc},{})).sort((a,b)=>b[1]-a[1])"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 3799, "label": "Back to calendar", "handler": "onBack", "disabled": false}, {"line": 3812, "label": "Export report", "handler": "exportDailyReport", "disabled": false}, {"line": 3816, "label": "Daily closing", "handler": "() => setTab(\"daily\")", "disabled": false}, {"line": 3822, "label": "Products & dealers", "handler": "() => setTab(\"purchases\")", "disabled": false}, {"line": 3828, "label": "Income & expenses", "handler": "() => setTab(\"ledger\")", "disabled": false}, {"line": 3834, "label": "30-day analytics", "handler": "() => setTab(\"analytics\")", "disabled": false}, {"line": 3957, "label": "View dealer balances", "handler": "() => setTab(\"purchases\")", "disabled": false}, {"line": 3969, "label": "Add product purchase", "handler": "() => setCreatingPurchase(true)", "disabled": false}, {"line": 4025, "label": "Pay dealer", "handler": "() => setPaying(p)", "disabled": false}, {"line": 4029, "label": "<icon/dynamic>", "handler": "() => removePurchase(p)", "disabled": false}, {"line": 4053, "label": "Add income / expense", "handler": "() => setCreatingEntry(true)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No product purchases recorded", "No paid bills in this period.", "No operating expenses in this period."] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:3706](../../frontend/src/App.jsx#L3706)

## T-W-Staff — Staff table/list

| Property | Finding |
| --- | --- |
| screen | W-Staff |
| purpose | Manage login accounts, kitchen roster, compensation fields and shifts through Staff. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | FRONTEND_ONLY |

Evidence: [frontend/src/App.jsx:4398](../../frontend/src/App.jsx#L4398)

## T-W-StaffManagement — Staff Management table/list

| Property | Finding |
| --- | --- |
| screen | W-StaffManagement |
| purpose | Team accounts → kitchen roster → attendance history. Compensation fields support daily/monthly pay; this is not a payroll processing system. |
| columns | ["Staff", "Role", "Check in", "Check out", "Working time", "Status"] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["shifts.filter( (s) => new Date(s.checkIn).toDateString() === new Date().toDateString(), )", "data.users.filter((u) => u.active)", "(data.kitchenStaff \|\| []).filter((u) => u.active)", "data.users.filter((u) => active(u.id))", "today.filter((s) => s.checkOut)", "staff.name .split(\" \") .map((x) => x[0]) .join(\"\") .slice(0, 2)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 4455, "label": "Add staff login", "handler": "() => setEditor({})", "disabled": false}, {"line": 4487, "label": "Staff Accounts", "handler": "() => setTab(\"team\")", "disabled": false}, {"line": 4493, "label": "Kitchen Team ( )", "handler": "() => setTab(\"kitchen\")", "disabled": false}, {"line": 4499, "label": "Working Time History", "handler": "() => setTab(\"history\")", "disabled": false}, {"line": 4528, "label": "Edit details", "handler": "() => setEditor(staff)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:4424](../../frontend/src/App.jsx#L4424)

## T-W-StaffEditor — Staff Editor table/list

| Property | Finding |
| --- | --- |
| screen | W-StaffEditor |
| purpose | Manage login accounts, kitchen roster, compensation fields and shifts through Staff Editor. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["e.target.value.replace(/\\D/g, \"\").slice(0, 6)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 4750, "label": "<icon/dynamic>", "handler": "() => setForm({ ...form, role: value })", "disabled": "disabled"}, {"line": 4781, "label": "<icon/dynamic>", "handler": "()=>setForm({...form,payType:value})", "disabled": false}, {"line": 4805, "label": "<icon/dynamic>", "handler": "", "disabled": false}, {"line": 4808, "label": "Delete staff", "handler": "() => setDeleteArmed(true)", "disabled": false}, {"line": 4809, "label": "Cancel", "handler": "() => setDeleteArmed(false)", "disabled": false}, {"line": 4809, "label": "<icon/dynamic>", "handler": "removeStaff", "disabled": "deleting"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:4680](../../frontend/src/App.jsx#L4680)

## T-W-RoleOverview — Role Overview table/list

| Property | Finding |
| --- | --- |
| screen | W-RoleOverview |
| purpose | Role-specific queue KPIs → primary queue shortcut → four recent items. Waiter attribution uses name matching, not stable staff IDs. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["data.orders.filter((order) => dateKey(order.createdAt) === today)", "todayOrders.filter((order) => order.orderType !== \"parcel\" && String(order.waiter \|\| \"\").toLowerCase().includes(firstName.toLowerCase()))", "mine.filter((order) => order.status === \"ready\")", "mine.filter((order) => order.status === \"preparing\")", "mine.filter((order) => order.status === \"new\")", "data.tables.filter((table) => table.status === \"occupied\")", "data.menu.filter((item) => String(item.category).toLowerCase() === \"juices\" && item.available)", "data.menu.filter((item) => String(item.category).toLowerCase() !== \"juices\" && !item.isCombo && item.available)", "data.tables.filter(t => t.status === \"available\")", "mine.filter(o => o.paymentStatus === \"paid\")", "mine.filter(o => o.status === \"ready\")", "mine.filter(o => [\"new\", \"preparing\"].includes(o.status))", "data.menu.filter(i=>String(i.category).toLowerCase()!==\"juices\"&&!i.isCombo&&!i.available)", "data.menu.filter(i=>String(i.category).toLowerCase()===\"juices\"&&!i.available)", "[...mine].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4)", "[...mine].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))"] |
| sorting | ["[...mine].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4)", "[...mine].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 4915, "label": "<icon/dynamic>", "handler": "()=>setPage(config.primary[0])", "disabled": false}, {"line": 4915, "label": "<icon/dynamic>", "handler": "()=>setPage(config.secondary[0])", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No active work needs attention."] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:4874](../../frontend/src/App.jsx#L4874)

## T-W-Bookings — Bookings table/list

| Property | Finding |
| --- | --- |
| screen | W-Bookings |
| purpose | Calendar → selected day → confirmed table bookings → create or cancel. No booking edit or seating action. Past/cancelled records are not returned by the current state feed. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["bookings.filter((booking) => booking.bookingDate === selectedDate)", "bookings.filter((booking) => booking.bookingDate === key)", "daily.slice(0,2)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 5000, "label": "Calendar", "handler": "() => setSelectedDate(null)", "disabled": false}, {"line": 5000, "label": "Add booking", "handler": "() => open(selectedDate)", "disabled": false}, {"line": 5008, "label": "<icon/dynamic>", "handler": "() => cancelBooking(booking.id)", "disabled": false}, {"line": 5013, "label": "Add booking", "handler": "() => open(dateKey(today))", "disabled": false}, {"line": 5016, "label": "<icon/dynamic>", "handler": "() => setMonth(new Date(year, monthIndex - 1, 1))", "disabled": false}, {"line": 5017, "label": "Today", "handler": "() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))", "disabled": false}, {"line": 5018, "label": "<icon/dynamic>", "handler": "() => setMonth(new Date(year, monthIndex + 1, 1))", "disabled": false}, {"line": 5024, "label": "<icon/dynamic>", "handler": "() => setSelectedDate(key)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No bookings for this date", "No bookings"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:4979](../../frontend/src/App.jsx#L4979)

## T-W-WaiterOrders — Waiter Orders table/list

| Property | Finding |
| --- | --- |
| screen | W-WaiterOrders |
| purpose | Take orders and additional rounds, coordinate handoff and settle bills through Waiter Orders. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["data.orders.filter((order) => { if (order.orderType === \"parcel\") return false; const waiter = String(order.waiter \|\| \"\").toLowerCase(); return !firstName \|\| waiter.includes(firstName); })", "mine.filter((order) => dateKey(order.createdAt) === selectedDate)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 5048, "label": "Calendar", "handler": "() => setSelectedDate(null)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:5033](../../frontend/src/App.jsx#L5033)

## T-W-BookingModal — Booking Modal table/list

| Property | Finding |
| --- | --- |
| screen | W-BookingModal |
| purpose | Phone, date, time, duration and available table. This reserves a restaurant table, not a room. API rejects past times and overlaps. No guest account, rate, deposit or stay. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["bookings.filter((booking) => booking.tableId === table.id && booking.bookingDate === form.bookingDate && bookingMinutes(booking.bookingTime) < requestedEnd && bookingMinutes(booking.bookingTime) + Number(booking.durationMinutes) > requestedStart)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 5097, "label": "<icon/dynamic>", "handler": "", "disabled": "!form.tableId \|\| !form.customerPhone \|\| busy"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:5053](../../frontend/src/App.jsx#L5053)

## T-W-OrderBuilder — Order Builder table/list

| Property | Finding |
| --- | --- |
| screen | W-OrderBuilder |
| purpose | Category choices → menu cards → quantities/cart → submit. New order or additional batch depends on table order. No web special-request input identified. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["c .map((i) => (i.menuId === id ? { ...i, qty: i.qty + d } : i)) .filter((i) => i.qty > 0)", "data.menu .filter((m) => cat === \"All\" \|\| m.category === cat)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 5384, "label": "<icon/dynamic>", "handler": "() => setCat(c)", "disabled": false}, {"line": 5397, "label": "<icon/dynamic>", "handler": "() => add(m.id)", "disabled": "!m.available"}, {"line": 5442, "label": "<icon/dynamic>", "handler": "() => qty(i.menuId, -1)", "disabled": false}, {"line": 5446, "label": "<icon/dynamic>", "handler": "() => qty(i.menuId, 1)", "disabled": false}, {"line": 5477, "label": " ", "handler": "send", "disabled": "!cart.length \|\| sending"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:5333](../../frontend/src/App.jsx#L5333)

## T-W-Chef — Chef table/list

| Property | Finding |
| --- | --- |
| screen | W-Chef |
| purpose | Prepare tickets and mark batches ready through Chef. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["active.filter((order) => order.orderType !== \"parcel\")", "active.filter((order) => order.orderType === \"parcel\")", "active.filter((o) => o.orderType === \"parcel\")", "active.filter((o) => o.orderType !== \"parcel\")", "orders.filter((o) => o.status === \"ready\")", "orders.filter((o) => o.status === \"new\")", "orders.filter((o) => o.status === \"preparing\")"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No orders in this queue right now."] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:5829](../../frontend/src/App.jsx#L5829)

## T-W-ChefStockBooking — Chef Stock Booking table/list

| Property | Finding |
| --- | --- |
| screen | W-ChefStockBooking |
| purpose | Track stock movements, minimums, planning and chef purchase requests through Chef Stock Booking. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [{"line": 5963, "tag": "input", "label": "Search ingredient or category", "type": "text", "value": "query", "required": false, "defaultValue": "", "disabled": false, "condition": [], "handler": "(event)=>setQuery(event.target.value)"}] |
| filters | ["requests.filter((request)=>request.status!==\"resolved\")", "inventory.filter((item)=>item.quantity<=item.min)", "inventory.filter((item)=>`${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>(a.quantity/a.min\|\|0)-(b.quantity/b.min\|\|0))", "inventory.filter((item)=>`${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()))"] |
| sorting | ["inventory.filter((item)=>`${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>(a.quantity/a.min\|\|0)-(b.quantity/b.min\|\|0))"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 5964, "label": "Book this stock", "handler": "()=>setBooking(item)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No ingredients found"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:5957](../../frontend/src/App.jsx#L5957)

## T-W-ChefStockRequestModal — Chef Stock Request Modal table/list

| Property | Finding |
| --- | --- |
| screen | W-ChefStockRequestModal |
| purpose | Track stock movements, minimums, planning and chef purchase requests through Chef Stock Request Modal. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 5973, "label": "Cancel", "handler": "close", "disabled": "busy"}, {"line": 5973, "label": "<icon/dynamic>", "handler": "", "disabled": "busy\|\|Number(quantity)<=0"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:5970](../../frontend/src/App.jsx#L5970)

## T-W-Juicer — Juicer table/list

| Property | Finding |
| --- | --- |
| screen | W-Juicer |
| purpose | Prepare tickets and mark batches ready through Juicer. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["active.filter((order) => order.orderType !== \"parcel\")", "active.filter((order) => order.orderType === \"parcel\")", "data.menu.filter(item=>String(item.category).toLowerCase()===\"juices\")", "active.filter(order => order.status === \"ready\")", "active.filter(order => order.orderType === \"parcel\")", "active.filter(order => order.orderType !== \"parcel\")", "active.filter(o=>o.status===\"new\")", "active.filter(o=>o.status===\"preparing\")", "active.filter(o=>o.status===\"ready\")"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No juice items in this queue right now."] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:5976](../../frontend/src/App.jsx#L5976)

## T-W-ChefDishes — Chef Dishes table/list

| Property | Finding |
| --- | --- |
| screen | W-ChefDishes |
| purpose | Manage dishes, images, prices, availability and combo composition through Chef Dishes. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [{"line": 6014, "tag": "input", "label": "Search dishes…", "type": "text", "value": "query", "required": false, "defaultValue": "", "disabled": false, "condition": [], "handler": "(event) => setQuery(event.target.value)"}] |
| filters | ["data.menu.filter((item) => !item.isCombo && (juicer ? String(item.category).toLowerCase() === \"juices\" : String(item.category).toLowerCase() !== \"juices\") && item.name.toLowerCase().includes(query.toLowerCase()))", "dishes.filter((item) => item.available)", "dishes.filter((item) => !item.available)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 6019, "label": "Mark completed", "handler": "() => setAvailability(item, false)", "disabled": false}, {"line": 6019, "label": "Make available", "handler": "() => setAvailability(item, true)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No dishes found"] |
| status | IMPLEMENTED |

Evidence: [frontend/src/App.jsx:6004](../../frontend/src/App.jsx#L6004)

## T-W-ChefManagement — Chef Management table/list

| Property | Finding |
| --- | --- |
| screen | W-ChefManagement |
| purpose | Manage login accounts, kitchen roster, compensation fields and shifts through Chef Management. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["staff.filter((x) => x.active)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 6046, "label": "<icon/dynamic>", "handler": "() => setJuicerEditor(true)", "disabled": "!!juicer"}, {"line": 6046, "label": "Add chef", "handler": "() => setEditor({})", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No chefs added yet"] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:6024](../../frontend/src/App.jsx#L6024)

## T-W-KitchenStaffEditor — Kitchen Staff Editor table/list

| Property | Finding |
| --- | --- |
| screen | W-KitchenStaffEditor |
| purpose | Manage login accounts, kitchen roster, compensation fields and shifts through Kitchen Staff Editor. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["String(member.joinedOn).slice(0, 10)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 6176, "label": "<icon/dynamic>", "handler": "()=>setForm({...form,payType:value})", "disabled": false}, {"line": 6199, "label": "<icon/dynamic>", "handler": "", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No PIN or separate login will be created."] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [frontend/src/App.jsx:6095](../../frontend/src/App.jsx#L6095)

## T-W-AttendancePanel — Attendance Panel table/list

| Property | Finding |
| --- | --- |
| screen | W-AttendancePanel |
| purpose | Web component exists but staff sidebar entries are commented out; Shell redirects unsupported page keys. Treat as dormant, not reachable staff navigation. |
| columns | ["Date", "Check in", "Check out", "Working time", "Status"] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["record.shifts.filter(s=>new Date(s.checkIn).toDateString()===new Date().toDateString())"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 19, "label": "<icon/dynamic>", "handler": "toggle", "disabled": "busy"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["Loading attendance…"] |
| status | FRONTEND_ONLY |

Evidence: [frontend/src/AttendancePanel.jsx:5](../../frontend/src/AttendancePanel.jsx#L5)

## T-M-NativeLanding — Native Landing table/list

| Property | Finding |
| --- | --- |
| screen | M-NativeLanding |
| purpose | PIN authentication, identity and profile editing through Native Landing. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 31, "label": "Login", "handler": "login", "disabled": false}, {"line": 31, "label": "Call to order", "handler": "()=>Linking.openURL('tel:+917904951736')", "disabled": false}, {"line": 31, "label": "Instagram", "handler": "()=>Linking.openURL('https://www.instagram.com/knock_out_azhagiyamandabam/')", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/App.js:31](../../mobile/App.js#L31)

## T-M-Login — Login table/list

| Property | Finding |
| --- | --- |
| screen | M-Login |
| purpose | Web supports tenant Hotel ID + PIN and no-Hotel-ID master/applicant path. Native requires four-digit Hotel ID and six-digit PIN, so it does not expose the same login paths. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["v.replace(/\\D/g,'').slice(0,4)", "v.replace(/\\D/g,'').slice(0,6)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 36, "label": "<icon/dynamic>", "handler": "()=>input.current?.focus()", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/App.js:36](../../mobile/App.js#L36)

## T-M-MasterMobile — Master Mobile table/list

| Property | Finding |
| --- | --- |
| screen | M-MasterMobile |
| purpose | Read-oriented company/user and revenue overview; no parity with web approval, company controls or SaaS billing management. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["item.name.split(' ').map(x=>x[0]).join('').slice(0,2)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 45, "label": "<icon/dynamic>", "handler": "logout", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [mobile/App.js:45](../../mobile/App.js#L45)

## T-M-Attendance — Attendance table/list

| Property | Finding |
| --- | --- |
| screen | M-Attendance |
| purpose | Native staff landing tab: check in/out and recent eight shifts. This is employee timekeeping, not guest arrival/departure. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["data.shifts.slice(0,8)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 47, "label": "busy?'Please wait…':active?'Check out now':'Check in now'", "handler": "toggle", "disabled": "busy"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [mobile/App.js:47](../../mobile/App.js#L47)

## T-M-AdminOverview — Admin Overview table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminOverview |
| purpose | Revenue and operational KPIs → occupancy/status graphic → recent orders and stock alerts. Metrics use loaded state rather than an unlimited historical dataset. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["state.orders.filter(o=>!['completed','served'].includes(o.status))", "(state.attendance\|\|[]).filter(x=>!x.checkOut)", "state.tables.filter(t=>t.status==='occupied')", "state.tables.filter(t=>t.status===status)", "state.orders.slice(0,5)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | FRONTEND_ONLY |

Evidence: [mobile/App.js:50](../../mobile/App.js#L50)

## T-M-AdminTables — Admin Tables table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminTables |
| purpose | Create tables, inspect active service and change table state through Admin Tables. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 54, "label": "<icon/dynamic>", "handler": "()=>setCreating(true)", "disabled": false}, {"line": 54, "label": "T seats ·", "handler": "()=>setSelected(item.id)", "disabled": false}, {"line": 54, "label": "<icon/dynamic>", "handler": "()=>setSelected(null)", "disabled": false}, {"line": 54, "label": "Delete table", "handler": "remove", "disabled": "!!order"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/App.js:54](../../mobile/App.js#L54)

## T-M-AdminMenu — Admin Menu table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminMenu |
| purpose | Manage dishes, images, prices, availability and combo composition through Admin Menu. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["state.menu.filter(x=>x.available)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | FRONTEND_ONLY |

Evidence: [mobile/App.js:57](../../mobile/App.js#L57)

## T-M-AdminStaff — Admin Staff table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminStaff |
| purpose | Manage login accounts, kitchen roster, compensation fields and shifts through Admin Staff. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["item.name.split(' ').map(x=>x[0]).join('').slice(0,2)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | FRONTEND_ONLY |

Evidence: [mobile/App.js:58](../../mobile/App.js#L58)

## T-M-AdminBillingModal — Admin Billing Modal table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminBillingModal |
| purpose | Take orders and additional rounds, coordinate handoff and settle bills through Admin Billing Modal. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 59, "label": "Card / UPI payment", "handler": "()=>finish('Card / UPI')", "disabled": false}, {"line": 59, "label": "Cash payment", "handler": "()=>finish('Cash')", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/App.js:59](../../mobile/App.js#L59)

## T-M-TableList — Table List table/list

| Property | Finding |
| --- | --- |
| screen | M-TableList |
| purpose | Create tables, inspect active service and change table state through Table List. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["live.filter(x=>x.key==='available')", "live.filter(x=>['occupied','preparing','received'].includes(x.key))", "live.filter(x=>['ready','collected'].includes(x.key))", "live.filter(x=>x.key==='reserved')", "live.filter(x=>x.key==='cleaning')"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 63, "label": "T seats ·", "handler": "()=>setSelected(item)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/App.js:63](../../mobile/App.js#L63)

## T-M-OrderModal — Order Modal table/list

| Property | Finding |
| --- | --- |
| screen | M-OrderModal |
| purpose | Create tables, inspect active service and change table state through Order Modal. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["c.map(x=>x.menuId===id?{...x,qty:x.qty+delta}:x).filter(x=>x.qty>0)", "state.menu.filter(m=>category==='All'\|\|m.category===category)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 75, "label": "<icon/dynamic>", "handler": "close", "disabled": false}, {"line": 75, "label": "<icon/dynamic>", "handler": "()=>status(x)", "disabled": "busy"}, {"line": 77, "label": "<icon/dynamic>", "handler": "()=>setCategory(c)", "disabled": false}, {"line": 77, "label": "<icon/dynamic>", "handler": "()=>add(item.id)", "disabled": "!item.available\|\|selectedQty>0"}, {"line": 77, "label": "<icon/dynamic>", "handler": "()=>qty(item.id,-1)", "disabled": false}, {"line": 77, "label": "<icon/dynamic>", "handler": "()=>qty(item.id,1)", "disabled": false}, {"line": 77, "label": "Preview order", "handler": "()=>setPreviewing(true)", "disabled": "!cart.length\|\|busy"}, {"line": 78, "label": "Edit order", "handler": "()=>setPreviewing(false)", "disabled": "busy"}, {"line": 78, "label": "<icon/dynamic>", "handler": "send", "disabled": "busy"}, {"line": 79, "label": "<icon/dynamic>", "handler": "previewing?()=>setPreviewing(false):close", "disabled": false}, {"line": 79, "label": "<icon/dynamic>", "handler": "()=>status(x)", "disabled": "!!existing\|\|busy"}, {"line": 79, "label": "Add a new order", "handler": "()=>{setCart([]);setPreviewing(false);setAdding(true)}", "disabled": false}, {"line": 79, "label": "Complete order — send bill", "handler": "requestBill", "disabled": "busy\|\|!['received','served'].includes(existing.status)"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/App.js:66](../../mobile/App.js#L66)

## T-M-OrderList — Order List table/list

| Property | Finding |
| --- | --- |
| screen | M-OrderList |
| purpose | Take orders and additional rounds, coordinate handoff and settle bills through Order List. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["state.orders.filter(o=>o.orderType!=='parcel')", "orders.filter(o=>dateKey(o.createdAt)===selectedDate)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 81, "label": "Calendar ·", "handler": "()=>setSelectedDate(null)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No orders for this date"] |
| status | IMPLEMENTED |

Evidence: [mobile/App.js:81](../../mobile/App.js#L81)

## T-M-ChefScreen — Chef Screen table/list

| Property | Finding |
| --- | --- |
| screen | M-ChefScreen |
| purpose | Prepare tickets and mark batches ready through Chef Screen. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["orders.filter(o=>o.orderType!=='parcel')", "orders.filter(o=>o.orderType==='parcel')"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/App.js:83](../../mobile/App.js#L83)

## T-M-JuicerScreen — Juicer Screen table/list

| Property | Finding |
| --- | --- |
| screen | M-JuicerScreen |
| purpose | Prepare tickets and mark batches ready through Juicer Screen. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["orders.filter(o=>o.status==='ready')", "orders.filter(o=>o.status!=='ready')"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/App.js:84](../../mobile/App.js#L84)

## T-M-ChefDishes — Chef Dishes table/list

| Property | Finding |
| --- | --- |
| screen | M-ChefDishes |
| purpose | Manage dishes, images, prices, availability and combo composition through Chef Dishes. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["state.menu.filter(item=>!item.isCombo&&(juices?String(item.category).toLowerCase()==='juices':String(item.category).toLowerCase()!=='juices'))", "dishes.filter(x=>x.available)", "dishes.filter(x=>!x.available)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 85, "label": "<icon/dynamic>", "handler": "()=>toggle(item)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/App.js:85](../../mobile/App.js#L85)

## T-M-ChefJuicerManagement — Chef Juicer Management table/list

| Property | Finding |
| --- | --- |
| screen | M-ChefJuicerManagement |
| purpose | Manage login accounts, kitchen roster, compensation fields and shifts through Chef Juicer Management. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 86, "label": "Create Juicer login", "handler": "()=>setShow(true)", "disabled": false}, {"line": 86, "label": "<icon/dynamic>", "handler": "()=>setShow(false)", "disabled": false}, {"line": 86, "label": "Daily salary", "handler": "()=>setForm({...form,payType:'daily'})", "disabled": false}, {"line": 86, "label": "Monthly salary", "handler": "()=>setForm({...form,payType:'monthly'})", "disabled": false}, {"line": 86, "label": "busy?'Creating…':'Create login'", "handler": "create", "disabled": "busy\|\|!form.name.trim()"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [mobile/App.js:86](../../mobile/App.js#L86)

## T-M-OperationsCalendarMobile — Operations Calendar Mobile table/list

| Property | Finding |
| --- | --- |
| screen | M-OperationsCalendarMobile |
| purpose | PIN authentication, identity and profile editing through Operations Calendar Mobile. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["orders.filter(x=>dateKey(x.createdAt)===key(day))", "daily.filter(x=>x.paymentStatus==='paid')"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 38, "label": "chevron-back", "handler": "()=>setMonth(new Date(year,mi-1,1))", "disabled": false}, {"line": 38, "label": "chevron-forward", "handler": "()=>setMonth(new Date(year,mi+1,1))", "disabled": false}, {"line": 38, "label": "<icon/dynamic>", "handler": "()=>onSelect(key(day))", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/AdminModules.js:35](../../mobile/AdminModules.js#L35)

## T-M-AdminDrawer — Admin Drawer table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminDrawer |
| purpose | PIN authentication, identity and profile editing through Admin Drawer. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["adminNavigation.filter(([id])=>group.ids.includes(id)&&canOpen(id,user))", "user.name.split(' ').map(x=>x[0]).join('').slice(0,2)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 42, "label": "KnockOUT PROPERTY MANAGEMENT Administrator", "handler": "()=>{}", "disabled": false}, {"line": 42, "label": "<icon/dynamic>", "handler": "()=>{select(id);close()}", "disabled": false}, {"line": 42, "label": "<icon/dynamic>", "handler": "logout", "disabled": false}, {"line": 42, "label": "<icon/dynamic>", "handler": "close", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/AdminModules.js:42](../../mobile/AdminModules.js#L42)

## T-M-AdminBookings — Admin Bookings table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminBookings |
| purpose | Reserve a restaurant table for a dated time interval and phone contact through Admin Bookings. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["bookings.filter(x=>x.bookingDate===selectedDate)", "bookings.filter(x=>x.bookingDate===key(day))"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 49, "label": "add", "handler": "()=>setCreating(true)", "disabled": false}, {"line": 49, "label": "trash-outline", "handler": "()=>cancel(item)", "disabled": false}, {"line": 49, "label": "Back to calendar", "handler": "()=>setSelectedDate(null)", "disabled": false}, {"line": 50, "label": "chevron-back", "handler": "()=>setMonth(new Date(year,mi-1,1))", "disabled": false}, {"line": 50, "label": "chevron-forward", "handler": "()=>setMonth(new Date(year,mi+1,1))", "disabled": false}, {"line": 50, "label": "<icon/dynamic>", "handler": "()=>setSelectedDate(key(day))", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [mobile/AdminModules.js:44](../../mobile/AdminModules.js#L44)

## T-M-AdminParcelsDay — Admin Parcels Day table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminParcelsDay |
| purpose | Create takeaway orders, record payment and coordinate collection through Admin Parcels Day. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["state.orders.filter(x=>x.orderType==='parcel')"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 59, "label": "add", "handler": "()=>setCreating(true)", "disabled": false}, {"line": 59, "label": "Mark Cash paid", "handler": "()=>markPaid(item,'Cash')", "disabled": false}, {"line": 59, "label": "Mark UPI paid", "handler": "()=>markPaid(item,'Card / UPI')", "disabled": false}, {"line": 59, "label": "item.paymentStatus==='paid'?'Complete — already paid':'Complete parcel'", "handler": "()=>item.paymentStatus==='paid'?finish(item):setPaying(item)", "disabled": false}, {"line": 59, "label": "Cash", "handler": "()=>finish(paying,'Cash')", "disabled": false}, {"line": 59, "label": "Card / UPI", "handler": "()=>finish(paying,'Card / UPI')", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/AdminModules.js:59](../../mobile/AdminModules.js#L59)

## T-M-AdminOrders — Admin Orders table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminOrders |
| purpose | Take orders and additional rounds, coordinate handoff and settle bills through Admin Orders. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["orders.filter(x=>dateKey(x.createdAt)===selectedDate)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 64, "label": "`Calendar · ${selectedDate.split('-').reverse().join('-')}`", "handler": "()=>setSelectedDate(null)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/AdminModules.js:61](../../mobile/AdminModules.js#L61)

## T-M-AdminParcels — Admin Parcels table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminParcels |
| purpose | Create takeaway orders, record payment and coordinate collection through Admin Parcels. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["props.state.orders.filter(x=>x.orderType==='parcel')", "all.filter(x=>dateKey(x.createdAt)===selectedDate)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 71, "label": "`Calendar · ${selectedDate.split('-').reverse().join('-')}`", "handler": "()=>setSelectedDate(null)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/AdminModules.js:67](../../mobile/AdminModules.js#L67)

## T-M-AdminMenuManager — Admin Menu Manager table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminMenuManager |
| purpose | Manage dishes, images, prices, availability and combo composition through Admin Menu Manager. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 76, "label": "add", "handler": "()=>setEditing({})", "disabled": false}, {"line": 76, "label": "<icon/dynamic>", "handler": "()=>setEditing(item)", "disabled": false}, {"line": 76, "label": "eye-off-outline", "handler": "()=>hide(item)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/AdminModules.js:76](../../mobile/AdminModules.js#L76)

## T-M-MenuEditor — Menu Editor table/list

| Property | Finding |
| --- | --- |
| screen | M-MenuEditor |
| purpose | Manage dishes, images, prices, availability and combo composition through Menu Editor. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["old.filter(x=>x.menuId!==id)", "state.menu.filter(x=>!x.isCombo&&x.id!==item?.id)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 78, "label": "Dish / drink", "handler": "()=>setCombo(false)", "disabled": false}, {"line": 78, "label": "Combo offer", "handler": "()=>setCombo(true)", "disabled": false}, {"line": 78, "label": "remove", "handler": "()=>bump(food.id,-1)", "disabled": false}, {"line": 78, "label": "add", "handler": "()=>bump(food.id,1)", "disabled": false}, {"line": 78, "label": "item.imageUrl?'Replace food photo':'Upload food photo'", "handler": "photo", "disabled": false}, {"line": 78, "label": "busy?'Saving…':'Save menu item'", "handler": "save", "disabled": "busy\|\|!form.name\|\|!form.price\|\|(combo&&!components.length)"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/AdminModules.js:78](../../mobile/AdminModules.js#L78)

## T-M-AdminStock — Admin Stock table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminStock |
| purpose | Track stock movements, minimums, planning and chef purchase requests through Admin Stock. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [{"line": 82, "tag": "TextInput", "label": "Search stock or category…", "type": "text", "value": "query", "required": false, "defaultValue": "", "disabled": false, "condition": ["view==='inventory'"], "handler": "setQuery"}] |
| filters | ["inventory.filter(x=>x.quantity<=x.min)", "transactions.filter(x=>new Date(x.createdAt).getTime()>=cutoff)", "recent.filter(x=>x.movementType==='usage')", "recent.filter(x=>x.movementType==='waste')", "inventory.map(item=>{const consumed=recent.filter(x=>x.inventoryId===item.id&&['usage','waste'].includes(x.movementType)).reduce((n,x)=>n+Math.abs(x.quantity),0),daily=consumed/30,days=daily?item.quantity/daily:null,reorder=Math.max(0,item.min*2-item.quantity);return{...item,consumed,days,reorder,reorderCost:reorder*item.cost}}).filter(x=>x.quantity<=x.min\|\|(x.days!==null&&x.days<=7)).sort((a,b)=>(a.days??9999)-(b.days??9999))", "inventory.map(item=>{const consumed=recent.filter(x=>x.inventoryId===item.id&&['usage','waste'].includes(x.movementType)).reduce((n,x)=>n+Math.abs(x.quantity),0),daily=consumed/30,days=daily?item.quantity/daily:null,reorder=Math.max(0,item.min*2-item.quantity);return{...item,consumed,days,reorder,reorderCost:reorder*item.cost}}).filter(x=>x.quantity<=x.min\|\|(x.days!==null&&x.days<=7))", "recent.filter(x=>x.inventoryId===item.id&&['usage','waste'].includes(x.movementType))", "inventory.filter(x=>`${x.name} ${x.category}`.toLowerCase().includes(query.toLowerCase()))"] |
| sorting | ["inventory.map(item=>{const consumed=recent.filter(x=>x.inventoryId===item.id&&['usage','waste'].includes(x.movementType)).reduce((n,x)=>n+Math.abs(x.quantity),0),daily=consumed/30,days=daily?item.quantity/daily:null,reorder=Math.max(0,item.min*2-item.quantity);return{...item,consumed,days,reorder,reorderCost:reorder*item.cost}}).filter(x=>x.quantity<=x.min\|\|(x.days!==null&&x.days<=7)).sort((a,b)=>(a.days??9999)-(b.days??9999))"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 82, "label": "add", "handler": "()=>setEditing({})", "disabled": false}, {"line": 82, "label": "x", "handler": "()=>setView(x)", "disabled": false}, {"line": 82, "label": "Move stock", "handler": "()=>setMoving(item)", "disabled": false}, {"line": 82, "label": "Edit", "handler": "()=>setEditing(item)", "disabled": false}, {"line": 82, "label": "Record purchase", "handler": "()=>setMoving(item)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [mobile/AdminModules.js:80](../../mobile/AdminModules.js#L80)

## T-M-StockEditor — Stock Editor table/list

| Property | Finding |
| --- | --- |
| screen | M-StockEditor |
| purpose | Track stock movements, minimums, planning and chef purchase requests through Stock Editor. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 84, "label": "busy?'Saving…':'Save stock item'", "handler": "save", "disabled": "busy\|\|!form.name\|\|!form.unit"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [mobile/AdminModules.js:84](../../mobile/AdminModules.js#L84)

## T-M-StockMovement — Stock Movement table/list

| Property | Finding |
| --- | --- |
| screen | M-StockMovement |
| purpose | Track stock movements, minimums, planning and chef purchase requests through Stock Movement. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 85, "label": "x", "handler": "()=>setType(x)", "disabled": false}, {"line": 85, "label": "Increase", "handler": "()=>setDirection(1)", "disabled": false}, {"line": 85, "label": "Decrease", "handler": "()=>setDirection(-1)", "disabled": false}, {"line": 85, "label": "busy?'Saving…':'Record movement'", "handler": "save", "disabled": "busy\|\|!Number(quantity)"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [mobile/AdminModules.js:85](../../mobile/AdminModules.js#L85)

## T-M-AdminFinance — Admin Finance table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminFinance |
| purpose | Review daily closing, ledger, purchases, balances and reports through Admin Finance. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["state.orders.filter(x=>x.paymentStatus==='paid'&&dateKey(x.completedAt)===key(day))"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 89, "label": "chevron-back", "handler": "()=>setMonth(new Date(year,mi-1,1))", "disabled": false}, {"line": 89, "label": "chevron-forward", "handler": "()=>setMonth(new Date(year,mi+1,1))", "disabled": false}, {"line": 89, "label": "<icon/dynamic>", "handler": "()=>setSelectedDate(key(day))", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/AdminModules.js:89](../../mobile/AdminModules.js#L89)

## T-M-FinanceDay — Finance Day table/list

| Property | Finding |
| --- | --- |
| screen | M-FinanceDay |
| purpose | Selected day’s financial summary and ledger/purchase/payment controls. Native does not reproduce all web analytics/report controls. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["(state.financeEntries\|\|[]).filter(x=>dateKey(x.entryDate)===date)", "state.orders.filter(x=>x.paymentStatus==='paid'&&dateKey(x.completedAt)===date)", "(state.supplierPurchases\|\|[]).filter(x=>dateKey(x.purchaseDate)===date)", "entries.filter(x=>x.entryType==='income')", "entries.filter(x=>x.entryType==='expense')", "payments.filter(x=>dateKey(x.paymentDate)===date)", "payments.filter(p=>p.purchaseId===x.id)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 91, "label": "arrow-back", "handler": "back", "disabled": false}, {"line": 91, "label": "Income / expense", "handler": "()=>setEntry(true)", "disabled": false}, {"line": 91, "label": "Dealer purchase", "handler": "()=>setPurchase(true)", "disabled": false}, {"line": 91, "label": "trash-outline", "handler": "()=>Alert.alert('Delete entry?',x.description,[{text:'Cancel'},{text:'Delete',style:'destructive',onPress:()=>remove(x.id)}])", "disabled": false}, {"line": 91, "label": "Record dealer payment", "handler": "()=>setPaying({...x,due})", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | IMPLEMENTED |

Evidence: [mobile/AdminModules.js:91](../../mobile/AdminModules.js#L91)

## T-M-AdminPeople — Admin People table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminPeople |
| purpose | Native accounts/kitchen toggle. No equivalent web history tab identified. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["item.name.split(' ').map(x=>x[0]).join('').slice(0,2)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 96, "label": "person-add-outline", "handler": "()=>mode==='accounts'?setStaff({}):setChef({})", "disabled": false}, {"line": 96, "label": "Portal accounts", "handler": "()=>setMode('accounts')", "disabled": false}, {"line": 96, "label": "Kitchen team", "handler": "()=>setMode('kitchen')", "disabled": false}, {"line": 96, "label": "· /", "handler": "()=>mode==='accounts'?setStaff(item):setChef(item)", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [mobile/AdminModules.js:96](../../mobile/AdminModules.js#L96)

## T-M-StaffEditor — Staff Editor table/list

| Property | Finding |
| --- | --- |
| screen | M-StaffEditor |
| purpose | Manage login accounts, kitchen roster, compensation fields and shifts through Staff Editor. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["v.replace(/\\D/g,'').slice(0,6)"] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 104, "label": "unavailable(value)?`${label} · created`:label", "handler": "()=>patch('role',value)", "disabled": "unavailable(value)"}, {"line": 104, "label": "Daily", "handler": "()=>patch('payType','daily')", "disabled": false}, {"line": 104, "label": "Monthly", "handler": "()=>patch('payType','monthly')", "disabled": false}, {"line": 104, "label": "busy?'Saving…':'Save staff login'", "handler": "save", "disabled": "busy\|\|!form.name\|\|String(form.pin).length!==6\|\|unavailable(form.role)"}, {"line": 104, "label": "Delete staff", "handler": "()=>setDeleteArmed(true)", "disabled": "busy"}, {"line": 104, "label": "Cancel", "handler": "()=>setDeleteArmed(false)", "disabled": "busy"}, {"line": 104, "label": "busy?'Deleting…':'Confirm delete'", "handler": "remove", "disabled": "busy"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [mobile/AdminModules.js:97](../../mobile/AdminModules.js#L97)

## T-M-AdminSettings — Admin Settings table/list

| Property | Finding |
| --- | --- |
| screen | M-AdminSettings |
| purpose | Native exposes business name, currency, GST, CGST and service charge. Server billing currently sets charge totals to zero. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 110, "label": "busy?'Saving…':'Save changes'", "handler": "save", "disabled": "busy\|\|!form.hotelName"}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | [] |
| status | PARTIALLY_IMPLEMENTED |

Evidence: [mobile/AdminModules.js:110](../../mobile/AdminModules.js#L110)

## T-M-PremiumDashboard — Premium Dashboard table/list

| Property | Finding |
| --- | --- |
| screen | M-PremiumDashboard |
| purpose | Today’s paid revenue hero → active orders, occupied tables and on-duty staff → permission-filtered shortcuts → floor summary → four recent orders. |
| columns | [] |
| columnNote | Cards/native text layout if no HTML headers; see screen content, not a missing table schema. |
| search | [] |
| filters | ["orders.filter(order=>dayKey(order.createdAt)===today)", "todaysOrders.filter(order=>order.paymentStatus==='paid')", "orders.filter(order=>!['completed','served','cancelled','canceled'].includes(order.status))", "[...orders].sort((a,b)=>(Date.parse(b.createdAt)\|\|0)-(Date.parse(a.createdAt)\|\|0)).slice(0,4)", "[...orders].sort((a,b)=>(Date.parse(b.createdAt)\|\|0)-(Date.parse(a.createdAt)\|\|0))", "tables.filter(table=>table.status==='occupied')", "[['tables','grid-outline','Floor plan','Manage table service'],['bookings','calendar-outline','Reservations','Plan the next arrival'],['orders','receipt-outline','Orders & billing','Follow every order'],['finance','wallet-outline','Finance','Review your accounts']].filter(([id])=>canOpen(id,user))", "(state.attendance\|\|[]).filter(item=>!item.checkOut)", "tables.filter(table=>table.status===status)"] |
| sorting | ["[...orders].sort((a,b)=>(Date.parse(b.createdAt)\|\|0)-(Date.parse(a.createdAt)\|\|0)).slice(0,4)", "[...orders].sort((a,b)=>(Date.parse(b.createdAt)\|\|0)-(Date.parse(a.createdAt)\|\|0))"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| rowActions | [{"line": 38, "label": "<icon/dynamic>", "handler": "()=>onNavigate(id)", "disabled": false}, {"line": 40, "label": "View all →", "handler": "()=>onNavigate('orders')", "disabled": false}] |
| bulkActions | No dedicated multi-select bulk operation identified |
| statusIndicators | Entity state badges/text where rendered; see status inventory |
| clickableColumns | Buttons/card handlers; no inferred row-wide interaction |
| emptyState | ["No tables yet. Add tables from the floor plan to begin."] |
| status | IMPLEMENTED |

Evidence: [mobile/PremiumDashboard.js:20](../../mobile/PremiumDashboard.js#L20)

## Collection limits

No universal pagination component was identified. Calendar/month views are date navigation, not proof of complete history. `/state` imposes retrieval limits; an empty historical day does not prove zero activity. No universal row selection/bulk operations were found. Raw filter/sort expressions above preserve actual searched fields and combination behavior.

Evidence: [backend/src/database.js:1](../../backend/src/database.js#L1); [frontend/src/App.jsx:1776](../../frontend/src/App.jsx#L1776)

## Shared order-table component

Columns: Order, Type / Guest, Created by, Items, Status, Started. Parent supplies order scope and ordering. No internal search, pagination, bulk selection or row action. Paid overrides the order-state badge. [Source: App.jsx:2689](../../frontend/src/App.jsx#L2689).

Legacy prototype tables are separate: inventory columns Item/SKU, Category, In Stock, Level, Unit Cost, Supplier, Adjust; orders columns Order, Table, Customer, Amount, Status, Time. They read localStorage rather than live tenant state. [Source: app.js:58–59](../../app.js#L58).
