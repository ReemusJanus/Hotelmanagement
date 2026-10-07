# Complete screen inventory

Discovery snapshot: 7 October 2026. **Source analysis, not live acceptance testing.** Application source was not modified. `IMPLEMENTED` means a source-backed implementation exists, not that production behavior was verified.

Each ID is a component/view, **not a URL**. Nested calendars, details and overlays are included because designers need their states. Shared visual helpers are separately accounted for in JSON componentAudit. Static expressions below preserve evidence where labels or field options are dynamic.

## W-PublicLanding — Public Landing

PIN authentication, identity and profile editing through Public Landing.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | anonymous |
| secondaryUsers | [] |
| entryPoints | ["Login"] |
| exitPoints | [] |
| contentHierarchy | Source order: Run hospitality beautifully. → One system that adapts to your business. → Everything your service team needs → Tables & Waiters → Kitchen Display → Parcel Operations → Business Intelligence → From first order to final bill. |
| displayedData | ["Run hospitality beautifully.", "One system that adapts to your business.", "Everything your service team needs", "Tables & Waiters", "Kitchen Display", "Parcel Operations", "Business Intelligence", "From first order to final bill."] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["anonymous"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["users", "master_users", "company_users"] |

Actions: ["KnockOUT HOSPITALITY OPERATING SYSTEM", "Register", "Login"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:213](../../frontend/src/App.jsx#L213)

## W-Login — Login

Web supports tenant Hotel ID + PIN and no-Hotel-ID master/applicant path. Native requires four-digit Hotel ID and six-digit PIN, so it does not expose the same login paths.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | anonymous |
| secondaryUsers | [] |
| entryPoints | ["CompanyApp"] |
| exitPoints | ["PublicLanding", "PublicCompanyRegistration"] |
| contentHierarchy | Web supports tenant Hotel ID + PIN and no-Hotel-ID master/applicant path. Native requires four-digit Hotel ID and six-digit PIN, so it does not expose the same login paths. |
| displayedData | [""] |
| cards | [] |
| charts | [] |
| tabs | ["[mode,setMode]=useState(routeFromPath)"] |
| filters | ["e.target.value.replace(/\\D/g,\"\").slice(0,4)", "e.target.value.replace(/\\D/g, \"\").slice(0, 6)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy, setBusy] = useState(false)"] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "setError(e.message)"] |
| permissions | {"roles": ["anonymous"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["PublicLanding", "PublicCompanyRegistration"] |
| apiUsed | ["resolvePortalLogin(hotelId, pin)"] |
| backendControllers | [] |
| entities | ["users", "master_users", "company_users"] |

Actions: [].

Forms: F-W-Login; tables/lists: T-W-Login.

Evidence: [frontend/src/App.jsx:274](../../frontend/src/App.jsx#L274)

## W-PublicCompanyRegistration — Public Company Registration

Company/admin/contact fields → package → period → submitted/temporary credential preview. “Sent” wording exceeds verified delivery evidence.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | notifications |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | anonymous |
| secondaryUsers | [] |
| entryPoints | ["Login"] |
| exitPoints | [] |
| contentHierarchy | Company/admin/contact fields → package → period → submitted/temporary credential preview. “Sent” wording exceeds verified delivery evidence. |
| displayedData | ["Sent for approval", "Choose how your business runs", "SELECT PACKAGE", "SUBSCRIPTION PERIOD"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["Tell us who you are, select a package and subscription period. No tenant database is created until approval, completed setup and payment."] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | ["setError(\"\")", "setError(err.message)"] |
| notifications | ["setError(\"\")", "setError(err.message)"] |
| permissions | {"roles": ["anonymous"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["submitCompanyRegistration(form)"] |
| backendControllers | [] |
| entities | ["notification_outbox"] |

Actions: ["Continue to temporary login", "Return to landing page", "Back to landing page", "<icon/dynamic>", "<icon/dynamic>", "<icon/dynamic>"].

Forms: F-W-PublicCompanyRegistration; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:375](../../frontend/src/App.jsx#L375)

## W-ApplicantOnboarding — Applicant Onboarding

Pending, rejected, approved activation and completed credential states. “Pay & activate” accepts a reference string; a verified payment gateway is not implemented.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | onboarding |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | applicant |
| secondaryUsers | [] |
| entryPoints | ["CompanyApp"] |
| exitPoints | [] |
| contentHierarchy | Pending, rejected, approved activation and completed credential states. “Pay & activate” accepts a reference string; a verified payment gateway is not implemented. |
| displayedData | ["Welcome to KnockOUT", "Opening your application", "Waiting for approval", "Application not approved", "Set up"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | ["setError(err.message)", "setError(\"\")"] |
| notifications | ["setError(err.message)", "setError(\"\")"] |
| permissions | {"roles": ["applicant"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["getOnboardingStatus(user.id,user.temporaryPin)", "completeCompanyRegistration({...form,id:user.id,pin:user.temporaryPin})"] |
| backendControllers | [] |
| entities | ["company_registration_requests", "companies", "tenant_subscriptions", "notification_outbox"] |

Actions: ["Login with permanent credentials", "Exit onboarding", "<icon/dynamic>"].

Forms: F-W-ApplicantOnboarding; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:382](../../frontend/src/App.jsx#L382)

## W-SuperAdminApp — Super Admin App

Network summary → company directory / registration requests → selected company tabs Overview, Users, SaaS Billing, Controls. No route changes for selection.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | master |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | ["App", "CompanyApp"] |
| exitPoints | ["MasterLogin", "MasterRegistrationDetail", "CompanyWorkspaceOverview", "MasterUsers", "MasterBilling", "CompanyControls", "MasterRegistrationRequests", "MasterNetworkOverview", "MasterActionModal", "MasterPinModal"] |
| contentHierarchy | Network summary → company directory / registration requests → selected company tabs Overview, Users, SaaS Billing, Controls. No route changes for selection. |
| displayedData | ["KnockOUT Master", ""] |
| cards | ["Status"] |
| charts | [] |
| tabs | ["[companySection, setCompanySection] = useState(\"overview\")", "[reviewBusy,setReviewBusy]=useState(null)"] |
| filters | ["registrationRequests.filter((request)=>request.status===\"pending\")", "companies.filter((company) => { const matchesStatus = companyFilter === \"all\" \|\| company.status === companyFilter \|\| (companyFilter === \"attention\" && (!company.online \|\| company.lowStock > 0)); const query = companySearch.trim().toLowerCase(); return matchesStatus && (!query \|\| [company.companyName, company.databaseName, company.adminName].some((value) => String(value \|\| \"\").toLowerCase().includes(query))); })", "(data.invoices\|\|[]).filter((invoice)=>invoice.companyId===selectedCompany.id)"] |
| search | [{"line": 567, "tag": "input", "label": "Search company, database or admin", "type": "text", "value": "companySearch", "required": false, "defaultValue": "", "disabled": false, "condition": ["selectedCompany", "selectedRegistration"], "handler": "(event)=>setCompanySearch(event.target.value)"}] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["MasterActionModal", "MasterPinModal"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No companies found"] |
| loadingStates | ["[reviewBusy,setReviewBusy]=useState(null)", "[actionBusy, setActionBusy] = useState(false)"] |
| errorStates | ["setNotice(e.message)", "setNotice(message)", "setNotice(\"\")", "toast(error.message)"] |
| notifications | ["setNotice(e.message)", "setNotice(message)", "setNotice(\"\")", "toast( `${company.companyName} ${company.status === \"active\" ? \"suspended\" : \"activated\"}`, )", "toast(e.message)", "toast(`${module} module ${enabled ? \"enabled\" : \"disabled\"} for ${company.companyName}`)", "toast(`${invoice.companyName} invoice marked ${status}`)", "toast(`${action.company.companyName} and its database were deleted`)", "toast(status===\"approve\"?`${request.companyName} approved · applicant can now complete setup and payment`:`${request.companyName} registration rejected`)", "toast(error.message)"] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["MasterLogin", "MasterRegistrationDetail", "CompanyWorkspaceOverview", "MasterUsers", "MasterBilling", "CompanyControls", "MasterRegistrationRequests", "MasterNetworkOverview", "MasterActionModal", "MasterPinModal"] |
| apiUsed | ["api(\"/state\")", "api(`/companies/${company.id}/status`, { method: \"PATCH\", body: JSON.stringify({ status: company.status === \"active\" ? \"suspended\" : \"active\", }), })", "api(`/companies/${company.id}/modules`, {method:\"PATCH\",body:JSON.stringify({module,enabled})})", "api(`/saas-invoices/${invoice.id}/status`, {method:\"PATCH\",body:JSON.stringify({status})})", "api(`/companies/${action.company.id}`, { method: \"DELETE\", body: JSON.stringify({ companyName: typed }), })", "api(`/company-registrations/${request.id}/${status}`,{method:\"POST\",body:JSON.stringify({reviewNote:status===\"reject\"?\"Application declined by KnockOUT Master\":\"Approved by KnockOUT Master\"})})"] |
| backendControllers | [{"method": "GET", "path": "/api/state", "evidence": [{"file": "backend/src/server.js", "line": 58}]}, {"method": "GET", "path": "/api/state", "evidence": [{"file": "backend/src/master-server.js", "line": 215}]}, {"method": "POST", "path": "/api/companies", "evidence": [{"file": "backend/src/master-server.js", "line": 216}]}, {"method": "POST", "path": "/api/company-registrations/:id/approve", "evidence": [{"file": "backend/src/master-server.js", "line": 217}]}, {"method": "PATCH", "path": "/api/companies/:id/modules", "evidence": [{"file": "backend/src/master-server.js", "line": 218}]}, {"method": "PATCH", "path": "/api/saas-invoices/:id/status", "evidence": [{"file": "backend/src/master-server.js", "line": 219}]}, {"method": "POST", "path": "/api/company-registrations/:id/reject", "evidence": [{"file": "backend/src/master-server.js", "line": 220}]}, {"method": "PATCH", "path": "/api/companies/:id/status", "evidence": [{"file": "backend/src/master-server.js", "line": 221}]}, {"method": "PATCH", "path": "/api/companies/:companyId/users/:userId/pin", "evidence": [{"file": "backend/src/master-server.js", "line": 222}]}, {"method": "DELETE", "path": "/api/companies/:id", "evidence": [{"file": "backend/src/master-server.js", "line": 224}]}] |
| entities | ["companies", "company_users", "saas_invoices", "module_pricing", "usage_logins"] |

Actions: ["Companies", "users", "Pending registrations", "Logout", "All companies", "<icon/dynamic>", "<icon/dynamic>", "Open company workspace All details and controls"].

Forms: F-W-SuperAdminApp; tables/lists: T-W-SuperAdminApp.

Evidence: [frontend/src/App.jsx:392](../../frontend/src/App.jsx#L392)

## W-MasterRegistrationRequests — Master Registration Requests

Operate tenant companies, logins, module access and SaaS invoices through Master Registration Requests.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | master |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | ["SuperAdminApp"] |
| exitPoints | [] |
| contentHierarchy | Source order: Tenant waiting list |
| displayedData | ["Tenant waiting list", ""] |
| cards | ["Status"] |
| charts | [] |
| tabs | [] |
| filters | ["requests.filter((request)=>request.status===\"pending\")", "requests.filter((request)=>request.status!==\"pending\").slice(0,5)", "requests.filter((request)=>request.status!==\"pending\")"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No registrations awaiting approval"] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["companies", "company_users", "saas_invoices", "module_pricing", "usage_logins"] |

Actions: ["· month Requested FIRST ADMINISTRATOR · Review details", "·"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-MasterRegistrationRequests.

Evidence: [frontend/src/App.jsx:618](../../frontend/src/App.jsx#L618)

## W-MasterRegistrationDetail — Master Registration Detail

Request a subscription, review it and activate a tenant through Master Registration Detail.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | onboarding |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | ["SuperAdminApp"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["Status"] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["company_registration_requests", "companies", "tenant_subscriptions", "notification_outbox"] |

Actions: ["Waiting list", "Reject application", "<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:623](../../frontend/src/App.jsx#L623)

## W-MasterNetworkOverview — Master Network Overview

Operate tenant companies, logins, module access and SaaS invoices through Master Network Overview.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | master |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | ["SuperAdminApp"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["Stat"] |
| charts | [] |
| tabs | [] |
| filters | ["new Date().toISOString().slice(0,7)", "(invoices\|\|[]).filter((invoice)=>invoice.billingMonth===currentMonth)", "companies.filter((company) => !company.online \|\| company.lowStock > 0 \|\| !company.adminLoginActive)", "currentInvoices.filter((invoice)=>invoice.status==='paid')", "companies.filter((company)=>company.status===\"active\")", "companies.filter((company)=>company.online)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["companies", "company_users", "saas_invoices", "module_pricing", "usage_logins"] |

Actions: [].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-MasterNetworkOverview.

Evidence: [frontend/src/App.jsx:628](../../frontend/src/App.jsx#L628)

## W-MasterActionModal — Master Action Modal

Operate tenant companies, logins, module access and SaaS invoices through Master Action Modal.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | master |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | ["SuperAdminApp"] |
| exitPoints | [] |
| contentHierarchy | Source order: Delete ? |
| displayedData | ["Delete ?"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | ["confirm(typed)"] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["confirm(typed)"] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["companies", "company_users", "saas_invoices", "module_pricing", "usage_logins"] |

Actions: ["Cancel", "<icon/dynamic>"].

Forms: F-W-MasterActionModal; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:647](../../frontend/src/App.jsx#L647)

## W-CompanyWorkspaceOverview — Company Workspace Overview

Operate tenant companies, logins, module access and SaaS invoices through Company Workspace Overview.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | master |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | ["SuperAdminApp"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["Stat", "Status", "CreditCard"] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["companies", "company_users", "saas_invoices", "module_pricing", "usage_logins"] |

Actions: ["Company users Manage declared accounts", "SaaS billing Open module invoice and monthly report"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-CompanyWorkspaceOverview.

Evidence: [frontend/src/App.jsx:693](../../frontend/src/App.jsx#L693)

## W-CompanyControls — Company Controls

Operate tenant companies, logins, module access and SaaS invoices through Company Controls.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | master |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | ["SuperAdminApp"] |
| exitPoints | [] |
| contentHierarchy | Source order: Access and lifecycle controls |
| displayedData | ["Access and lifecycle controls"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["companies", "company_users", "saas_invoices", "module_pricing", "usage_logins"] |

Actions: ["<icon/dynamic>", "Delete company"].

Forms: F-W-CompanyControls; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:708](../../frontend/src/App.jsx#L708)

## W-MasterUsers — Master Users

Operate tenant companies, logins, module access and SaaS invoices through Master Users.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | master |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | ["SuperAdminApp"] |
| exitPoints | [] |
| contentHierarchy | Source order: users |
| displayedData | ["users"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No company users yet"] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["companies", "company_users", "saas_invoices", "module_pricing", "usage_logins"] |

Actions: ["Change PIN"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-MasterUsers.

Evidence: [frontend/src/App.jsx:713](../../frontend/src/App.jsx#L713)

## W-MasterPinModal — Master Pin Modal

Operate tenant companies, logins, module access and SaaS invoices through Master Pin Modal.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | master |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | ["SuperAdminApp"] |
| exitPoints | [] |
| contentHierarchy | Source order: Change user PIN |
| displayedData | ["Change user PIN"] |
| cards | ["CreditCard"] |
| charts | [] |
| tabs | [] |
| filters | ["e.target.value.replace(/\\D/g, \"\").slice(0, 6)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy, setBusy] = useState(false)"] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "toast(`${user.name}'s PIN changed successfully`)", "setError(e.message)"] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api( isMaster ? `/master-users/${user.id}/pin` : `/companies/${company.id}/users/${user.id}/pin`, { method: \"PATCH\", body: JSON.stringify({ pin }) }, )"] |
| backendControllers | [{"method": "POST", "path": "/api/companies", "evidence": [{"file": "backend/src/master-server.js", "line": 216}]}, {"method": "PATCH", "path": "/api/companies/:id/modules", "evidence": [{"file": "backend/src/master-server.js", "line": 218}]}, {"method": "PATCH", "path": "/api/companies/:id/status", "evidence": [{"file": "backend/src/master-server.js", "line": 221}]}, {"method": "PATCH", "path": "/api/companies/:companyId/users/:userId/pin", "evidence": [{"file": "backend/src/master-server.js", "line": 222}]}, {"method": "PATCH", "path": "/api/master-users/:userId/pin", "evidence": [{"file": "backend/src/master-server.js", "line": 223}]}, {"method": "DELETE", "path": "/api/companies/:id", "evidence": [{"file": "backend/src/master-server.js", "line": 224}]}] |
| entities | ["companies", "company_users", "saas_invoices", "module_pricing", "usage_logins"] |

Actions: ["Cancel", "<icon/dynamic>"].

Forms: F-W-MasterPinModal; tables/lists: T-W-MasterPinModal.

Evidence: [frontend/src/App.jsx:776](../../frontend/src/App.jsx#L776)

## W-MasterBilling — Master Billing

Operate tenant companies, logins, module access and SaaS invoices through Master Billing.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | master |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | ["SuperAdminApp"] |
| exitPoints | ["MasterPricingSlab"] |
| contentHierarchy | Source order: Monthly SaaS billing |
| displayedData | ["Monthly SaaS billing"] |
| cards | ["Stat"] |
| charts | [] |
| tabs | [] |
| filters | ["[...new Set((invoices\|\|[]).map((invoice)=>invoice.billingMonth))].sort()", "new Date().toISOString().slice(0,7)", "(invoices\|\|[]).filter((invoice)=>invoice.billingMonth===month&&companies.some((company)=>company.id===invoice.companyId))", "rows.filter((row)=>row.status==='paid')", "rows.filter((row)=>row.status==='due')"] |
| search | [] |
| sorting | ["[...new Set((invoices\|\|[]).map((invoice)=>invoice.billingMonth))].sort()"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No subscription invoices are available for this month."] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["MasterPricingSlab"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["companies", "company_users", "saas_invoices", "module_pricing", "usage_logins"] |

Actions: ["Export monthly report", "<icon/dynamic>"].

Forms: F-W-MasterBilling; tables/lists: T-W-MasterBilling.

Evidence: [frontend/src/App.jsx:846](../../frontend/src/App.jsx#L846)

## W-MasterPricingSlab — Master Pricing Slab

Operate tenant companies, logins, module access and SaaS invoices through Master Pricing Slab.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | master |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | ["MasterBilling"] |
| exitPoints | [] |
| contentHierarchy | Source order: Module pricing slab |
| displayedData | ["Module pricing slab"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(\"\")"] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api('/module-pricing')", "api(`/module-pricing/${key}`,{method:'PATCH',body:JSON.stringify({price:Number(pricing[key].price)})})"] |
| backendControllers | [{"method": "GET", "path": "/api/module-pricing", "evidence": [{"file": "backend/src/master-server.js", "line": 225}]}, {"method": "PATCH", "path": "/api/module-pricing/:key", "evidence": [{"file": "backend/src/master-server.js", "line": 226}]}] |
| entities | ["companies", "company_users", "saas_invoices", "module_pricing", "usage_logins"] |

Actions: ["<icon/dynamic>", "<icon/dynamic>"].

Forms: F-W-MasterPricingSlab; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:856](../../frontend/src/App.jsx#L856)

## W-MasterLogin — Master Login

PIN authentication, identity and profile editing through Master Login.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | anonymous |
| secondaryUsers | [] |
| entryPoints | ["SuperAdminApp"] |
| exitPoints | [] |
| contentHierarchy | Source order: One master. Every company. |
| displayedData | ["One master. Every company."] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["e.target.value.replace(/\\D/g, \"\").slice(0, 6)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy, setBusy] = useState(false)"] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "setError(e.message)"] |
| permissions | {"roles": ["anonymous"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(\"/login\", { method: \"POST\", body: JSON.stringify({ pin }) })"] |
| backendControllers | [{"method": "POST", "path": "/api/login", "evidence": [{"file": "backend/src/server.js", "line": 59}]}, {"method": "POST", "path": "/api/login", "evidence": [{"file": "backend/src/master-server.js", "line": 214}]}] |
| entities | ["users", "master_users", "company_users"] |

Actions: ["<icon/dynamic>"].

Forms: F-W-MasterLogin; tables/lists: T-W-MasterLogin.

Evidence: [frontend/src/App.jsx:863](../../frontend/src/App.jsx#L863)

## W-CompanyRegistration — Company Registration

PIN authentication, identity and profile editing through Company Registration.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | access |
| status | FRONTEND_ONLY |
| reachability | Dormant/unlinked |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | [] |
| exitPoints | [] |
| contentHierarchy | Source order: Register a hotel or café |
| displayedData | ["Register a hotel or café"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy, setBusy] = useState(false)"] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "toast( `${result.companyName} created · Hotel ID ${result.hotelId} · Admin PIN ${result.adminPin}`, )", "setError(e.message)"] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(\"/companies\", { method: \"POST\", body: JSON.stringify(form), })"] |
| backendControllers | [{"method": "POST", "path": "/api/companies", "evidence": [{"file": "backend/src/master-server.js", "line": 216}]}, {"method": "PATCH", "path": "/api/companies/:id/modules", "evidence": [{"file": "backend/src/master-server.js", "line": 218}]}, {"method": "PATCH", "path": "/api/companies/:id/status", "evidence": [{"file": "backend/src/master-server.js", "line": 221}]}, {"method": "PATCH", "path": "/api/companies/:companyId/users/:userId/pin", "evidence": [{"file": "backend/src/master-server.js", "line": 222}]}, {"method": "DELETE", "path": "/api/companies/:id", "evidence": [{"file": "backend/src/master-server.js", "line": 224}]}] |
| entities | ["users", "master_users", "company_users"] |

Actions: ["<icon/dynamic>"].

Forms: F-W-CompanyRegistration; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:912](../../frontend/src/App.jsx#L912)

## W-ProfileEditor — Profile Editor

Name, phone, email and profile image edit. Web profile load failure falls back to session identity.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | ["waiter", "chef", "juicer"] |
| entryPoints | ["Shell"] |
| exitPoints | [] |
| contentHierarchy | Name, phone, email and profile image edit. Web profile load failure falls back to session identity. |
| displayedData | ["Edit your profile"] |
| cards | [] |
| charts | [] |
| tabs | ["[preview,setPreview]=useState(user.profileImageUrl\|\|\"\")"] |
| filters | ["form.name.split(\" \").map(part=>part[0]).join(\"\").slice(0,2)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | ["setError(\"Choose a JPG, PNG, or WebP image\")", "setError(\"Profile photo must be smaller than 5 MB\")", "setError(\"\")", "setError(err.message)"] |
| notifications | ["setError(\"Choose a JPG, PNG, or WebP image\")", "setError(\"Profile photo must be smaller than 5 MB\")", "setError(\"\")", "setError(err.message)"] |
| permissions | {"roles": ["admin", "waiter", "chef", "juicer"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["apiForm(\"/profile\",body,{method:\"PATCH\"})"] |
| backendControllers | [{"method": "GET", "path": "/api/profile", "evidence": [{"file": "backend/src/server.js", "line": 60}]}, {"method": "PATCH", "path": "/api/profile", "evidence": [{"file": "backend/src/server.js", "line": 61}]}] |
| entities | ["users", "master_users", "company_users"] |

Actions: ["<icon/dynamic>"].

Forms: F-W-ProfileEditor; tables/lists: T-W-ProfileEditor.

Evidence: [frontend/src/App.jsx:1105](../../frontend/src/App.jsx#L1105)

## W-Admin — Admin

PIN authentication, identity and profile editing through Admin.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["CompanyApp"] |
| exitPoints | ["AdminOverview", "AdminTables", "Bookings", "AdminOrders", "ParcelPanel", "MenuManager", "Stock", "DailyFinance", "StaffManagement", "SettingsPanel", "BookingModal"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | ["[page, setPage] = useState(\"overview\")"] |
| filters | ["(data.stockRequests \|\| []).filter((request) => request.status !== \"resolved\")", "(data.inventory \|\| []).filter((item) => item.quantity <= item.min)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["BookingModal"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["AdminOverview", "AdminTables", "Bookings", "AdminOrders", "ParcelPanel", "MenuManager", "Stock", "DailyFinance", "StaffManagement", "SettingsPanel", "BookingModal"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["users", "master_users", "company_users"] |

Actions: ["<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-Admin.

Evidence: [frontend/src/App.jsx:1150](../../frontend/src/App.jsx#L1150)

## W-AdminOverview — Admin Overview

Revenue and operational KPIs → occupancy/status graphic → recent orders and stock alerts. Metrics use loaded state rather than an unlimited historical dataset.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | overview |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Admin"] |
| exitPoints | [] |
| contentHierarchy | Revenue and operational KPIs → occupancy/status graphic → recent orders and stock alerts. Metrics use loaded state rather than an unlimited historical dataset. |
| displayedData | [] |
| cards | ["Stat"] |
| charts | ["Ring"] |
| tabs | [] |
| filters | ["data.orders.filter( (o) => ![\"completed\", \"served\"].includes(o.status), )", "data.orders .filter((o) => o.total)", "data.tables.filter((t) => t.status === \"occupied\")", "data.tables.filter((t) => t.status === \"reserved\")", "data.tables.filter((t) => t.status === \"cleaning\")", "active.filter((o) => o.status === \"ready\")", "data.inventory.filter((i) => i.quantity <= i.min)", "data.tables.filter((t) => t.status !== \"available\")", "data.tables.filter((t) => t.status === s)", "data.orders.slice(0, 6)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["orders", "restaurant_tables", "users", "staff_attendance", "inventory"] |

Actions: ["View all orders", "View all →"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-AdminOverview.

Evidence: [frontend/src/App.jsx:1202](../../frontend/src/App.jsx#L1202)

## W-AdminTables — Admin Tables

Create tables, inspect active service and change table state through Admin Tables.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | tables |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Admin"] |
| exitPoints | ["AdminTableDetails", "TableEditor", "AdminBillPopup"] |
| contentHierarchy | Source order: Table · Bill # |
| displayedData | ["Table · Bill #", ""] |
| cards | ["TableCard"] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["TableEditor", "AdminBillPopup"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["AdminTableDetails", "TableEditor", "AdminBillPopup"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["restaurant_tables", "orders", "order_items"] |

Actions: ["Add table", "Print bill", "Continue to payment"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:1355](../../frontend/src/App.jsx#L1355)

## W-AdminTableDetails — Admin Table Details

Create tables, inspect active service and change table state through Admin Table Details.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | tables |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminTables"] |
| exitPoints | ["AdminBillPopup"] |
| contentHierarchy | Source order: Table → Current order |
| displayedData | ["Table", "Current order", ""] |
| cards | ["Status"] |
| charts | [] |
| tabs | [] |
| filters | ["[orderDepartmentProgress(order, data, false), orderDepartmentProgress(order, data, true)].filter(Boolean)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["AdminBillPopup"] |
| drawers | [] |
| dialogs | ["confirm(`Delete Table ${table.number}?`)"] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["confirm(`Delete Table ${table.number}?`)", "toast(`Table ${table.number} deleted`)", "toast(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["AdminBillPopup"] |
| apiUsed | ["api(`/tables/${table.id}`, { method: \"DELETE\" })"] |
| backendControllers | [{"method": "PATCH", "path": "/api/tables/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 88}]}, {"method": "POST", "path": "/api/tables", "evidence": [{"file": "backend/src/server.js", "line": 89}]}, {"method": "DELETE", "path": "/api/tables/:id", "evidence": [{"file": "backend/src/server.js", "line": 90}]}] |
| entities | ["restaurant_tables", "orders", "order_items"] |

Actions: ["Bill / Print", "Pay bill", "Delete table"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-AdminTableDetails.

Evidence: [frontend/src/App.jsx:1590](../../frontend/src/App.jsx#L1590)

## W-TableEditor — Table Editor

Create tables, inspect active service and change table state through Table Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | tables |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminTables"] |
| exitPoints | [] |
| contentHierarchy | Source order: Add a table |
| displayedData | ["Add a table"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "toast(`Table ${form.number} added`)", "setError(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(\"/tables\", { method: \"POST\", body: JSON.stringify(form) })"] |
| backendControllers | [{"method": "PATCH", "path": "/api/tables/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 88}]}, {"method": "POST", "path": "/api/tables", "evidence": [{"file": "backend/src/server.js", "line": 89}]}, {"method": "DELETE", "path": "/api/tables/:id", "evidence": [{"file": "backend/src/server.js", "line": 90}]}] |
| entities | ["restaurant_tables", "orders", "order_items"] |

Actions: ["Add table"].

Forms: F-W-TableEditor; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:1716](../../frontend/src/App.jsx#L1716)

## W-OperationsCalendar — Operations Calendar

PIN authentication, identity and profile editing through Operations Calendar.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminOrders", "ParcelPanel", "WaiterOrders"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [""] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["orders.filter((order) => dateKey(order.createdAt) === key)", "daily.filter((order) => order.paymentStatus === \"paid\")", "daily.filter((order) => order.status !== \"completed\")", "daily.slice(0, 3)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No orders", " No orders"] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["users", "master_users", "company_users"] |

Actions: ["<icon/dynamic>", "Today", "<icon/dynamic>", "<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-OperationsCalendar.

Evidence: [frontend/src/App.jsx:1776](../../frontend/src/App.jsx#L1776)

## W-AdminOrders — Admin Orders

Take orders and additional rounds, coordinate handoff and settle bills through Admin Orders.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | orders |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Admin"] |
| exitPoints | ["OperationsCalendar"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["DailyOrderCards"] |
| charts | [] |
| tabs | [] |
| filters | ["data.orders.filter((order) => dateKey(order.createdAt) === selectedDate)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["OperationsCalendar"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["orders", "order_items", "menu_items", "restaurant_tables"] |

Actions: ["Calendar"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-AdminOrders.

Evidence: [frontend/src/App.jsx:1822](../../frontend/src/App.jsx#L1822)

## W-FoodManager — Food Manager

Manage dishes, images, prices, availability and combo composition through Food Manager.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | menu |
| status | FRONTEND_ONLY |
| reachability | Dormant/unlinked |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | [] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [""] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[uploading, setUploading] = useState(null)"] |
| errorStates | [] |
| notifications | ["toast(`${item.name} photo saved to MinIO`)", "toast(e.message)", "toast(\"Food photo removed\")"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["apiForm(`/menu/${item.id}/image`, form)", "api(`/menu/${item.id}/image`, { method: \"DELETE\" })"] |
| backendControllers | [{"method": "POST", "path": "/api/menu", "evidence": [{"file": "backend/src/server.js", "line": 125}]}, {"method": "PUT", "path": "/api/menu/:id", "evidence": [{"file": "backend/src/server.js", "line": 126}]}, {"method": "DELETE", "path": "/api/menu/:id", "evidence": [{"file": "backend/src/server.js", "line": 127}]}, {"method": "PATCH", "path": "/api/menu/:id/availability", "evidence": [{"file": "backend/src/server.js", "line": 128}]}, {"method": "POST", "path": "/api/menu/:id/image", "evidence": [{"file": "backend/src/server.js", "line": 131}]}, {"method": "DELETE", "path": "/api/menu/:id/image", "evidence": [{"file": "backend/src/server.js", "line": 132}]}] |
| entities | ["menu_items", "combo_components"] |

Actions: ["Remove"].

Forms: F-W-FoodManager; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:1830](../../frontend/src/App.jsx#L1830)

## W-MenuManager — Menu Manager

Dishes / combos tabs → cards → editor. Combos reference menu items; image upload supported. No general text search found here.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | menu |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Admin"] |
| exitPoints | ["DishEditor", "ComboEditor"] |
| contentHierarchy | Dishes / combos tabs → cards → editor. Combos reference menu items; image upload supported. No general text search found here. |
| displayedData | [""] |
| cards | [] |
| charts | [] |
| tabs | ["[tab, setTab] = useState(\"dishes\")"] |
| filters | ["data.menu.filter((i) => tab === \"combos\" ? i.isCombo : !i.isCombo, )", "data.menu.filter((i) => !i.isCombo)", "data.menu.filter((i) => i.isCombo)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["DishEditor", "ComboEditor"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[uploading, setUploading] = useState(null)"] |
| errorStates | [] |
| notifications | ["toast(\"Photo saved to MinIO\")", "toast(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["DishEditor", "ComboEditor"] |
| apiUsed | ["apiForm(`/menu/${item.id}/image`, form)"] |
| backendControllers | [{"method": "POST", "path": "/api/menu", "evidence": [{"file": "backend/src/server.js", "line": 125}]}, {"method": "PUT", "path": "/api/menu/:id", "evidence": [{"file": "backend/src/server.js", "line": 126}]}, {"method": "DELETE", "path": "/api/menu/:id", "evidence": [{"file": "backend/src/server.js", "line": 127}]}, {"method": "PATCH", "path": "/api/menu/:id/availability", "evidence": [{"file": "backend/src/server.js", "line": 128}]}, {"method": "POST", "path": "/api/menu/:id/image", "evidence": [{"file": "backend/src/server.js", "line": 131}]}, {"method": "DELETE", "path": "/api/menu/:id/image", "evidence": [{"file": "backend/src/server.js", "line": 132}]}] |
| entities | ["menu_items", "combo_components"] |

Actions: ["Add", "Dishes & Juices", "Combo Offers", "Customize"].

Forms: F-W-MenuManager; tables/lists: T-W-MenuManager.

Evidence: [frontend/src/App.jsx:1894](../../frontend/src/App.jsx#L1894)

## W-DishEditor — Dish Editor

Manage dishes, images, prices, availability and combo composition through Dish Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | menu |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["MenuManager"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [""] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["toast(item ? \"Dish customized\" : \"New dish added\")"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(item ? `/menu/${item.id}` : \"/menu\", { method: item ? \"PUT\" : \"POST\", body: JSON.stringify(form), })"] |
| backendControllers | [{"method": "POST", "path": "/api/menu", "evidence": [{"file": "backend/src/server.js", "line": 125}]}, {"method": "PUT", "path": "/api/menu/:id", "evidence": [{"file": "backend/src/server.js", "line": 126}]}, {"method": "DELETE", "path": "/api/menu/:id", "evidence": [{"file": "backend/src/server.js", "line": 127}]}, {"method": "PATCH", "path": "/api/menu/:id/availability", "evidence": [{"file": "backend/src/server.js", "line": 128}]}, {"method": "POST", "path": "/api/menu/:id/image", "evidence": [{"file": "backend/src/server.js", "line": 131}]}, {"method": "DELETE", "path": "/api/menu/:id/image", "evidence": [{"file": "backend/src/server.js", "line": 132}]}] |
| entities | ["menu_items", "combo_components"] |

Actions: ["<icon/dynamic>"].

Forms: F-W-DishEditor; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:2018](../../frontend/src/App.jsx#L2018)

## W-ComboEditor — Combo Editor

Manage dishes, images, prices, availability and combo composition through Combo Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | menu |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["MenuManager"] |
| exitPoints | [] |
| contentHierarchy | Source order: Select dishes and juices |
| displayedData | ["", "Select dishes and juices"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["p.filter((x) => x.menuId !== id)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["toast(item ? \"Combo customized\" : \"Combo offer created\")"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(item ? `/combos/${item.id}` : \"/combos\", { method: item ? \"PUT\" : \"POST\", body: JSON.stringify({ ...form, components: parts }), })"] |
| backendControllers | [{"method": "POST", "path": "/api/combos", "evidence": [{"file": "backend/src/server.js", "line": 129}]}, {"method": "PUT", "path": "/api/combos/:id", "evidence": [{"file": "backend/src/server.js", "line": 130}]}] |
| entities | ["menu_items", "combo_components"] |

Actions: ["·", "<icon/dynamic>"].

Forms: F-W-ComboEditor; tables/lists: T-W-ComboEditor.

Evidence: [frontend/src/App.jsx:2102](../../frontend/src/App.jsx#L2102)

## W-ParcelPanel — Parcel Panel

Calendar → selected day → parcel list. Create only for today; detail/handoff, prepayment and final payment are separate modal states.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | parcels |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Admin"] |
| exitPoints | ["OperationsCalendar", "ParcelBuilder", "ParcelPaymentModal", "ParcelHandoffModal"] |
| contentHierarchy | Calendar → selected day → parcel list. Create only for today; detail/handoff, prepayment and final payment are separate modal states. |
| displayedData | ["#", "", "No parcel orders"] |
| cards | ["Status"] |
| charts | [] |
| tabs | [] |
| filters | ["data.orders.filter((o) => o.orderType === \"parcel\")", "allParcels.filter((order) => dateKey(order.createdAt) === selectedDate)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["ParcelBuilder", "ParcelPaymentModal", "ParcelHandoffModal"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No parcel orders"] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["toast( `Parcel #${order.id} completed${order.paymentStatus === \"paid\" ? \" — already paid\" : ` by ${method}`}`, )", "toast(e.message)", "toast(`Parcel #${order.id} marked paid by ${method}`)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["OperationsCalendar", "ParcelBuilder", "ParcelPaymentModal", "ParcelHandoffModal"] |
| apiUsed | ["api(`/orders/${order.id}/finalize`, { method: \"POST\", body: JSON.stringify({ paymentMethod: method }), })", "api(`/orders/${order.id}/mark-paid`, { method: \"POST\", body: JSON.stringify({ paymentMethod: method }), })"] |
| backendControllers | [{"method": "POST", "path": "/api/orders", "evidence": [{"file": "backend/src/server.js", "line": 86}]}, {"method": "POST", "path": "/api/orders/:id/items", "evidence": [{"file": "backend/src/server.js", "line": 87}]}, {"method": "POST", "path": "/api/orders/:id/mark-paid", "evidence": [{"file": "backend/src/server.js", "line": 92}]}, {"method": "PATCH", "path": "/api/orders/:id/items/status", "evidence": [{"file": "backend/src/server.js", "line": 93}]}, {"method": "PATCH", "path": "/api/orders/:id/batches/:batchNo/handoff", "evidence": [{"file": "backend/src/server.js", "line": 94}]}, {"method": "PATCH", "path": "/api/orders/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 95}]}, {"method": "POST", "path": "/api/orders/:id/request-bill", "evidence": [{"file": "backend/src/server.js", "line": 96}]}, {"method": "GET", "path": "/api/orders/:id/bill", "evidence": [{"file": "backend/src/server.js", "line": 97}]}, {"method": "POST", "path": "/api/orders/:id/finalize", "evidence": [{"file": "backend/src/server.js", "line": 98}]}] |
| entities | ["orders", "order_items", "menu_items"] |

Actions: ["Calendar", "New parcel order", "Mark as paid now", "Complete parcel handoff", "View / print bill"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-ParcelPanel.

Evidence: [frontend/src/App.jsx:2222](../../frontend/src/App.jsx#L2222)

## W-ParcelHandoffModal — Parcel Handoff Modal

Create takeaway orders, record payment and coordinate collection through Parcel Handoff Modal.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | parcels |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["ParcelPanel"] |
| exitPoints | [] |
| contentHierarchy | Source order: # |
| displayedData | ["#", ""] |
| cards | ["CreditCard"] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["orders", "order_items", "menu_items"] |

Actions: ["Print bill", "Continue to payment", "Cash Cash payment received", "Card / UPI Digital payment received", "<icon/dynamic>", "Back to bill", "Print final bill", "Close"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:2382](../../frontend/src/App.jsx#L2382)

## W-ParcelPaymentModal — Parcel Payment Modal

Create takeaway orders, record payment and coordinate collection through Parcel Payment Modal.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | parcels |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["ParcelPanel"] |
| exitPoints | [] |
| contentHierarchy | Source order: # |
| displayedData | ["#"] |
| cards | ["CreditCard"] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["orders", "order_items", "menu_items"] |

Actions: ["Cash Cash payment received", "Card / UPI Digital payment received"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:2516](../../frontend/src/App.jsx#L2516)

## W-ParcelBuilder — Parcel Builder

Create takeaway orders, record payment and coordinate collection through Parcel Builder.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | parcels |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["ParcelPanel"] |
| exitPoints | [] |
| contentHierarchy | Source order: Take a parcel order → Parcel basket |
| displayedData | ["Take a parcel order", "Parcel basket"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["c .map((i) => (i.menuId === id ? { ...i, qty: i.qty + delta } : i)) .filter((i) => i.qty > 0)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["toast( paymentMethod ? `Parcel paid by ${paymentMethod} and sent to Chef` : \"Parcel sent to Chef — payment due at handoff\", )", "toast(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(\"/parcels\", { method: \"POST\", body: JSON.stringify({ customerName: customer, customerPhone: phone, adminName: user.name, items: cart, paymentMethod: paymentMethod \|\| null, }), })"] |
| backendControllers | [{"method": "POST", "path": "/api/parcels", "evidence": [{"file": "backend/src/server.js", "line": 91}]}] |
| entities | ["orders", "order_items", "menu_items"] |

Actions: ["<icon/dynamic>", "<icon/dynamic>", "<icon/dynamic>", "Pay on handoff", "Cash paid", "Card / UPI paid", "Send parcel to kitchen"].

Forms: F-W-ParcelBuilder; tables/lists: T-W-ParcelBuilder.

Evidence: [frontend/src/App.jsx:2546](../../frontend/src/App.jsx#L2546)

## W-Stock — Stock

Inventory / activity / planning views. Name/category query, category and health filters combine. Forecast derives from recorded usage/waste, not automatic ingredient consumption.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | stock |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Admin"] |
| exitPoints | ["StockEditor", "StockMovement"] |
| contentHierarchy | Inventory / activity / planning views. Name/category query, category and health filters combine. Forecast derives from recorded usage/waste, not automatic ingredient consumption. |
| displayedData | ["Daily inventory movement", "", "No matching stock items", "No stock movements yet", "Stock levels are healthy"] |
| cards | ["Stat", "Status"] |
| charts | [] |
| tabs | ["[tab, setTab] = useState(\"inventory\")"] |
| filters | ["data.inventory.filter((i) => i.quantity <= i.min)", "transactions .filter((x) => x.movementType === \"purchase\")", "transactions.filter((x) => new Date(x.createdAt).getTime() >= cutoff)", "recent .filter((x) => x.movementType === \"usage\")", "recent .filter((x) => x.movementType === \"waste\")", "transactions.filter((x) => dateKey(x.createdAt) === todayKey)", "todayMovements.filter((x) => x.movementType === \"purchase\")", "todayMovements.filter((x) => x.movementType === \"usage\")", "todayMovements.filter((x) => x.movementType === \"waste\")", "[...new Set(data.inventory.map((i) => i.category).filter(Boolean))].sort()", "data.inventory.map((i) => i.category).filter(Boolean)", "data.inventory.filter((item) => { const matchesText = `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()), matchesCategory = category === \"all\" \|\| item.category === category, state = item.quantity === 0 ? \"out\" : item.quantity <= item.min ? \"low\" : \"healthy\"; return matchesText && matchesCategory && (health === \"all\" \|\| health === state); })", "transactions.filter((x) => movementFilter === \"all\" ? true : x.movementType === movementFilter, )", "data.inventory .map((item) => { const consumed = recent .filter((x) => x.inventoryId === item.id && [\"usage\", \"waste\"].includes(x.movementType)) .reduce((s, x) => s + Math.abs(x.quantity), 0), dailyUse = consumed / 30, daysCover = dailyUse > 0 ? item.quantity / dailyUse : null, reorderQty = Math.max(0, item.min * 2 - item.quantity); return { ...item, consumed, dailyUse, daysCover, reorderQty, reorderCost: reorderQty * item.cost }; }) .sort((a, b) => (a.daysCover ?? 9999) - (b.daysCover ?? 9999))", "recent .filter((x) => x.inventoryId === item.id && [\"usage\", \"waste\"].includes(x.movementType))", "planning.filter((x) => x.quantity <= x.min \|\| (x.daysCover !== null && x.daysCover <= 7))", "new Date().toISOString().slice(0, 10)", "low.slice(0,3)"] |
| search | [{"line": 2892, "tag": "input", "label": "Search item or category…", "type": "text", "value": "query", "required": false, "defaultValue": "", "disabled": false, "condition": ["tab === \"inventory\""], "handler": "(e)=>setQuery(e.target.value)"}] |
| sorting | ["[...new Set(data.inventory.map((i) => i.category).filter(Boolean))].sort()", "data.inventory .map((item) => { const consumed = recent .filter((x) => x.inventoryId === item.id && [\"usage\", \"waste\"].includes(x.movementType)) .reduce((s, x) => s + Math.abs(x.quantity), 0), dailyUse = consumed / 30, daysCover = dailyUse > 0 ? item.quantity / dailyUse : null, reorderQty = Math.max(0, item.min * 2 - item.quantity); return { ...item, consumed, dailyUse, daysCover, reorderQty, reorderCost: reorderQty * item.cost }; }) .sort((a, b) => (a.daysCover ?? 9999) - (b.daysCover ?? 9999))"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["StockEditor"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No matching stock items", "No stock movements yet", "No item currently needs a suggested reorder."] |
| loadingStates | [] |
| errorStates | ["toast(error.message)"] |
| notifications | ["toast(`${request.itemName} request marked ${status}`)", "toast(error.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["StockEditor", "StockMovement"] |
| apiUsed | ["api(`/stock-requests/${request.id}/status`, { method:\"PATCH\", body:JSON.stringify({status}) })"] |
| backendControllers | [{"method": "POST", "path": "/api/stock-requests", "evidence": [{"file": "backend/src/server.js", "line": 103}]}, {"method": "PATCH", "path": "/api/stock-requests/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 104}]}] |
| entities | ["inventory", "inventory_transactions", "stock_requests"] |

Actions: ["Add stock item", "<icon/dynamic>", "Mark ordered", "Resolve", "Current inventory", "Movement history", "Reorder & forecasting", "Edit details", "Record movement", "<icon/dynamic>", "Export CSV", "Add stock"].

Forms: F-W-Stock; tables/lists: T-W-Stock.

Evidence: [frontend/src/App.jsx:2739](../../frontend/src/App.jsx#L2739)

## W-StockEditor — Stock Editor

Track stock movements, minimums, planning and chef purchase requests through Stock Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | stock |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Stock"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [""] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy, setBusy] = useState(false)"] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "toast(item ? \"Stock item updated\" : \"Stock item created\")", "setError(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(item ? `/inventory/${item.id}` : \"/inventory\", { method: item ? \"PUT\" : \"POST\", body: JSON.stringify({ ...form, createdBy: user.name }), })"] |
| backendControllers | [{"method": "POST", "path": "/api/inventory", "evidence": [{"file": "backend/src/server.js", "line": 99}]}, {"method": "PUT", "path": "/api/inventory/:id", "evidence": [{"file": "backend/src/server.js", "line": 100}]}, {"method": "POST", "path": "/api/inventory/:id/movements", "evidence": [{"file": "backend/src/server.js", "line": 101}]}, {"method": "DELETE", "path": "/api/inventory/:id", "evidence": [{"file": "backend/src/server.js", "line": 102}]}] |
| entities | ["inventory", "inventory_transactions", "stock_requests"] |

Actions: ["<icon/dynamic>"].

Forms: F-W-StockEditor; tables/lists: T-W-StockEditor.

Evidence: [frontend/src/App.jsx:3039](../../frontend/src/App.jsx#L3039)

## W-StockMovement — Stock Movement

Track stock movements, minimums, planning and chef purchase requests through Stock Movement.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | stock |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Stock"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [""] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy, setBusy] = useState(false)"] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "toast(`${item.name} stock movement recorded`)", "setError(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(`/inventory/${item.id}/movements`, { method: \"POST\", body: JSON.stringify({ ...form, createdBy: user.name }), })"] |
| backendControllers | [{"method": "POST", "path": "/api/inventory", "evidence": [{"file": "backend/src/server.js", "line": 99}]}, {"method": "PUT", "path": "/api/inventory/:id", "evidence": [{"file": "backend/src/server.js", "line": 100}]}, {"method": "POST", "path": "/api/inventory/:id/movements", "evidence": [{"file": "backend/src/server.js", "line": 101}]}, {"method": "DELETE", "path": "/api/inventory/:id", "evidence": [{"file": "backend/src/server.js", "line": 102}]}] |
| entities | ["inventory", "inventory_transactions", "stock_requests"] |

Actions: ["Record movement"].

Forms: F-W-StockMovement; tables/lists: T-W-StockMovement.

Evidence: [frontend/src/App.jsx:3145](../../frontend/src/App.jsx#L3145)

## W-Finance — Finance

Review daily closing, ledger, purchases, balances and reports through Finance.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | finance |
| status | FRONTEND_ONLY |
| reachability | Dormant/unlinked |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | [] |
| exitPoints | ["FinanceEntry"] |
| contentHierarchy | Source order: No finance entries |
| displayedData | ["No finance entries"] |
| cards | ["Stat", "Status"] |
| charts | [] |
| tabs | [] |
| filters | ["data.orders .filter((o) => o.paymentStatus === \"paid\")", "entries .filter((x) => x.entryType === \"income\")", "entries .filter((x) => x.entryType === \"expense\")"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | ["confirm(`Delete ${entry.description}?`)"] |
| stateTextEvidence | ["No finance entries"] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["confirm(`Delete ${entry.description}?`)", "toast(\"Finance entry deleted\")", "toast(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["FinanceEntry"] |
| apiUsed | ["api(`/finance/${entry.id}`, { method: \"DELETE\" })"] |
| backendControllers | [{"method": "POST", "path": "/api/finance", "evidence": [{"file": "backend/src/server.js", "line": 105}]}, {"method": "DELETE", "path": "/api/finance/:id", "evidence": [{"file": "backend/src/server.js", "line": 106}]}] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: ["Add finance entry", "<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-Finance.

Evidence: [frontend/src/App.jsx:3238](../../frontend/src/App.jsx#L3238)

## W-FinanceEntry — Finance Entry

Review daily closing, ledger, purchases, balances and reports through Finance Entry.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | finance |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Finance", "DailyFinanceDetails"] |
| exitPoints | [] |
| contentHierarchy | Source order: Add finance entry |
| displayedData | ["Add finance entry"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["new Date().toISOString().slice(0, 10)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy, setBusy] = useState(false)"] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "toast(\"Finance entry recorded\")", "setError(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(\"/finance\", { method: \"POST\", body: JSON.stringify({ ...form, createdBy: user.name }), })"] |
| backendControllers | [{"method": "POST", "path": "/api/finance", "evidence": [{"file": "backend/src/server.js", "line": 105}]}, {"method": "DELETE", "path": "/api/finance/:id", "evidence": [{"file": "backend/src/server.js", "line": 106}]}] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: ["Save finance entry"].

Forms: F-W-FinanceEntry; tables/lists: T-W-FinanceEntry.

Evidence: [frontend/src/App.jsx:3397](../../frontend/src/App.jsx#L3397)

## W-DailyFinance — Daily Finance

Review daily closing, ledger, purchases, balances and reports through Daily Finance.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | finance |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Admin"] |
| exitPoints | ["DailyFinanceDetails", "FinanceCalendar"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["DailyFinanceDetails", "FinanceCalendar"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: [].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:3513](../../frontend/src/App.jsx#L3513)

## W-FinanceCalendar — Finance Calendar

Review daily closing, ledger, purchases, balances and reports through Finance Calendar.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | finance |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["DailyFinance"] |
| exitPoints | ["MonthlyRevenueReport"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [""] |
| cards | ["DailyKpi"] |
| charts | [] |
| tabs | [] |
| filters | ["data.orders.filter( (o) => o.paymentStatus === \"paid\" && dateKey(o.completedAt) === key, )", "entries .filter( (x) => x.entryType === \"expense\" && dateKey(x.entryDate) === key, )", "payments .filter((x) => dateKey(x.paymentDate) === key)", "purchases .filter((x) => dateKey(x.purchaseDate) === key)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No records"] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["MonthlyRevenueReport"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: ["<icon/dynamic>", "Today", "<icon/dynamic>", "<icon/dynamic>"].

Forms: F-W-FinanceCalendar; tables/lists: T-W-FinanceCalendar.

Evidence: [frontend/src/App.jsx:3525](../../frontend/src/App.jsx#L3525)

## W-MonthlyRevenueReport — Monthly Revenue Report

Review daily closing, ledger, purchases, balances and reports through Monthly Revenue Report.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | finance |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["FinanceCalendar"] |
| exitPoints | [] |
| contentHierarchy | Source order: revenue report → Payment collection |
| displayedData | ["revenue report", "Payment collection"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["data.orders.filter((order) => order.paymentStatus === \"paid\" && dateKey(order.completedAt).startsWith(prefix))", "(data.financeEntries \|\| []).filter((entry) => dateKey(entry.entryDate).startsWith(prefix))", "(data.supplierPayments \|\| []).filter((payment) => dateKey(payment.paymentDate).startsWith(prefix))", "entries.filter((entry) => entry.entryType === \"income\")", "entries.filter((entry) => entry.entryType === \"expense\")", "orders.filter((order) => dateKey(order.completedAt) === key)", "day.key.slice(-2)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No paid bills in this month."] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: ["Export monthly CSV", "`${day.key}: ${money(day.total)} from ${day.bills} bills`"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-MonthlyRevenueReport.

Evidence: [frontend/src/App.jsx:3678](../../frontend/src/App.jsx#L3678)

## W-DailyFinanceDetails — Daily Finance Details

Selected day → closing KPIs → daily / purchases / ledger / analytics tabs. Includes supplier balances, paid bills, transactions and trailing 30-day analytics.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | finance |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["DailyFinance"] |
| exitPoints | ["FinanceEntry", "SupplierPurchaseForm", "DealerPaymentForm"] |
| contentHierarchy | Selected day → closing KPIs → daily / purchases / ledger / analytics tabs. Includes supplier balances, paid bills, transactions and trailing 30-day analytics. |
| displayedData | ["No product purchases recorded"] |
| cards | ["DailyKpi", "Status"] |
| charts | [] |
| tabs | ["[tab, setTab] = useState(\"daily\")"] |
| filters | ["data.orders.filter( (o) => o.paymentStatus === \"paid\" && dateKey(o.completedAt) === date, )", "entries.filter((x) => dateKey(x.entryDate) === date)", "dailyEntries .filter((x) => x.entryType === \"expense\")", "dailyEntries .filter((x) => x.entryType === \"income\")", "purchases.filter((x) => dateKey(x.purchaseDate) === date)", "payments.filter((x) => dateKey(x.paymentDate) === date)", "payments .filter((x) => x.purchaseId === p.id)", "data.orders.filter((o) => o.paymentStatus === \"paid\" && inReportRange(o.completedAt))", "entries.filter((x) => inReportRange(`${dateKey(x.entryDate)}T12:00:00`) && dateKey(x.entryDate) >= dateKey(reportStart))", "payments.filter((x) => inReportRange(`${dateKey(x.paymentDate)}T12:00:00`) && dateKey(x.paymentDate) >= dateKey(reportStart))", "reportEntries.filter((x)=>x.entryType===\"income\")", "reportEntries.filter((x)=>x.entryType===\"expense\")", "Object.entries(reportOrders.reduce((acc,o)=>{const key=o.paymentMethod\|\|\"Unspecified\";acc[key]=(acc[key]\|\|0)+Number(o.total\|\|0);return acc},{})).sort((a,b)=>b[1]-a[1])", "Object.entries(reportEntries.filter((x)=>x.entryType===\"expense\").reduce((acc,x)=>{acc[x.category]=(acc[x.category]\|\|0)+x.amount;return acc},{})).sort((a,b)=>b[1]-a[1])", "reportOrders.filter((o)=>dateKey(o.completedAt)===key)", "reportEntries.filter((x)=>dateKey(x.entryDate)===key&&x.entryType===\"expense\")", "reportPayments.filter((x)=>dateKey(x.paymentDate)===key)"] |
| search | [] |
| sorting | ["Object.entries(reportOrders.reduce((acc,o)=>{const key=o.paymentMethod\|\|\"Unspecified\";acc[key]=(acc[key]\|\|0)+Number(o.total\|\|0);return acc},{})).sort((a,b)=>b[1]-a[1])", "Object.entries(reportEntries.filter((x)=>x.entryType===\"expense\").reduce((acc,x)=>{acc[x.category]=(acc[x.category]\|\|0)+x.amount;return acc},{})).sort((a,b)=>b[1]-a[1])"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["SupplierPurchaseForm", "DealerPaymentForm"] |
| drawers | [] |
| dialogs | ["confirm(`Delete purchase from ${purchase.supplierName}?`)"] |
| stateTextEvidence | ["No product purchases recorded", "No paid bills in this period.", "No operating expenses in this period."] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["confirm(`Delete purchase from ${purchase.supplierName}?`)", "toast(\"Supplier purchase deleted\")", "toast(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["FinanceEntry", "SupplierPurchaseForm", "DealerPaymentForm"] |
| apiUsed | ["api(`/supplier-purchases/${purchase.id}`, { method: \"DELETE\" })"] |
| backendControllers | [{"method": "POST", "path": "/api/supplier-purchases", "evidence": [{"file": "backend/src/server.js", "line": 107}]}, {"method": "POST", "path": "/api/supplier-purchases/:id/payments", "evidence": [{"file": "backend/src/server.js", "line": 108}]}, {"method": "DELETE", "path": "/api/supplier-purchases/:id", "evidence": [{"file": "backend/src/server.js", "line": 109}]}] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: ["Back to calendar", "Export report", "Daily closing", "Products & dealers", "Income & expenses", "30-day analytics", "View dealer balances", "Add product purchase", "Pay dealer", "<icon/dynamic>", "Add income / expense"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-DailyFinanceDetails.

Evidence: [frontend/src/App.jsx:3706](../../frontend/src/App.jsx#L3706)

## W-SupplierPurchaseForm — Supplier Purchase Form

Review daily closing, ledger, purchases, balances and reports through Supplier Purchase Form.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | finance |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["DailyFinanceDetails"] |
| exitPoints | [] |
| contentHierarchy | Source order: Add shop / dealer invoice |
| displayedData | ["Add shop / dealer invoice"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy, setBusy] = useState(false)"] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "toast(`Purchase saved · ${money(due)} still payable`)", "setError(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(\"/supplier-purchases\", { method: \"POST\", body: JSON.stringify({ ...form, createdBy: user.name }), })"] |
| backendControllers | [{"method": "POST", "path": "/api/supplier-purchases", "evidence": [{"file": "backend/src/server.js", "line": 107}]}, {"method": "POST", "path": "/api/supplier-purchases/:id/payments", "evidence": [{"file": "backend/src/server.js", "line": 108}]}, {"method": "DELETE", "path": "/api/supplier-purchases/:id", "evidence": [{"file": "backend/src/server.js", "line": 109}]}] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: ["<icon/dynamic>"].

Forms: F-W-SupplierPurchaseForm; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:4164](../../frontend/src/App.jsx#L4164)

## W-DealerPaymentForm — Dealer Payment Form

Review daily closing, ledger, purchases, balances and reports through Dealer Payment Form.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | finance |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["DailyFinanceDetails"] |
| exitPoints | [] |
| contentHierarchy | Source order: Pay |
| displayedData | ["Pay"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy, setBusy] = useState(false)"] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "toast(`Payment recorded for ${purchase.supplierName}`)", "setError(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(`/supplier-purchases/${purchase.id}/payments`, { method: \"POST\", body: JSON.stringify({ ...form, createdBy: user.name }), })"] |
| backendControllers | [{"method": "POST", "path": "/api/supplier-purchases", "evidence": [{"file": "backend/src/server.js", "line": 107}]}, {"method": "POST", "path": "/api/supplier-purchases/:id/payments", "evidence": [{"file": "backend/src/server.js", "line": 108}]}, {"method": "DELETE", "path": "/api/supplier-purchases/:id", "evidence": [{"file": "backend/src/server.js", "line": 109}]}] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: ["Record dealer payment"].

Forms: F-W-DealerPaymentForm; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:4306](../../frontend/src/App.jsx#L4306)

## W-Staff — Staff

Manage login accounts, kitchen roster, compensation fields and shifts through Staff.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | staff |
| status | FRONTEND_ONLY |
| reachability | Dormant/unlinked |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | [] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [""] |
| cards | ["Status"] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: [].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-Staff.

Evidence: [frontend/src/App.jsx:4398](../../frontend/src/App.jsx#L4398)

## W-StaffManagement — Staff Management

Team accounts → kitchen roster → attendance history. Compensation fields support daily/monthly pay; this is not a payroll processing system.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | staff |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Admin"] |
| exitPoints | ["AdminKitchenTeam", "StaffEditor"] |
| contentHierarchy | Team accounts → kitchen roster → attendance history. Compensation fields support daily/monthly pay; this is not a payroll processing system. |
| displayedData | [""] |
| cards | ["Stat", "Status"] |
| charts | [] |
| tabs | ["[tab, setTab] = useState(\"team\")"] |
| filters | ["shifts.filter( (s) => new Date(s.checkIn).toDateString() === new Date().toDateString(), )", "data.users.filter((u) => u.active)", "(data.kitchenStaff \|\| []).filter((u) => u.active)", "data.users.filter((u) => active(u.id))", "today.filter((s) => s.checkOut)", "staff.name .split(\" \") .map((x) => x[0]) .join(\"\") .slice(0, 2)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["StaffEditor"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["toast(`${staff.name} checked ${shift ? \"out\" : \"in\"}`)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["AdminKitchenTeam", "StaffEditor"] |
| apiUsed | ["api(`/staff/${staff.id}/${shift ? \"check-out\" : \"check-in\"}`, { method: \"POST\", body: JSON.stringify({ notes: note }), })"] |
| backendControllers | [{"method": "POST", "path": "/api/staff", "evidence": [{"file": "backend/src/server.js", "line": 115}]}, {"method": "PUT", "path": "/api/staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 116}]}, {"method": "DELETE", "path": "/api/staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 117}]}, {"method": "POST", "path": "/api/staff/:id/check-in", "evidence": [{"file": "backend/src/server.js", "line": 123}]}, {"method": "POST", "path": "/api/staff/:id/check-out", "evidence": [{"file": "backend/src/server.js", "line": 124}]}] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: ["Add staff login", "Staff Accounts", "Kitchen Team ( )", "Working Time History", "Edit details"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-StaffManagement.

Evidence: [frontend/src/App.jsx:4424](../../frontend/src/App.jsx#L4424)

## W-AdminKitchenTeam — Admin Kitchen Team

PIN authentication, identity and profile editing through Admin Kitchen Team.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["StaffManagement"] |
| exitPoints | ["KitchenStaffEditor"] |
| contentHierarchy | Source order: No kitchen employees |
| displayedData | ["No kitchen employees"] |
| cards | ["KitchenMemberCard"] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["KitchenStaffEditor"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No kitchen employees"] |
| loadingStates | [] |
| errorStates | ["toast(error.message)"] |
| notifications | ["toast(`${member.name} removed from the kitchen team`)", "toast(error.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["KitchenStaffEditor"] |
| apiUsed | ["api(`/kitchen-staff/${member.id}`, { method: \"DELETE\" })"] |
| backendControllers | [{"method": "POST", "path": "/api/kitchen-staff", "evidence": [{"file": "backend/src/server.js", "line": 120}]}, {"method": "PUT", "path": "/api/kitchen-staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 121}]}, {"method": "DELETE", "path": "/api/kitchen-staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 122}]}] |
| entities | ["users", "master_users", "company_users"] |

Actions: ["Add chef"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:4654](../../frontend/src/App.jsx#L4654)

## W-StaffEditor — Staff Editor

Manage login accounts, kitchen roster, compensation fields and shifts through Staff Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | staff |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["StaffManagement"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [""] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["e.target.value.replace(/\\D/g, \"\").slice(0, 6)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "toast(staff ? \"Staff login updated\" : `Staff login created · Generated PIN ${result.pin}`)", "setError(e.message)", "toast(`${staff.name} removed from Staff Management`)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(staff ? `/staff/${staff.id}` : \"/staff\", { method: staff ? \"PUT\" : \"POST\", body: JSON.stringify(form), })", "api(`/staff/${staff.id}`, { method: \"DELETE\" })"] |
| backendControllers | [{"method": "POST", "path": "/api/staff", "evidence": [{"file": "backend/src/server.js", "line": 115}]}, {"method": "PUT", "path": "/api/staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 116}]}, {"method": "DELETE", "path": "/api/staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 117}]}, {"method": "POST", "path": "/api/staff/:id/check-in", "evidence": [{"file": "backend/src/server.js", "line": 123}]}, {"method": "POST", "path": "/api/staff/:id/check-out", "evidence": [{"file": "backend/src/server.js", "line": 124}]}] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: ["<icon/dynamic>", "<icon/dynamic>", "<icon/dynamic>", "Delete staff", "Cancel", "<icon/dynamic>"].

Forms: F-W-StaffEditor; tables/lists: T-W-StaffEditor.

Evidence: [frontend/src/App.jsx:4680](../../frontend/src/App.jsx#L4680)

## W-SettingsPanel — Settings Panel

Web business name editable; currency disabled; tax/service inputs commented out.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | settings |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Admin"] |
| exitPoints | [] |
| contentHierarchy | Web business name editable; currency disabled; tax/service inputs commented out. |
| displayedData | ["Restaurant details"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["toast(\"Business settings saved\")"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(\"/settings\", { method: \"PUT\", body: JSON.stringify(s) })"] |
| backendControllers | [{"method": "PUT", "path": "/api/settings", "evidence": [{"file": "backend/src/server.js", "line": 110}]}] |
| entities | ["settings"] |

Actions: ["Save changes"].

Forms: F-W-SettingsPanel; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:4815](../../frontend/src/App.jsx#L4815)

## W-RoleOverview — Role Overview

Role-specific queue KPIs → primary queue shortcut → four recent items. Waiter attribution uses name matching, not stable staff IDs.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | overview |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | waiter |
| secondaryUsers | ["chef", "juicer"] |
| entryPoints | ["Waiter", "Chef", "Juicer"] |
| exitPoints | [] |
| contentHierarchy | Role-specific queue KPIs → primary queue shortcut → four recent items. Waiter attribution uses name matching, not stable staff IDs. |
| displayedData | [""] |
| cards | ["Status"] |
| charts | [] |
| tabs | [] |
| filters | ["data.orders.filter((order) => dateKey(order.createdAt) === today)", "todayOrders.filter((order) => order.orderType !== \"parcel\" && String(order.waiter \|\| \"\").toLowerCase().includes(firstName.toLowerCase()))", "mine.filter((order) => order.status === \"ready\")", "mine.filter((order) => order.status === \"preparing\")", "mine.filter((order) => order.status === \"new\")", "data.tables.filter((table) => table.status === \"occupied\")", "data.menu.filter((item) => String(item.category).toLowerCase() === \"juices\" && item.available)", "data.menu.filter((item) => String(item.category).toLowerCase() !== \"juices\" && !item.isCombo && item.available)", "data.tables.filter(t => t.status === \"available\")", "mine.filter(o => o.paymentStatus === \"paid\")", "mine.filter(o => o.status === \"ready\")", "mine.filter(o => [\"new\", \"preparing\"].includes(o.status))", "data.menu.filter(i=>String(i.category).toLowerCase()!==\"juices\"&&!i.isCombo&&!i.available)", "data.menu.filter(i=>String(i.category).toLowerCase()===\"juices\"&&!i.available)", "[...mine].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4)", "[...mine].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))"] |
| search | [] |
| sorting | ["[...mine].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4)", "[...mine].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No active work needs attention."] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["waiter", "chef", "juicer"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["orders", "restaurant_tables", "users", "staff_attendance", "inventory"] |

Actions: ["<icon/dynamic>", "<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-RoleOverview.

Evidence: [frontend/src/App.jsx:4874](../../frontend/src/App.jsx#L4874)

## W-Waiter — Waiter

PIN authentication, identity and profile editing through Waiter.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | waiter |
| secondaryUsers | [] |
| entryPoints | ["CompanyApp"] |
| exitPoints | ["RoleOverview", "WaiterOrders", "TableDrawer"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["TableCard"] |
| charts | [] |
| tabs | ["[page, setPage] = useState(\"overview\")"] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | ["TableDrawer"] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["waiter"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["RoleOverview", "WaiterOrders", "TableDrawer"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["users", "master_users", "company_users"] |

Actions: [].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:4920](../../frontend/src/App.jsx#L4920)

## W-Bookings — Bookings

Calendar → selected day → confirmed table bookings → create or cancel. No booking edit or seating action. Past/cancelled records are not returned by the current state feed.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | bookings |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Admin"] |
| exitPoints | [] |
| contentHierarchy | Calendar → selected day → confirmed table bookings → create or cancel. No booking edit or seating action. Past/cancelled records are not returned by the current state feed. |
| displayedData | ["No bookings for this date", ""] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["bookings.filter((booking) => booking.bookingDate === selectedDate)", "bookings.filter((booking) => booking.bookingDate === key)", "daily.slice(0,2)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | ["confirm(\"Cancel this table booking?\")"] |
| stateTextEvidence | ["No bookings for this date", "No bookings"] |
| loadingStates | [] |
| errorStates | ["toast(error.message)"] |
| notifications | ["confirm(\"Cancel this table booking?\")", "toast(\"Booking cancelled and the time slot released\")", "toast(error.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(`/bookings/${id}`, { method: \"DELETE\" })"] |
| backendControllers | [{"method": "POST", "path": "/api/bookings", "evidence": [{"file": "backend/src/server.js", "line": 62}]}, {"method": "DELETE", "path": "/api/bookings/:id", "evidence": [{"file": "backend/src/server.js", "line": 85}]}] |
| entities | ["bookings", "restaurant_tables", "notification_outbox"] |

Actions: ["Calendar", "Add booking", "<icon/dynamic>", "Add booking", "<icon/dynamic>", "Today", "<icon/dynamic>", "<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-Bookings.

Evidence: [frontend/src/App.jsx:4979](../../frontend/src/App.jsx#L4979)

## W-WaiterOrders — Waiter Orders

Take orders and additional rounds, coordinate handoff and settle bills through Waiter Orders.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | orders |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | waiter |
| secondaryUsers | [] |
| entryPoints | ["Waiter"] |
| exitPoints | ["OperationsCalendar"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["DailyOrderCards"] |
| charts | [] |
| tabs | [] |
| filters | ["data.orders.filter((order) => { if (order.orderType === \"parcel\") return false; const waiter = String(order.waiter \|\| \"\").toLowerCase(); return !firstName \|\| waiter.includes(firstName); })", "mine.filter((order) => dateKey(order.createdAt) === selectedDate)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["waiter"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["OperationsCalendar"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["orders", "order_items", "menu_items", "restaurant_tables"] |

Actions: ["Calendar"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-WaiterOrders.

Evidence: [frontend/src/App.jsx:5033](../../frontend/src/App.jsx#L5033)

## W-BookingModal — Booking Modal

Phone, date, time, duration and available table. This reserves a restaurant table, not a room. API rejects past times and overlaps. No guest account, rate, deposit or stay.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | notifications |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Admin"] |
| exitPoints | [] |
| contentHierarchy | Phone, date, time, duration and available table. This reserves a restaurant table, not a room. API rejects past times and overlaps. No guest account, rate, deposit or stay. |
| displayedData | ["Book a table"] |
| cards | [] |
| charts | [] |
| tabs | ["[form, setForm] = useState({ tableId: \"\", customerPhone: \"\", bookingDate: initialDate \|\| dateKey(new Date()), bookingTime: \"18:00\", durationMinutes: 90, })"] |
| filters | ["bookings.filter((booking) => booking.tableId === table.id && booking.bookingDate === form.bookingDate && bookingMinutes(booking.bookingTime) < requestedEnd && bookingMinutes(booking.bookingTime) + Number(booking.durationMinutes) > requestedStart)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | ["toast(result.notificationStatus === \"sent\" ? \"Booking confirmed · SMS sent to customer\" : result.notificationStatus === \"failed\" ? \"Booking confirmed · SMS delivery failed\" : \"Booking confirmed · SMS queued (gateway configuration required)\")"] |
| stateTextEvidence | [] |
| loadingStates | ["[busy, setBusy] = useState(false)"] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "toast(result.notificationStatus === \"sent\" ? \"Booking confirmed · SMS sent to customer\" : result.notificationStatus === \"failed\" ? \"Booking confirmed · SMS delivery failed\" : \"Booking confirmed · SMS queued (gateway configuration required)\")", "setError(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(\"/bookings\", { method: \"POST\", body: JSON.stringify(form) })"] |
| backendControllers | [{"method": "POST", "path": "/api/bookings", "evidence": [{"file": "backend/src/server.js", "line": 62}]}, {"method": "DELETE", "path": "/api/bookings/:id", "evidence": [{"file": "backend/src/server.js", "line": 85}]}] |
| entities | ["notification_outbox"] |

Actions: ["<icon/dynamic>"].

Forms: F-W-BookingModal; tables/lists: T-W-BookingModal.

Evidence: [frontend/src/App.jsx:5053](../../frontend/src/App.jsx#L5053)

## W-TableDrawer — Table Drawer

Create tables, inspect active service and change table state through Table Drawer.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | tables |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | waiter |
| secondaryUsers | [] |
| entryPoints | ["Waiter"] |
| exitPoints | ["OrderBuilder", "Bill"] |
| contentHierarchy | Source order: Table → Table is under cleaning → Waiting for kitchen handoff → Deliver to Table → Order received → Kitchen is preparing this order |
| displayedData | ["Table", "Table is under cleaning", "Waiting for kitchen handoff", "Deliver to Table", "Order received", "Kitchen is preparing this order"] |
| cards | ["Status", "TableStatusControls"] |
| charts | [] |
| tabs | ["[mode, setMode] = useState(order ? \"history\" : \"order\")"] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["OrderBuilder"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[handoffBusy, setHandoffBusy] = useState(\"\")"] |
| errorStates | [] |
| notifications | ["toast(`Round ${batchNo} of order #${order.id} received at Table ${table.number}`)", "toast(e.message)"] |
| permissions | {"roles": ["waiter"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["OrderBuilder", "Bill"] |
| apiUsed | ["api(`/orders/${order.id}/batches/${batchNo}/handoff`, { method: \"PATCH\", body: JSON.stringify({ status }), })"] |
| backendControllers | [{"method": "POST", "path": "/api/orders", "evidence": [{"file": "backend/src/server.js", "line": 86}]}, {"method": "POST", "path": "/api/orders/:id/items", "evidence": [{"file": "backend/src/server.js", "line": 87}]}, {"method": "POST", "path": "/api/orders/:id/mark-paid", "evidence": [{"file": "backend/src/server.js", "line": 92}]}, {"method": "PATCH", "path": "/api/orders/:id/items/status", "evidence": [{"file": "backend/src/server.js", "line": 93}]}, {"method": "PATCH", "path": "/api/orders/:id/batches/:batchNo/handoff", "evidence": [{"file": "backend/src/server.js", "line": 94}]}, {"method": "PATCH", "path": "/api/orders/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 95}]}, {"method": "POST", "path": "/api/orders/:id/request-bill", "evidence": [{"file": "backend/src/server.js", "line": 96}]}, {"method": "GET", "path": "/api/orders/:id/bill", "evidence": [{"file": "backend/src/server.js", "line": 97}]}, {"method": "POST", "path": "/api/orders/:id/finalize", "evidence": [{"file": "backend/src/server.js", "line": 98}]}] |
| entities | ["restaurant_tables", "orders", "order_items"] |

Actions: ["View orders", "Add new order", "Bill", "<icon/dynamic>", "More order", "Complete & billing"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:5119](../../frontend/src/App.jsx#L5119)

## W-OrderBuilder — Order Builder

Category choices → menu cards → quantities/cart → submit. New order or additional batch depends on table order. No web special-request input identified.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | orders |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | waiter |
| secondaryUsers | [] |
| entryPoints | ["TableDrawer"] |
| exitPoints | [] |
| contentHierarchy | Category choices → menu cards → quantities/cart → submit. New order or additional batch depends on table order. No web special-request input identified. |
| displayedData | [""] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["c .map((i) => (i.menuId === id ? { ...i, qty: i.qty + d } : i)) .filter((i) => i.qty > 0)", "data.menu .filter((m) => cat === \"All\" \|\| m.category === cat)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[sending, setSending] = useState(false)"] |
| errorStates | [] |
| notifications | ["toast( existing ? \"Additional order sent to kitchen\" : \"Order sent to kitchen\", )", "toast(e.message)"] |
| permissions | {"roles": ["waiter"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(existing ? `/orders/${existing.id}/items` : \"/orders\", { method: \"POST\", body: JSON.stringify( existing ? { items: cart } : { tableId: table.id, guestName: table.guestName \|\| \"Walk-in Guest\", waiter: user.name.split(\" \")[0], items: cart, }, ), })"] |
| backendControllers | [{"method": "POST", "path": "/api/orders", "evidence": [{"file": "backend/src/server.js", "line": 86}]}, {"method": "POST", "path": "/api/orders/:id/items", "evidence": [{"file": "backend/src/server.js", "line": 87}]}, {"method": "POST", "path": "/api/orders/:id/mark-paid", "evidence": [{"file": "backend/src/server.js", "line": 92}]}, {"method": "PATCH", "path": "/api/orders/:id/items/status", "evidence": [{"file": "backend/src/server.js", "line": 93}]}, {"method": "PATCH", "path": "/api/orders/:id/batches/:batchNo/handoff", "evidence": [{"file": "backend/src/server.js", "line": 94}]}, {"method": "PATCH", "path": "/api/orders/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 95}]}, {"method": "POST", "path": "/api/orders/:id/request-bill", "evidence": [{"file": "backend/src/server.js", "line": 96}]}, {"method": "GET", "path": "/api/orders/:id/bill", "evidence": [{"file": "backend/src/server.js", "line": 97}]}, {"method": "POST", "path": "/api/orders/:id/finalize", "evidence": [{"file": "backend/src/server.js", "line": 98}]}] |
| entities | ["orders", "order_items", "menu_items", "restaurant_tables"] |

Actions: ["<icon/dynamic>", "<icon/dynamic>", "<icon/dynamic>", "<icon/dynamic>", " "].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-OrderBuilder.

Evidence: [frontend/src/App.jsx:5333](../../frontend/src/App.jsx#L5333)

## W-Bill — Bill

Take orders and additional rounds, coordinate handoff and settle bills through Bill.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | orders |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | waiter |
| secondaryUsers | [] |
| entryPoints | ["TableDrawer"] |
| exitPoints | [] |
| contentHierarchy | Source order: No active bill → Sent to Admin |
| displayedData | ["No active bill", "", "Sent to Admin"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No active bill"] |
| loadingStates | ["[sending, setSending] = useState(false)"] |
| errorStates | [] |
| notifications | ["toast(`Bill for Table ${table.number} sent to Admin`)", "toast(e.message)"] |
| permissions | {"roles": ["waiter"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(`/orders/${order.id}/request-bill`, { method: \"POST\", body: \"{}\", })"] |
| backendControllers | [{"method": "POST", "path": "/api/orders", "evidence": [{"file": "backend/src/server.js", "line": 86}]}, {"method": "POST", "path": "/api/orders/:id/items", "evidence": [{"file": "backend/src/server.js", "line": 87}]}, {"method": "POST", "path": "/api/orders/:id/mark-paid", "evidence": [{"file": "backend/src/server.js", "line": 92}]}, {"method": "PATCH", "path": "/api/orders/:id/items/status", "evidence": [{"file": "backend/src/server.js", "line": 93}]}, {"method": "PATCH", "path": "/api/orders/:id/batches/:batchNo/handoff", "evidence": [{"file": "backend/src/server.js", "line": 94}]}, {"method": "PATCH", "path": "/api/orders/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 95}]}, {"method": "POST", "path": "/api/orders/:id/request-bill", "evidence": [{"file": "backend/src/server.js", "line": 96}]}, {"method": "GET", "path": "/api/orders/:id/bill", "evidence": [{"file": "backend/src/server.js", "line": 97}]}, {"method": "POST", "path": "/api/orders/:id/finalize", "evidence": [{"file": "backend/src/server.js", "line": 98}]}] |
| entities | ["orders", "order_items", "menu_items", "restaurant_tables"] |

Actions: ["<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:5657](../../frontend/src/App.jsx#L5657)

## W-AdminBillPopup — Admin Bill Popup

Take orders and additional rounds, coordinate handoff and settle bills through Admin Bill Popup.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | orders |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminTables", "AdminTableDetails"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [""] |
| cards | ["CreditCard"] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["toast(`Table ${table?.number} payment completed by ${method}`)", "toast(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(`/orders/${order.id}/finalize`, { method: \"POST\", body: JSON.stringify({ paymentMethod: method }), })"] |
| backendControllers | [{"method": "POST", "path": "/api/orders", "evidence": [{"file": "backend/src/server.js", "line": 86}]}, {"method": "POST", "path": "/api/orders/:id/items", "evidence": [{"file": "backend/src/server.js", "line": 87}]}, {"method": "POST", "path": "/api/orders/:id/mark-paid", "evidence": [{"file": "backend/src/server.js", "line": 92}]}, {"method": "PATCH", "path": "/api/orders/:id/items/status", "evidence": [{"file": "backend/src/server.js", "line": 93}]}, {"method": "PATCH", "path": "/api/orders/:id/batches/:batchNo/handoff", "evidence": [{"file": "backend/src/server.js", "line": 94}]}, {"method": "PATCH", "path": "/api/orders/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 95}]}, {"method": "POST", "path": "/api/orders/:id/request-bill", "evidence": [{"file": "backend/src/server.js", "line": 96}]}, {"method": "GET", "path": "/api/orders/:id/bill", "evidence": [{"file": "backend/src/server.js", "line": 97}]}, {"method": "POST", "path": "/api/orders/:id/finalize", "evidence": [{"file": "backend/src/server.js", "line": 98}]}] |
| entities | ["orders", "order_items", "menu_items", "restaurant_tables"] |

Actions: ["Card / UPI Record digital payment", "Cash Record cash payment"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:5730](../../frontend/src/App.jsx#L5730)

## W-Chef — Chef

Prepare tickets and mark batches ready through Chef.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | production |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | chef |
| secondaryUsers | [] |
| entryPoints | ["CompanyApp"] |
| exitPoints | ["RoleOverview", "ChefManagement", "ChefStockBooking", "ChefDishes"] |
| contentHierarchy | Source order: Kitchen is clear |
| displayedData | ["Kitchen is clear"] |
| cards | ["KitchenTicket"] |
| charts | [] |
| tabs | ["[page, setPage] = useState(\"overview\")"] |
| filters | ["active.filter((order) => order.orderType !== \"parcel\")", "active.filter((order) => order.orderType === \"parcel\")", "active.filter((o) => o.orderType === \"parcel\")", "active.filter((o) => o.orderType !== \"parcel\")", "orders.filter((o) => o.status === \"ready\")", "orders.filter((o) => o.status === \"new\")", "orders.filter((o) => o.status === \"preparing\")"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No orders in this queue right now."] |
| loadingStates | [] |
| errorStates | ["toast(error.message)"] |
| notifications | ["toast(`Order #${id} marked ${next}`)", "toast(`Round ${batchNo} of order #${id} collected from the kitchen`)", "toast(error.message)"] |
| permissions | {"roles": ["chef"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["RoleOverview", "ChefManagement", "ChefStockBooking", "ChefDishes"] |
| apiUsed | ["api(`/orders/${id}/items/status`, { method: \"PATCH\", body: JSON.stringify({ status: next, batchNo }), })", "api(`/orders/${id}/batches/${batchNo}/handoff`, { method: \"PATCH\", body: JSON.stringify({ status: \"collected\" }), })"] |
| backendControllers | [{"method": "POST", "path": "/api/orders", "evidence": [{"file": "backend/src/server.js", "line": 86}]}, {"method": "POST", "path": "/api/orders/:id/items", "evidence": [{"file": "backend/src/server.js", "line": 87}]}, {"method": "POST", "path": "/api/orders/:id/mark-paid", "evidence": [{"file": "backend/src/server.js", "line": 92}]}, {"method": "PATCH", "path": "/api/orders/:id/items/status", "evidence": [{"file": "backend/src/server.js", "line": 93}]}, {"method": "PATCH", "path": "/api/orders/:id/batches/:batchNo/handoff", "evidence": [{"file": "backend/src/server.js", "line": 94}]}, {"method": "PATCH", "path": "/api/orders/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 95}]}, {"method": "POST", "path": "/api/orders/:id/request-bill", "evidence": [{"file": "backend/src/server.js", "line": 96}]}, {"method": "GET", "path": "/api/orders/:id/bill", "evidence": [{"file": "backend/src/server.js", "line": 97}]}, {"method": "POST", "path": "/api/orders/:id/finalize", "evidence": [{"file": "backend/src/server.js", "line": 98}]}] |
| entities | ["orders", "order_items", "menu_items"] |

Actions: [].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-Chef.

Evidence: [frontend/src/App.jsx:5829](../../frontend/src/App.jsx#L5829)

## W-ChefStockBooking — Chef Stock Booking

Track stock movements, minimums, planning and chef purchase requests through Chef Stock Booking.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | stock |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | chef |
| secondaryUsers | [] |
| entryPoints | ["Chef"] |
| exitPoints | ["ChefStockRequestModal"] |
| contentHierarchy | Source order: No ingredients found |
| displayedData | ["", "No ingredients found"] |
| cards | ["Stat"] |
| charts | [] |
| tabs | [] |
| filters | ["requests.filter((request)=>request.status!==\"resolved\")", "inventory.filter((item)=>item.quantity<=item.min)", "inventory.filter((item)=>`${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>(a.quantity/a.min\|\|0)-(b.quantity/b.min\|\|0))", "inventory.filter((item)=>`${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()))"] |
| search | [{"line": 5963, "tag": "input", "label": "Search ingredient or category", "type": "text", "value": "query", "required": false, "defaultValue": "", "disabled": false, "condition": [], "handler": "(event)=>setQuery(event.target.value)"}] |
| sorting | ["inventory.filter((item)=>`${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>(a.quantity/a.min\|\|0)-(b.quantity/b.min\|\|0))"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["ChefStockRequestModal"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No ingredients found"] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["chef"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["ChefStockRequestModal"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["inventory", "inventory_transactions", "stock_requests"] |

Actions: ["Book this stock"].

Forms: F-W-ChefStockBooking; tables/lists: T-W-ChefStockBooking.

Evidence: [frontend/src/App.jsx:5957](../../frontend/src/App.jsx#L5957)

## W-ChefStockRequestModal — Chef Stock Request Modal

Track stock movements, minimums, planning and chef purchase requests through Chef Stock Request Modal.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | stock |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | chef |
| secondaryUsers | [] |
| entryPoints | ["ChefStockBooking"] |
| exitPoints | [] |
| contentHierarchy | Source order: Request |
| displayedData | ["Request"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | ["setError(\"\")", "setError(err.message)"] |
| notifications | ["setError(\"\")", "toast(`${item.name} stock request sent to Admin`)", "setError(err.message)"] |
| permissions | {"roles": ["chef"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(\"/stock-requests\",{method:\"POST\",body:JSON.stringify({inventoryId:item.id,requestedQuantity:Number(quantity),note,requestedBy:user.name})})"] |
| backendControllers | [{"method": "POST", "path": "/api/stock-requests", "evidence": [{"file": "backend/src/server.js", "line": 103}]}, {"method": "PATCH", "path": "/api/stock-requests/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 104}]}] |
| entities | ["inventory", "inventory_transactions", "stock_requests"] |

Actions: ["Cancel", "<icon/dynamic>"].

Forms: F-W-ChefStockRequestModal; tables/lists: T-W-ChefStockRequestModal.

Evidence: [frontend/src/App.jsx:5970](../../frontend/src/App.jsx#L5970)

## W-Juicer — Juicer

Prepare tickets and mark batches ready through Juicer.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | production |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | juicer |
| secondaryUsers | [] |
| entryPoints | ["CompanyApp"] |
| exitPoints | ["RoleOverview", "ChefDishes"] |
| contentHierarchy | Source order: Juice station is clear |
| displayedData | ["Juice station is clear"] |
| cards | ["KitchenTicket"] |
| charts | [] |
| tabs | ["[page, setPage] = useState(\"overview\")"] |
| filters | ["active.filter((order) => order.orderType !== \"parcel\")", "active.filter((order) => order.orderType === \"parcel\")", "data.menu.filter(item=>String(item.category).toLowerCase()===\"juices\")", "active.filter(order => order.status === \"ready\")", "active.filter(order => order.orderType === \"parcel\")", "active.filter(order => order.orderType !== \"parcel\")", "active.filter(o=>o.status===\"new\")", "active.filter(o=>o.status===\"preparing\")", "active.filter(o=>o.status===\"ready\")"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No juice items in this queue right now."] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["toast(`Juice order #${id} marked ${next}`)"] |
| permissions | {"roles": ["juicer"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["RoleOverview", "ChefDishes"] |
| apiUsed | ["api(`/orders/${id}/items/status`, { method: \"PATCH\", body: JSON.stringify({ status: next, batchNo }) })"] |
| backendControllers | [{"method": "POST", "path": "/api/orders", "evidence": [{"file": "backend/src/server.js", "line": 86}]}, {"method": "POST", "path": "/api/orders/:id/items", "evidence": [{"file": "backend/src/server.js", "line": 87}]}, {"method": "POST", "path": "/api/orders/:id/mark-paid", "evidence": [{"file": "backend/src/server.js", "line": 92}]}, {"method": "PATCH", "path": "/api/orders/:id/items/status", "evidence": [{"file": "backend/src/server.js", "line": 93}]}, {"method": "PATCH", "path": "/api/orders/:id/batches/:batchNo/handoff", "evidence": [{"file": "backend/src/server.js", "line": 94}]}, {"method": "PATCH", "path": "/api/orders/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 95}]}, {"method": "POST", "path": "/api/orders/:id/request-bill", "evidence": [{"file": "backend/src/server.js", "line": 96}]}, {"method": "GET", "path": "/api/orders/:id/bill", "evidence": [{"file": "backend/src/server.js", "line": 97}]}, {"method": "POST", "path": "/api/orders/:id/finalize", "evidence": [{"file": "backend/src/server.js", "line": 98}]}] |
| entities | ["orders", "order_items", "menu_items"] |

Actions: [].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-Juicer.

Evidence: [frontend/src/App.jsx:5976](../../frontend/src/App.jsx#L5976)

## W-ChefDishes — Chef Dishes

Manage dishes, images, prices, availability and combo composition through Chef Dishes.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | menu |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | chef |
| secondaryUsers | ["juicer"] |
| entryPoints | ["Chef", "Juicer"] |
| exitPoints | [] |
| contentHierarchy | Source order: No dishes found |
| displayedData | ["", "No dishes found"] |
| cards | ["Status"] |
| charts | [] |
| tabs | [] |
| filters | ["data.menu.filter((item) => !item.isCombo && (juicer ? String(item.category).toLowerCase() === \"juices\" : String(item.category).toLowerCase() !== \"juices\") && item.name.toLowerCase().includes(query.toLowerCase()))", "dishes.filter((item) => item.available)", "dishes.filter((item) => !item.available)"] |
| search | [{"line": 6014, "tag": "input", "label": "Search dishes…", "type": "text", "value": "query", "required": false, "defaultValue": "", "disabled": false, "condition": [], "handler": "(event) => setQuery(event.target.value)"}] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No dishes found"] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["toast(`${item.name} marked ${available ? \"available\" : \"completed / unavailable\"}`)"] |
| permissions | {"roles": ["chef", "juicer"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(`/menu/${item.id}/availability`, { method: \"PATCH\", body: JSON.stringify({ available }) })"] |
| backendControllers | [{"method": "POST", "path": "/api/menu", "evidence": [{"file": "backend/src/server.js", "line": 125}]}, {"method": "PUT", "path": "/api/menu/:id", "evidence": [{"file": "backend/src/server.js", "line": 126}]}, {"method": "DELETE", "path": "/api/menu/:id", "evidence": [{"file": "backend/src/server.js", "line": 127}]}, {"method": "PATCH", "path": "/api/menu/:id/availability", "evidence": [{"file": "backend/src/server.js", "line": 128}]}, {"method": "POST", "path": "/api/menu/:id/image", "evidence": [{"file": "backend/src/server.js", "line": 131}]}, {"method": "DELETE", "path": "/api/menu/:id/image", "evidence": [{"file": "backend/src/server.js", "line": 132}]}] |
| entities | ["menu_items", "combo_components"] |

Actions: ["Mark completed", "Make available"].

Forms: F-W-ChefDishes; tables/lists: T-W-ChefDishes.

Evidence: [frontend/src/App.jsx:6004](../../frontend/src/App.jsx#L6004)

## W-ChefManagement — Chef Management

Manage login accounts, kitchen roster, compensation fields and shifts through Chef Management.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | staff |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | chef |
| secondaryUsers | [] |
| entryPoints | ["Chef"] |
| exitPoints | ["KitchenStaffEditor", "JuicerLoginEditor"] |
| contentHierarchy | Source order: No chefs added yet |
| displayedData | ["", "No chefs added yet"] |
| cards | ["Status", "Stat", "KitchenMemberCard"] |
| charts | [] |
| tabs | [] |
| filters | ["staff.filter((x) => x.active)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["KitchenStaffEditor", "JuicerLoginEditor"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No chefs added yet"] |
| loadingStates | [] |
| errorStates | ["toast(error.message)"] |
| notifications | ["toast(error.message)", "toast(\"Chef removed\")", "toast(e.message)"] |
| permissions | {"roles": ["chef"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["KitchenStaffEditor", "JuicerLoginEditor"] |
| apiUsed | ["api(\"/juicer-login\")", "api(`/kitchen-staff/${id}`, { method: \"DELETE\" })"] |
| backendControllers | [{"method": "GET", "path": "/api/juicer-login", "evidence": [{"file": "backend/src/server.js", "line": 118}]}, {"method": "POST", "path": "/api/juicer-login", "evidence": [{"file": "backend/src/server.js", "line": 119}]}, {"method": "POST", "path": "/api/kitchen-staff", "evidence": [{"file": "backend/src/server.js", "line": 120}]}, {"method": "PUT", "path": "/api/kitchen-staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 121}]}, {"method": "DELETE", "path": "/api/kitchen-staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 122}]}] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: ["<icon/dynamic>", "Add chef"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-ChefManagement.

Evidence: [frontend/src/App.jsx:6024](../../frontend/src/App.jsx#L6024)

## W-JuicerLoginEditor — Juicer Login Editor

Manage login accounts, kitchen roster, compensation fields and shifts through Juicer Login Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | staff |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | chef |
| secondaryUsers | [] |
| entryPoints | ["ChefManagement"] |
| exitPoints | [] |
| contentHierarchy | Source order: Create Juicer login |
| displayedData | ["Create Juicer login"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | ["toast(error.message)"] |
| notifications | ["toast(`Juicer login created · Generated PIN ${result.pin}`)", "toast(error.message)"] |
| permissions | {"roles": ["chef"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(\"/juicer-login\",{method:\"POST\",body:JSON.stringify(form)})"] |
| backendControllers | [{"method": "GET", "path": "/api/juicer-login", "evidence": [{"file": "backend/src/server.js", "line": 118}]}, {"method": "POST", "path": "/api/juicer-login", "evidence": [{"file": "backend/src/server.js", "line": 119}]}] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: ["<icon/dynamic>"].

Forms: F-W-JuicerLoginEditor; tables/lists: No separate list identified.

Evidence: [frontend/src/App.jsx:6090](../../frontend/src/App.jsx#L6090)

## W-KitchenStaffEditor — Kitchen Staff Editor

Manage login accounts, kitchen roster, compensation fields and shifts through Kitchen Staff Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | staff |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | admin |
| secondaryUsers | ["chef"] |
| entryPoints | ["AdminKitchenTeam", "ChefManagement"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [""] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["String(member.joinedOn).slice(0, 10)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No PIN or separate login will be created."] |
| loadingStates | [] |
| errorStates | ["setError(\"\")", "setError(e.message)"] |
| notifications | ["setError(\"\")", "toast(member ? \"Chef updated\" : \"Chef added\")", "setError(e.message)"] |
| permissions | {"roles": ["admin", "chef"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(member ? `/kitchen-staff/${member.id}` : \"/kitchen-staff\", { method: member ? \"PUT\" : \"POST\", body: JSON.stringify(form), })"] |
| backendControllers | [{"method": "POST", "path": "/api/kitchen-staff", "evidence": [{"file": "backend/src/server.js", "line": 120}]}, {"method": "PUT", "path": "/api/kitchen-staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 121}]}, {"method": "DELETE", "path": "/api/kitchen-staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 122}]}] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: ["<icon/dynamic>", "<icon/dynamic>"].

Forms: F-W-KitchenStaffEditor; tables/lists: T-W-KitchenStaffEditor.

Evidence: [frontend/src/App.jsx:6095](../../frontend/src/App.jsx#L6095)

## W-AttendancePanel — Attendance Panel

Web component exists but staff sidebar entries are commented out; Shell redirects unsupported page keys. Treat as dormant, not reachable staff navigation.

| Aspect | Current implementation |
| --- | --- |
| platform | web |
| module | staff |
| status | FRONTEND_ONLY |
| reachability | Dormant/unlinked |
| routeDefinition | Local component state; public Login selects /, /login, /register. |
| primaryUser | waiter |
| secondaryUsers | ["chef", "juicer"] |
| entryPoints | [] |
| exitPoints | [] |
| contentHierarchy | Web component exists but staff sidebar entries are commented out; Shell redirects unsupported page keys. Treat as dormant, not reachable staff navigation. |
| displayedData | ["Hello,", "", "Ready to start?", "My recent working times"] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["record.shifts.filter(s=>new Date(s.checkIn).toDateString()===new Date().toDateString())"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["Loading attendance…"] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["toast(e.message)", "toast(`You are checked ${active?'out':'in'}`)"] |
| permissions | {"roles": ["waiter", "chef", "juicer"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(`/attendance/${user.id}`)", "api(`/attendance/${user.id}/${active?'check-out':'check-in'}`,{method:'POST',body:'{}'})"] |
| backendControllers | [{"method": "GET", "path": "/api/attendance/:id", "evidence": [{"file": "backend/src/server.js", "line": 112}]}, {"method": "POST", "path": "/api/attendance/:id/check-in", "evidence": [{"file": "backend/src/server.js", "line": 113}]}, {"method": "POST", "path": "/api/attendance/:id/check-out", "evidence": [{"file": "backend/src/server.js", "line": 114}]}] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: ["<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-W-AttendancePanel.

Evidence: [frontend/src/AttendancePanel.jsx:5](../../frontend/src/AttendancePanel.jsx#L5)

## M-NativeLanding — Native Landing

PIN authentication, identity and profile editing through Native Landing.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | anonymous |
| secondaryUsers | [] |
| entryPoints | ["Root"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["anonymous"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["users", "master_users", "company_users"] |

Actions: ["Login", "Call to order", "Instagram"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-NativeLanding.

Evidence: [mobile/App.js:31](../../mobile/App.js#L31)

## M-RoleSelect — Role Select

PIN authentication, identity and profile editing through Role Select.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | access |
| status | FRONTEND_ONLY |
| reachability | Dormant/unlinked |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | [] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["users", "master_users", "company_users"] |

Actions: ["0"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [mobile/App.js:35](../../mobile/App.js#L35)

## M-Login — Login

Web supports tenant Hotel ID + PIN and no-Hotel-ID master/applicant path. Native requires four-digit Hotel ID and six-digit PIN, so it does not expose the same login paths.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | anonymous |
| secondaryUsers | [] |
| entryPoints | ["Root"] |
| exitPoints | [] |
| contentHierarchy | Web supports tenant Hotel ID + PIN and no-Hotel-ID master/applicant path. Native requires four-digit Hotel ID and six-digit PIN, so it does not expose the same login paths. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["v.replace(/\\D/g,'').slice(0,4)", "v.replace(/\\D/g,'').slice(0,6)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | ["setError('')", "setError(e.message)"] |
| notifications | ["setError('')", "setError(e.message)"] |
| permissions | {"roles": ["anonymous"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["fetch(`http://${host}:${unifiedApiPort}/api/public/resolve-login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hotelId,pin})})"] |
| backendControllers | [{"method": "POST", "path": "/api/public/resolve-login", "evidence": [{"file": "backend/src/master-server.js", "line": 211}]}] |
| entities | ["users", "master_users", "company_users"] |

Actions: ["<icon/dynamic>"].

Forms: F-M-Login; tables/lists: T-M-Login.

Evidence: [mobile/App.js:36](../../mobile/App.js#L36)

## M-MasterMobile — Master Mobile

Read-oriented company/user and revenue overview; no parity with web approval, company controls or SaaS billing management.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | master |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | superadmin |
| secondaryUsers | [] |
| entryPoints | ["Portal"] |
| exitPoints | [] |
| contentHierarchy | Read-oriented company/user and revenue overview; no parity with web approval, company controls or SaaS billing management. |
| displayedData | [] |
| cards | ["AdminStat"] |
| charts | [] |
| tabs | [] |
| filters | ["item.name.split(' ').map(x=>x[0]).join('').slice(0,2)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["notify(e.message)"] |
| permissions | {"roles": ["superadmin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api('/state')"] |
| backendControllers | [{"method": "GET", "path": "/api/state", "evidence": [{"file": "backend/src/server.js", "line": 58}]}, {"method": "GET", "path": "/api/state", "evidence": [{"file": "backend/src/master-server.js", "line": 215}]}] |
| entities | ["companies", "company_users", "saas_invoices", "module_pricing", "usage_logins"] |

Actions: ["<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-MasterMobile.

Evidence: [mobile/App.js:45](../../mobile/App.js#L45)

## M-Attendance — Attendance

Native staff landing tab: check in/out and recent eight shifts. This is employee timekeeping, not guest arrival/departure.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | staff |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | waiter |
| secondaryUsers | ["chef", "juicer"] |
| entryPoints | ["Portal"] |
| exitPoints | [] |
| contentHierarchy | Native staff landing tab: check in/out and recent eight shifts. This is employee timekeeping, not guest arrival/departure. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["data.shifts.slice(0,8)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify(e.message)", "notify(`Checked ${active?'out':'in'} successfully`)"] |
| permissions | {"roles": ["waiter", "chef", "juicer"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(`/attendance/${user.id}`)", "api(`/attendance/${user.id}/${active?'check-out':'check-in'}`,{method:'POST',body:'{}'})"] |
| backendControllers | [{"method": "GET", "path": "/api/attendance/:id", "evidence": [{"file": "backend/src/server.js", "line": 112}]}, {"method": "POST", "path": "/api/attendance/:id/check-in", "evidence": [{"file": "backend/src/server.js", "line": 113}]}, {"method": "POST", "path": "/api/attendance/:id/check-out", "evidence": [{"file": "backend/src/server.js", "line": 114}]}] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: ["busy?'Please wait…':active?'Check out now':'Check in now'"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-Attendance.

Evidence: [mobile/App.js:47](../../mobile/App.js#L47)

## M-AdminOverview — Admin Overview

Revenue and operational KPIs → occupancy/status graphic → recent orders and stock alerts. Metrics use loaded state rather than an unlimited historical dataset.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | overview |
| status | FRONTEND_ONLY |
| reachability | Dormant/unlinked |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | [] |
| exitPoints | [] |
| contentHierarchy | Revenue and operational KPIs → occupancy/status graphic → recent orders and stock alerts. Metrics use loaded state rather than an unlimited historical dataset. |
| displayedData | [] |
| cards | ["AdminStat"] |
| charts | [] |
| tabs | [] |
| filters | ["state.orders.filter(o=>!['completed','served'].includes(o.status))", "(state.attendance\|\|[]).filter(x=>!x.checkOut)", "state.tables.filter(t=>t.status==='occupied')", "state.tables.filter(t=>t.status===status)", "state.orders.slice(0,5)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["orders", "restaurant_tables", "users", "staff_attendance", "inventory"] |

Actions: [].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminOverview.

Evidence: [mobile/App.js:50](../../mobile/App.js#L50)

## M-AdminTables — Admin Tables

Create tables, inspect active service and change table state through Admin Tables.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | tables |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminScreen"] |
| exitPoints | ["MobileTableEditor"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["MobileTableEditor"] |
| drawers | [] |
| dialogs | ["Alert.alert(`Delete Table ${table.number}?`,'Historical orders will be preserved.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{try{await api(`/tables/${table.id}`,{method:'DELETE'});setSelected(null);await refresh();notify(`Table ${table.number} deleted`)}catch(e){notify(e.message)}}}])"] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | ["Alert.alert(`Delete Table ${table.number}?`,'Historical orders will be preserved.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{try{await api(`/tables/${table.id}`,{method:'DELETE'});setSelected(null);await refresh();notify(`Table ${table.number} deleted`)}catch(e){notify(e.message)}}}])"] |
| notifications | ["Alert.alert(`Delete Table ${table.number}?`,'Historical orders will be preserved.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{try{await api(`/tables/${table.id}`,{method:'DELETE'});setSelected(null);await refresh();notify(`Table ${table.number} deleted`)}catch(e){notify(e.message)}}}])", "notify(`Table ${table.number} deleted`)", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["MobileTableEditor"] |
| apiUsed | ["api(`/tables/${table.id}`,{method:'DELETE'})"] |
| backendControllers | [{"method": "PATCH", "path": "/api/tables/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 88}]}, {"method": "POST", "path": "/api/tables", "evidence": [{"file": "backend/src/server.js", "line": 89}]}, {"method": "DELETE", "path": "/api/tables/:id", "evidence": [{"file": "backend/src/server.js", "line": 90}]}] |
| entities | ["restaurant_tables", "orders", "order_items"] |

Actions: ["<icon/dynamic>", "T seats ·", "<icon/dynamic>", "Delete table"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminTables.

Evidence: [mobile/App.js:54](../../mobile/App.js#L54)

## M-MobileTableEditor — Mobile Table Editor

Create tables, inspect active service and change table state through Mobile Table Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | tables |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminTables"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify(`Table ${number} added`)", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api('/tables',{method:'POST',body:JSON.stringify({number,seats,area})})"] |
| backendControllers | [{"method": "PATCH", "path": "/api/tables/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 88}]}, {"method": "POST", "path": "/api/tables", "evidence": [{"file": "backend/src/server.js", "line": 89}]}, {"method": "DELETE", "path": "/api/tables/:id", "evidence": [{"file": "backend/src/server.js", "line": 90}]}] |
| entities | ["restaurant_tables", "orders", "order_items"] |

Actions: ["<icon/dynamic>", "Add table"].

Forms: F-M-MobileTableEditor; tables/lists: No separate list identified.

Evidence: [mobile/App.js:55](../../mobile/App.js#L55)

## M-AdminMenu — Admin Menu

Manage dishes, images, prices, availability and combo composition through Admin Menu.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | menu |
| status | FRONTEND_ONLY |
| reachability | Dormant/unlinked |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | [] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["state.menu.filter(x=>x.available)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["menu_items", "combo_components"] |

Actions: [].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminMenu.

Evidence: [mobile/App.js:57](../../mobile/App.js#L57)

## M-AdminStaff — Admin Staff

Manage login accounts, kitchen roster, compensation fields and shifts through Admin Staff.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | staff |
| status | FRONTEND_ONLY |
| reachability | Dormant/unlinked |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | [] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["item.name.split(' ').map(x=>x[0]).join('').slice(0,2)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: [].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminStaff.

Evidence: [mobile/App.js:58](../../mobile/App.js#L58)

## M-AdminBillingModal — Admin Billing Modal

Take orders and additional rounds, coordinate handoff and settle bills through Admin Billing Modal.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | orders |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Portal"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["notify(`Table ${table?.number} payment completed`)", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(`/orders/${order.id}/finalize`,{method:'POST',body:JSON.stringify({paymentMethod:method})})"] |
| backendControllers | [{"method": "POST", "path": "/api/orders", "evidence": [{"file": "backend/src/server.js", "line": 86}]}, {"method": "POST", "path": "/api/orders/:id/items", "evidence": [{"file": "backend/src/server.js", "line": 87}]}, {"method": "POST", "path": "/api/orders/:id/mark-paid", "evidence": [{"file": "backend/src/server.js", "line": 92}]}, {"method": "PATCH", "path": "/api/orders/:id/items/status", "evidence": [{"file": "backend/src/server.js", "line": 93}]}, {"method": "PATCH", "path": "/api/orders/:id/batches/:batchNo/handoff", "evidence": [{"file": "backend/src/server.js", "line": 94}]}, {"method": "PATCH", "path": "/api/orders/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 95}]}, {"method": "POST", "path": "/api/orders/:id/request-bill", "evidence": [{"file": "backend/src/server.js", "line": 96}]}, {"method": "GET", "path": "/api/orders/:id/bill", "evidence": [{"file": "backend/src/server.js", "line": 97}]}, {"method": "POST", "path": "/api/orders/:id/finalize", "evidence": [{"file": "backend/src/server.js", "line": 98}]}] |
| entities | ["orders", "order_items", "menu_items", "restaurant_tables"] |

Actions: ["Card / UPI payment", "Cash payment"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminBillingModal.

Evidence: [mobile/App.js:59](../../mobile/App.js#L59)

## M-WaiterScreen — Waiter Screen

PIN authentication, identity and profile editing through Waiter Screen.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | waiter |
| secondaryUsers | [] |
| entryPoints | ["Portal"] |
| exitPoints | ["OrderList", "TableList"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["waiter"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["OrderList", "TableList"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["users", "master_users", "company_users"] |

Actions: [].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: No separate list identified.

Evidence: [mobile/App.js:61](../../mobile/App.js#L61)

## M-TableList — Table List

Create tables, inspect active service and change table state through Table List.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | tables |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | waiter |
| secondaryUsers | [] |
| entryPoints | ["WaiterScreen"] |
| exitPoints | ["OrderModal"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["live.filter(x=>x.key==='available')", "live.filter(x=>['occupied','preparing','received'].includes(x.key))", "live.filter(x=>['ready','collected'].includes(x.key))", "live.filter(x=>x.key==='reserved')", "live.filter(x=>x.key==='cleaning')"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["OrderModal"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["waiter"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["OrderModal"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["restaurant_tables", "orders", "order_items"] |

Actions: ["T seats ·"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-TableList.

Evidence: [mobile/App.js:63](../../mobile/App.js#L63)

## M-OrderModal — Order Modal

Create tables, inspect active service and change table state through Order Modal.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | tables |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | waiter |
| secondaryUsers | [] |
| entryPoints | ["TableList"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | ["[previewing,setPreviewing]=useState(false)"] |
| filters | ["c.map(x=>x.menuId===id?{...x,qty:x.qty+delta}:x).filter(x=>x.qty>0)", "state.menu.filter(m=>category==='All'\|\|m.category===category)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify(existing?'Additional order sent to kitchen':'Order sent to kitchen')", "notify(e.message)", "notify(`Table marked ${next}`)", "notify(`Table ${table.number} bill sent to Admin`)", "notify(`Round ${batchNo} received at Table ${table.number}`)"] |
| permissions | {"roles": ["waiter"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(existing?`/orders/${existing.id}/items`:'/orders',{method:'POST',body:JSON.stringify(existing?{items:cart}:{tableId:table.id,guestName:table.guestName\|\|'Walk-in Guest',waiter:'Mobile Waiter',items:cart})})", "api(`/tables/${table.id}/status`,{method:'PATCH',body:JSON.stringify({status:next})})", "api(`/orders/${existing.id}/request-bill`,{method:'POST',body:'{}'})", "api(`/orders/${existing.id}/batches/${batchNo}/handoff`,{method:'PATCH',body:JSON.stringify({status:'received'})})"] |
| backendControllers | [{"method": "POST", "path": "/api/orders", "evidence": [{"file": "backend/src/server.js", "line": 86}]}, {"method": "POST", "path": "/api/orders/:id/items", "evidence": [{"file": "backend/src/server.js", "line": 87}]}, {"method": "PATCH", "path": "/api/tables/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 88}]}, {"method": "POST", "path": "/api/tables", "evidence": [{"file": "backend/src/server.js", "line": 89}]}, {"method": "DELETE", "path": "/api/tables/:id", "evidence": [{"file": "backend/src/server.js", "line": 90}]}, {"method": "POST", "path": "/api/orders/:id/mark-paid", "evidence": [{"file": "backend/src/server.js", "line": 92}]}, {"method": "PATCH", "path": "/api/orders/:id/items/status", "evidence": [{"file": "backend/src/server.js", "line": 93}]}, {"method": "PATCH", "path": "/api/orders/:id/batches/:batchNo/handoff", "evidence": [{"file": "backend/src/server.js", "line": 94}]}, {"method": "PATCH", "path": "/api/orders/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 95}]}, {"method": "POST", "path": "/api/orders/:id/request-bill", "evidence": [{"file": "backend/src/server.js", "line": 96}]}, {"method": "GET", "path": "/api/orders/:id/bill", "evidence": [{"file": "backend/src/server.js", "line": 97}]}, {"method": "POST", "path": "/api/orders/:id/finalize", "evidence": [{"file": "backend/src/server.js", "line": 98}]}] |
| entities | ["restaurant_tables", "orders", "order_items"] |

Actions: ["<icon/dynamic>", "<icon/dynamic>", "<icon/dynamic>", "<icon/dynamic>", "<icon/dynamic>", "<icon/dynamic>", "Preview order", "Edit order", "<icon/dynamic>", "<icon/dynamic>", "<icon/dynamic>", "Add a new order", "Complete order — send bill"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-OrderModal.

Evidence: [mobile/App.js:66](../../mobile/App.js#L66)

## M-OrderList — Order List

Take orders and additional rounds, coordinate handoff and settle bills through Order List.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | orders |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | waiter |
| secondaryUsers | [] |
| entryPoints | ["WaiterScreen"] |
| exitPoints | ["OperationsCalendarMobile"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["state.orders.filter(o=>o.orderType!=='parcel')", "orders.filter(o=>dateKey(o.createdAt)===selectedDate)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No orders for this date"] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["waiter"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["OperationsCalendarMobile"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["orders", "order_items", "menu_items", "restaurant_tables"] |

Actions: ["Calendar ·"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-OrderList.

Evidence: [mobile/App.js:81](../../mobile/App.js#L81)

## M-ChefScreen — Chef Screen

Prepare tickets and mark batches ready through Chef Screen.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | production |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | chef |
| secondaryUsers | [] |
| entryPoints | ["Portal"] |
| exitPoints | ["ChefJuicerManagement", "ChefDishes"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["KitchenTicket"] |
| charts | [] |
| tabs | [] |
| filters | ["orders.filter(o=>o.orderType!=='parcel')", "orders.filter(o=>o.orderType==='parcel')"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["notify(`Round ${batchNo} of order #${id} collected from kitchen`)", "notify(e.message)", "notify(`Food round ${batchNo} marked ${status}`)"] |
| permissions | {"roles": ["chef"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["ChefJuicerManagement", "ChefDishes"] |
| apiUsed | ["api(`/orders/${id}/batches/${batchNo}/handoff`,{method:'PATCH',body:JSON.stringify({status:'collected'})})", "api(`/orders/${id}/items/status`,{method:'PATCH',body:JSON.stringify({status,batchNo})})"] |
| backendControllers | [{"method": "POST", "path": "/api/orders", "evidence": [{"file": "backend/src/server.js", "line": 86}]}, {"method": "POST", "path": "/api/orders/:id/items", "evidence": [{"file": "backend/src/server.js", "line": 87}]}, {"method": "POST", "path": "/api/orders/:id/mark-paid", "evidence": [{"file": "backend/src/server.js", "line": 92}]}, {"method": "PATCH", "path": "/api/orders/:id/items/status", "evidence": [{"file": "backend/src/server.js", "line": 93}]}, {"method": "PATCH", "path": "/api/orders/:id/batches/:batchNo/handoff", "evidence": [{"file": "backend/src/server.js", "line": 94}]}, {"method": "PATCH", "path": "/api/orders/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 95}]}, {"method": "POST", "path": "/api/orders/:id/request-bill", "evidence": [{"file": "backend/src/server.js", "line": 96}]}, {"method": "GET", "path": "/api/orders/:id/bill", "evidence": [{"file": "backend/src/server.js", "line": 97}]}, {"method": "POST", "path": "/api/orders/:id/finalize", "evidence": [{"file": "backend/src/server.js", "line": 98}]}] |
| entities | ["orders", "order_items", "menu_items"] |

Actions: [].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-ChefScreen.

Evidence: [mobile/App.js:83](../../mobile/App.js#L83)

## M-JuicerScreen — Juicer Screen

Prepare tickets and mark batches ready through Juicer Screen.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | production |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | juicer |
| secondaryUsers | [] |
| entryPoints | ["Portal"] |
| exitPoints | ["ChefDishes"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["KitchenTicket"] |
| charts | [] |
| tabs | [] |
| filters | ["orders.filter(o=>o.status==='ready')", "orders.filter(o=>o.status!=='ready')"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["notify(`Juice round ${batchNo} marked ${status}`)", "notify(e.message)"] |
| permissions | {"roles": ["juicer"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["ChefDishes"] |
| apiUsed | ["api(`/orders/${id}/items/status`,{method:'PATCH',body:JSON.stringify({status,batchNo})})"] |
| backendControllers | [{"method": "POST", "path": "/api/orders", "evidence": [{"file": "backend/src/server.js", "line": 86}]}, {"method": "POST", "path": "/api/orders/:id/items", "evidence": [{"file": "backend/src/server.js", "line": 87}]}, {"method": "POST", "path": "/api/orders/:id/mark-paid", "evidence": [{"file": "backend/src/server.js", "line": 92}]}, {"method": "PATCH", "path": "/api/orders/:id/items/status", "evidence": [{"file": "backend/src/server.js", "line": 93}]}, {"method": "PATCH", "path": "/api/orders/:id/batches/:batchNo/handoff", "evidence": [{"file": "backend/src/server.js", "line": 94}]}, {"method": "PATCH", "path": "/api/orders/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 95}]}, {"method": "POST", "path": "/api/orders/:id/request-bill", "evidence": [{"file": "backend/src/server.js", "line": 96}]}, {"method": "GET", "path": "/api/orders/:id/bill", "evidence": [{"file": "backend/src/server.js", "line": 97}]}, {"method": "POST", "path": "/api/orders/:id/finalize", "evidence": [{"file": "backend/src/server.js", "line": 98}]}] |
| entities | ["orders", "order_items", "menu_items"] |

Actions: [].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-JuicerScreen.

Evidence: [mobile/App.js:84](../../mobile/App.js#L84)

## M-ChefDishes — Chef Dishes

Manage dishes, images, prices, availability and combo composition through Chef Dishes.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | menu |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | chef |
| secondaryUsers | ["juicer"] |
| entryPoints | ["ChefScreen", "JuicerScreen"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["state.menu.filter(item=>!item.isCombo&&(juices?String(item.category).toLowerCase()==='juices':String(item.category).toLowerCase()!=='juices'))", "dishes.filter(x=>x.available)", "dishes.filter(x=>!x.available)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["notify(`${item.name} marked ${item.available?'completed / unavailable':'available'}`)", "notify(e.message)"] |
| permissions | {"roles": ["chef", "juicer"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api(`/menu/${item.id}/availability`,{method:'PATCH',body:JSON.stringify({available:!item.available})})"] |
| backendControllers | [{"method": "POST", "path": "/api/menu", "evidence": [{"file": "backend/src/server.js", "line": 125}]}, {"method": "PUT", "path": "/api/menu/:id", "evidence": [{"file": "backend/src/server.js", "line": 126}]}, {"method": "DELETE", "path": "/api/menu/:id", "evidence": [{"file": "backend/src/server.js", "line": 127}]}, {"method": "PATCH", "path": "/api/menu/:id/availability", "evidence": [{"file": "backend/src/server.js", "line": 128}]}, {"method": "POST", "path": "/api/menu/:id/image", "evidence": [{"file": "backend/src/server.js", "line": 131}]}, {"method": "DELETE", "path": "/api/menu/:id/image", "evidence": [{"file": "backend/src/server.js", "line": 132}]}] |
| entities | ["menu_items", "combo_components"] |

Actions: ["<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-ChefDishes.

Evidence: [mobile/App.js:85](../../mobile/App.js#L85)

## M-ChefJuicerManagement — Chef Juicer Management

Manage login accounts, kitchen roster, compensation fields and shifts through Chef Juicer Management.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | staff |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | chef |
| secondaryUsers | [] |
| entryPoints | ["ChefScreen"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify(e.message)", "notify(`Juicer login created · PIN ${result.pin}`)"] |
| permissions | {"roles": ["chef"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["api('/juicer-login')", "api('/juicer-login',{method:'POST',body:JSON.stringify(form)})"] |
| backendControllers | [{"method": "GET", "path": "/api/juicer-login", "evidence": [{"file": "backend/src/server.js", "line": 118}]}, {"method": "POST", "path": "/api/juicer-login", "evidence": [{"file": "backend/src/server.js", "line": 119}]}] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: ["Create Juicer login", "<icon/dynamic>", "Daily salary", "Monthly salary", "busy?'Creating…':'Create login'"].

Forms: F-M-ChefJuicerManagement; tables/lists: T-M-ChefJuicerManagement.

Evidence: [mobile/App.js:86](../../mobile/App.js#L86)

## M-OperationsCalendarMobile — Operations Calendar Mobile

PIN authentication, identity and profile editing through Operations Calendar Mobile.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["OrderList", "AdminOrders", "AdminParcels"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["orders.filter(x=>dateKey(x.createdAt)===key(day))", "daily.filter(x=>x.paymentStatus==='paid')"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["users", "master_users", "company_users"] |

Actions: ["chevron-back", "chevron-forward", "<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-OperationsCalendarMobile.

Evidence: [mobile/AdminModules.js:35](../../mobile/AdminModules.js#L35)

## M-AdminDrawer — Admin Drawer

PIN authentication, identity and profile editing through Admin Drawer.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | access |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["Portal"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["adminNavigation.filter(([id])=>group.ids.includes(id)&&canOpen(id,user))", "user.name.split(' ').map(x=>x[0]).join('').slice(0,2)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["users", "master_users", "company_users"] |

Actions: ["KnockOUT PROPERTY MANAGEMENT Administrator", "<icon/dynamic>", "<icon/dynamic>", "<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminDrawer.

Evidence: [mobile/AdminModules.js:42](../../mobile/AdminModules.js#L42)

## M-AdminBookings — Admin Bookings

Reserve a restaurant table for a dated time interval and phone contact through Admin Bookings.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | bookings |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminScreen"] |
| exitPoints | ["AdminBookingEditor"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["Status"] |
| charts | [] |
| tabs | [] |
| filters | ["bookings.filter(x=>x.bookingDate===selectedDate)", "bookings.filter(x=>x.bookingDate===key(day))"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["AdminBookingEditor"] |
| drawers | [] |
| dialogs | ["Alert.alert(`Cancel Table ${item.tableNumber}?`,'This releases the reserved time slot.',[{text:'Keep booking',style:'cancel'},{text:'Cancel booking',style:'destructive',onPress:async()=>{try{await request(`/bookings/${item.id}`,{method:'DELETE'});await refresh();notify('Booking cancelled')}catch(e){notify(e.message)}}}])"] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | ["Alert.alert(`Cancel Table ${item.tableNumber}?`,'This releases the reserved time slot.',[{text:'Keep booking',style:'cancel'},{text:'Cancel booking',style:'destructive',onPress:async()=>{try{await request(`/bookings/${item.id}`,{method:'DELETE'});await refresh();notify('Booking cancelled')}catch(e){notify(e.message)}}}])"] |
| notifications | ["Alert.alert(`Cancel Table ${item.tableNumber}?`,'This releases the reserved time slot.',[{text:'Keep booking',style:'cancel'},{text:'Cancel booking',style:'destructive',onPress:async()=>{try{await request(`/bookings/${item.id}`,{method:'DELETE'});await refresh();notify('Booking cancelled')}catch(e){notify(e.message)}}}])", "notify('Booking cancelled')", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["AdminBookingEditor"] |
| apiUsed | ["request(`/bookings/${item.id}`,{method:'DELETE'})"] |
| backendControllers | [{"method": "POST", "path": "/api/bookings", "evidence": [{"file": "backend/src/server.js", "line": 62}]}, {"method": "DELETE", "path": "/api/bookings/:id", "evidence": [{"file": "backend/src/server.js", "line": 85}]}] |
| entities | ["bookings", "restaurant_tables", "notification_outbox"] |

Actions: ["add", "trash-outline", "Back to calendar", "chevron-back", "chevron-forward", "<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminBookings.

Evidence: [mobile/AdminModules.js:44](../../mobile/AdminModules.js#L44)

## M-AdminBookingEditor — Admin Booking Editor

Reserve a restaurant table for a dated time interval and phone contact through Admin Booking Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | bookings |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminBookings"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | ["[tableId,setTableId]=useState(null)"] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | ["notify(result.notificationStatus==='sent'?'Booking confirmed · SMS sent':'Booking confirmed · SMS queued')"] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify(result.notificationStatus==='sent'?'Booking confirmed · SMS sent':'Booking confirmed · SMS queued')", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["request('/bookings',{method:'POST',body:JSON.stringify({tableId,customerPhone,bookingDate,bookingTime,durationMinutes})})"] |
| backendControllers | [{"method": "POST", "path": "/api/bookings", "evidence": [{"file": "backend/src/server.js", "line": 62}]}, {"method": "DELETE", "path": "/api/bookings/:id", "evidence": [{"file": "backend/src/server.js", "line": 85}]}] |
| entities | ["bookings", "restaurant_tables", "notification_outbox"] |

Actions: ["`${value} min`", "`Table ${item.number}${locked(item.id)?' · locked':''}`", "busy?'Locking…':'Confirm & send SMS'"].

Forms: F-M-AdminBookingEditor; tables/lists: No separate list identified.

Evidence: [mobile/AdminModules.js:52](../../mobile/AdminModules.js#L52)

## M-AdminParcelsDay — Admin Parcels Day

Create takeaway orders, record payment and coordinate collection through Admin Parcels Day.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | parcels |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminParcels"] |
| exitPoints | ["ParcelEditor"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["Status"] |
| charts | [] |
| tabs | [] |
| filters | ["state.orders.filter(x=>x.orderType==='parcel')"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["ParcelEditor"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["notify(`Parcel #${order.id} completed`)", "notify(e.message)", "notify(`Parcel #${order.id} marked paid`)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["ParcelEditor"] |
| apiUsed | ["request(`/orders/${order.id}/finalize`,{method:'POST',body:JSON.stringify({paymentMethod:method})})", "request(`/orders/${order.id}/mark-paid`,{method:'POST',body:JSON.stringify({paymentMethod:method})})"] |
| backendControllers | [{"method": "POST", "path": "/api/orders", "evidence": [{"file": "backend/src/server.js", "line": 86}]}, {"method": "POST", "path": "/api/orders/:id/items", "evidence": [{"file": "backend/src/server.js", "line": 87}]}, {"method": "POST", "path": "/api/orders/:id/mark-paid", "evidence": [{"file": "backend/src/server.js", "line": 92}]}, {"method": "PATCH", "path": "/api/orders/:id/items/status", "evidence": [{"file": "backend/src/server.js", "line": 93}]}, {"method": "PATCH", "path": "/api/orders/:id/batches/:batchNo/handoff", "evidence": [{"file": "backend/src/server.js", "line": 94}]}, {"method": "PATCH", "path": "/api/orders/:id/status", "evidence": [{"file": "backend/src/server.js", "line": 95}]}, {"method": "POST", "path": "/api/orders/:id/request-bill", "evidence": [{"file": "backend/src/server.js", "line": 96}]}, {"method": "GET", "path": "/api/orders/:id/bill", "evidence": [{"file": "backend/src/server.js", "line": 97}]}, {"method": "POST", "path": "/api/orders/:id/finalize", "evidence": [{"file": "backend/src/server.js", "line": 98}]}] |
| entities | ["orders", "order_items", "menu_items"] |

Actions: ["add", "Mark Cash paid", "Mark UPI paid", "item.paymentStatus==='paid'?'Complete — already paid':'Complete parcel'", "Cash", "Card / UPI"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminParcelsDay.

Evidence: [mobile/AdminModules.js:59](../../mobile/AdminModules.js#L59)

## M-AdminOrders — Admin Orders

Take orders and additional rounds, coordinate handoff and settle bills through Admin Orders.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | orders |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminScreen"] |
| exitPoints | ["OperationsCalendarMobile"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["Status"] |
| charts | [] |
| tabs | [] |
| filters | ["orders.filter(x=>dateKey(x.createdAt)===selectedDate)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["OperationsCalendarMobile"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["orders", "order_items", "menu_items", "restaurant_tables"] |

Actions: ["`Calendar · ${selectedDate.split('-').reverse().join('-')}`"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminOrders.

Evidence: [mobile/AdminModules.js:61](../../mobile/AdminModules.js#L61)

## M-AdminParcels — Admin Parcels

Create takeaway orders, record payment and coordinate collection through Admin Parcels.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | parcels |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminScreen"] |
| exitPoints | ["OperationsCalendarMobile", "AdminParcelsDay"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["props.state.orders.filter(x=>x.orderType==='parcel')", "all.filter(x=>dateKey(x.createdAt)===selectedDate)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["OperationsCalendarMobile", "AdminParcelsDay"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["orders", "order_items", "menu_items"] |

Actions: ["`Calendar · ${selectedDate.split('-').reverse().join('-')}`"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminParcels.

Evidence: [mobile/AdminModules.js:67](../../mobile/AdminModules.js#L67)

## M-ParcelEditor — Parcel Editor

Create takeaway orders, record payment and coordinate collection through Parcel Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | parcels |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminParcelsDay"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["Status"] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify('Parcel sent to kitchen')", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["request('/parcels',{method:'POST',body:JSON.stringify({customerName:name,customerPhone:phone,adminName:user.name,items,paymentMethod:payment==='unpaid'?null:payment})})"] |
| backendControllers | [{"method": "POST", "path": "/api/parcels", "evidence": [{"file": "backend/src/server.js", "line": 91}]}] |
| entities | ["orders", "order_items", "menu_items"] |

Actions: ["Pay later", "Cash paid", "Card / UPI", "remove", "add", "busy?'Creating…':'Send to kitchen'"].

Forms: F-M-ParcelEditor; tables/lists: No separate list identified.

Evidence: [mobile/AdminModules.js:74](../../mobile/AdminModules.js#L74)

## M-AdminMenuManager — Admin Menu Manager

Manage dishes, images, prices, availability and combo composition through Admin Menu Manager.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | menu |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminScreen"] |
| exitPoints | ["MenuEditor"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["Status"] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["MenuEditor"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | ["notify(`${item.name} hidden`)", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["MenuEditor"] |
| apiUsed | ["request(`/menu/${item.id}`,{method:'DELETE'})"] |
| backendControllers | [{"method": "POST", "path": "/api/menu", "evidence": [{"file": "backend/src/server.js", "line": 125}]}, {"method": "PUT", "path": "/api/menu/:id", "evidence": [{"file": "backend/src/server.js", "line": 126}]}, {"method": "DELETE", "path": "/api/menu/:id", "evidence": [{"file": "backend/src/server.js", "line": 127}]}, {"method": "PATCH", "path": "/api/menu/:id/availability", "evidence": [{"file": "backend/src/server.js", "line": 128}]}, {"method": "POST", "path": "/api/menu/:id/image", "evidence": [{"file": "backend/src/server.js", "line": 131}]}, {"method": "DELETE", "path": "/api/menu/:id/image", "evidence": [{"file": "backend/src/server.js", "line": 132}]}] |
| entities | ["menu_items", "combo_components"] |

Actions: ["add", "<icon/dynamic>", "eye-off-outline"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminMenuManager.

Evidence: [mobile/AdminModules.js:76](../../mobile/AdminModules.js#L76)

## M-MenuEditor — Menu Editor

Manage dishes, images, prices, availability and combo composition through Menu Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | menu |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminMenuManager"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["old.filter(x=>x.menuId!==id)", "state.menu.filter(x=>!x.isCombo&&x.id!==item?.id)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify(item?'Menu item updated':'Menu item added')", "notify(e.message)", "notify('Food photo uploaded')"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["request(path,{method:item?'PUT':'POST',body:JSON.stringify(combo?{name:form.name,description:form.description,price:form.price,icon:form.icon,components}:{...form})})"] |
| backendControllers | [] |
| entities | ["menu_items", "combo_components"] |

Actions: ["Dish / drink", "Combo offer", "remove", "add", "item.imageUrl?'Replace food photo':'Upload food photo'", "busy?'Saving…':'Save menu item'"].

Forms: F-M-MenuEditor; tables/lists: T-M-MenuEditor.

Evidence: [mobile/AdminModules.js:78](../../mobile/AdminModules.js#L78)

## M-AdminStock — Admin Stock

Track stock movements, minimums, planning and chef purchase requests through Admin Stock.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | stock |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminScreen"] |
| exitPoints | ["StockEditor", "StockMovement"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | ["Metric", "Status"] |
| charts | [] |
| tabs | ["[view,setView]=useState('inventory')"] |
| filters | ["inventory.filter(x=>x.quantity<=x.min)", "transactions.filter(x=>new Date(x.createdAt).getTime()>=cutoff)", "recent.filter(x=>x.movementType==='usage')", "recent.filter(x=>x.movementType==='waste')", "inventory.map(item=>{const consumed=recent.filter(x=>x.inventoryId===item.id&&['usage','waste'].includes(x.movementType)).reduce((n,x)=>n+Math.abs(x.quantity),0),daily=consumed/30,days=daily?item.quantity/daily:null,reorder=Math.max(0,item.min*2-item.quantity);return{...item,consumed,days,reorder,reorderCost:reorder*item.cost}}).filter(x=>x.quantity<=x.min\|\|(x.days!==null&&x.days<=7)).sort((a,b)=>(a.days??9999)-(b.days??9999))", "inventory.map(item=>{const consumed=recent.filter(x=>x.inventoryId===item.id&&['usage','waste'].includes(x.movementType)).reduce((n,x)=>n+Math.abs(x.quantity),0),daily=consumed/30,days=daily?item.quantity/daily:null,reorder=Math.max(0,item.min*2-item.quantity);return{...item,consumed,days,reorder,reorderCost:reorder*item.cost}}).filter(x=>x.quantity<=x.min\|\|(x.days!==null&&x.days<=7))", "recent.filter(x=>x.inventoryId===item.id&&['usage','waste'].includes(x.movementType))", "inventory.filter(x=>`${x.name} ${x.category}`.toLowerCase().includes(query.toLowerCase()))"] |
| search | [{"line": 82, "tag": "TextInput", "label": "Search stock or category…", "type": "text", "value": "query", "required": false, "defaultValue": "", "disabled": false, "condition": ["view==='inventory'"], "handler": "setQuery"}] |
| sorting | ["inventory.map(item=>{const consumed=recent.filter(x=>x.inventoryId===item.id&&['usage','waste'].includes(x.movementType)).reduce((n,x)=>n+Math.abs(x.quantity),0),daily=consumed/30,days=daily?item.quantity/daily:null,reorder=Math.max(0,item.min*2-item.quantity);return{...item,consumed,days,reorder,reorderCost:reorder*item.cost}}).filter(x=>x.quantity<=x.min\|\|(x.days!==null&&x.days<=7)).sort((a,b)=>(a.days??9999)-(b.days??9999))"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["StockEditor"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["StockEditor", "StockMovement"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["inventory", "inventory_transactions", "stock_requests"] |

Actions: ["add", "x", "Move stock", "Edit", "Record purchase"].

Forms: F-M-AdminStock; tables/lists: T-M-AdminStock.

Evidence: [mobile/AdminModules.js:80](../../mobile/AdminModules.js#L80)

## M-StockEditor — Stock Editor

Track stock movements, minimums, planning and chef purchase requests through Stock Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | stock |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminStock"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify('Stock item saved')", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["request(item?`/inventory/${item.id}`:'/inventory',{method:item?'PUT':'POST',body:JSON.stringify({...form,createdBy:user.name})})"] |
| backendControllers | [{"method": "POST", "path": "/api/inventory", "evidence": [{"file": "backend/src/server.js", "line": 99}]}, {"method": "PUT", "path": "/api/inventory/:id", "evidence": [{"file": "backend/src/server.js", "line": 100}]}, {"method": "POST", "path": "/api/inventory/:id/movements", "evidence": [{"file": "backend/src/server.js", "line": 101}]}, {"method": "DELETE", "path": "/api/inventory/:id", "evidence": [{"file": "backend/src/server.js", "line": 102}]}] |
| entities | ["inventory", "inventory_transactions", "stock_requests"] |

Actions: ["busy?'Saving…':'Save stock item'"].

Forms: F-M-StockEditor; tables/lists: T-M-StockEditor.

Evidence: [mobile/AdminModules.js:84](../../mobile/AdminModules.js#L84)

## M-StockMovement — Stock Movement

Track stock movements, minimums, planning and chef purchase requests through Stock Movement.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | stock |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminStock"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify('Stock movement recorded')", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["request(`/inventory/${item.id}/movements`,{method:'POST',body:JSON.stringify({movementType:type,quantity,unitCost,note,adjustmentDirection:direction,createdBy:user.name})})"] |
| backendControllers | [{"method": "POST", "path": "/api/inventory", "evidence": [{"file": "backend/src/server.js", "line": 99}]}, {"method": "PUT", "path": "/api/inventory/:id", "evidence": [{"file": "backend/src/server.js", "line": 100}]}, {"method": "POST", "path": "/api/inventory/:id/movements", "evidence": [{"file": "backend/src/server.js", "line": 101}]}, {"method": "DELETE", "path": "/api/inventory/:id", "evidence": [{"file": "backend/src/server.js", "line": 102}]}] |
| entities | ["inventory", "inventory_transactions", "stock_requests"] |

Actions: ["x", "Increase", "Decrease", "busy?'Saving…':'Record movement'"].

Forms: F-M-StockMovement; tables/lists: T-M-StockMovement.

Evidence: [mobile/AdminModules.js:85](../../mobile/AdminModules.js#L85)

## M-AdminFinance — Admin Finance

Review daily closing, ledger, purchases, balances and reports through Admin Finance.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | finance |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminScreen"] |
| exitPoints | ["FinanceDay"] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["state.orders.filter(x=>x.paymentStatus==='paid'&&dateKey(x.completedAt)===key(day))"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["FinanceDay"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: ["chevron-back", "chevron-forward", "<icon/dynamic>"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminFinance.

Evidence: [mobile/AdminModules.js:89](../../mobile/AdminModules.js#L89)

## M-FinanceDay — Finance Day

Selected day’s financial summary and ledger/purchase/payment controls. Native does not reproduce all web analytics/report controls.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | finance |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminFinance"] |
| exitPoints | ["FinanceEntry", "PurchaseEditor", "DealerPayment"] |
| contentHierarchy | Selected day’s financial summary and ledger/purchase/payment controls. Native does not reproduce all web analytics/report controls. |
| displayedData | [] |
| cards | ["Metric", "Status"] |
| charts | [] |
| tabs | [] |
| filters | ["(state.financeEntries\|\|[]).filter(x=>dateKey(x.entryDate)===date)", "state.orders.filter(x=>x.paymentStatus==='paid'&&dateKey(x.completedAt)===date)", "(state.supplierPurchases\|\|[]).filter(x=>dateKey(x.purchaseDate)===date)", "entries.filter(x=>x.entryType==='income')", "entries.filter(x=>x.entryType==='expense')", "payments.filter(x=>dateKey(x.paymentDate)===date)", "payments.filter(p=>p.purchaseId===x.id)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["PurchaseEditor"] |
| drawers | [] |
| dialogs | ["Alert.alert('Delete entry?',x.description,[{text:'Cancel'},{text:'Delete',style:'destructive',onPress:()=>remove(x.id)}])"] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | ["Alert.alert('Delete entry?',x.description,[{text:'Cancel'},{text:'Delete',style:'destructive',onPress:()=>remove(x.id)}])"] |
| notifications | ["notify('Finance entry deleted')", "notify(e.message)", "Alert.alert('Delete entry?',x.description,[{text:'Cancel'},{text:'Delete',style:'destructive',onPress:()=>remove(x.id)}])"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["FinanceEntry", "PurchaseEditor", "DealerPayment"] |
| apiUsed | ["request(`/finance/${id}`,{method:'DELETE'})"] |
| backendControllers | [{"method": "POST", "path": "/api/finance", "evidence": [{"file": "backend/src/server.js", "line": 105}]}, {"method": "DELETE", "path": "/api/finance/:id", "evidence": [{"file": "backend/src/server.js", "line": 106}]}] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: ["arrow-back", "Income / expense", "Dealer purchase", "trash-outline", "Record dealer payment"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-FinanceDay.

Evidence: [mobile/AdminModules.js:91](../../mobile/AdminModules.js#L91)

## M-FinanceEntry — Finance Entry

Review daily closing, ledger, purchases, balances and reports through Finance Entry.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | finance |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["FinanceDay"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify('Finance entry recorded')", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["request('/finance',{method:'POST',body:JSON.stringify({entryType:type,category,description,amount,paymentMethod:method,entryDate:date,reference,createdBy:user.name})})"] |
| backendControllers | [{"method": "POST", "path": "/api/finance", "evidence": [{"file": "backend/src/server.js", "line": 105}]}, {"method": "DELETE", "path": "/api/finance/:id", "evidence": [{"file": "backend/src/server.js", "line": 106}]}] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: ["Expense", "Income", "Cash", "Card / UPI", "Bank", "busy?'Saving…':'Save entry'"].

Forms: F-M-FinanceEntry; tables/lists: No separate list identified.

Evidence: [mobile/AdminModules.js:92](../../mobile/AdminModules.js#L92)

## M-PurchaseEditor — Purchase Editor

Review daily closing, ledger, purchases, balances and reports through Purchase Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | finance |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["FinanceDay"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify('Dealer purchase recorded')", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["request('/supplier-purchases',{method:'POST',body:JSON.stringify({supplierName,description,invoiceNumber,purchaseDate:date,totalAmount,paidAmount,paymentMethod:'Cash',createdBy:user.name})})"] |
| backendControllers | [{"method": "POST", "path": "/api/supplier-purchases", "evidence": [{"file": "backend/src/server.js", "line": 107}]}, {"method": "POST", "path": "/api/supplier-purchases/:id/payments", "evidence": [{"file": "backend/src/server.js", "line": 108}]}, {"method": "DELETE", "path": "/api/supplier-purchases/:id", "evidence": [{"file": "backend/src/server.js", "line": 109}]}] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: ["busy?'Saving…':'Save purchase'"].

Forms: F-M-PurchaseEditor; tables/lists: No separate list identified.

Evidence: [mobile/AdminModules.js:93](../../mobile/AdminModules.js#L93)

## M-DealerPayment — Dealer Payment

Review daily closing, ledger, purchases, balances and reports through Dealer Payment.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | finance |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["FinanceDay"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify('Dealer payment recorded')", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["request(`/supplier-purchases/${purchase.id}/payments`,{method:'POST',body:JSON.stringify({amount,paymentDate:date,paymentMethod:method,createdBy:user.name})})"] |
| backendControllers | [{"method": "POST", "path": "/api/supplier-purchases", "evidence": [{"file": "backend/src/server.js", "line": 107}]}, {"method": "POST", "path": "/api/supplier-purchases/:id/payments", "evidence": [{"file": "backend/src/server.js", "line": 108}]}, {"method": "DELETE", "path": "/api/supplier-purchases/:id", "evidence": [{"file": "backend/src/server.js", "line": 109}]}] |
| entities | ["finance_entries", "supplier_purchases", "supplier_payments", "orders"] |

Actions: ["Cash", "Card / UPI", "Bank", "busy?'Saving…':'Record payment'"].

Forms: F-M-DealerPayment; tables/lists: No separate list identified.

Evidence: [mobile/AdminModules.js:94](../../mobile/AdminModules.js#L94)

## M-AdminPeople — Admin People

Native accounts/kitchen toggle. No equivalent web history tab identified.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | staff |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminScreen"] |
| exitPoints | ["StaffEditor", "ChefEditor"] |
| contentHierarchy | Native accounts/kitchen toggle. No equivalent web history tab identified. |
| displayedData | [] |
| cards | ["Status"] |
| charts | [] |
| tabs | ["[mode,setMode]=useState('accounts')"] |
| filters | ["item.name.split(' ').map(x=>x[0]).join('').slice(0,2)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | ["StaffEditor", "ChefEditor"] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | ["StaffEditor", "ChefEditor"] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: ["person-add-outline", "Portal accounts", "Kitchen team", "· /"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-AdminPeople.

Evidence: [mobile/AdminModules.js:96](../../mobile/AdminModules.js#L96)

## M-StaffEditor — Staff Editor

Manage login accounts, kitchen roster, compensation fields and shifts through Staff Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | staff |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminPeople"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["v.replace(/\\D/g,'').slice(0,6)"] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify('Staff account saved')", "notify(e.message)", "notify(`${item.name} removed · PIN is available again`)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["request('/state')", "request(item?`/staff/${item.id}`:'/staff',{method:item?'PUT':'POST',body:JSON.stringify(form)})", "request(`/staff/${item.id}`,{method:'DELETE'})"] |
| backendControllers | [{"method": "GET", "path": "/api/state", "evidence": [{"file": "backend/src/server.js", "line": 58}]}, {"method": "POST", "path": "/api/staff", "evidence": [{"file": "backend/src/server.js", "line": 115}]}, {"method": "PUT", "path": "/api/staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 116}]}, {"method": "DELETE", "path": "/api/staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 117}]}, {"method": "POST", "path": "/api/staff/:id/check-in", "evidence": [{"file": "backend/src/server.js", "line": 123}]}, {"method": "POST", "path": "/api/staff/:id/check-out", "evidence": [{"file": "backend/src/server.js", "line": 124}]}, {"method": "GET", "path": "/api/state", "evidence": [{"file": "backend/src/master-server.js", "line": 215}]}] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: ["unavailable(value)?`${label} · created`:label", "Daily", "Monthly", "busy?'Saving…':'Save staff login'", "Delete staff", "Cancel", "busy?'Deleting…':'Confirm delete'"].

Forms: F-M-StaffEditor; tables/lists: T-M-StaffEditor.

Evidence: [mobile/AdminModules.js:97](../../mobile/AdminModules.js#L97)

## M-ChefEditor — Chef Editor

Manage login accounts, kitchen roster, compensation fields and shifts through Chef Editor.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | staff |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminPeople"] |
| exitPoints | [] |
| contentHierarchy | Native/component layout; see child sections and field order below. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify('Chef details saved')", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["request(item?`/kitchen-staff/${item.id}`:'/kitchen-staff',{method:item?'PUT':'POST',body:JSON.stringify(form)})"] |
| backendControllers | [{"method": "POST", "path": "/api/kitchen-staff", "evidence": [{"file": "backend/src/server.js", "line": 120}]}, {"method": "PUT", "path": "/api/kitchen-staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 121}]}, {"method": "DELETE", "path": "/api/kitchen-staff/:id", "evidence": [{"file": "backend/src/server.js", "line": 122}]}] |
| entities | ["users", "kitchen_staff", "staff_attendance"] |

Actions: ["Daily", "Monthly", "busy?'Saving…':'Save chef'"].

Forms: F-M-ChefEditor; tables/lists: No separate list identified.

Evidence: [mobile/AdminModules.js:106](../../mobile/AdminModules.js#L106)

## M-AdminSettings — Admin Settings

Native exposes business name, currency, GST, CGST and service charge. Server billing currently sets charge totals to zero.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | settings |
| status | PARTIALLY_IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminScreen"] |
| exitPoints | [] |
| contentHierarchy | Native exposes business name, currency, GST, CGST and service charge. Server billing currently sets charge totals to zero. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | [] |
| search | [] |
| sorting | [] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | [] |
| loadingStates | ["[busy,setBusy]=useState(false)"] |
| errorStates | [] |
| notifications | ["notify('Business settings saved')", "notify(e.message)"] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | ["request('/settings',{method:'PUT',body:JSON.stringify(form)})"] |
| backendControllers | [{"method": "PUT", "path": "/api/settings", "evidence": [{"file": "backend/src/server.js", "line": 110}]}] |
| entities | ["settings"] |

Actions: ["busy?'Saving…':'Save changes'"].

Forms: F-M-AdminSettings; tables/lists: T-M-AdminSettings.

Evidence: [mobile/AdminModules.js:110](../../mobile/AdminModules.js#L110)

## M-PremiumDashboard — Premium Dashboard

Today’s paid revenue hero → active orders, occupied tables and on-duty staff → permission-filtered shortcuts → floor summary → four recent orders.

| Aspect | Current implementation |
| --- | --- |
| platform | mobile |
| module | overview |
| status | IMPLEMENTED |
| reachability | Reachable component or nested view |
| routeDefinition | Local tab/modal state; no screen router found. |
| primaryUser | admin |
| secondaryUsers | [] |
| entryPoints | ["AdminScreen"] |
| exitPoints | [] |
| contentHierarchy | Today’s paid revenue hero → active orders, occupied tables and on-duty staff → permission-filtered shortcuts → floor summary → four recent orders. |
| displayedData | [] |
| cards | [] |
| charts | [] |
| tabs | [] |
| filters | ["orders.filter(order=>dayKey(order.createdAt)===today)", "todaysOrders.filter(order=>order.paymentStatus==='paid')", "orders.filter(order=>!['completed','served','cancelled','canceled'].includes(order.status))", "[...orders].sort((a,b)=>(Date.parse(b.createdAt)\|\|0)-(Date.parse(a.createdAt)\|\|0)).slice(0,4)", "[...orders].sort((a,b)=>(Date.parse(b.createdAt)\|\|0)-(Date.parse(a.createdAt)\|\|0))", "tables.filter(table=>table.status==='occupied')", "[['tables','grid-outline','Floor plan','Manage table service'],['bookings','calendar-outline','Reservations','Plan the next arrival'],['orders','receipt-outline','Orders & billing','Follow every order'],['finance','wallet-outline','Finance','Review your accounts']].filter(([id])=>canOpen(id,user))", "(state.attendance\|\|[]).filter(item=>!item.checkOut)", "tables.filter(table=>table.status===status)"] |
| search | [] |
| sorting | ["[...orders].sort((a,b)=>(Date.parse(b.createdAt)\|\|0)-(Date.parse(a.createdAt)\|\|0)).slice(0,4)", "[...orders].sort((a,b)=>(Date.parse(b.createdAt)\|\|0)-(Date.parse(a.createdAt)\|\|0))"] |
| pagination | No paginated navigation identified; data may be bounded by state API. |
| modals | [] |
| drawers | [] |
| dialogs | [] |
| stateTextEvidence | ["No tables yet. Add tables from the floor plan to begin."] |
| loadingStates | [] |
| errorStates | [] |
| notifications | [] |
| permissions | {"roles": ["admin"], "moduleVisibility": "Web Shell module map; native checks differ. See permission matrix."} |
| relatedScreens | [] |
| apiUsed | [] |
| backendControllers | [] |
| entities | ["orders", "restaurant_tables", "users", "staff_attendance", "inventory"] |

Actions: ["<icon/dynamic>", "View all →"].

Forms: No direct input fields; nested editors may contain forms.; tables/lists: T-M-PremiumDashboard.

Evidence: [mobile/PremiumDashboard.js:20](../../mobile/PremiumDashboard.js#L20)



## Separate legacy prototype — seven additional views

These are **FRONTEND_ONLY**, outside the 109 React/native component-view count. They are reachable only from the standalone root `index.html` prototype. They have no current role API/backend contract and should not enter the active product design backlog by accident.

| ID | Purpose | Controls / caveats | Evidence |
| --- | --- | --- | --- |
| L-dashboard | Demo metrics, fixed chart/activity data and recent local orders | Navigation shortcuts; no live backend | [app.js:42](../../app.js#L42) |
| L-tables | Local table cards and floor filters | All/Ground Floor/Rooftop; edit table; add table; guest-name/time reservation | [app.js:52](../../app.js#L52) |
| L-billing | Local menu/cart and simulated checkout | Category filter; table/takeaway choice; quantity controls; clear; receipt/print | [app.js:53](../../app.js#L53) |
| L-inventory | Local ingredient stock and suppliers | Text search; stock/category filter; add/adjust; CSV export | [app.js:57](../../app.js#L57) |
| L-orders | Local order list | New order; status chips displayed but no filter handler found in bind | [app.js:60](../../app.js#L60) |
| L-reports | Demo sales metrics, fixed bars and derived best sellers | Print report; not live analytics | [app.js:61](../../app.js#L61) |
| L-admin | Business profile and local demo reset | Name/GST/phone/email/address/tax/service; save; reset demo; other settings buttons decorative | [app.js:62](../../app.js#L62) |


