# Forms and validation inventory

Discovery snapshot: 7 October 2026. **Source analysis, not live acceptance testing.** Application source was not modified. `IMPLEMENTED` means a source-backed implementation exists, not that production behavior was verified.

Fields below preserve actual control bindings. A missing HTML `required` attribute does **not** mean the server field is optional. Defaults come from the recorded state initializer; editing commonly hydrates from an existing entity. Conditional expressions are source context, not a normalized truth table. Dynamic controls and options should be read alongside the linked component.

## F-W-Login — Login controls

Web supports tenant Hotel ID + PIN and no-Hotel-ID master/applicant path. Native requires four-digit Hotel ID and six-digit PIN, so it does not expose the same login paths.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| 4-DIGIT HOTEL ID NOT REQUIRED FOR SUPER ADMIN | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e)=>setHotelId(e.target.value.replace(/\D/g,"").slice(0,4)) |
| pin | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6)) |

Defaults/dependencies: ["[mode,setMode]=useState(routeFromPath)", "[hotelId,setHotelId]=useState(\"\")", "[pin, setPin] = useState(\"\")", "[error, setError] = useState(\"\")", "[busy, setBusy] = useState(false)", "[verified, setVerified] = useState(false)"]

Submit/API: ["resolvePortalLogin(hotelId, pin)"]

Feedback: ["setError(\"\")", "setError(e.message)"]

Roles: anonymous; IMPLEMENTED. Evidence: [frontend/src/App.jsx:274](../../frontend/src/App.jsx#L274)

## F-W-PublicCompanyRegistration — Public Company Registration controls

Company/admin/contact fields → package → period → submitted/temporary credential preview. “Sent” wording exceeds verified delivery evidence.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| HOTEL / BUSINESS NAME | text | Explicit JSX required | {"defaultValue": ""} | ["submitted"] | [] (e)=>setForm({...form,companyName:e.target.value}) |
| ADMINISTRATOR NAME | text | Explicit JSX required | {"defaultValue": ""} | ["submitted"] | [] (e)=>setForm({...form,adminName:e.target.value}) |
| ADMIN EMAIL | email | Explicit JSX required | {"defaultValue": ""} | ["submitted"] | [] (e)=>setForm({...form,email:e.target.value}) |
| PHONE NUMBER | text | Explicit JSX required | {"defaultValue": ""} | ["submitted"] | [] (e)=>setForm({...form,phone:e.target.value}) |

Defaults/dependencies: ["[form,setForm]=useState({companyName:\"\",adminName:\"\",email:\"\",phone:\"\",packageCode:\"starter\",periodMonths:1})", "[busy,setBusy]=useState(false)", "[error,setError]=useState(\"\")", "[submitted,setSubmitted]=useState(null)"]

Submit/API: ["submitCompanyRegistration(form)"]

Feedback: ["setError(\"\")", "setError(err.message)"]

Roles: anonymous; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:375](../../frontend/src/App.jsx#L375)

## F-W-ApplicantOnboarding — Applicant Onboarding controls

Pending, rejected, approved activation and completed credential states. “Pay & activate” accepts a reference string; a verified payment gateway is not implemented.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| BUSINESS TYPE Restaurant Café Hotel Cloud Kitchen Food Court | select | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | ["status.status==='rejected'", "status.status==='pending'"] | ["Restaurant", "Café", "Hotel", "Cloud Kitchen", "Food Court"] e=>setForm({...form,businessType:e.target.value}) |
| GST NUMBER (OPTIONAL) | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | ["status.status==='rejected'", "status.status==='pending'"] | [] e=>setForm({...form,gstNumber:e.target.value}) |
| BUSINESS ADDRESS | textarea | Explicit JSX required | {"defaultValue": ""} | ["status.status==='rejected'", "status.status==='pending'"] | [] e=>setForm({...form,address:e.target.value}) |
| PAYMENT REFERENCE Payment gateway reference confirms the selected package purchase. | text | Explicit JSX required | {"defaultValue": ""} | ["status.status==='rejected'", "status.status==='pending'"] | [] e=>setForm({...form,paymentReference:e.target.value}) |

Defaults/dependencies: ["[status,setStatus]=useState(null)", "[form,setForm]=useState({businessType:\"Restaurant\",address:\"\",gstNumber:\"\",paymentReference:\"\"})", "[busy,setBusy]=useState(false)", "[error,setError]=useState(\"\")", "[complete,setComplete]=useState(null)"]

Submit/API: ["getOnboardingStatus(user.id,user.temporaryPin)", "completeCompanyRegistration({...form,id:user.id,pin:user.temporaryPin})"]

Feedback: ["setError(err.message)", "setError(\"\")"]

Roles: applicant; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:382](../../frontend/src/App.jsx#L382)

## F-W-SuperAdminApp — Super Admin App controls

Network summary → company directory / registration requests → selected company tabs Overview, Users, SaaS Billing, Controls. No route changes for selection.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Search company, database or admin | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | ["selectedCompany", "selectedRegistration"] | [] (event)=>setCompanySearch(event.target.value) |

Defaults/dependencies: ["[user, setUser] = useState( () => authenticatedUser || (() => { try { return JSON.parse( sessionStorage.getItem(\"knockout-master-user\") || \"null\", ); } catch { return null; } })(), )", "[data, setData] = useState(null)", "[masterAction, setMasterAction] = useState(null)", "[pinUser, setPinUser] = useState(null)", "[selectedCompanyId, setSelectedCompanyId] = useState(null)", "[selectedRegistrationId,setSelectedRegistrationId]=useState(null)", "[companySection, setCompanySection] = useState(\"overview\")", "[companySearch, setCompanySearch] = useState(\"\")", "[companyFilter, setCompanyFilter] = useState(\"all\")", "[reviewBusy,setReviewBusy]=useState(null)", "[actionBusy, setActionBusy] = useState(false)", "[notice, setNotice] = useState(\"\")"]

Submit/API: ["api(\"/state\")", "api(`/companies/${company.id}/status`, { method: \"PATCH\", body: JSON.stringify({ status: company.status === \"active\" ? \"suspended\" : \"active\", }), })", "api(`/companies/${company.id}/modules`, {method:\"PATCH\",body:JSON.stringify({module,enabled})})", "api(`/saas-invoices/${invoice.id}/status`, {method:\"PATCH\",body:JSON.stringify({status})})", "api(`/companies/${action.company.id}`, { method: \"DELETE\", body: JSON.stringify({ companyName: typed }), })", "api(`/company-registrations/${request.id}/${status}`,{method:\"POST\",body:JSON.stringify({reviewNote:status===\"reject\"?\"Application declined by KnockOUT Master\":\"Approved by KnockOUT Master\"})})"]

Feedback: ["setNotice(e.message)", "setNotice(message)", "setNotice(\"\")", "toast( `${company.companyName} ${company.status === \"active\" ? \"suspended\" : \"activated\"}`, )", "toast(e.message)", "toast(`${module} module ${enabled ? \"enabled\" : \"disabled\"} for ${company.companyName}`)", "toast(`${invoice.companyName} invoice marked ${status}`)", "toast(`${action.company.companyName} and its database were deleted`)", "toast(status===\"approve\"?`${request.companyName} approved · applicant can now complete setup and payment`:`${request.companyName} registration rejected`)", "toast(error.message)"]

Roles: superadmin; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:392](../../frontend/src/App.jsx#L392)

## F-W-MasterActionModal — Master Action Modal controls

Operate tenant companies, logins, module access and SaaS invoices through Master Action Modal.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| TYPE TO CONFIRM | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setTyped(e.target.value) |

Defaults/dependencies: ["[typed, setTyped] = useState(\"\")"]

Submit/API: []

Feedback: ["confirm(typed)"]

Roles: superadmin; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:647](../../frontend/src/App.jsx#L647)

## F-W-CompanyControls — Company Controls controls

Operate tenant companies, logins, module access and SaaS invoices through Company Controls.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
|  | checkbox | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (event)=>toggleModule(company,key,event.target.checked) |

Defaults/dependencies: []

Submit/API: []

Feedback: []

Roles: superadmin; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:708](../../frontend/src/App.jsx#L708)

## F-W-MasterPinModal — Master Pin Modal controls

Operate tenant companies, logins, module access and SaaS invoices through Master Pin Modal.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| NEW 6-DIGIT PIN | password | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6)) |

Defaults/dependencies: ["[pin, setPin] = useState(\"\")", "[busy, setBusy] = useState(false)", "[error, setError] = useState(\"\")"]

Submit/API: ["api( isMaster ? `/master-users/${user.id}/pin` : `/companies/${company.id}/users/${user.id}/pin`, { method: \"PATCH\", body: JSON.stringify({ pin }) }, )"]

Feedback: ["setError(\"\")", "toast(`${user.name}'s PIN changed successfully`)", "setError(e.message)"]

Roles: superadmin; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:776](../../frontend/src/App.jsx#L776)

## F-W-MasterBilling — Master Billing controls

Operate tenant companies, logins, module access and SaaS invoices through Master Billing.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Billing month | select | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (event)=>setMonth(event.target.value) |

Defaults/dependencies: ["[month,setMonth]=useState(months[0]||new Date().toISOString().slice(0,7))"]

Submit/API: []

Feedback: []

Roles: superadmin; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:846](../../frontend/src/App.jsx#L846)

## F-W-MasterPricingSlab — Master Pricing Slab controls

Operate tenant companies, logins, module access and SaaS invoices through Master Pricing Slab.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Per tenant / month | number | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": "", "min": "0"} | ["editing"] | [] event=>setPricing({...pricing,[key]:{...item,price:event.target.value}}) |

Defaults/dependencies: ["[pricing,setPricing]=useState(null)", "[editing,setEditing]=useState(false)", "[busy,setBusy]=useState(\"\")"]

Submit/API: ["api('/module-pricing')", "api(`/module-pricing/${key}`,{method:'PATCH',body:JSON.stringify({price:Number(pricing[key].price)})})"]

Feedback: []

Roles: superadmin; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:856](../../frontend/src/App.jsx#L856)

## F-W-MasterLogin — Master Login controls

PIN authentication, identity and profile editing through Master Login.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| 6-digit Master PIN | password | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6)) |

Defaults/dependencies: ["[pin, setPin] = useState(\"\")", "[error, setError] = useState(\"\")", "[busy, setBusy] = useState(false)"]

Submit/API: ["api(\"/login\", { method: \"POST\", body: JSON.stringify({ pin }) })"]

Feedback: ["setError(\"\")", "setError(e.message)"]

Roles: anonymous; IMPLEMENTED. Evidence: [frontend/src/App.jsx:863](../../frontend/src/App.jsx#L863)

## F-W-CompanyRegistration — Company Registration controls

PIN authentication, identity and profile editing through Company Registration.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Hotel / business name | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, companyName: e.target.value }) |
| Admin name | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, adminName: e.target.value }) |
| Phone | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, phone: e.target.value }) |
| Email | email | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, email: e.target.value }) |

Defaults/dependencies: ["[form, setForm] = useState({ companyName: \"\", adminName: \"\", email: \"\", phone: \"\", })", "[busy, setBusy] = useState(false)", "[error, setError] = useState(\"\")"]

Submit/API: ["api(\"/companies\", { method: \"POST\", body: JSON.stringify(form), })"]

Feedback: ["setError(\"\")", "toast( `${result.companyName} created · Hotel ID ${result.hotelId} · Admin PIN ${result.adminPin}`, )", "setError(e.message)"]

Roles: superadmin; FRONTEND_ONLY. Evidence: [frontend/src/App.jsx:912](../../frontend/src/App.jsx#L912)

## F-W-ProfileEditor — Profile Editor controls

Name, phone, email and profile image edit. Web profile load failure falls back to session identity.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Change photo | file | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] event=>choose(event.target.files[0]) |
| FULL NAME | text | Explicit JSX required | {"defaultValue": ""} | [] | [] event=>setForm({...form,name:event.target.value}) |
| MOBILE NUMBER | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] event=>setForm({...form,phone:event.target.value}) |
| EMAIL ADDRESS | email | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] event=>setForm({...form,email:event.target.value}) |

Defaults/dependencies: ["[form,setForm]=useState({name:user.name||\"\",phone:user.phone||\"\",email:user.email||\"\"})", "[image,setImage]=useState(null)", "[preview,setPreview]=useState(user.profileImageUrl||\"\")", "[busy,setBusy]=useState(false)", "[error,setError]=useState(\"\")"]

Submit/API: ["apiForm(\"/profile\",body,{method:\"PATCH\"})"]

Feedback: ["setError(\"Choose a JPG, PNG, or WebP image\")", "setError(\"Profile photo must be smaller than 5 MB\")", "setError(\"\")", "setError(err.message)"]

Roles: admin, waiter, chef, juicer; IMPLEMENTED. Evidence: [frontend/src/App.jsx:1105](../../frontend/src/App.jsx#L1105)

## F-W-TableEditor — Table Editor controls

Create tables, inspect active service and change table state through Table Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Table number | number | Explicit JSX required | {"defaultValue": "", "min": "1"} | [] | [] (e) => setForm({ ...form, number: e.target.value }) |
| Number of seats | number | Explicit JSX required | {"defaultValue": "", "min": "1"} | [] | [] (e) => setForm({ ...form, seats: e.target.value }) |
| Service area | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, area: e.target.value }) |

Defaults/dependencies: ["[form, setForm] = useState({ number: \"\", seats: 4, area: \"Main Hall\" })", "[error, setError] = useState(\"\")"]

Submit/API: ["api(\"/tables\", { method: \"POST\", body: JSON.stringify(form) })"]

Feedback: ["setError(\"\")", "toast(`Table ${form.number} added`)", "setError(e.message)"]

Roles: admin; IMPLEMENTED. Evidence: [frontend/src/App.jsx:1716](../../frontend/src/App.jsx#L1716)

## F-W-FoodManager — Food Manager controls

Manage dishes, images, prices, availability and combo composition through Food Manager.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
|  | file | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => upload(item, e.target.files[0]) |

Defaults/dependencies: ["[uploading, setUploading] = useState(null)"]

Submit/API: ["apiForm(`/menu/${item.id}/image`, form)", "api(`/menu/${item.id}/image`, { method: \"DELETE\" })"]

Feedback: ["toast(`${item.name} photo saved to MinIO`)", "toast(e.message)", "toast(\"Food photo removed\")"]

Roles: admin; FRONTEND_ONLY. Evidence: [frontend/src/App.jsx:1830](../../frontend/src/App.jsx#L1830)

## F-W-MenuManager — Menu Manager controls

Dishes / combos tabs → cards → editor. Combos reference menu items; image upload supported. No general text search found here.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
|  | file | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => upload(item, e.target.files[0]) |

Defaults/dependencies: ["[tab, setTab] = useState(\"dishes\")", "[editor, setEditor] = useState(null)", "[uploading, setUploading] = useState(null)"]

Submit/API: ["apiForm(`/menu/${item.id}/image`, form)"]

Feedback: ["toast(\"Photo saved to MinIO\")", "toast(e.message)"]

Roles: admin; IMPLEMENTED. Evidence: [frontend/src/App.jsx:1894](../../frontend/src/App.jsx#L1894)

## F-W-DishEditor — Dish Editor controls

Manage dishes, images, prices, availability and combo composition through Dish Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Food name | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, name: e.target.value }) |
| Category | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | "[\"Starters\", \"Mains\", \"Desserts\", \"Beverages\", \"Juices\", \"Sides\", \"Specials\"]" (category) => setForm({ ...form, category }) |
| Icon | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, icon: e.target.value }) |
| Description | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, description: e.target.value }) |
| Amount / selling price | number | Explicit JSX required | {"defaultValue": "", "min": "0"} | [] | [] (e) => setForm({ ...form, price: e.target.value }) |
|   Available for ordering | checkbox | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, available: e.target.checked }) |

Defaults/dependencies: ["[form, setForm] = useState({ name: item?.name || \"\", category: item?.category || \"Mains\", description: item?.description || \"\", price: item?.price || \"\", icon: item?.icon || \"🍽️\", available: item?.available ?? true, })"]

Submit/API: ["api(item ? `/menu/${item.id}` : \"/menu\", { method: item ? \"PUT\" : \"POST\", body: JSON.stringify(form), })"]

Feedback: ["toast(item ? \"Dish customized\" : \"New dish added\")"]

Roles: admin; IMPLEMENTED. Evidence: [frontend/src/App.jsx:2018](../../frontend/src/App.jsx#L2018)

## F-W-ComboEditor — Combo Editor controls

Manage dishes, images, prices, availability and combo composition through Combo Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Combo name | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, name: e.target.value }) |
| Combo amount | number | Explicit JSX required | {"defaultValue": "", "min": "0"} | [] | [] (e) => setForm({ ...form, price: e.target.value }) |
| Icon | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, icon: e.target.value }) |
| Description | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, description: e.target.value }) |
| Qty | number | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": "", "min": "1"} | ["selected"] | [] (e) => qty(d.id, e.target.value) |

Defaults/dependencies: ["[form, setForm] = useState({ name: item?.name || \"\", description: item?.description || \"\", price: item?.price || \"\", icon: item?.icon || \"🎁\", })", "[parts, setParts] = useState( item?.components?.map((c) => ({ menuId: c.menuId, quantity: c.quantity, })) || [], )"]

Submit/API: ["api(item ? `/combos/${item.id}` : \"/combos\", { method: item ? \"PUT\" : \"POST\", body: JSON.stringify({ ...form, components: parts }), })"]

Feedback: ["toast(item ? \"Combo customized\" : \"Combo offer created\")"]

Roles: admin; IMPLEMENTED. Evidence: [frontend/src/App.jsx:2102](../../frontend/src/App.jsx#L2102)

## F-W-ParcelBuilder — Parcel Builder controls

Create takeaway orders, record payment and coordinate collection through Parcel Builder.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Customer name | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setCustomer(e.target.value) |
| Phone number | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setPhone(e.target.value) |

Defaults/dependencies: ["[cart, setCart] = useState([])", "[customer, setCustomer] = useState(\"\")", "[phone, setPhone] = useState(\"\")", "[paymentMethod, setPaymentMethod] = useState(\"\")"]

Submit/API: ["api(\"/parcels\", { method: \"POST\", body: JSON.stringify({ customerName: customer, customerPhone: phone, adminName: user.name, items: cart, paymentMethod: paymentMethod || null, }), })"]

Feedback: ["toast( paymentMethod ? `Parcel paid by ${paymentMethod} and sent to Chef` : \"Parcel sent to Chef — payment due at handoff\", )", "toast(e.message)"]

Roles: admin; IMPLEMENTED. Evidence: [frontend/src/App.jsx:2546](../../frontend/src/App.jsx#L2546)

## F-W-Stock — Stock controls

Inventory / activity / planning views. Name/category query, category and health filters combine. Forecast derives from recorded usage/waste, not automatic ingredient consumption.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Search item or category… | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | ["tab === \"inventory\""] | [] (e)=>setQuery(e.target.value) |
| category | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | ["tab === \"inventory\""] | "[{value:\"all\",label:\"All categories\"},...categories.map((x)=>({value:x,label:x}))]" setCategory |
| health | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | ["tab === \"inventory\""] | "[{value:\"all\",label:\"All stock levels\"},{value:\"healthy\",label:\"Healthy\"},{value:\"low\",label:\"Low stock\"},{value:\"out\",label:\"Out of stock\"}]" setHealth |

Defaults/dependencies: ["[editing, setEditing] = useState(null)", "[moving, setMoving] = useState(null)", "[tab, setTab] = useState(\"inventory\")", "[query, setQuery] = useState(\"\")", "[category, setCategory] = useState(\"all\")", "[health, setHealth] = useState(\"all\")", "[movementFilter, setMovementFilter] = useState(\"all\")"]

Submit/API: ["api(`/stock-requests/${request.id}/status`, { method:\"PATCH\", body:JSON.stringify({status}) })"]

Feedback: ["toast(`${request.itemName} request marked ${status}`)", "toast(error.message)"]

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:2739](../../frontend/src/App.jsx#L2739)

## F-W-StockEditor — Stock Editor controls

Track stock movements, minimums, planning and chef purchase requests through Stock Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Ingredient / item name | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, name: e.target.value }) |
| Category | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, category: e.target.value }) |
| Unit | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | "[\"kg\", \"g\", \"L\", \"ml\", \"pcs\", \"pack\"]" (unit) => setForm({ ...form, unit }) |
| Opening quantity | number | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": "", "min": "0"} | ["!item"] | [] (e) => setForm({ ...form, quantity: e.target.value }) |
| Minimum level | number | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": "", "min": "0"} | [] | [] (e) => setForm({ ...form, min: e.target.value }) |
| Unit cost | number | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": "", "min": "0"} | [] | [] (e) => setForm({ ...form, cost: e.target.value }) |

Defaults/dependencies: ["[form, setForm] = useState( item ? { name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, min: item.min, cost: item.cost, } : { name: \"\", category: \"\", quantity: 0, unit: \"kg\", min: 0, cost: 0 }, )", "[busy, setBusy] = useState(false)", "[error, setError] = useState(\"\")"]

Submit/API: ["api(item ? `/inventory/${item.id}` : \"/inventory\", { method: item ? \"PUT\" : \"POST\", body: JSON.stringify({ ...form, createdBy: user.name }), })"]

Feedback: ["setError(\"\")", "toast(item ? \"Stock item updated\" : \"Stock item created\")", "setError(e.message)"]

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:3039](../../frontend/src/App.jsx#L3039)

## F-W-StockMovement — Stock Movement controls

Track stock movements, minimums, planning and chef purchase requests through Stock Movement.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Movement type | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | "[{value:\"purchase\",label:\"Purchase / stock in\"},{value:\"usage\",label:\"Kitchen usage\"},{value:\"waste\",label:\"Waste / spoilage\"},{value:\"adjustment\",label:\"Manual adjustment\"}]" (movementType) => setForm({ ...form, movementType }) |
| Adjustment direction | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | ["form.movementType === \"adjustment\""] | "[{value:1,label:\"Increase stock\"},{value:-1,label:\"Decrease stock\"}]" (adjustmentDirection) => setForm({ ...form, adjustmentDirection: Number(adjustmentDirection) }) |
| Quantity ( ) | number | Explicit JSX required | {"defaultValue": "", "min": "0.01"} | [] | [] (e) => setForm({ ...form, quantity: e.target.value }) |
| Unit cost | number | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": "", "min": "0"} | [] | [] (e) => setForm({ ...form, unitCost: e.target.value }) |
| Notes | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, note: e.target.value }) |

Defaults/dependencies: ["[form, setForm] = useState({ movementType: \"purchase\", quantity: \"\", unitCost: item.cost, note: \"\", adjustmentDirection: 1, })", "[busy, setBusy] = useState(false)", "[error, setError] = useState(\"\")"]

Submit/API: ["api(`/inventory/${item.id}/movements`, { method: \"POST\", body: JSON.stringify({ ...form, createdBy: user.name }), })"]

Feedback: ["setError(\"\")", "toast(`${item.name} stock movement recorded`)", "setError(e.message)"]

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:3145](../../frontend/src/App.jsx#L3145)

## F-W-FinanceEntry — Finance Entry controls

Review daily closing, ledger, purchases, balances and reports through Finance Entry.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Entry type | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | "[{value:\"expense\",label:\"Expense\"},{value:\"income\",label:\"Income\"}]" (entryType) => setForm({ ...form, entryType }) |
| Category | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, category: e.target.value }) |
| Description | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, description: e.target.value }) |
| Amount | number | Explicit JSX required | {"defaultValue": "", "min": "0.01"} | [] | [] (e) => setForm({ ...form, amount: e.target.value }) |
| Payment method | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | "[\"Cash\", \"Card / UPI\", \"Bank Transfer\"]" (paymentMethod) => setForm({ ...form, paymentMethod }) |
| Date | date | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, entryDate: e.target.value }) |
| Reference | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, reference: e.target.value }) |

Defaults/dependencies: ["[form, setForm] = useState({ entryType: \"expense\", category: \"Purchases\", description: \"\", amount: \"\", paymentMethod: \"Cash\", entryDate: today, reference: \"\", })", "[busy, setBusy] = useState(false)", "[error, setError] = useState(\"\")"]

Submit/API: ["api(\"/finance\", { method: \"POST\", body: JSON.stringify({ ...form, createdBy: user.name }), })"]

Feedback: ["setError(\"\")", "toast(\"Finance entry recorded\")", "setError(e.message)"]

Roles: admin; IMPLEMENTED. Evidence: [frontend/src/App.jsx:3397](../../frontend/src/App.jsx#L3397)

## F-W-FinanceCalendar — Finance Calendar controls

Review daily closing, ledger, purchases, balances and reports through Finance Calendar.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| REPORT MONTH | month | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (event)=>{const [nextYear,nextMonth]=event.target.value.split("-").map(Number);if(nextYear&&nextMonth)setMonth(new Date(nextYear,nextMonth-1,1));} |

Defaults/dependencies: ["[month, setMonth] = useState( () => new Date(today.getFullYear(), today.getMonth(), 1), )"]

Submit/API: []

Feedback: []

Roles: admin; IMPLEMENTED. Evidence: [frontend/src/App.jsx:3525](../../frontend/src/App.jsx#L3525)

## F-W-SupplierPurchaseForm — Supplier Purchase Form controls

Review daily closing, ledger, purchases, balances and reports through Supplier Purchase Form.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Shop or dealer name | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, supplierName: e.target.value }) |
| Invoice number | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, invoiceNumber: e.target.value }) |
| Purchase date | date | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, purchaseDate: e.target.value }) |
| Products / description | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, description: e.target.value }) |
| Total invoice amount | number | Explicit JSX required | {"defaultValue": "", "min": "0.01"} | [] | [] (e) => setForm({ ...form, totalAmount: e.target.value }) |
| Amount paid now | number | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": "", "min": "0", "max": "form.totalAmount \|\| undefined"} | [] | [] (e) => setForm({ ...form, paidAmount: e.target.value }) |
| Payment method | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | "[\"Cash\", \"Card / UPI\", \"Bank Transfer\", \"Credit\"]" (paymentMethod) => setForm({ ...form, paymentMethod }) |
| Payment reference | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, reference: e.target.value }) |
| Notes | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, notes: e.target.value }) |

Defaults/dependencies: ["[form, setForm] = useState({ supplierName: \"\", invoiceNumber: \"\", description: \"\", purchaseDate: date, totalAmount: \"\", paidAmount: 0, paymentMethod: \"Cash\", reference: \"\", notes: \"\", })", "[busy, setBusy] = useState(false)", "[error, setError] = useState(\"\")"]

Submit/API: ["api(\"/supplier-purchases\", { method: \"POST\", body: JSON.stringify({ ...form, createdBy: user.name }), })"]

Feedback: ["setError(\"\")", "toast(`Purchase saved · ${money(due)} still payable`)", "setError(e.message)"]

Roles: admin; IMPLEMENTED. Evidence: [frontend/src/App.jsx:4164](../../frontend/src/App.jsx#L4164)

## F-W-DealerPaymentForm — Dealer Payment Form controls

Review daily closing, ledger, purchases, balances and reports through Dealer Payment Form.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Amount to pay | number | Explicit JSX required | {"defaultValue": "", "min": "0.01", "max": "purchase.due"} | [] | [] (e) => setForm({ ...form, amount: e.target.value }) |
| Payment date | date | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, paymentDate: e.target.value }) |
| Payment method | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | "[\"Cash\", \"Card / UPI\", \"Bank Transfer\"]" (paymentMethod) => setForm({ ...form, paymentMethod }) |
| Reference | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, reference: e.target.value }) |
| Notes | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, notes: e.target.value }) |

Defaults/dependencies: ["[form, setForm] = useState({ amount: purchase.due, paymentMethod: \"Cash\", paymentDate: date, reference: \"\", notes: \"\", })", "[busy, setBusy] = useState(false)", "[error, setError] = useState(\"\")"]

Submit/API: ["api(`/supplier-purchases/${purchase.id}/payments`, { method: \"POST\", body: JSON.stringify({ ...form, createdBy: user.name }), })"]

Feedback: ["setError(\"\")", "toast(`Payment recorded for ${purchase.supplierName}`)", "setError(e.message)"]

Roles: admin; IMPLEMENTED. Evidence: [frontend/src/App.jsx:4306](../../frontend/src/App.jsx#L4306)

## F-W-StaffEditor — Staff Editor controls

Manage login accounts, kitchen roster, compensation fields and shifts through Staff Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Full name | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, name: e.target.value }) |
| 6-digit login PIN | text | Explicit JSX required | {"defaultValue": ""} | ["staff"] | [] (e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 6), }) |
| Phone | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, phone: e.target.value }) |
| form.payRate | number | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": "", "min": "0"} | [] | [] (e) => setForm({ ...form, payRate: e.target.value }) |
|   Login account active | checkbox | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | ["staff"] | [] (e) => setForm({ ...form, active: e.target.checked }) |

Defaults/dependencies: ["[form, setForm] = useState({ name: staff?.name || \"\", role: staff?.role || \"waiter\", pin: staff?.pin || \"\", phone: staff?.phone || \"\", payType: staff?.payType || \"monthly\", payRate: staff?.payRate || 0, active: staff?.active ?? true, })", "[error, setError] = useState(\"\")", "[deleteArmed, setDeleteArmed] = useState(false)", "[deleting, setDeleting] = useState(false)"]

Submit/API: ["api(staff ? `/staff/${staff.id}` : \"/staff\", { method: staff ? \"PUT\" : \"POST\", body: JSON.stringify(form), })", "api(`/staff/${staff.id}`, { method: \"DELETE\" })"]

Feedback: ["setError(\"\")", "toast(staff ? \"Staff login updated\" : `Staff login created · Generated PIN ${result.pin}`)", "setError(e.message)", "toast(`${staff.name} removed from Staff Management`)"]

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:4680](../../frontend/src/App.jsx#L4680)

## F-W-SettingsPanel — Settings Panel controls

Web business name editable; currency disabled; tax/service inputs commented out.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Business name | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setS({ ...s, hotelName: e.target.value }) |
| Currency | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | []  |

Defaults/dependencies: ["[s, setS] = useState(data.settings)"]

Submit/API: ["api(\"/settings\", { method: \"PUT\", body: JSON.stringify(s) })"]

Feedback: ["toast(\"Business settings saved\")"]

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:4815](../../frontend/src/App.jsx#L4815)

## F-W-BookingModal — Booking Modal controls

Phone, date, time, duration and available table. This reserves a restaurant table, not a room. API rejects past times and overlaps. No guest account, rate, deposit or stay.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Customer mobile number | tel | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, customerPhone: e.target.value }) |
| Booking date | date | Explicit JSX required | {"defaultValue": "", "min": "dateKey(new Date())"} | [] | [] (e) => setForm({ ...form, bookingDate: e.target.value, tableId: "" }) |
| Booking time | time | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, bookingTime: e.target.value, tableId: "" }) |
| Reservation duration | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | "[60,90,120,150,180].map((minutes) => ({ value: minutes, label: `${minutes} minutes`, note: `Table locked until ${bookingTimeLabel(String(Math.floor((requestedStart+minutes)/60)%24).padStart(2,\"0\")+\":\"+String((requestedStart+minutes)%60).padStart(2,\"0\"))}` }))" (durationMinutes) => setForm({ ...form, durationMinutes: Number(durationMinutes), tableId: "" }) |
| Available table for this time | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | "tableOptions" (tableId) => setForm({ ...form, tableId }) |

Defaults/dependencies: ["[form, setForm] = useState({ tableId: \"\", customerPhone: \"\", bookingDate: initialDate || dateKey(new Date()), bookingTime: \"18:00\", durationMinutes: 90, })", "[error, setError] = useState(\"\")", "[busy, setBusy] = useState(false)"]

Submit/API: ["api(\"/bookings\", { method: \"POST\", body: JSON.stringify(form) })"]

Feedback: ["setError(\"\")", "toast(result.notificationStatus === \"sent\" ? \"Booking confirmed · SMS sent to customer\" : result.notificationStatus === \"failed\" ? \"Booking confirmed · SMS delivery failed\" : \"Booking confirmed · SMS queued (gateway configuration required)\")", "setError(e.message)"]

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:5053](../../frontend/src/App.jsx#L5053)

## F-W-ChefStockBooking — Chef Stock Booking controls

Track stock movements, minimums, planning and chef purchase requests through Chef Stock Booking.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Search ingredient or category | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (event)=>setQuery(event.target.value) |

Defaults/dependencies: ["[query,setQuery]=useState(\"\")", "[booking,setBooking]=useState(null)"]

Submit/API: []

Feedback: []

Roles: chef; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:5957](../../frontend/src/App.jsx#L5957)

## F-W-ChefStockRequestModal — Chef Stock Request Modal controls

Track stock movements, minimums, planning and chef purchase requests through Chef Stock Request Modal.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| QUANTITY REQUIRED | number | Explicit JSX required | {"defaultValue": "", "min": "0.01"} | [] | [] (event)=>setQuantity(event.target.value) |
| NOTE / REASON | textarea | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (event)=>setNote(event.target.value) |

Defaults/dependencies: ["[quantity,setQuantity]=useState(String(suggested))", "[note,setNote]=useState(\"\")", "[busy,setBusy]=useState(false)", "[error,setError]=useState(\"\")"]

Submit/API: ["api(\"/stock-requests\",{method:\"POST\",body:JSON.stringify({inventoryId:item.id,requestedQuantity:Number(quantity),note,requestedBy:user.name})})"]

Feedback: ["setError(\"\")", "toast(`${item.name} stock request sent to Admin`)", "setError(err.message)"]

Roles: chef; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:5970](../../frontend/src/App.jsx#L5970)

## F-W-ChefDishes — Chef Dishes controls

Manage dishes, images, prices, availability and combo composition through Chef Dishes.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Search dishes… | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (event) => setQuery(event.target.value) |

Defaults/dependencies: ["[query, setQuery] = useState(\"\")"]

Submit/API: ["api(`/menu/${item.id}/availability`, { method: \"PATCH\", body: JSON.stringify({ available }) })"]

Feedback: ["toast(`${item.name} marked ${available ? \"available\" : \"completed / unavailable\"}`)"]

Roles: chef, juicer; IMPLEMENTED. Evidence: [frontend/src/App.jsx:6004](../../frontend/src/App.jsx#L6004)

## F-W-JuicerLoginEditor — Juicer Login Editor controls

Manage login accounts, kitchen roster, compensation fields and shifts through Juicer Login Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Full name | text | Explicit JSX required | {"defaultValue": ""} | [] | [] e=>setForm({...form,name:e.target.value}) |
| Phone | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] e=>setForm({...form,phone:e.target.value}) |
| Salary basis Daily Monthly | select | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | ["Daily", "Monthly"] e=>setForm({...form,payType:e.target.value}) |
| Salary amount | number | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": "", "min": "0"} | [] | [] e=>setForm({...form,payRate:e.target.value}) |

Defaults/dependencies: ["[form,setForm]=useState({name:\"\",phone:\"\",payType:\"monthly\",payRate:0})", "[busy,setBusy]=useState(false)"]

Submit/API: ["api(\"/juicer-login\",{method:\"POST\",body:JSON.stringify(form)})"]

Feedback: ["toast(`Juicer login created · Generated PIN ${result.pin}`)", "toast(error.message)"]

Roles: chef; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:6090](../../frontend/src/App.jsx#L6090)

## F-W-KitchenStaffEditor — Kitchen Staff Editor controls

Manage login accounts, kitchen roster, compensation fields and shifts through Kitchen Staff Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Full name | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, name: e.target.value }) |
| Designation | text | Explicit JSX required | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, designation: e.target.value }) |
| Phone | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, phone: e.target.value }) |
| Specialization | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, specialization: e.target.value }) |
| Joining date | date | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, joinedOn: e.target.value }) |
| form.payRate | number | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": "", "min": "0"} | [] | [] (e) => setForm({ ...form, payRate: e.target.value }) |
| Notes | textarea | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] (e) => setForm({ ...form, notes: e.target.value }) |
| Active kitchen employee | checkbox | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | ["member"] | [] (e) => setForm({ ...form, active: e.target.checked }) |

Defaults/dependencies: ["[form, setForm] = useState({ name: member?.name || \"\", designation: member?.designation || \"Chef\", phone: member?.phone || \"\", specialization: member?.specialization || \"\", payType: member?.payType || \"monthly\", payRate: member?.payRate || 0, joinedOn: member?.joinedOn ? String(member.joinedOn).slice(0, 10) : \"\", notes: member?.notes || \"\", active: member?.active ?? true, createdBy: user?.name || \"Admin\", })", "[error, setError] = useState(\"\")"]

Submit/API: ["api(member ? `/kitchen-staff/${member.id}` : \"/kitchen-staff\", { method: member ? \"PUT\" : \"POST\", body: JSON.stringify(form), })"]

Feedback: ["setError(\"\")", "toast(member ? \"Chef updated\" : \"Chef added\")", "setError(e.message)"]

Roles: admin, chef; PARTIALLY_IMPLEMENTED. Evidence: [frontend/src/App.jsx:6095](../../frontend/src/App.jsx#L6095)

## F-M-Login — Login controls

Web supports tenant Hotel ID + PIN and no-Hotel-ID master/applicant path. Native requires four-digit Hotel ID and six-digit PIN, so it does not expose the same login paths.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| 4-digit Hotel ID | number-pad | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>setHotelId(v.replace(/\D/g,'').slice(0,4)) |
| pin | number-pad | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>setPin(v.replace(/\D/g,'').slice(0,6)) |

Defaults/dependencies: ["[hotelId,setHotelId]=useState('')", "[pin,setPin]=useState('')", "[busy,setBusy]=useState(false)", "[error,setError]=useState('')", "[verified,setVerified]=useState(false)"]

Submit/API: ["fetch(`http://${host}:${unifiedApiPort}/api/public/resolve-login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hotelId,pin})})"]

Feedback: ["setError('')", "setError(e.message)"]

Roles: anonymous; IMPLEMENTED. Evidence: [mobile/App.js:36](../../mobile/App.js#L36)

## F-M-MobileTableEditor — Mobile Table Editor controls

Create tables, inspect active service and change table state through Mobile Table Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Table number | number-pad | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setNumber |
| Seats | number-pad | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setSeats |
| Service area | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setArea |

Defaults/dependencies: ["[number,setNumber]=useState('')", "[seats,setSeats]=useState('4')", "[area,setArea]=useState('Main Hall')", "[busy,setBusy]=useState(false)"]

Submit/API: ["api('/tables',{method:'POST',body:JSON.stringify({number,seats,area})})"]

Feedback: ["notify(`Table ${number} added`)", "notify(e.message)"]

Roles: admin; IMPLEMENTED. Evidence: [mobile/App.js:55](../../mobile/App.js#L55)

## F-M-ChefJuicerManagement — Chef Juicer Management controls

Manage login accounts, kitchen roster, compensation fields and shifts through Chef Juicer Management.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Full name | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] name=>setForm({...form,name}) |
| Phone | phone-pad | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] phone=>setForm({...form,phone}) |
| Salary amount | decimal-pad | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] payRate=>setForm({...form,payRate}) |

Defaults/dependencies: ["[juicer,setJuicer]=useState(undefined)", "[show,setShow]=useState(false)", "[busy,setBusy]=useState(false)", "[form,setForm]=useState({name:'',phone:'',payType:'monthly',payRate:'0'})"]

Submit/API: ["api('/juicer-login')", "api('/juicer-login',{method:'POST',body:JSON.stringify(form)})"]

Feedback: ["notify(e.message)", "notify(`Juicer login created · PIN ${result.pin}`)"]

Roles: chef; PARTIALLY_IMPLEMENTED. Evidence: [mobile/App.js:86](../../mobile/App.js#L86)

## F-M-AdminBookingEditor — Admin Booking Editor controls

Reserve a restaurant table for a dated time interval and phone contact through Admin Booking Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Customer mobile number | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setPhone |
| Booking date (YYYY-MM-DD) | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] value=>{setDate(value);setTableId(null)} |
| Booking time (24-hour HH:MM) | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] value=>{setTime(value);setTableId(null)} |

Defaults/dependencies: ["[tableId,setTableId]=useState(null)", "[customerPhone,setPhone]=useState('')", "[bookingDate,setDate]=useState(initialDate||today())", "[bookingTime,setTime]=useState('18:00')", "[durationMinutes,setDuration]=useState(90)", "[busy,setBusy]=useState(false)"]

Submit/API: ["request('/bookings',{method:'POST',body:JSON.stringify({tableId,customerPhone,bookingDate,bookingTime,durationMinutes})})"]

Feedback: ["notify(result.notificationStatus==='sent'?'Booking confirmed · SMS sent':'Booking confirmed · SMS queued')", "notify(e.message)"]

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [mobile/AdminModules.js:52](../../mobile/AdminModules.js#L52)

## F-M-ParcelEditor — Parcel Editor controls

Create takeaway orders, record payment and coordinate collection through Parcel Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Customer name | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setName |
| Phone | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setPhone |

Defaults/dependencies: ["[name,setName]=useState('')", "[phone,setPhone]=useState('')", "[payment,setPayment]=useState('unpaid')", "[items,setItems]=useState([])", "[busy,setBusy]=useState(false)"]

Submit/API: ["request('/parcels',{method:'POST',body:JSON.stringify({customerName:name,customerPhone:phone,adminName:user.name,items,paymentMethod:payment==='unpaid'?null:payment})})"]

Feedback: ["notify('Parcel sent to kitchen')", "notify(e.message)"]

Roles: admin; IMPLEMENTED. Evidence: [mobile/AdminModules.js:74](../../mobile/AdminModules.js#L74)

## F-M-MenuEditor — Menu Editor controls

Manage dishes, images, prices, availability and combo composition through Menu Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Name | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('name',v) |
| Category | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | ["!combo"] | [] v=>patch('category',v) |
| Price | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('price',v) |
| Icon / emoji | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('icon',v) |
| Description / customization | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('description',v) |

Defaults/dependencies: ["[combo,setCombo]=useState(!!item?.isCombo)", "[form,setForm]=useState(item?{name:item.name,category:item.category,description:item.description||'',price:String(item.price),icon:item.icon||'🍽️',available:item.available}:{name:'',category:'Mains',description:'',price:'',icon:'🍽️',available:true})", "[components,setComponents]=useState(item?.components?.map(x=>({menuId:x.menuId,quantity:x.quantity}))||[])", "[busy,setBusy]=useState(false)"]

Submit/API: ["request(path,{method:item?'PUT':'POST',body:JSON.stringify(combo?{name:form.name,description:form.description,price:form.price,icon:form.icon,components}:{...form})})"]

Feedback: ["notify(item?'Menu item updated':'Menu item added')", "notify(e.message)", "notify('Food photo uploaded')"]

Roles: admin; IMPLEMENTED. Evidence: [mobile/AdminModules.js:78](../../mobile/AdminModules.js#L78)

## F-M-AdminStock — Admin Stock controls

Track stock movements, minimums, planning and chef purchase requests through Admin Stock.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Search stock or category… | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | ["view==='inventory'"] | [] setQuery |

Defaults/dependencies: ["[editing,setEditing]=useState(null)", "[moving,setMoving]=useState(null)", "[view,setView]=useState('inventory')", "[query,setQuery]=useState('')"]

Submit/API: []

Feedback: []

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [mobile/AdminModules.js:80](../../mobile/AdminModules.js#L80)

## F-M-StockEditor — Stock Editor controls

Track stock movements, minimums, planning and chef purchase requests through Stock Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Item name | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('name',v) |
| Category | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('category',v) |
| Opening quantity | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | ["!item"] | [] v=>patch('quantity',v) |
| Unit | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('unit',v) |
| Minimum | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('min',v) |
| Unit cost | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('cost',v) |

Defaults/dependencies: ["[form,setForm]=useState(item?{name:item.name,category:item.category,quantity:item.quantity,unit:item.unit,min:item.min,cost:item.cost}:{name:'',category:'Ingredients',quantity:'0',unit:'kg',min:'0',cost:'0'})", "[busy,setBusy]=useState(false)"]

Submit/API: ["request(item?`/inventory/${item.id}`:'/inventory',{method:item?'PUT':'POST',body:JSON.stringify({...form,createdBy:user.name})})"]

Feedback: ["notify('Stock item saved')", "notify(e.message)"]

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [mobile/AdminModules.js:84](../../mobile/AdminModules.js#L84)

## F-M-StockMovement — Stock Movement controls

Track stock movements, minimums, planning and chef purchase requests through Stock Movement.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| `Quantity (${item.unit})` | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setQuantity |
| Unit cost | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setUnitCost |
| Notes | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setNote |

Defaults/dependencies: ["[type,setType]=useState('purchase')", "[quantity,setQuantity]=useState('')", "[unitCost,setUnitCost]=useState(String(item.cost))", "[note,setNote]=useState('')", "[direction,setDirection]=useState(1)", "[busy,setBusy]=useState(false)"]

Submit/API: ["request(`/inventory/${item.id}/movements`,{method:'POST',body:JSON.stringify({movementType:type,quantity,unitCost,note,adjustmentDirection:direction,createdBy:user.name})})"]

Feedback: ["notify('Stock movement recorded')", "notify(e.message)"]

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [mobile/AdminModules.js:85](../../mobile/AdminModules.js#L85)

## F-M-FinanceEntry — Finance Entry controls

Review daily closing, ledger, purchases, balances and reports through Finance Entry.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Category | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setCategory |
| Description | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setDescription |
| Amount | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setAmount |
| Reference | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setReference |

Defaults/dependencies: ["[type,setType]=useState('expense')", "[category,setCategory]=useState('Purchases')", "[description,setDescription]=useState('')", "[amount,setAmount]=useState('')", "[method,setMethod]=useState('Cash')", "[reference,setReference]=useState('')", "[busy,setBusy]=useState(false)"]

Submit/API: ["request('/finance',{method:'POST',body:JSON.stringify({entryType:type,category,description,amount,paymentMethod:method,entryDate:date,reference,createdBy:user.name})})"]

Feedback: ["notify('Finance entry recorded')", "notify(e.message)"]

Roles: admin; IMPLEMENTED. Evidence: [mobile/AdminModules.js:92](../../mobile/AdminModules.js#L92)

## F-M-PurchaseEditor — Purchase Editor controls

Review daily closing, ledger, purchases, balances and reports through Purchase Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Shop / dealer | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setSupplier |
| Description | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setDescription |
| Invoice number | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setInvoice |
| Total amount | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setTotal |
| Amount paid now | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setPaid |

Defaults/dependencies: ["[supplierName,setSupplier]=useState('')", "[description,setDescription]=useState('')", "[invoiceNumber,setInvoice]=useState('')", "[totalAmount,setTotal]=useState('')", "[paidAmount,setPaid]=useState('0')", "[busy,setBusy]=useState(false)"]

Submit/API: ["request('/supplier-purchases',{method:'POST',body:JSON.stringify({supplierName,description,invoiceNumber,purchaseDate:date,totalAmount,paidAmount,paymentMethod:'Cash',createdBy:user.name})})"]

Feedback: ["notify('Dealer purchase recorded')", "notify(e.message)"]

Roles: admin; IMPLEMENTED. Evidence: [mobile/AdminModules.js:93](../../mobile/AdminModules.js#L93)

## F-M-DealerPayment — Dealer Payment controls

Review daily closing, ledger, purchases, balances and reports through Dealer Payment.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Payment amount | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] setAmount |

Defaults/dependencies: ["[amount,setAmount]=useState(String(purchase.due))", "[method,setMethod]=useState('Cash')", "[busy,setBusy]=useState(false)"]

Submit/API: ["request(`/supplier-purchases/${purchase.id}/payments`,{method:'POST',body:JSON.stringify({amount,paymentDate:date,paymentMethod:method,createdBy:user.name})})"]

Feedback: ["notify('Dealer payment recorded')", "notify(e.message)"]

Roles: admin; IMPLEMENTED. Evidence: [mobile/AdminModules.js:94](../../mobile/AdminModules.js#L94)

## F-M-StaffEditor — Staff Editor controls

Manage login accounts, kitchen roster, compensation fields and shifts through Staff Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Full name | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('name',v) |
| Unique 6-digit PIN | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('pin',v.replace(/\D/g,'').slice(0,6)) |
| Phone | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('phone',v) |
| form.payType==='daily'?'Daily salary amount':'Monthly salary amount' | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('payRate',v) |

Defaults/dependencies: ["[form,setForm]=useState(item?{name:item.name,role:item.role,pin:item.pin,phone:item.phone||'',payType:item.payType,payRate:item.payRate,active:item.active}:{name:'',role:'waiter',pin:'',phone:'',payType:'monthly',payRate:'0',active:true})", "[busy,setBusy]=useState(false)", "[deleteArmed,setDeleteArmed]=useState(false)", "[accounts,setAccounts]=useState([])"]

Submit/API: ["request('/state')", "request(item?`/staff/${item.id}`:'/staff',{method:item?'PUT':'POST',body:JSON.stringify(form)})", "request(`/staff/${item.id}`,{method:'DELETE'})"]

Feedback: ["notify('Staff account saved')", "notify(e.message)", "notify(`${item.name} removed · PIN is available again`)"]

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [mobile/AdminModules.js:97](../../mobile/AdminModules.js#L97)

## F-M-ChefEditor — Chef Editor controls

Manage login accounts, kitchen roster, compensation fields and shifts through Chef Editor.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Full name | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('name',v) |
| Designation | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('designation',v) |
| Specialization | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('specialization',v) |
| Phone | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('phone',v) |
| Joining date (YYYY-MM-DD) | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('joinedOn',v) |
| form.payType==='daily'?'Daily salary amount':'Monthly salary amount' | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('payRate',v) |
| Notes | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('notes',v) |

Defaults/dependencies: ["[form,setForm]=useState(item?{name:item.name,designation:item.designation,phone:item.phone||'',specialization:item.specialization||'',payType:item.payType,payRate:item.payRate,joinedOn:dateKey(item.joinedOn),notes:item.notes||'',active:item.active}:{name:'',designation:'Chef',phone:'',specialization:'',payType:'monthly',payRate:'0',joinedOn:today(),notes:'',active:true})", "[busy,setBusy]=useState(false)"]

Submit/API: ["request(item?`/kitchen-staff/${item.id}`:'/kitchen-staff',{method:item?'PUT':'POST',body:JSON.stringify(form)})"]

Feedback: ["notify('Chef details saved')", "notify(e.message)"]

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [mobile/AdminModules.js:106](../../mobile/AdminModules.js#L106)

## F-M-AdminSettings — Admin Settings controls

Native exposes business name, currency, GST, CGST and service charge. Server billing currently sets charge totals to zero.

| Label / binding | Control | Required evidence | Defaults / limits | Condition | Options / validation handler |
| --- | --- | --- | --- | --- | --- |
| Business name | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('hotelName',v) |
| Currency | text | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('currency',v) |
| GST rate (%) | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('taxRate',v) |
| CGST rate (%) | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('cgstRate',v) |
| Service tax (%) | numeric | No explicit JSX required; consult server validation, not proof optional | {"defaultValue": ""} | [] | [] v=>patch('serviceCharge',v) |

Defaults/dependencies: ["[form,setForm]=useState({...state.settings})", "[busy,setBusy]=useState(false)"]

Submit/API: ["request('/settings',{method:'PUT',body:JSON.stringify(form)})"]

Feedback: ["notify('Business settings saved')", "notify(e.message)"]

Roles: admin; PARTIALLY_IMPLEMENTED. Evidence: [mobile/AdminModules.js:110](../../mobile/AdminModules.js#L110)

## Server validation and submission catalogue

This catalogue provides actual request fields and rejected cases, including controls submitted through parent callbacks. Match the endpoint with the screen API/handler; dynamic endpoint families are not guessed.

| Endpoint | Input fields | Validation/error messages | Evidence |
| --- | --- | --- | --- |
| POST /api/login | pin |  | [backend/src/server.js:59](../../backend/src/server.js#L59) |
| PATCH /api/profile | name, phone, email | Your name is required; Enter a valid email address; Your profile could not be found | [backend/src/server.js:61](../../backend/src/server.js#L61) |
| POST /api/bookings | tableId, bookingDate, bookingTime, durationMinutes, customerPhone | Only Admin can create table bookings; Table, future date, time, 30–240 minute duration, and a valid customer phone are required; Table is not available; Choose a future booking date and time | [backend/src/server.js:62](../../backend/src/server.js#L62) |
| POST /api/orders | items.length, items, tableId, guestName, waiter | Table orders must be created from the Waiter portal; Add at least one food item; Table not found; This table is under cleaning. Mark it Available or Reserved before ordering.; This table already has an active order; This table is locked for a confirmed reservation at the current time; Menu item unavailable | [backend/src/server.js:86](../../backend/src/server.js#L86) |
| POST /api/orders/:id/items | items.length, items | Additional table orders must come from the Waiter portal; Add at least one item; Order not found; This order is already in billing; Menu item unavailable | [backend/src/server.js:87](../../backend/src/server.js#L87) |
| PATCH /api/tables/:id/status | status, bookingTime | Only Admin or Waiter can update tables; Invalid table status; Table not found; Finalize the active bill before changing this table; Create an order to mark this table occupied | [backend/src/server.js:88](../../backend/src/server.js#L88) |
| POST /api/tables | number, seats, area | Admin access required; Table number, seats, and service area are required | [backend/src/server.js:89](../../backend/src/server.js#L89) |
| POST /api/parcels | items.length, items, paymentMethod, customerName, customerPhone, adminName | Parcel orders are created by Admin; Add at least one food item; Invalid payment method; Menu item unavailable | [backend/src/server.js:91](../../backend/src/server.js#L91) |
| POST /api/orders/:id/mark-paid | paymentMethod | Only Admin can record parcel payments; Choose Cash or Card / UPI; Order not found; Advance payment is only available for parcel orders; Parcel is already completed | [backend/src/server.js:92](../../backend/src/server.js#L92) |
| PATCH /api/orders/:id/items/status | status, batchNo | Chef or Juicer access required; Invalid preparation status | [backend/src/server.js:93](../../backend/src/server.js#L93) |
| PATCH /api/orders/:id/batches/:batchNo/handoff | status | Invalid round handoff status; Order not found; Parcel orders use the Admin handoff flow; Kitchen round not found; Wait until every item in this round is ready; The Chef must confirm this round was collected first | [backend/src/server.js:94](../../backend/src/server.js#L94) |
| PATCH /api/orders/:id/status | status | Invalid service handoff status; Order not found; Parcel orders use the Admin handoff flow | [backend/src/server.js:95](../../backend/src/server.js#L95) |
| POST /api/orders/:id/request-bill |  | Billing requests must come from the Waiter portal; Order not found; This order is already completed; Confirm that the order was received at the table first | [backend/src/server.js:96](../../backend/src/server.js#L96) |
| POST /api/orders/:id/finalize | paymentMethod | Only Admin can finalize payments; Order not found; Record Cash or Card / UPI payment before completing this order | [backend/src/server.js:98](../../backend/src/server.js#L98) |
| POST /api/inventory | name, category, quantity, unit, min, cost, createdBy | Admin access required; Name, unit, and valid quantities are required | [backend/src/server.js:99](../../backend/src/server.js#L99) |
| PUT /api/inventory/:id | name, category, unit, min, cost | Admin access required | [backend/src/server.js:100](../../backend/src/server.js#L100) |
| POST /api/inventory/:id/movements | movementType, quantity, adjustmentDirection, unitCost, note, createdBy | Admin access required; Choose a movement type and enter a positive quantity; Stock item not found; Not enough stock for this movement | [backend/src/server.js:101](../../backend/src/server.js#L101) |
| POST /api/stock-requests | inventoryId, requestedQuantity, requestedBy, note | Only Chef can request kitchen stock; Choose an item and enter the quantity required; Stock item not found | [backend/src/server.js:103](../../backend/src/server.js#L103) |
| PATCH /api/stock-requests/:id/status | status | Only Admin can manage stock requests; Invalid stock request status; Stock request not found | [backend/src/server.js:104](../../backend/src/server.js#L104) |
| POST /api/finance | entryType, category, description, amount, paymentMethod, entryDate, reference, createdBy | Admin access required; Type, category, description, amount, and date are required | [backend/src/server.js:105](../../backend/src/server.js#L105) |
| POST /api/supplier-purchases | supplierName, invoiceNumber, description, purchaseDate, totalAmount, paidAmount, paymentMethod, reference, notes, createdBy | Admin access required; Supplier, description, date, valid total, and paid amount are required | [backend/src/server.js:107](../../backend/src/server.js#L107) |
| POST /api/supplier-purchases/:id/payments | amount, paymentDate, paymentMethod, reference, notes, createdBy | Admin access required; A positive payment amount and payment date are required; Supplier purchase not found | [backend/src/server.js:108](../../backend/src/server.js#L108) |
| PUT /api/settings | hotelName, taxRate, cgstRate, serviceCharge, currency |  | [backend/src/server.js:110](../../backend/src/server.js#L110) |
| POST /api/attendance/:id/check-in | notes | This staff account does not belong to this portal; Staff must check in from their own portal; You are already checked in | [backend/src/server.js:113](../../backend/src/server.js#L113) |
| POST /api/attendance/:id/check-out | notes | This staff account does not belong to this portal; Staff must check out from their own portal; You are not currently checked in | [backend/src/server.js:114](../../backend/src/server.js#L114) |
| POST /api/staff | name, role, phone, payType, payRate | Admin access required; Name, role, and Daily/Monthly salary basis are required | [backend/src/server.js:115](../../backend/src/server.js#L115) |
| PUT /api/staff/:id | name, role, pin, phone, payType, payRate, active | Admin access required; Valid role, unique 6-digit PIN, and Daily/Monthly salary basis are required; Staff member not found | [backend/src/server.js:116](../../backend/src/server.js#L116) |
| POST /api/juicer-login | name, phone, payType, payRate | Only the Head Chef can create the Juicer login; Name and salary basis are required; This company already has its single Juicer login. Admin can edit it from Staff Management. | [backend/src/server.js:119](../../backend/src/server.js#L119) |
| POST /api/kitchen-staff | name, designation, phone, specialization, payType, payRate, joinedOn, notes, createdBy | Admin or Head Chef access required; Chef name, designation, and Daily/Monthly salary basis are required | [backend/src/server.js:120](../../backend/src/server.js#L120) |
| PUT /api/kitchen-staff/:id | name, designation, phone, specialization, payType, payRate, joinedOn, notes, active | Admin or Head Chef access required; Chef name, designation, and Daily/Monthly salary basis are required; Kitchen staff member not found | [backend/src/server.js:121](../../backend/src/server.js#L121) |
| POST /api/staff/:id/check-in | notes | Admin access required; Active staff member not found; Staff member is already checked in | [backend/src/server.js:123](../../backend/src/server.js#L123) |
| POST /api/staff/:id/check-out | notes | Admin access required; No active check-in found | [backend/src/server.js:124](../../backend/src/server.js#L124) |
| POST /api/menu | name, category, description, price, icon, available | Admin access required; Name, category, and valid price are required | [backend/src/server.js:125](../../backend/src/server.js#L125) |
| PUT /api/menu/:id | name, category, description, price, icon, available | Admin access required | [backend/src/server.js:126](../../backend/src/server.js#L126) |
| PATCH /api/menu/:id/availability | available | Admin, Head Chef, or Juicer access required; Availability must be true or false; Juicer can only update juice availability; Dish not found | [backend/src/server.js:128](../../backend/src/server.js#L128) |
| POST /api/combos | name, description, price, icon, components | Admin access required; Combo name, price, and at least one item are required; A selected combo item is invalid | [backend/src/server.js:129](../../backend/src/server.js#L129) |
| PUT /api/combos/:id | name, description, price, icon, components | Admin access required | [backend/src/server.js:130](../../backend/src/server.js#L130) |
| POST /api/menu/:id/image |  | Please select an image file; Menu item not found | [backend/src/server.js:131](../../backend/src/server.js#L131) |
| POST /api/reports | filename, content, contentType | Report filename and content are required | [backend/src/server.js:133](../../backend/src/server.js#L133) |
| POST /api/public/company-registrations | companyName, adminName, email, phone, packageCode, periodMonths | Enter valid business details, package, and subscription period; This hotel/business name is already registered; An active application already uses this business name or email; Sent for approval. Your temporary onboarding PIN has been queued to your email and mobile. | [backend/src/master-server.js:210](../../backend/src/master-server.js#L210) |
| POST /api/public/resolve-login | hotelId, pin | Invalid Super Admin or temporary onboarding PIN. Hotel staff must enter their Hotel ID.; Invalid Master Hotel ID or PIN; Enter your 4-digit Hotel ID and 6-digit PIN; Invalid Hotel ID, PIN, or inactive account | [backend/src/master-server.js:211](../../backend/src/master-server.js#L211) |
| POST /api/public/onboarding-status | id, pin | Temporary onboarding session is invalid | [backend/src/master-server.js:212](../../backend/src/master-server.js#L212) |
| POST /api/public/complete-registration | pin, id, paymentReference, businessType, address, gstNumber | Temporary onboarding session is invalid; Master approval is required before completing registration; A valid payment reference is required; Business type and address are required | [backend/src/master-server.js:213](../../backend/src/master-server.js#L213) |
| POST /api/login | pin | Invalid KnockOUT Master PIN | [backend/src/master-server.js:214](../../backend/src/master-server.js#L214) |
| POST /api/companies | companyName, adminName, email, phone, selectedModules |  | [backend/src/master-server.js:216](../../backend/src/master-server.js#L216) |
| POST /api/company-registrations/:id/approve | reviewNote | Registration request not found | [backend/src/master-server.js:217](../../backend/src/master-server.js#L217) |
| PATCH /api/companies/:id/modules | module, enabled | Invalid module setting; Company not found | [backend/src/master-server.js:218](../../backend/src/master-server.js#L218) |
| PATCH /api/saas-invoices/:id/status | status | Invalid invoice status; Invoice not found | [backend/src/master-server.js:219](../../backend/src/master-server.js#L219) |
| POST /api/company-registrations/:id/reject | reviewNote | Registration request is missing or already reviewed | [backend/src/master-server.js:220](../../backend/src/master-server.js#L220) |
| PATCH /api/companies/:id/status | status | Invalid company status; Company not found | [backend/src/master-server.js:221](../../backend/src/master-server.js#L221) |
| PATCH /api/companies/:companyId/users/:userId/pin | pin | PIN must contain exactly 6 digits; Company not found; User not found | [backend/src/master-server.js:222](../../backend/src/master-server.js#L222) |
| PATCH /api/master-users/:userId/pin | pin | PIN must contain exactly 6 digits; Master user not found | [backend/src/master-server.js:223](../../backend/src/master-server.js#L223) |
| PATCH /api/module-pricing/:key | price | Enter a valid module price | [backend/src/master-server.js:226](../../backend/src/master-server.js#L226) |
| POST /api/reports | filename, content, contentType | Report filename and content are required | [backend/src/master-server.js:227](../../backend/src/master-server.js#L227) |

## Form complexity findings

Combo composition, staff identity/pay/PIN and supplier purchase/payment forms mix multiple concepts. Grouping and progressive disclosure are recommendations, not current behavior. Payment-choice buttons, availability toggles, cart steppers and confirmation dialogs are also controls; their handlers are in the action catalogue even when no HTML input is present. Native PurchaseEditor records initial payment as Cash without a payment-method selector.

Evidence: [frontend/src/App.jsx:2102](../../frontend/src/App.jsx#L2102); [frontend/src/App.jsx:4680](../../frontend/src/App.jsx#L4680); [frontend/src/App.jsx:4164](../../frontend/src/App.jsx#L4164); [mobile/AdminModules.js:93](../../mobile/AdminModules.js#L93)

## Legacy prototype forms — FRONTEND_ONLY

Root app local-only forms: table editor/add table (name/seats/floor and state), reservation (guest name, available table, time default 20:00), cart/table choice, stock adjustment (new numeric quantity), new inventory (name, SKU, category, quantity, unit cost, supplier), business settings (name, GST identifier, phone, email, address, tax rate, service rate). They mutate localStorage, show toast feedback and close local modals; they do not validate against current server permissions or schemas. Prototype checkout immediately displays payment successful, with no gateway.

Evidence: [app.js:74](../../app.js#L74), [app.js:75](../../app.js#L75), [app.js:76](../../app.js#L76), [app.js:77](../../app.js#L77), [app.js:78](../../app.js#L78), [app.js:79](../../app.js#L79), [app.js:81](../../app.js#L81).
