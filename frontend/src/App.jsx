import LandingStory from "./LandingStory";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  Armchair,
  Package,
  ReceiptText,
  Users,
  LogOut,
  Bell,
  Search,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  X,
  ArrowRight,
  CalendarDays,
  Settings,
  TrendingUp,
  CreditCard,
  Banknote,
  Printer,
  Trash2,
  Building2,
  Wallet,
  ArrowDownUp,
  Boxes,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Gauge,
  PieChart,
  CupSoda,
} from "lucide-react";
import { api, apiForm, resolvePortalLogin, submitCompanyRegistration, getOnboardingStatus, completeCompanyRegistration, saveReport } from "./api";
import AttendancePanel from "./AttendancePanel";

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
const exportCsv = (name, rows) => {
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`,
    csv = rows.map((row) => row.map(escape).join(",")).join("\n"),
    blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
  saveReport(name,"\ufeff"+csv).catch(error=>console.error("Report storage failed",error));
};
const elapsed = (iso) =>
  `${Math.max(1, Math.floor((Date.now() - new Date(iso)) / 60000))} min`;
function useLiveUpdates(enabled, database, onChange) {
  useEffect(() => {
    if (!enabled || !database) return;
    let socket, retryTimer, refreshTimer, stopped = false, retries = 0;
    const scheduleRefresh = (message) => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => onChange(message), 80);
    };
    const connect = () => {
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      const token = sessionStorage.getItem("knockout-access-token") || "";
      socket = new WebSocket(`${protocol}//${location.host}/ws?database=${encodeURIComponent(database)}&token=${encodeURIComponent(token)}`);
      socket.onopen = () => { retries = 0; };
      socket.onmessage = (event) => {
        try { const message = JSON.parse(event.data); if (message.type === "state.changed") scheduleRefresh(message); } catch {}
      };
      socket.onclose = () => {
        if (!stopped) retryTimer = setTimeout(connect, Math.min(1000 * 2 ** retries++, 15000));
      };
    };
    connect();
    const fallback = setInterval(() => onChange(), 120000);
    return () => { stopped = true; clearTimeout(retryTimer); clearTimeout(refreshTimer); clearInterval(fallback); socket?.close(); };
  }, [enabled, database, onChange]);
}
export default function App() {
  const portalRole = import.meta.env.VITE_PORTAL_ROLE || "admin";
  return portalRole === "superadmin" ? (
    <SuperAdminApp />
  ) : (
    <CompanyApp portalRole={portalRole} />
  );
}
function CompanyApp() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("knockout-portal-user") || "null",
      );
    } catch {
      return null;
    }
  });
  const [data, setData] = useState(null),
    [notice, setNotice] = useState("");
  const refresh = useCallback(() =>
    Promise.all([api("/state"), api("/session")])
      .then(([state, session]) => {
        setData(state);
        setUser((current) => {
          if (!current) return current;
          const updated = {...current, modules: session.modules};
          sessionStorage.setItem("knockout-portal-user", JSON.stringify(updated));
          return updated;
        });
      })
      .catch((e) => setNotice(e.message)), []);
  useEffect(() => {
    if (user && !["superadmin","applicant"].includes(user.role)) {
      refresh();
    }
  }, [user?.id, user?.role, refresh]);
  const handleLiveChange = useCallback((message) => {
    if (message?.resource === "company.modules" && message.modules) {
      setUser((current) => {
        if (!current) return current;
        const updated = {...current, modules: message.modules};
        sessionStorage.setItem("knockout-portal-user", JSON.stringify(updated));
        return updated;
      });
      if ((user?.role === "chef" && message.modules.kitchen === false) || (user?.role === "juicer" && message.modules.juicer === false)) {
        window.dispatchEvent(new CustomEvent("knockout:session-revoked", {detail:{message:"This portal was disabled by KnockOUT Master."}}));
        return;
      }
    }
    refresh();
  }, [refresh, user?.role]);
  useLiveUpdates(Boolean(user && !["superadmin","applicant"].includes(user.role)), user?.companyDatabase || "knockout", handleLiveChange);
  const login = (u) => {
    if(u.companyDatabase)localStorage.setItem("knockout-company-db", u.companyDatabase);
    localStorage.setItem("knockout-portal-role", u.role);
    sessionStorage.setItem("knockout-portal-user", JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    sessionStorage.removeItem("knockout-portal-user");
    sessionStorage.removeItem("knockout-access-token");
    setUser(null);
    setData(null);
  };
  useEffect(() => {
    const revoke = (event) => {
      logout();
      setNotice(event.detail?.message || "Your company access has been disabled.");
    };
    window.addEventListener("knockout:session-revoked", revoke);
    return () => window.removeEventListener("knockout:session-revoked", revoke);
  }, []);
  useEffect(() => {
    const updateProfile = (event) => setUser(event.detail);
    window.addEventListener("knockout:profile-updated", updateProfile);
    return () => window.removeEventListener("knockout:profile-updated", updateProfile);
  }, []);
  const toast = (m) => {
    setNotice(m);
    setTimeout(() => setNotice(""), 2800);
  };
  if (!user) return <Login onLogin={login} />;
  if (user.role === "applicant") return <ApplicantOnboarding user={user} logout={logout}/>;
  if (user.role === "superadmin")
    return <SuperAdminApp authenticatedUser={user} onLogout={logout} />;
  if (!data)
    return (
      <div className="loading">
        <span className="logo">K</span>
        <p>Opening your portal…</p>
      </div>
    );
  return (
    <>
      {user.role === "admin" ? (
        <Admin
          data={data}
          refresh={refresh}
          user={user}
          logout={logout}
          toast={toast}
        />
      ) : user.role === "waiter" ? (
        <Waiter
          data={data}
          refresh={refresh}
          user={user}
          logout={logout}
          toast={toast}
        />
      ) : user.role === "chef" ? (
        <Chef
          data={data}
          refresh={refresh}
          user={user}
          logout={logout}
          toast={toast}
        />
      ) : (
        <Juicer data={data} refresh={refresh} user={user} logout={logout} toast={toast} />
      )}
      <div className={`toast ${notice ? "show" : ""}`}>{notice}</div>
    </>
  );
}

function PublicLanding(props) { return <LandingStory {...props}/>; }

function Login({ onLogin }) {
  const routeFromPath = () => location.pathname === "/login" ? "login" : location.pathname === "/register" ? "register" : "landing";
  const [mode,setMode]=useState(routeFromPath),[hotelId,setHotelId]=useState(""),[pin, setPin] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [verified, setVerified] = useState(false),
    input = useRef(null);
  useEffect(() => {
    if(mode==="login")input.current?.focus();
  }, [mode]);
  useEffect(() => {
    const update = () => setMode(routeFromPath());
    addEventListener("popstate", update);
    return () => removeEventListener("popstate", update);
  }, []);
  useEffect(() => {
    if (hotelId.length === 4 && pin.length === 6 && !busy) { submit(); return; }
    if (!hotelId && pin.length >= 4 && pin.length <= 6 && !busy) {
      const timer = setTimeout(() => submit(), 550);
      return () => clearTimeout(timer);
    }
  }, [hotelId, pin]);
  async function submit(e) {
    e?.preventDefault();
    const masterAttempt = !hotelId && pin.length >= 4 && pin.length <= 6;
    if ((!masterAttempt && (hotelId.length !== 4 || pin.length !== 6)) || busy) return;
    setBusy(true);
    setError("");
    try {
      const user = await resolvePortalLogin(hotelId, pin);
      setVerified(true);
      setTimeout(() => { history.replaceState({}, "", "/"); onLogin(user); }, 500);
    } catch (e) {
      if (!hotelId && pin.length < 6) return;
      setError(e.message);
      setPin("");
      setTimeout(() => input.current?.focus(), 100);
    } finally {
      setBusy(false);
    }
  }
  function navigate(next) {
    const path = next === "login" ? "/login" : next === "register" ? "/register" : "/";
    history.pushState({}, "", path);
    setMode(next);
  }
  if(mode==="landing")return <PublicLanding login={()=>navigate("login")} register={()=>navigate("register")}/>;
  if(mode==="register")return <PublicCompanyRegistration back={()=>navigate("landing")}/>;
  return (
    <main className="web-auth otp-entry">
      <header className="otp-web-brand">
        <span className="logo">K</span>
        <b>KnockOUT</b>
        <small>UNIVERSAL ACCESS · ONE APPLICATION</small>
      </header>
      <section className={`web-otp-card ${verified ? "verified" : ""}`}>
        <i />
        <div className="otp-premium-mark"><span>K</span><div><b>KnockOUT Access</b><small>Secure multi-tenant gateway</small></div><em>ENCRYPTED</em></div>
        <span className="eyebrow">SAAS HOTEL ACCESS</span>
        <h1>{verified ? "Access verified" : "Enter Hotel ID & PIN"}</h1>
        <p>
          {verified
            ? "Opening your correct workspace…"
            : "Your Hotel ID selects the correct company. Your PIN opens your assigned portal."}
        </p>
        <label className="hotel-id-field"><span>4-DIGIT HOTEL ID <em>NOT REQUIRED FOR SUPER ADMIN</em></span><input value={hotelId} onChange={(e)=>setHotelId(e.target.value.replace(/\D/g,"").slice(0,4))} inputMode="numeric" maxLength="4" placeholder="Hotel staff: 1234" autoFocus/></label>
        <div
          className="web-otp-grid six-digit"
          onClick={() => input.current?.focus()}
        >
          {[0, 1, 2, 3, 4, 5].map((_, index) => (
            <span
              key={index}
              className={`${pin.length === index ? "active" : ""} ${pin.length > index ? "filled" : ""}`}
            >
              <b>{pin[index] || ""}</b>
              {pin.length === index && !verified ? <u /> : null}
            </span>
          ))}
        </div>
        <input
          ref={input}
          className="web-otp-input"
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength="6"
        />
        {busy ? <div className="otp-spinner" /> : null}
        {error ? <div className="web-otp-error">{error}</div> : null}
        <small className="otp-demo">
          Super Admin: enter only your Master PIN. Hotel staff: enter Hotel ID and six-digit PIN.
        </small>
      </section>
    </main>
  );
}

function PublicCompanyRegistration({ back }) {
  const[form,setForm]=useState({companyName:"",adminName:"",email:"",phone:"",packageCode:"starter",periodMonths:1}),[busy,setBusy]=useState(false),[error,setError]=useState(""),[submitted,setSubmitted]=useState(null);
  async function submit(event){event.preventDefault();setBusy(true);setError("");try{setSubmitted(await submitCompanyRegistration(form))}catch(err){setError(err.message)}finally{setBusy(false)}}
  const plans={starter:{name:"Starter",copy:"Tables, billing, menu and kitchen"},growth:{name:"Growth",copy:"Adds bookings, parcels and stock"},complete:{name:"Complete",copy:"Every KnockOUT module"}};
  return <main className="web-auth public-registration-page"><header className="otp-web-brand"><span className="logo">K</span><b>KnockOUT</b><small>NEW TENANT APPLICATION</small></header><section className="public-registration-card">{submitted?<div className="registration-success"><span><CheckCircle2/></span><span className="eyebrow">APPLICATION #{submitted.id}</span><h1>Sent for approval</h1><p>Your request is saved in the Master waiting list. We sent a temporary onboarding PIN to your email and mobile. Use it <b>without a Hotel ID</b> to follow approval and finish setup.</p><div className="temporary-pin-card"><small>TEMPORARY ONBOARDING PIN</small><strong>{submitted.temporaryPin}</strong><span>Development preview · delivery is recorded in the notification outbox</span></div><button className="primary wide" onClick={()=>{history.pushState({},"","/login");location.reload()}}>Continue to temporary login</button><button className="secondary wide" onClick={back}>Return to landing page</button></div>:<><button className="web-back registration-back" onClick={back}><ChevronLeft/>Back to landing page</button><span className="eyebrow">TENANT REGISTRATION · STEP 1</span><h1>Choose how your business runs</h1><p>Tell us who you are, select a package and subscription period. No tenant database is created until approval, completed setup and payment.</p><form className="public-registration-form" onSubmit={submit}><label>HOTEL / BUSINESS NAME<input value={form.companyName} onChange={(e)=>setForm({...form,companyName:e.target.value})} placeholder="Example: Grand Palm Café" required/></label><label>ADMINISTRATOR NAME<input value={form.adminName} onChange={(e)=>setForm({...form,adminName:e.target.value})} placeholder="Full name" required/></label><label>ADMIN EMAIL<input type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="admin@business.com" required/></label><label>PHONE NUMBER<input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="9876543210" inputMode="tel" required/></label><fieldset className="registration-packages full"><legend>SELECT PACKAGE</legend>{Object.entries(plans).map(([key,plan])=><button type="button" key={key} className={form.packageCode===key?"selected":""} onClick={()=>setForm({...form,packageCode:key})}><b>{plan.name}</b><small>{plan.copy}</small>{form.packageCode===key?<CheckCircle2/>:null}</button>)}</fieldset><fieldset className="registration-period full"><legend>SUBSCRIPTION PERIOD</legend>{[[1,"1 month"],[6,"6 months · 5% saving"],[12,"1 year · 10% saving"]].map(([months,label])=><button type="button" key={months} className={form.periodMonths===months?"selected":""} onClick={()=>setForm({...form,periodMonths:months})}>{label}</button>)}</fieldset><div className="registration-process full"><span><b>1</b>Waiting list</span><i/><span><b>2</b>Master approval</span><i/><span><b>3</b>Setup & payment</span><i/><span><b>4</b>Workspace</span></div>{error?<div className="form-error full">{error}</div>:null}<button className="primary wide full" disabled={busy}>{busy?"Sending application…":"Submit for approval"}</button></form></>}</section></main>;
}

function ApplicantOnboarding({user,logout}){
  const[status,setStatus]=useState(null),[form,setForm]=useState({businessType:"Restaurant",address:"",gstNumber:"",paymentReference:""}),[busy,setBusy]=useState(false),[error,setError]=useState(""),[complete,setComplete]=useState(null);
  const moduleNames={tables:"Tables & Waiters",bookings:"Table Bookings",billing:"Orders & Billing",parcels:"Parcel Orders",menu:"Food & Photos",stock:"Stock Management",finance:"Finance Management",staff:"Staff Management",kitchen:"Chef Portal",juicer:"Juicer Portal"};
  const refresh=useCallback(()=>getOnboardingStatus(user.id,user.temporaryPin).then(setStatus).catch(err=>setError(err.message)),[user.id,user.temporaryPin]);
  useEffect(()=>{refresh();const timer=setInterval(refresh,10000);return()=>clearInterval(timer)},[refresh]);
  async function finish(event){event.preventDefault();setBusy(true);setError("");try{setComplete(await completeCompanyRegistration({...form,id:user.id,pin:user.temporaryPin}))}catch(err){setError(err.message)}finally{setBusy(false)}}
  if(complete)return <main className="web-auth public-registration-page"><section className="public-registration-card registration-success"><span><CheckCircle2/></span><span className="eyebrow">WORKSPACE ACTIVATED</span><h1>Welcome to KnockOUT</h1><p>Your isolated tenant database and first Administrator account have now been created.</p><div className="credential-result"><span>HOTEL ID <b>{complete.hotelId}</b></span><span>NEW ADMIN PIN <b>{complete.adminPin}</b></span></div><p>Permanent credentials were queued to your email and mobile. Your temporary PIN is now disabled.</p><button className="primary wide" onClick={logout}>Login with permanent credentials</button></section></main>;
  return <main className="web-auth public-registration-page"><header className="otp-web-brand"><span className="logo">K</span><b>KnockOUT</b><small>SECURE ONBOARDING</small></header><section className="public-registration-card onboarding-card">{!status?<div className="approval-wait"><span className="otp-spinner"/><h1>Opening your application</h1>{error?<div className="form-error">{error}</div>:null}</div>:status.status==='pending'?<div className="approval-wait applicant-waiting-view"><span className="approval-pulse"><Clock3/></span><span className="eyebrow">APPLICATION #{user.id}</span><h1>Waiting for approval</h1><p>Your application has reached KnockOUT Master. This page updates automatically after it is reviewed.</p><div className="applicant-details"><span><small>BUSINESS</small><b>{status.companyName}</b></span><span><small>ADMINISTRATOR</small><b>{status.adminName}</b></span><span><small>EMAIL</small><b>{status.email}</b></span><span><small>MOBILE</small><b>{status.phone}</b></span><span><small>PACKAGE</small><b>{status.packageCode}</b></span><span><small>SUBSCRIPTION</small><b>{status.periodMonths} month{status.periodMonths>1?'s':''}</b></span></div><div className="applicant-module-list"><small>SELECTED MODULES</small><div>{(status.selectedModules||[]).map(key=><span key={key}><CheckCircle2/>{moduleNames[key]||key}</span>)}</div></div>{error?<div className="form-error">{error}</div>:null}</div>:status.status==='rejected'?<div className="approval-wait"><AlertTriangle/><h1>Application not approved</h1><p>{status.reviewNote||"Contact KnockOUT support for more information."}</p></div>:<><button className="web-back registration-back" onClick={logout}><ChevronLeft/>Exit onboarding</button><span className="eyebrow">APPROVED · COMPLETE REGISTRATION</span><h1>Set up {status.companyName}</h1><p>Complete the company profile and confirm payment. Your tenant database is created only after this step succeeds.</p><div className="onboarding-summary"><span><small>PACKAGE</small><b>{status.packageCode}</b></span><span><small>PERIOD</small><b>{status.periodMonths} month{status.periodMonths>1?'s':''}</b></span><span><small>MODULES</small><b>{status.selectedModules.length}</b></span><span><small>TOTAL WITH GST</small><b>{money(status.total)}</b></span></div><form className="public-registration-form" onSubmit={finish}><label>BUSINESS TYPE<select value={form.businessType} onChange={e=>setForm({...form,businessType:e.target.value})}><option>Restaurant</option><option>Café</option><option>Hotel</option><option>Cloud Kitchen</option><option>Food Court</option></select></label><label>GST NUMBER (OPTIONAL)<input value={form.gstNumber} onChange={e=>setForm({...form,gstNumber:e.target.value})}/></label><label className="full">BUSINESS ADDRESS<textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})} required/></label><label className="full">PAYMENT REFERENCE<input value={form.paymentReference} onChange={e=>setForm({...form,paymentReference:e.target.value})} placeholder="Transaction / payment reference" required/><small>Payment gateway reference confirms the selected package purchase.</small></label>{error?<div className="form-error full">{error}</div>:null}<button className="primary wide full" disabled={busy}>{busy?"Creating secure workspace…":`Pay ${money(status.total)} & activate workspace`}</button></form></>}</section></main>;
}

function SuperAdminApp({ authenticatedUser = null, onLogout = null }) {
  const [user, setUser] = useState(
      () =>
        authenticatedUser ||
        (() => {
          try {
            return JSON.parse(
              sessionStorage.getItem("knockout-master-user") || "null",
            );
          } catch {
            return null;
          }
        })(),
    ),
    [data, setData] = useState(null),
    [masterAction, setMasterAction] = useState(null),
    [pinUser, setPinUser] = useState(null),
    [selectedCompanyId, setSelectedCompanyId] = useState(null),
    [selectedRegistrationId,setSelectedRegistrationId]=useState(null),
    [companySection, setCompanySection] = useState("overview"),
    [companySearch, setCompanySearch] = useState(""),
    [companyFilter, setCompanyFilter] = useState("all"),
    [reviewBusy,setReviewBusy]=useState(null),
    [actionBusy, setActionBusy] = useState(false),
    [notice, setNotice] = useState("");
  const refresh = useCallback(
    () =>
      api("/state")
        .then(setData)
        .catch((e) => setNotice(e.message)),
    [],
  );
  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, refresh]);
  useLiveUpdates(Boolean(user), "master", refresh);
  const toast = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3500);
  };
  async function status(company) {
    try {
      await api(`/companies/${company.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: company.status === "active" ? "suspended" : "active",
        }),
      });
      await refresh();
      toast(
        `${company.companyName} ${company.status === "active" ? "suspended" : "activated"}`,
      );
    } catch (e) {
      toast(e.message);
    }
  }
  async function toggleModule(company, module, enabled) {
    try {
      await api(`/companies/${company.id}/modules`, {method:"PATCH",body:JSON.stringify({module,enabled})});
      await refresh();
      toast(`${module} module ${enabled ? "enabled" : "disabled"} for ${company.companyName}`);
    } catch (e) { toast(e.message); }
  }
  async function setInvoiceStatus(invoice, status) {
    try {
      await api(`/saas-invoices/${invoice.id}/status`, {method:"PATCH",body:JSON.stringify({status})});
      await refresh();
      toast(`${invoice.companyName} invoice marked ${status}`);
    } catch (e) { toast(e.message); }
  }
  async function confirmMasterAction(typed = "") {
    const action = masterAction;
    if (!action || actionBusy) return;
    setActionBusy(true);
    try {
      {
        await api(`/companies/${action.company.id}`, {
          method: "DELETE",
          body: JSON.stringify({ companyName: typed }),
        });
        toast(`${action.company.companyName} and its database were deleted`);
      }
      setMasterAction(null);
      await refresh();
    } catch (e) {
      toast(e.message);
    } finally {
      setActionBusy(false);
    }
  }
  async function reviewRegistration(request,status){setReviewBusy(request.id);try{await api(`/company-registrations/${request.id}/${status}`,{method:"POST",body:JSON.stringify({reviewNote:status==="reject"?"Application declined by KnockOUT Master":"Approved by KnockOUT Master"})});await refresh();toast(status==="approve"?`${request.companyName} approved · applicant can now complete setup and payment`:`${request.companyName} registration rejected`)}catch(error){toast(error.message)}finally{setReviewBusy(null)}}
  if (!user)
    return (
      <MasterLogin
        login={(value) => {
          if(value.accessToken)sessionStorage.setItem("knockout-access-token",value.accessToken);
          sessionStorage.setItem("knockout-master-user", JSON.stringify(value));
          setUser(value);
        }}
      />
    );
  if (!data)
    return (
      <div className="loading">
        <span className="logo">K</span>
        <p>Opening KnockOUT Master…</p>
      </div>
    );
  const companies = data.companies || [],
    registrationRequests=data.registrationRequests||[],pendingRegistrations=registrationRequests.filter((request)=>request.status==="pending"),
    selectedRegistration=registrationRequests.find(request=>request.id===selectedRegistrationId)||null,
    selectedCompany = companies.find((company) => company.id === selectedCompanyId) || null,
    visibleCompanies = companies.filter((company) => {
      const matchesStatus = companyFilter === "all" || company.status === companyFilter || (companyFilter === "attention" && (!company.online || company.lowStock > 0));
      const query = companySearch.trim().toLowerCase();
      return matchesStatus && (!query || [company.companyName, company.databaseName, company.adminName].some((value) => String(value || "").toLowerCase().includes(query)));
    });
  const logoutMaster = () => {
    sessionStorage.removeItem("knockout-master-user");
    sessionStorage.removeItem("knockout-access-token");
    if (onLogout) onLogout();
    else setUser(null);
  };
  return (
    <div className="master-shell">
      <aside>
        <div className="brand">
          <span className="logo">K</span>
          <div>
            <b>KnockOUT</b>
            <small>MASTER CONTROL</small>
          </div>
        </div>
        <nav>
          <button className={!selectedCompany&&!selectedRegistration ? "active" : ""} onClick={() => { setSelectedCompanyId(null);setSelectedRegistrationId(null); setCompanySection("overview"); }}>
            <LayoutDashboard size={18} />
            Companies
          </button>
          <div className="master-company-nav">
            <small>COMPANY USERS</small>
            {companies.map((company) => <button key={company.id} className={selectedCompany?.id === company.id ? "active" : ""} onClick={() => { setSelectedRegistrationId(null);setSelectedCompanyId(company.id); setCompanySection("overview"); }}><Building2 size={17}/><span>{company.companyName}<small>{company.staffCount} users</small></span></button>)}
          </div>
        </nav>
      </aside>
      <main>
        <header>
          <div>
            <span className="eyebrow">MULTI-COMPANY CONTROL</span>
            <h2>KnockOUT Master</h2>
          </div>
          <div className="master-header-actions">
            <button className="master-pending-counter" onClick={()=>{setSelectedCompanyId(null);setSelectedRegistrationId(pendingRegistrations[0]?.id||null)}}><Bell size={15}/><span><b>{pendingRegistrations.length}</b><small>Pending registrations</small></span></button>
            <div className="header-user">
              <span className="header-avatar">KM</span>
              <span className="header-user-copy"><b>KnockOUT Master</b><small>Super Admin</small></span>
              <button onClick={logoutMaster} title="Logout"><LogOut size={17}/></button>
            </div>
          </div>
        </header>
        <div className="page">
          {selectedRegistration ? <MasterRegistrationDetail request={selectedRegistration} busy={reviewBusy} review={reviewRegistration} back={()=>setSelectedRegistrationId(null)}/> : selectedCompany ? <>
            <PageHead kicker="COMPANY WORKSPACE" title={selectedCompany.companyName} sub={`All details and controls for the isolated ${selectedCompany.databaseName} database.`} action={<button className="secondary" onClick={() => setSelectedCompanyId(null)}><ChevronLeft size={15}/> All companies</button>}/>
            <div className="company-detail-tabs"><div>{[["overview","Overview",LayoutDashboard],["users","Users",Users],["revenue","SaaS Billing",CreditCard],["controls","Controls",Settings]].map(([id,label,Icon])=><button key={id} className={companySection===id?"active":""} onClick={()=>setCompanySection(id)}><Icon size={15}/>{label}{id==="users"?<b>{selectedCompany.users?.length||0}</b>:null}</button>)}</div><span><i className={selectedCompany.online ? "online" : ""}/>{selectedCompany.online ? "Database online" : "Database unavailable"}</span></div>
            {companySection === "overview" ? <CompanyWorkspaceOverview company={selectedCompany} invoice={(data.invoices||[]).find((invoice)=>invoice.companyId===selectedCompany.id)} subscription={(data.subscriptions||[]).find((item)=>item.companyId===selectedCompany.id)} usage={(data.usage||[]).find((item)=>item.companyId===selectedCompany.id)} openUsers={()=>setCompanySection("users")} openRevenue={()=>setCompanySection("revenue")}/> : null}
            {companySection === "users" ? <MasterUsers company={selectedCompany} changePin={setPinUser}/> : null}
            {companySection === "revenue" ? <MasterBilling invoices={(data.invoices||[]).filter((invoice)=>invoice.companyId===selectedCompany.id)} companies={[selectedCompany]} setStatus={setInvoiceStatus}/> : null}
            {companySection === "controls" ? <CompanyControls company={selectedCompany} status={status} toggleModule={toggleModule} setMasterAction={setMasterAction}/> : null}
          </> : <>
          <PageHead kicker="EXECUTIVE COMMAND" title="Company Network" sub="A live operational view of every company in the KnockOUT group." />
          <MasterRegistrationRequests requests={registrationRequests} open={request=>setSelectedRegistrationId(request.id)}/>
          <MasterNetworkOverview companies={companies} invoices={data.invoices||[]} usage={data.usage||[]}/>
          <div className="master-directory-toolbar">
            <div><span className="eyebrow">COMPANY DIRECTORY</span><b>{visibleCompanies.length} of {companies.length} companies</b></div>
            <label><Search size={15}/><input value={companySearch} onChange={(event)=>setCompanySearch(event.target.value)} placeholder="Search company, database or admin"/></label>
            <div className="master-filter-chips">{[["all","All"],["active","Active"],["suspended","Suspended"],["attention","Needs attention"]].map(([id,label])=><button key={id} className={companyFilter===id?"active":""} onClick={()=>setCompanyFilter(id)}>{label}</button>)}</div>
          </div>
          <div className="company-grid">
            {visibleCompanies.map((company) => (
              <article
                className={`company-card ${company.status}`}
                key={company.id}
              >
                <header>
                  <span>
                    <Building2 size={19} />
                  </span>
                  <Status status={company.status} />
                </header>
                <h2>{company.companyName}</h2>
                <code>CY-DB · {company.cyDb||company.databaseName}</code>
                <p>{company.adminName} · {company.staffCount} active users</p>
                <div className="company-card-metrics"><span><b>{money((data.invoices||[]).find((invoice)=>invoice.companyId===company.id)?.total||0)}</b><small>Monthly SaaS bill</small></span><span><b>{company.activeOrders}</b><small>Live orders</small></span><span className={company.lowStock?"warning":""}><b>{company.lowStock}</b><small>Low stock</small></span></div>
                <footer className="company-health"><span><i className={company.online?"online":""}/>{company.online?"Database online":"Database offline"}</span><small>{(data.usage||[]).find(item=>item.companyId===company.id)?.totalLogins||0} logins tracked</small></footer>
                <button className="company-users-button" onClick={() => { setSelectedRegistrationId(null);setSelectedCompanyId(company.id); setCompanySection("overview"); }}><LayoutDashboard size={15}/><span>Open company workspace<small>All details and controls</small></span><ArrowRight size={16}/></button>
              </article>
            ))}
          </div>
          {!visibleCompanies.length?<div className="master-directory-empty"><Search/><b>No companies found</b><small>Change the search or status filter.</small></div>:null}
          <MasterBilling invoices={data.invoices||[]} companies={companies} setStatus={setInvoiceStatus}/>
          </>}
        </div>
        <footer className="powered-by-knockout">Powered by <b>KnockOUT</b></footer>
      </main>
      {masterAction ? (
        <MasterActionModal
          action={masterAction}
          busy={actionBusy}
          close={() => !actionBusy && setMasterAction(null)}
          confirm={confirmMasterAction}
        />
      ) : null}
      {pinUser ? (
        <MasterPinModal
          entry={pinUser}
          close={() => setPinUser(null)}
          refresh={refresh}
          toast={toast}
        />
      ) : null}
      <div className={`toast ${notice ? "show" : ""}`}>{notice}</div>
    </div>
  );
}

function MasterRegistrationRequests({ requests,open }) {
  const pending=requests.filter((request)=>request.status==="pending"),history=requests.filter((request)=>request.status!=="pending").slice(0,5);
  return <section className="panel master-registration-queue"><header><div><span className="eyebrow">MASTER APPROVAL REQUIRED</span><h2>Tenant waiting list</h2><p>Select an application to open its complete review page.</p></div><span className={pending.length?"has-pending":""}><b>{pending.length}</b><small>Awaiting review</small></span></header>{pending.length?<div className="registration-request-list">{pending.map((request)=><button className="registration-request-row" key={request.id} onClick={()=>open(request)}><span className="registration-company-icon"><Building2/></span><span><h3>{request.companyName}</h3><code>{request.packageCode} · {request.periodMonths} month{request.periodMonths>1?'s':''}</code><p>Requested {new Date(request.createdAt).toLocaleString("en-IN")}</p></span><span className="registration-admin-details"><small>FIRST ADMINISTRATOR</small><b>{request.adminName}</b><span>{request.email} · {request.phone}</span></span><span className="registration-open-action">Review details<ArrowRight/></span></button>)}</div>:<div className="registration-empty"><CheckCircle2/><span><b>No registrations awaiting approval</b><small>New public applications appear here automatically.</small></span></div>}{history.length?<details><summary>Recent decisions ({history.length})</summary><div className="registration-history">{history.map((request)=><button key={request.id} onClick={()=>open(request)}><Status status={request.status}/><b>{request.companyName}</b><small>{request.packageCode} · {request.completedAt?'Registration complete':request.status==='approved'?'Waiting for setup/payment':'Reviewed'}</small></button>)}</div></details>:null}</section>;
}

function MasterRegistrationDetail({request,busy,review,back}){
  const names={tables:"Tables & Waiters",bookings:"Table Bookings",billing:"Orders & Billing",parcels:"Parcel Orders",menu:"Food & Photos",stock:"Stock Management",finance:"Finance Management",staff:"Staff Management",kitchen:"Chef Portal",juicer:"Juicer Portal"};
  return <div className="registration-detail-page"><PageHead kicker="TENANT APPLICATION" title={request.companyName} sub={`Application #${request.id} · submitted ${new Date(request.createdAt).toLocaleString('en-IN')}`} action={<button className="secondary" onClick={back}><ChevronLeft/>Waiting list</button>}/><section className="panel registration-detail-card"><header><div><span className="registration-company-icon"><Building2/></span><div><small>APPLICATION STATUS</small><Status status={request.status}/></div></div><span>{request.periodMonths} month subscription</span></header><div className="registration-detail-grid"><article><small>BUSINESS DETAILS</small><p><span>Business name</span><b>{request.companyName}</b></p><p><span>Application ID</span><b>#{request.id}</b></p><p><span>Submitted</span><b>{new Date(request.createdAt).toLocaleString('en-IN')}</b></p></article><article><small>FIRST ADMINISTRATOR</small><p><span>Name</span><b>{request.adminName}</b></p><p><span>Email</span><b>{request.email}</b></p><p><span>Mobile</span><b>{request.phone}</b></p></article><article><small>SELECTED PACKAGE</small><p><span>Package</span><b className="capitalize">{request.packageCode}</b></p><p><span>Billing period</span><b>{request.periodMonths} month{request.periodMonths>1?'s':''}</b></p><p><span>Tenant database</span><b>Not created yet</b></p></article></div><div className="registration-detail-modules"><small>PACKAGE MODULES</small><div>{(request.selectedModules||[]).map(key=><span key={key}><CheckCircle2/>{names[key]||key}</span>)}</div></div>{request.reviewNote?<div className="registration-review-note"><small>MASTER REVIEW NOTE</small><p>{request.reviewNote}</p></div>:null}{request.status==='pending'?<footer><button disabled={busy===request.id} onClick={()=>review(request,'reject')}>Reject application</button><button className="primary" disabled={busy===request.id} onClick={()=>review(request,'approve')}><CheckCircle2/>{busy===request.id?'Processing…':'Approve application'}</button></footer>:<footer><Status status={request.status}/><span>{request.completedAt?'Tenant registration completed':request.status==='approved'?'Applicant can now continue setup and payment':'Application review completed'}</span></footer>}</section></div>;
}

function MasterNetworkOverview({ companies, invoices, usage }) {
  const currentMonth=new Date().toISOString().slice(0,7),currentInvoices=(invoices||[]).filter((invoice)=>invoice.billingMonth===currentMonth),totalRevenue=currentInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
    activeOrders = companies.reduce((sum, company) => sum + Number(company.activeOrders || 0), 0),
    activeUsers = (usage||[]).reduce((sum, item) => sum + Number(item.uniqueUsers || 0), 0), totalLogins=(usage||[]).reduce((sum,item)=>sum+Number(item.totalLogins||0),0),
    alerts = companies.filter((company) => !company.online || company.lowStock > 0 || !company.adminLoginActive),
    collectedRevenue=currentInvoices.filter((invoice)=>invoice.status==='paid').reduce((sum,invoice)=>sum+Number(invoice.total||0),0);
  return <>
    <div className="stats master-stats master-network-stats">
      <Stat icon={Building2} label="Companies" value={companies.length} note={`${companies.filter((company)=>company.status==="active").length} active tenants`}/>
      <Stat icon={TrendingUp} label="KnockOUT monthly revenue" value={money(totalRevenue)} note={`${money(collectedRevenue)} subscription fees collected`}/>
      <Stat icon={ReceiptText} label="Live orders" value={activeOrders} note="Across the company network"/>
      <Stat icon={Users} label="Software users" value={activeUsers} note={`${totalLogins} successful logins tracked`}/>
    </div>
    <section className={`master-command-strip ${alerts.length?"has-alerts":"healthy"}`}>
      <Gauge/><div><span className="eyebrow">NETWORK HEALTH</span><b>{alerts.length?`${alerts.length} compan${alerts.length===1?"y needs":"ies need"} attention`:"All companies operating normally"}</b><small>{alerts.length?alerts.map((company)=>company.companyName).join(" · "):"Databases, administrators, and stock levels are healthy."}</small></div><span>{companies.filter((company)=>company.online).length}/{companies.length}<small>online</small></span>
    </section>
  </>;
}

function MasterActionModal({ action, busy, close, confirm }) {
  const [typed, setTyped] = useState(""),
    company = action.company,
    matches = typed === company.companyName;
  return (
    <Modal close={close} hideClose={busy}>
      <div className="master-action-icon danger">
        <Trash2 size={24} />
      </div>
      <span className="eyebrow">
        PERMANENT COMPANY DELETION
      </span>
      <h2>
        Delete {company.companyName}?
      </h2>
      <p>
        This permanently removes <b>{company.companyName}</b>, database{" "}
        <code>{company.databaseName}</code>, and all company data. This cannot be undone.
      </p>
      <label className="master-confirm-input">
          TYPE <b>{company.companyName}</b> TO CONFIRM
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={company.companyName}
            disabled={busy}
          />
      </label>
      <div className="master-action-buttons">
        <button onClick={close} disabled={busy}>
          Cancel
        </button>
        <button
          className="danger"
          onClick={() => confirm(typed)}
          disabled={busy || !matches}
        >
          {busy
            ? "Please wait…"
            : "Delete company"}
        </button>
      </div>
    </Modal>
  );
}

function CompanyWorkspaceOverview({ company, invoice, subscription, usage, openUsers, openRevenue }) {
  return <div className="company-workspace-overview">
    <div className="stats master-stats">
      <Stat icon={TrendingUp} label="Monthly SaaS bill" value={money(invoice?.total||0)} note={`${invoice?.status==='paid'?'Subscription collected':'Subscription payment due'}`}/>
      <Stat icon={ReceiptText} label="Active orders" value={company.activeOrders} note="Current live workload"/>
      <Stat icon={Users} label="Users logged in" value={usage?.uniqueUsers||0} note={`${usage?.totalLogins||0} successful logins tracked`}/>
      <Stat icon={AlertTriangle} label="Low stock" value={company.lowStock} note="Items requiring attention" tone="warning"/>
    </div>
    <div className="company-workspace-grid">
      <section className="panel company-profile-panel"><PanelHead title="Company profile" sub="Tenant identity, usage and subscription"/><div className="company-profile-facts"><p><span>Company</span><b>{company.companyName}</b></p><p><span>Hotel ID</span><code>{company.hotelId}</code></p><p><span>CY-DB</span><code>{company.cyDb||company.databaseName}</code></p><p><span>Administrator</span><b>{company.adminName}</b></p><p><span>Last login</span><b>{usage?.lastLogin?new Date(usage.lastLogin).toLocaleString('en-IN'):'No login recorded'}</b></p><p><span>Status</span><Status status={company.status}/></p><p><span>Subscription</span><b>{subscription?`${subscription.packageCode} · ${subscription.status}`:'Legacy tenant'}</b></p><p><span>Expires</span><b>{subscription?new Date(subscription.expiresAt).toLocaleDateString('en-IN'):'—'}</b></p></div></section>
      <aside className="company-workspace-actions"><button onClick={openUsers}><Users/><span><b>Company users</b><small>Manage {company.users?.length || 0} declared accounts</small></span><ArrowRight/></button><button onClick={openRevenue}><CreditCard/><span><b>SaaS billing</b><small>Open module invoice and monthly report</small></span><ArrowRight/></button></aside>
    </div>
  </div>;
}

function CompanyControls({ company, status, toggleModule, setMasterAction }) {
  const labels={tables:"Tables",bookings:"Table Bookings",billing:"Orders & Billing",parcels:"Parcel Orders",menu:"Food & Photos",stock:"Stock Management",finance:"Finance Management",staff:"Staff Management",kitchen:"Chef Portal",juicer:"Juicer Portal"};
  return <section className="panel company-controls-panel"><span className="eyebrow">COMPANY ADMINISTRATION</span><h2>Access and lifecycle controls</h2><p>Module changes are delivered live by socket to <b>{company.companyName}</b> · Hotel ID <b>{company.hotelId}</b>.</p><div className="company-module-grid">{Object.entries(labels).map(([key,label])=><label key={key}><span><b>{label}</b><small>{company.modules?.[key]!==false?"Module available":"Module disabled"}</small></span><input type="checkbox" checked={company.modules?.[key]!==false} onChange={(event)=>toggleModule(company,key,event.target.checked)}/><i/></label>)}</div><div className="company-control-grid"><article><Building2/><div><b>Company status</b><small>{company.status === "active" ? "Suspend all company portal access" : "Restore company portal access"}</small></div><button onClick={()=>status(company)}>{company.status === "active" ? "Suspend company" : "Activate company"}</button></article><article className="danger"><Trash2/><div><b>Delete company</b><small>Remove the company and its isolated database permanently</small></div>{company.databaseName==="knockout"?<span>Primary company protected</span>:<button onClick={()=>setMasterAction({type:"company",company})}>Delete company</button>}</article></div></section>;
}

function MasterUsers({ company, changePin }) {
  const rows = (company.users || []).map((user) => ({ company, user, isMaster: false }));
  return (
    <section className="master-users-panel">
      <div>
        <span className="eyebrow">ACCESS DIRECTORY</span>
        <h2>{company.companyName} users</h2>
        <p>
          Admin, Waiter, Chef, and Juicer accounts declared under this company only.
          Six-digit PINs are unique inside this hotel. The same PIN may be reused by another Hotel ID.
        </p>
      </div>
      <div className="table-scroll">
        <table className="master-users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Designation</th>
              <th>6-digit PIN</th>
              <th>Status</th>
              <th>Recovery</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ company, user, isMaster }) => (
              <tr key={`${company.id}-${user.id}`}>
                <td>
                  <b>{user.name}</b>
                  <small>{user.phone || "Secure KnockOUT account"}</small>
                </td>
                <td>
                  <span className={`designation ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <code className="master-user-pin">{user.pin}</code>
                </td>
                <td>
                  <span
                    className={user.active ? "user-active" : "user-inactive"}
                  >
                    {user.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button
                    className="change-pin-btn"
                    onClick={() => changePin({ company, user, isMaster })}
                  >
                    Change PIN
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <div className="master-users-empty"><Users/><b>No company users yet</b><small>Create staff from this company’s Admin portal.</small></div> : null}
      </div>
    </section>
  );
}

function MasterPinModal({ entry, close, refresh, toast }) {
  const [pin, setPin] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    { company, user, isMaster } = entry;
  async function save(e) {
    e.preventDefault();
    if (pin.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      await api(
        isMaster
          ? `/master-users/${user.id}/pin`
          : `/companies/${company.id}/users/${user.id}/pin`,
        { method: "PATCH", body: JSON.stringify({ pin }) },
      );
      await refresh();
      toast(`${user.name}'s PIN changed successfully`);
      close();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal close={close} hideClose={busy}>
      <div className="master-action-icon">
        <CreditCard size={24} />
      </div>
      <span className="eyebrow">FORGOT PIN RECOVERY</span>
      <h2>Change user PIN</h2>
      <p>
        Set a new globally unique six-digit PIN for <b>{user.name}</b>,{" "}
        {user.role} at <b>{company.companyName}</b>.
      </p>
      <div className="current-pin-line">
        <span>Current PIN / password</span>
        <code>{user.pin}</code>
      </div>
      <form onSubmit={save}>
        <label className="master-confirm-input">
          NEW 6-DIGIT PIN
          <input
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="••••••"
            inputMode="numeric"
            type="password"
            autoFocus
            disabled={busy}
          />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <div className="master-action-buttons">
          <button type="button" onClick={close} disabled={busy}>
            Cancel
          </button>
          <button className="primary" disabled={busy || pin.length !== 6}>
            {busy ? "Updating…" : "Change PIN"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MasterBilling({ invoices, companies, setStatus }) {
  const months=[...new Set((invoices||[]).map((invoice)=>invoice.billingMonth))].sort().reverse(),[month,setMonth]=useState(months[0]||new Date().toISOString().slice(0,7)),rows=(invoices||[]).filter((invoice)=>invoice.billingMonth===month&&companies.some((company)=>company.id===invoice.companyId)),subtotal=rows.reduce((sum,row)=>sum+row.subtotal,0),tax=rows.reduce((sum,row)=>sum+row.tax,0),total=rows.reduce((sum,row)=>sum+row.total,0),paid=rows.filter((row)=>row.status==='paid').reduce((sum,row)=>sum+row.total,0);
  const exportReport=()=>exportCsv(`knockout-saas-billing-${month}.csv`,[["KnockOUT SaaS monthly billing report",month],["Company","Hotel ID","Enabled modules","Subtotal","GST","Total","Status"],...rows.map((row)=>[row.companyName,row.hotelId,(row.lineItems||[]).map((item)=>item.name).join(" + "),row.subtotal,row.tax,row.total,row.status]),[],["Summary"],["Subtotal",subtotal],["GST",tax],["Invoiced",total],["Collected",paid],["Outstanding",total-paid]]);
  return <section className="master-revenue-panel master-billing-panel">
    <header className="master-billing-head"><div><span className="eyebrow">KNOCKOUT COMPANY REVENUE</span><h2>Monthly SaaS billing</h2><p>Subscription invoices are generated from each tenant’s activated KnockOUT modules. Hotel food sales are not included.</p></div><div><label>Billing month<select value={month} onChange={(event)=>setMonth(event.target.value)}>{months.map((value)=><option key={value} value={value}>{new Date(`${value}-01T12:00:00`).toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</option>)}</select></label><button className="secondary" onClick={exportReport} disabled={!rows.length}><FileDown size={15}/> Export monthly report</button></div></header>
    <MasterPricingSlab/>
    <div className="stats master-stats master-billing-stats"><Stat icon={ReceiptText} label="Invoices" value={rows.length} note={`${rows.filter((row)=>row.status==='due').length} awaiting payment`}/><Stat icon={TrendingUp} label="SaaS revenue" value={money(total)} note="Module fees including GST"/><Stat icon={CheckCircle2} label="Collected" value={money(paid)} note="Paid tenant invoices"/><Stat icon={Wallet} label="Outstanding" value={money(total-paid)} note="Subscription fees due" tone={total-paid>0?"warning":""}/></div>
    {rows.length?<div className="master-revenue-scroll"><table className="master-revenue-table master-billing-table"><thead><tr><th>Tenant</th><th>Activated modules</th><th>Subtotal</th><th>GST</th><th>Total</th><th>Payment</th></tr></thead><tbody>{rows.map((invoice)=><tr key={invoice.id}><th>{invoice.companyName}<small>Hotel ID {invoice.hotelId}</small></th><td><div className="invoice-module-chips">{(invoice.lineItems||[]).map((item)=><span key={item.key}>{item.name}<b>{money(item.price)}</b></span>)}</div></td><td><b>{money(invoice.subtotal)}</b></td><td><b>{money(invoice.tax)}</b><small>{invoice.taxRate}% GST</small></td><td><strong>{money(invoice.total)}</strong></td><td><button className={`invoice-status ${invoice.status}`} onClick={()=>setStatus(invoice,invoice.status==='paid'?'due':'paid')}>{invoice.status==='paid'?<CheckCircle2 size={14}/>:<Clock3 size={14}/>} {invoice.status==='paid'?'Paid':'Mark paid'}</button></td></tr>)}</tbody><tfoot><tr><th colSpan="4">Monthly KnockOUT revenue</th><td><strong>{money(total)}</strong><small>{money(paid)} collected</small></td><td><b>{money(total-paid)} due</b></td></tr></tfoot></table></div>:<div className="master-revenue-empty">No subscription invoices are available for this month.</div>}
  </section>;
}
function MasterPricingSlab(){
  const[pricing,setPricing]=useState(null),[editing,setEditing]=useState(false),[busy,setBusy]=useState("");
  useEffect(()=>{api('/module-pricing').then(setPricing).catch(()=>{})},[]);
  async function save(key){setBusy(key);try{await api(`/module-pricing/${key}`,{method:'PATCH',body:JSON.stringify({price:Number(pricing[key].price)})});setEditing(false)}finally{setBusy("")}}
  if(!pricing)return null;
  return <section className="master-pricing-slab"><header><div><span className="eyebrow">MASTER PRICING</span><h3>Module pricing slab</h3><p>Monthly prices used for new packages and unpaid SaaS invoices.</p></div><button className="secondary" onClick={()=>setEditing(value=>!value)}>{editing?'Finish editing':'Edit pricing'}</button></header><div>{Object.entries(pricing).map(([key,item])=><label key={key}><span><b>{item.name}</b><small>Per tenant / month</small></span>{editing?<span className="pricing-input">₹<input type="number" min="0" step="1" value={item.price} onChange={event=>setPricing({...pricing,[key]:{...item,price:event.target.value}})}/><button disabled={busy===key} onClick={()=>save(key)}>{busy===key?'Saving…':'Save'}</button></span>:<strong>{money(item.price)}</strong>}</label>)}</div></section>;
}
function MasterLogin({ login }) {
  const [pin, setPin] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      login(
        await api("/login", { method: "POST", body: JSON.stringify({ pin }) }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="master-login">
      <section>
        <span className="logo">K</span>
        <span className="eyebrow">KNOCKOUT MASTER</span>
        <h1>
          One master.
          <br />
          Every company.
        </h1>
        <p>Secure multi-company administration and database provisioning.</p>
        <form onSubmit={submit}>
          <input
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="6-digit Master PIN"
            type="password"
            inputMode="numeric"
            autoFocus
          />
          {error ? <div className="form-error">{error}</div> : null}
          <button className="primary wide" disabled={busy || pin.length !== 6}>
            {busy ? "Verifying…" : "Open Master Control"}
          </button>
        </form>
      </section>
    </main>
  );
}
function CompanyRegistration({ close, refresh, toast }) {
  const [form, setForm] = useState({
      companyName: "",
      adminName: "",
      email: "",
      phone: "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const database = `tenant_${form.companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}`;
  async function register(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/companies", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await refresh();
      toast(
        `${result.companyName} created · Hotel ID ${result.hotelId} · Admin PIN ${result.adminPin}`,
      );
      close();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">NEW TENANT REGISTRATION</span>
      <h2>Register a hotel or café</h2>
      <p>
        A separate MariaDB database and initial Admin account will be created
        automatically.
      </p>
      <form className="modal-form" onSubmit={register}>
        <label>
          Hotel / business name
          <input
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            required
          />
        </label>
        <div className="database-preview">
          <Building2 size={17} />
          <span>Database to create</span>
          <code>{form.companyName.trim() ? database : "—"}</code>
        </div>
        <div className="database-preview"><Settings size={17}/><span>Login credentials</span><code>Generated automatically</code></div>
        <label>
          Admin name
          <input
            value={form.adminName}
            onChange={(e) => setForm({ ...form, adminName: e.target.value })}
            required
          />
        </label>
        <div className="form-grid">
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
        </div>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button
          className="primary wide"
          disabled={busy}
        >
          {busy ? "Creating database…" : "Register & create database"}
        </button>
      </form>
    </Modal>
  );
}

const portalNav = {
  admin: [
    ["overview", "Overview", LayoutDashboard],
    ["tables", "Tables", Armchair],
    ["bookings", "Table Bookings", CalendarDays],
    ["orders", "Orders & Billing", ReceiptText],
    ["parcels", "Parcel Orders", Package],
    ["menu", "Food & Photos", UtensilsCrossed],
    ["stock", "Stock Management", Boxes],
    ["finance", "Finance Management", Wallet],
    ["staff", "Staff", Users],
    ["settings", "Settings", Settings],
  ],
  waiter: [
    ["overview", "Overview", LayoutDashboard],
    // ["attendance", "Check In / Out", Clock3], // Temporarily disabled; retain for later.
    ["floor", "Tables", Armchair],
    ["orders", "My Orders", ReceiptText],
  ],
  chef: [
    ["overview", "Overview", LayoutDashboard],
    // ["attendance", "Check In / Out", Clock3], // Temporarily disabled; retain for later.
    ["team", "Chef Management", Users],
    ["stock-booking", "Book Kitchen Stock", Boxes],
    ["dishes", "Dishes", UtensilsCrossed],
    ["kitchen", "Table Orders", ChefHat],
    ["parcels", "Parcel Queue", Package],
    ["ready", "Ready to Serve", CheckCircle2],
  ],
  juicer: [
    ["overview", "Overview", LayoutDashboard],
    // ["attendance", "Check In / Out", Clock3], // Temporarily disabled; retain for later.
    ["juices", "Juices", CupSoda],
    ["queue", "Table Orders", Armchair],
    ["parcel-queue", "Parcel Queue", Package],
    ["ready", "Ready Juices", CheckCircle2],
  ],
};
function Shell({ role, user, page, setPage, logout, children, navBadges = {} }) {
  const [profileOpen,setProfileOpen]=useState(false),[profile,setProfile]=useState(user);
  const navModule={tables:"tables",floor:"tables",bookings:"bookings",orders:"billing",parcels:"parcels",menu:"menu",stock:"stock",finance:"finance",staff:"staff",team:"staff","stock-booking":"stock",dishes:"menu",kitchen:"kitchen",ready:"kitchen",juices:"juicer",queue:"juicer","parcel-queue":"juicer"};
  const visibleNav=portalNav[role].filter(([id])=>!navModule[id]||user.modules?.[navModule[id]]!==false);
  useEffect(() => {
    if (!visibleNav.some(([id]) => id === page)) setPage("overview");
  }, [page, setPage, user.modules]);
  async function openProfile(){setProfileOpen(true);try{setProfile(await api("/profile"))}catch{/* Keep the signed-in identity visible if loading fails. */}}
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <span className="logo">K</span>
          <div>
            <b>{user.companyName || "Your hotel"}</b>
            <small>{role} portal</small>
          </div>
        </div>
        <nav>
          {visibleNav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => setPage(id)}
            >
              <Icon size={18} />
              {label}
              {navBadges[id] > 0 ? (
                <span className="nav-count-badge">{navBadges[id]}</span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>
      <main>
        <header>
          <div className="global-search">
            <Search size={16} />
            <input placeholder="Search anything…" />
          </div>
          <div className="header-actions">
            <button>
              <Bell size={17} />
            </button>
            <div className="header-user">
              <button className="header-profile" onClick={openProfile} title="Open my profile">
                <span className="header-avatar">{profile.profileImageUrl?<img src={profile.profileImageUrl} alt=""/>:profile.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</span>
                <span className="header-user-copy"><b>{profile.name}</b><small>{role} · Edit profile</small></span>
              </button>
              <button className="header-logout" onClick={logout} title="Logout"><LogOut size={17}/></button>
            </div>
          </div>
        </header>
        <div className="page">{children}</div>
        <footer className="powered-by-knockout">Powered by <b>KnockOUT</b></footer>
      </main>
      {profileOpen?<ProfileEditor user={profile} close={()=>setProfileOpen(false)} saved={(updated)=>{const next={...user,...updated};setProfile(next);sessionStorage.setItem("knockout-portal-user",JSON.stringify(next));window.dispatchEvent(new CustomEvent("knockout:profile-updated",{detail:next}));setProfileOpen(false)}}/>:null}
    </div>
  );
}

function ProfileEditor({user,close,saved}){
  const[form,setForm]=useState({name:user.name||"",phone:user.phone||"",email:user.email||""}),[image,setImage]=useState(null),[preview,setPreview]=useState(user.profileImageUrl||""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  function choose(file){if(!file)return;if(!file.type.startsWith("image/")){setError("Choose a JPG, PNG, or WebP image");return}if(file.size>5*1024*1024){setError("Profile photo must be smaller than 5 MB");return}setError("");setImage(file);setPreview(URL.createObjectURL(file))}
  async function submit(event){event.preventDefault();setBusy(true);setError("");try{const body=new FormData();body.append("name",form.name);body.append("phone",form.phone);body.append("email",form.email);if(image)body.append("image",image);const updated=await apiForm("/profile",body,{method:"PATCH"});saved({...form,...updated,profileImageUrl:updated.profileImageUrl||preview})}catch(err){setError(err.message)}finally{setBusy(false)}}
  return <Modal close={close} hideClose={busy}><div className="profile-editor-head"><label className="profile-photo-picker"><span>{preview?<img src={preview} alt="Profile preview"/>:form.name.split(" ").map(part=>part[0]).join("").slice(0,2)}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>choose(event.target.files[0])}/><small>Change photo</small></label><div><span className="eyebrow">MY ACCOUNT</span><h2>Edit your profile</h2><p>{String(user.role||"").toUpperCase()} portal identity</p></div></div><form className="modal-form" onSubmit={submit}><label>FULL NAME<input required value={form.name} onChange={event=>setForm({...form,name:event.target.value})}/></label><div className="form-grid"><label>MOBILE NUMBER<input value={form.phone} onChange={event=>setForm({...form,phone:event.target.value})} inputMode="tel" placeholder="9876543210"/></label><label>EMAIL ADDRESS<input type="email" value={form.email} onChange={event=>setForm({...form,email:event.target.value})} placeholder="name@company.com"/></label></div>{error?<div className="form-error">{error}</div>:null}<button className="primary wide" disabled={busy}>{busy?"Saving profile…":"Save profile"}</button></form></Modal>
}
function PageHead({ kicker, title, sub, action }) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{kicker}</span>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {action}
    </div>
  );
}
function Stat({ icon: Icon, label, value, note, tone = "" }) {
  return (
    <div className={`stat ${tone}`}>
      <span>
        <Icon size={18} />
      </span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
        <em>{note}</em>
      </div>
    </div>
  );
}
function ThemeSelect({ value, onChange, options, placeholder = "Choose an option", disabled = false, className = "" }) {
  const [open, setOpen] = useState(false), root = useRef(null), normalized = options.map((option) => typeof option === "string" ? { value: option, label: option } : option), selected = normalized.find((option) => String(option.value) === String(value));
  useEffect(() => {
    const close = (event) => !root.current?.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return <div ref={root} className={`theme-select ${open ? "open" : ""} ${disabled ? "disabled" : ""} ${className}`}>
    <button type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}><span className={selected ? "" : "placeholder"}>{selected?.label || placeholder}</span><ChevronRight size={15}/></button>
    {open ? <div className="theme-select-menu" role="listbox">{normalized.map((option) => <button type="button" role="option" aria-selected={String(option.value) === String(value)} className={String(option.value) === String(value) ? "selected" : ""} disabled={option.disabled} key={String(option.value)} onClick={() => { onChange(option.value); setOpen(false); }}><span>{option.label}</span>{option.note ? <small>{option.note}</small> : null}{String(option.value) === String(value) ? <CheckCircle2 size={14}/> : null}</button>)}</div> : null}
  </div>;
}

function Admin({ data, refresh, user, logout, toast }) {
  const [page, setPage] = useState("overview"), [booking, setBooking] = useState(false);
  const pendingStockRequests = (data.stockRequests || []).filter((request) => request.status !== "resolved"), lowStock = (data.inventory || []).filter((item) => item.quantity <= item.min);
  return (
    <>
      <Shell
        role="admin"
        user={user}
        page={page}
        setPage={setPage}
        logout={logout}
      >
        {(pendingStockRequests.length || lowStock.length) ? <button className="admin-stock-notification" onClick={()=>setPage("stock")}><Bell/><span><b>{pendingStockRequests.length ? `${pendingStockRequests.length} kitchen stock request${pendingStockRequests.length===1?"":"s"}` : `${lowStock.length} low-stock item${lowStock.length===1?"":"s"}`}</b><small>{pendingStockRequests.length ? "Chef requested replenishment · open Stock Management" : "Inventory has reached its minimum level"}</small></span><ArrowRight/></button> : null}
        {page === "overview" && <AdminOverview data={data} setPage={setPage} user={user} />}{" "}
        {page === "tables" && (
          <AdminTables data={data} refresh={refresh} toast={toast} user={user} />
        )}{" "}
        {page === "bookings" && <Bookings data={data} refresh={refresh} toast={toast} open={(date) => setBooking(date || true)} />}{" "}
        {page === "orders" && <AdminOrders data={data} />}{" "}
        {page === "parcels" && (
          <ParcelPanel
            data={data}
            refresh={refresh}
            user={user}
            toast={toast}
          />
        )}{" "}
        {page === "menu" && (
          <MenuManager data={data} refresh={refresh} toast={toast} />
        )}{" "}
        {page === "stock" && (
          <Stock data={data} refresh={refresh} toast={toast} user={user} />
        )}{" "}
        {page === "finance" && (
          <DailyFinance
            data={data}
            refresh={refresh}
            toast={toast}
            user={user}
          />
        )}{" "}
        {page === "staff" && (
          <StaffManagement data={data} refresh={refresh} toast={toast} />
        )}{" "}
        {page === "settings" && (
          <SettingsPanel data={data} refresh={refresh} toast={toast} />
        )}
        {booking ? <BookingModal data={data} initialDate={typeof booking === "string" ? booking : undefined} close={() => setBooking(false)} refresh={refresh} toast={toast} /> : null}
      </Shell>
    </>
  );
}
function AdminOverview({ data, setPage, user }) {
  const active = data.orders.filter(
      (o) => !["completed", "served"].includes(o.status),
    ),
    days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - 6 + index);
      const key = dateKey(date);
      return { key, label: date.toLocaleDateString(undefined, { weekday: "short" }),
        total: data.orders.filter((order) => order.paymentStatus === "paid" && dateKey(order.completedAt || order.createdAt) === key)
          .reduce((sum, order) => sum + Number(order.total || 0), 0) };
    }),
    revenue = days[6].total,
    chartMax = Math.max(1, ...days.map((day) => day.total)),
    hour = new Date().getHours(),
    greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <div className="portal-overview admin-overview">
      <section className="premier-hero">
        <div className="premier-hero-copy">
          <span className="premier-kicker"><span /> YOUR SERVICE, IN FOCUS</span>
          <h1>{greeting},<br /><em>{user?.name || "Admin"}.</em></h1>
          <p>A little more perspective.<br />Everything you need for a seamless service.</p>
          <div className="premier-hero-actions">
            <button className="primary" onClick={() => setPage("orders")}>Open orders <ArrowRight size={16} /></button>
            <button className="secondary" onClick={() => setPage("tables")}>Explore the floor <Armchair size={16} /></button>
          </div>
          <span className="premier-date">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span>
        </div>
        <div className="premier-scene" aria-hidden="true">
          <div className="premier-orbit premier-orbit-one" /><div className="premier-orbit premier-orbit-two" />
          <div className="premier-plinth"><div className="premier-sculpture">K<span>HOSPITALITY, ELEVATED</span></div></div>
          <div className="premier-float premier-float-top"><Armchair size={19}/><div><strong>{data.tables.filter(t => t.status === "available").length} tables</strong><small>Ready to welcome</small></div></div>
          <div className="premier-float premier-float-bottom"><ReceiptText size={19}/><div><strong>{active.length} active orders</strong><small>Service at a glance</small></div></div>
        </div>
      </section>
      <div className="premier-section-label"><span>THE DAILY PICTURE</span><span>Current workspace data</span></div>
      <div className="stats">
        <Stat
          icon={TrendingUp}
          label="Today's Revenue"
          value={money(revenue)}
          note="Paid orders today"
        />
        <Stat
          icon={Armchair}
          label="Occupied Tables"
          value={`${data.tables.filter((t) => t.status === "occupied").length} / ${data.tables.length}`}
          note={`${data.tables.filter((t) => t.status === "reserved").length} reservations · ${data.tables.filter((t) => t.status === "cleaning").length} cleaning`}
        />
        <Stat
          icon={ReceiptText}
          label="Active Orders"
          value={active.length}
          note={`${active.filter((o) => o.status === "ready").length} ready to serve`}
        />
        <Stat
          icon={AlertTriangle}
          label="Low Stock"
          value={data.inventory.filter((i) => i.quantity <= i.min).length}
          note="Requires attention"
          tone="warning"
        />
      </div>
      <div className="admin-grid">
        <section className="panel revenue-panel">
          <PanelHead
            title="Revenue Overview"
            sub="Sales over the last 7 days"
          />
          <div className="chart">
            {days.map((day) => (
              <div key={day.key} title={`${day.label}: ${money(day.total)}`}>
                <span style={{ height: `${day.total ? Math.max(3, day.total / chartMax * 100) : 0}%` }} />
                <small>{day.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <PanelHead title="Live Operations" sub="Current service health" />
          <div className="operations">
            <Ring
              value={Math.round(
                (data.tables.filter((t) => t.status !== "available").length /
                  Math.max(1, data.tables.length)) *
                  100,
              )}
            />
            <div>
              {["available", "occupied", "reserved", "cleaning"].map((s) => (
                <p key={s}>
                  <i className={s} />
                  <span>{s}</span>
                  <b>{data.tables.filter((t) => t.status === s).length}</b>
                </p>
              ))}
            </div>
          </div>
        </section>
      </div>
      <section className="panel">
        <PanelHead
          title="Live Orders"
          sub="Updates shared across waiter and chef portals"
          action={
            <button className="link" onClick={() => setPage("orders")}>
              View all →
            </button>
          }
        />
        <OrderTable orders={data.orders.slice(0, 6)} tables={data.tables} />
      </section>
    </div>
  );
}
function PanelHead({ title, sub, action }) {
  return (
    <div className="panel-head">
      <div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      {action}
    </div>
  );
}
function Ring({ value }) {
  return (
    <div
      className="ring"
      style={{ background: `conic-gradient(#2f6d50 ${value}%,#e8ece7 0)` }}
    >
      <span>
        <b>{value}%</b>
        <small>occupied</small>
      </span>
    </div>
  );
}
function orderDepartmentProgress(order, data, wantsJuice) {
  if (!order) return null;
  const lines = order.items
    .map((line) => ({
      ...line,
      menu: data.menu.find((item) => item.id === line.menuId),
    }))
    .filter(
      (line) =>
        (String(line.menu?.category || "").toLowerCase() === "juices") ===
        wantsJuice,
    );
  if (!lines.length) return null;
  const status = lines.every((line) => line.itemStatus === "ready")
    ? "ready"
    : lines.every((line) => (line.itemStatus || "new") === "new")
      ? "new"
      : "preparing";
  const names = lines.map((line) => `${line.qty}× ${line.menu?.name || "Menu item"}`);
  return {
    key: wantsJuice ? "juice" : "dish",
    label: wantsJuice ? "Juice station" : "Kitchen dishes",
    status,
    count: lines.reduce((sum, line) => sum + line.qty, 0),
    names,
  };
}
function AdminTables({ data, refresh, toast, user }) {
  const [selected, setSelected] = useState(null),
    [creating, setCreating] = useState(false),
    [billOrder, setBillOrder] = useState(null),
    [payOrder, setPayOrder] = useState(null),
    table = data.tables.find((t) => t.id === selected);
  return (
    <>
      <PageHead
        kicker="FLOOR MANAGEMENT"
        title="All Tables"
        sub="Add tables and inspect their live service status."
        action={
          <button className="primary" onClick={() => setCreating(true)}>
            <Plus size={15} /> Add table
          </button>
        }
      />
      <TableSummary data={data} />
      <div className="table-grid">
        {data.tables.map((t) => (
          <TableCard
            key={t.id}
            table={t}
            order={data.orders.find((o) => o.id === t.orderId)}
            data={data}
            onClick={() => setSelected(t.id)}
            onBill={(order) => setBillOrder(order)}
            onPay={(order) => setPayOrder(order)}
          />
        ))}
      </div>
      {table ? (
        <AdminTableDetails
          table={table}
          order={data.orders.find((o) => o.id === table.orderId)}
          data={data}
          close={() => setSelected(null)}
          refresh={refresh}
          toast={toast}
          user={user}
        />
      ) : null}
      {creating ? (
        <TableEditor
          close={() => setCreating(false)}
          refresh={refresh}
          toast={toast}
        />
      ) : null}
      {billOrder ? (
        <Modal close={() => setBillOrder(null)} wide>
          <span className="eyebrow">DINE-IN BILL</span>
          <h2>
            Table {data.tables.find((t) => t.id === billOrder.tableId)?.number} · Bill #{billNumber(billOrder)}
          </h2>
          <div className="table-bill-preview">
            <BillReceipt
              table={data.tables.find((t) => t.id === billOrder.tableId)}
              order={billOrder}
              data={data}
              bill={calculateBill(billOrder, data)}
            />
            <aside>
              <Printer size={30} />
              <span className="eyebrow">READY TO PRINT</span>
              <h3>{money(calculateBill(billOrder, data).total)}</h3>
              <p>Review the complete table bill and print a copy for the customer.</p>
              <button className="primary wide" onClick={openPrinter}>
                <Printer size={17} /> Print bill
              </button>
              {billOrder.status === "billing_requested" ? (
                <button
                  className="secondary wide"
                  onClick={() => {
                    setBillOrder(null);
                    setPayOrder(billOrder);
                  }}
                >
                  Continue to payment <ArrowRight size={16} />
                </button>
              ) : null}
            </aside>
          </div>
        </Modal>
      ) : null}
      {payOrder ? (
        <AdminBillPopup
          order={payOrder}
          table={data.tables.find((t) => t.id === payOrder.tableId)}
          data={data}
          refresh={refresh}
          toast={toast}
          close={() => setPayOrder(null)}
        />
      ) : null}
    </>
  );
}
function TableSummary({ data }) {
  return (
    <div className="summary-strip">
      {["available", "occupied", "reserved", "cleaning"].map((s) => (
        <div key={s}>
          <i className={s} />
          <b>{data.tables.filter((t) => t.status === s).length}</b>
          <span>{s}</span>
        </div>
      ))}
      <div>
        <Armchair size={17} />
        <b>{data.tables.length}</b>
        <span>Total tables</span>
      </div>
    </div>
  );
}
function TableCard({ table, order, data, onClick, onBill, onPay }) {
  const idle =
      table.status === "cleaning" ? "Cleaning in progress" : "Clean & ready",
    paymentRequested = order?.status === "billing_requested",
    kitchenStatus = order
      ? {
          new: { key: "kitchen-new", label: "New order" },
          preparing: { key: "kitchen-preparing", label: "Preparing" },
          ready: { key: "kitchen-ready", label: "Ready to serve" },
          collected: { key: "kitchen-collected", label: "Collected" },
          received: { key: "kitchen-received", label: "Order received" },
          served: { key: "kitchen-served", label: "Served" },
          billing_requested: {
            key: "payment-requested",
            label: "Payment requested",
          },
        }[order.status]
      : null,
    visibleStatus = kitchenStatus || {
      key: table.status,
      label: table.status,
    },
    departments = order
      ? [
          orderDepartmentProgress(order, data, false),
          orderDepartmentProgress(order, data, true),
        ].filter(Boolean)
      : [],
    ageMinutes = order
      ? Math.max(0, Math.floor((Date.now() - new Date(order.createdAt)) / 60000))
      : 0,
    needsAttention =
      ageMinutes >= 20 && departments.some((item) => item.status !== "ready");
  return (
    <article
      className={`table-card ${table.status} ${kitchenStatus?.key || ""}`}
    >
      <button className="table-card-main" onClick={onClick}>
        <div>
          <span className="table-number">
            T{String(table.number).padStart(2, "0")}
          </span>
          <em className={`table-status-badge ${visibleStatus.key}`}>
            <i />
            {visibleStatus.label}
          </em>
        </div>
        {paymentRequested ? (
          <div className="table-payment-alert">
            <Bell size={15} /> Waiter sent this table for billing
          </div>
        ) : null}
        {order && !paymentRequested ? (
          <div className="table-production-monitor">
            <div className="table-production-head">
              <span>Live preparation</span>
              {needsAttention ? <b><Clock3 size={11}/> Needs attention</b> : null}
            </div>
            {departments.map((department) => (
              <div className={`table-production-row ${department.key} ${department.status}`} key={department.key}>
                <span className="production-icon">
                  {department.key === "juice" ? <CupSoda size={14}/> : <ChefHat size={14}/>}
                </span>
                <span className="production-copy">
                  <small>{department.label} · {department.count} item{department.count === 1 ? "" : "s"}</small>
                  <b>{department.names.slice(0, 2).join(" · ")}{department.names.length > 2 ? ` +${department.names.length - 2} more` : ""}</b>
                </span>
                <em>{department.status}</em>
              </div>
            ))}
          </div>
        ) : null}
        <h3>
          {table.status === "reserved"
            ? "Reserved table"
            : table.guestName ||
              (table.status === "cleaning" ? "Being cleaned" : "Ready for guests")}
        </h3>
        <p>
          <Users size={13} />
          {table.seats} seats · {table.area}
        </p>
        {order ? (
          <footer>
            <Clock3 size={13} />
            {elapsed(order.createdAt)}
            <b>#{order.id}</b>
          </footer>
        ) : table.bookingTime ? (
          <footer>
            <CalendarDays size={13} />
            {table.bookingTime}
            <b>Booked</b>
          </footer>
        ) : (
          <footer>
            <CheckCircle2 size={13} />
            {idle}
          </footer>
        )}
      </button>
      {order && (onBill || (paymentRequested && onPay)) ? (
        <div className={`table-card-actions ${paymentRequested ? "urgent" : ""}`}>
          {onBill ? (
            <button onClick={() => onBill(order)}>
              <Printer size={14} /> Bill / Print
            </button>
          ) : null}
          {paymentRequested ? (
            <button className="pay" onClick={() => onPay?.(order)}>
              <Wallet size={14} /> Pay
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
function AdminTableDetails({ table, order, data, close, refresh, toast, user }) {
  const [billing, setBilling] = useState(false),
    [paying, setPaying] = useState(false);
  const lines =
      order?.items.map((i) => ({
        ...i,
        menu: data.menu.find((m) => m.id === i.menuId),
      })) || [],
    subtotal = lines.reduce((sum, i) => sum + (i.menu?.price || 0) * i.qty, 0),
    departments = order
      ? [orderDepartmentProgress(order, data, false), orderDepartmentProgress(order, data, true)].filter(Boolean)
      : [];
  async function remove() {
    if (!confirm(`Delete Table ${table.number}?`)) return;
    try {
      await api(`/tables/${table.id}`, { method: "DELETE" });
      await refresh();
      toast(`Table ${table.number} deleted`);
      close();
    } catch (e) {
      toast(e.message);
    }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">LIVE TABLE STATUS</span>
      <div className="table-detail-title">
        <div>
          <h2>Table {table.number}</h2>
          <p>
            {table.area} · {table.seats} seats
          </p>
        </div>
        <Status status={table.status} />
      </div>
      <div className="table-detail-grid">
        <div>
          <small>Current status</small>
          <b>{table.status === "cleaning" ? "Under cleaning" : table.status}</b>
        </div>
        <div>
          <small>{table.status === "reserved" ? "Reservation" : "Guest"}</small>
          <b>{table.status === "reserved" ? "Reserved table" : table.guestName || "No guest assigned"}</b>
        </div>
        <div>
          <small>Reservation time</small>
          <b>{table.bookingTime || "Not reserved"}</b>
        </div>
        <div>
          <small>Active order</small>
          <b>{order ? `#${order.id}` : "None"}</b>
        </div>
      </div>
      {order ? (
        <section className="table-order-detail">
          <div className="panel-head">
            <div>
              <h2>Current order</h2>
              <p>
                Kitchen status: {order.status} · Waiter: {order.waiter}
              </p>
            </div>
            <Status status={order.status} />
          </div>
          <div className="table-detail-production">
            {departments.map((department) => <div className={`${department.key} ${department.status}`} key={department.key}><span>{department.key === "juice" ? <CupSoda size={16}/> : <ChefHat size={16}/>}<b>{department.label}</b></span><em>{department.status}</em><p>{department.names.join(" · ")}</p></div>)}
          </div>
          {lines.map((i, index) => (
            <div className="detail-line" key={`${i.menuId}-${index}`}>
              <span>
                {i.qty} × {i.menu?.name || "Menu item"}
              </span>
              <b>{money((i.menu?.price || 0) * i.qty)}</b>
            </div>
          ))}
          <div className="detail-total">
            <span>Current subtotal</span>
            <b>{money(subtotal)}</b>
          </div>
          <div className="table-detail-bill-actions">
            <button className="secondary" onClick={() => setBilling(true)}>
              <Printer size={14} /> Bill / Print
            </button>
            {order.status === "billing_requested" ? (
              <button className="primary" onClick={() => setPaying(true)}>
                <Wallet size={14} /> Pay bill
              </button>
            ) : null}
          </div>
        </section>
      ) : (
        <div className="empty-table-detail">
          <CheckCircle2 size={28} />
          <h3>
            {table.status === "cleaning"
              ? "Cleaning team is preparing this table"
              : "No active order"}
          </h3>
          <p>This status is updated live from the Waiter portal.</p>
          {table.status !== "cleaning" ? <small>Table orders are created from the Waiter portal.</small> : null}
        </div>
      )}
      <button className="delete-table-btn" disabled={!!order} onClick={remove}>
        <Trash2 size={15} /> Delete table
      </button>
      {billing ? (
        <Modal close={() => setBilling(false)} wide>
          <BillReceipt table={table} order={order} data={data} bill={calculateBill(order, data)} />
        </Modal>
      ) : null}
      {paying ? (
        <AdminBillPopup
          order={order}
          table={table}
          data={data}
          refresh={refresh}
          toast={toast}
          close={() => {
            setPaying(false);
            close();
          }}
        />
      ) : null}
    </Modal>
  );
}
function TableEditor({ close, refresh, toast }) {
  const [form, setForm] = useState({ number: "", seats: 4, area: "Main Hall" }),
    [error, setError] = useState("");
  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/tables", { method: "POST", body: JSON.stringify(form) });
      await refresh();
      toast(`Table ${form.number} added`);
      close();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">FLOOR SETUP</span>
      <h2>Add a table</h2>
      <p>Create a new table for Admin and Waiter floor views.</p>
      <form className="modal-form" onSubmit={save}>
        <div className="form-grid">
          <label>
            Table number
            <input
              required
              type="number"
              min="1"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
            />
          </label>
          <label>
            Number of seats
            <input
              required
              type="number"
              min="1"
              value={form.seats}
              onChange={(e) => setForm({ ...form, seats: e.target.value })}
            />
          </label>
        </div>
        <label>
          Service area
          <input
            required
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
            placeholder="Main Hall, Terrace, Rooftop…"
          />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary wide">
          <Plus size={15} /> Add table
        </button>
      </form>
    </Modal>
  );
}
function OperationsCalendar({ orders, kicker, title, sub, label, onSelect, action }) {
  const today = new Date(), [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1)),
    year = month.getFullYear(), monthIndex = month.getMonth(), days = new Date(year, monthIndex + 1, 0).getDate(),
    leading = new Date(year, monthIndex, 1).getDay(), cells = [...Array(leading).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const keyFor = (day) => `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return <>
    <PageHead kicker={kicker} title={title} sub={sub} action={action}/>
    <section className="finance-calendar operations-calendar">
      <header><div><span>{label}</span><h2>{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2></div><div>
        <button onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}><ChevronLeft size={18}/></button>
        <button className="calendar-today" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>
        <button onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}><ChevronRight size={18}/></button>
      </div></header>
      <div className="finance-weekdays">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="finance-month-grid">{cells.map((day, index) => {
        if (!day) return <span className="calendar-blank" key={`blank-${index}`}/>;
        const key = keyFor(day), daily = orders.filter((order) => dateKey(order.createdAt) === key),
          paid = daily.filter((order) => order.paymentStatus === "paid"), revenue = paid.reduce((sum, order) => sum + Number(order.total || 0), 0),
          open = daily.filter((order) => order.status !== "completed").length, isToday = key === dateKey(today), weekend = index % 7 === 0 || index % 7 === 6;
        return <button key={key} className={`${daily.length ? "has-activity" : ""} ${isToday ? "is-today" : ""} ${weekend ? "weekend" : ""}`} onClick={() => onSelect(key)}>
          <header><b>{day}</b><em>{daily.length ? `${daily.length} ${daily.length === 1 ? "ORDER" : "ORDERS"}` : weekend ? "W/E" : "OPEN"}</em></header>
          {daily.length ? <div className="order-day-data"><strong>{revenue ? money(revenue) : `${daily.length} order${daily.length === 1 ? "" : "s"}`}</strong><small>{paid.length} paid · {open} active</small><p>{daily.slice(0, 3).map((order) => <span key={order.id}>#{order.id}</span>)}</p></div> : <div className="calendar-no-data"><ReceiptText size={19}/><small>No orders</small></div>}
        </button>;
      })}</div>
      <footer><span><i className="activity"/> Orders recorded</span><span><i className="today"/> Today</span><span><i/> No orders</span></footer>
    </section>
  </>;
}
function DailyOrderCards({ orders, data }) {
  const [receipt, setReceipt] = useState(null);
  return <>
    <div className="daily-order-grid">{orders.map((order) => {
      const table = data.tables.find((item) => item.id === order.tableId), bill = calculateBill(order, data), itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
      return <article className={`order-history-card ${order.status}`} key={order.id}>
        <header><div><span>{order.orderType === "parcel" ? "PARCEL" : `TABLE ${table?.number || "—"}`}</span><h2>#{order.id}</h2></div><Status status={order.paymentStatus === "paid" ? "paid" : order.status}/></header>
        <h3>{order.guestName || "Walk-in Guest"}</h3><p>{order.waiter || "Admin"} · {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</p>
        <div className="order-history-items">{order.items.map((item, index) => <span key={`${item.menuId}-${index}`}><b>{item.qty}×</b> {data.menu.find((food) => food.id === item.menuId)?.name || "Menu item"}</span>)}</div>
        <footer><span>{itemCount} items</span><strong>{money(order.total || bill.total)}</strong></footer>
        {(order.paymentStatus === "paid" || order.status === "completed") ? <button className="parcel-receipt-button" onClick={() => setReceipt({ order, table, bill })}><Printer size={14}/> View / print bill</button> : null}
      </article>;
    })}</div>
    {!orders.length ? <div className="empty-state"><ReceiptText/><h3>No orders for this date</h3><p>Orders created on this date will appear here.</p></div> : null}
    {receipt ? <Modal close={() => setReceipt(null)} wide><BillReceipt table={receipt.table} order={receipt.order} data={data} bill={receipt.bill}/></Modal> : null}
  </>;
}
function AdminOrders({ data }) {
  const [selectedDate, setSelectedDate] = useState(null), daily = selectedDate ? data.orders.filter((order) => dateKey(order.createdAt) === selectedDate) : [];
  if (!selectedDate) return <OperationsCalendar orders={data.orders} kicker="SALES & SERVICE" title="Orders & Billing Calendar" sub="Select a date to view its dine-in and parcel orders, bills, payments and totals." label="ALL SALES ORDERS" onSelect={setSelectedDate}/>;
  return <>
    <PageHead kicker="DAILY SALES & SERVICE" title={new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} sub={`${daily.length} order${daily.length === 1 ? "" : "s"} created on this date.`} action={<button className="secondary" onClick={() => setSelectedDate(null)}><ChevronLeft size={15}/> Calendar</button>}/>
    <DailyOrderCards orders={daily} data={data}/>
  </>;
}
function FoodManager({ data, refresh, toast }) {
  const [uploading, setUploading] = useState(null);
  async function upload(item, file) {
    if (!file) return;
    setUploading(item.id);
    try {
      const form = new FormData();
      form.append("image", file);
      await apiForm(`/menu/${item.id}/image`, form);
      await refresh();
      toast(`${item.name} photo saved to MinIO`);
    } catch (e) {
      toast(e.message);
    } finally {
      setUploading(null);
    }
  }
  async function remove(item) {
    await api(`/menu/${item.id}/image`, { method: "DELETE" });
    await refresh();
    toast("Food photo removed");
  }
  return (
    <>
      <PageHead
        kicker="MENU ASSET LIBRARY"
        title="Food & Photos"
        sub="Upload food photography to the KnockOUT MinIO library."
      />
      <div className="food-grid">
        {data.menu.map((item) => (
          <article className="food-card" key={item.id}>
            <div className="food-photo">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} />
              ) : (
                <span>{item.icon}</span>
              )}
              <em>{item.category}</em>
            </div>
            <div className="food-info">
              <h3>{item.name}</h3>
              <b>{money(item.price)}</b>
              <div>
                <label className="upload-btn">
                  {uploading === item.id ? "Uploading…" : "Upload photo"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading === item.id}
                    onChange={(e) => upload(item, e.target.files[0])}
                  />
                </label>
                {item.imageUrl && (
                  <button onClick={() => remove(item)}>Remove</button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
function MenuManager({ data, refresh, toast }) {
  const [tab, setTab] = useState("dishes"),
    [editor, setEditor] = useState(null),
    [uploading, setUploading] = useState(null);
  const list = data.menu.filter((i) =>
    tab === "combos" ? i.isCombo : !i.isCombo,
  );
  async function upload(item, file) {
    if (!file) return;
    setUploading(item.id);
    const form = new FormData();
    form.append("image", file);
    try {
      await apiForm(`/menu/${item.id}/image`, form);
      await refresh();
      toast("Photo saved to MinIO");
    } catch (e) {
      toast(e.message);
    } finally {
      setUploading(null);
    }
  }
  return (
    <>
      <PageHead
        kicker="MENU MANAGEMENT"
        title="Dishes & Combo Offers"
        sub="Add and customize every dish, juice, price, photo, and combo."
        action={
          <button
            className="primary"
            onClick={() =>
              setEditor({
                type: tab === "combos" ? "combo" : "dish",
                item: null,
              })
            }
          >
            <Plus size={15} /> Add {tab === "combos" ? "combo" : "dish"}
          </button>
        }
      />
      <div className="menu-tabs">
        <button
          className={tab === "dishes" ? "active" : ""}
          onClick={() => setTab("dishes")}
        >
          Dishes & Juices <b>{data.menu.filter((i) => !i.isCombo).length}</b>
        </button>
        <button
          className={tab === "combos" ? "active" : ""}
          onClick={() => setTab("combos")}
        >
          Combo Offers <b>{data.menu.filter((i) => i.isCombo).length}</b>
        </button>
      </div>
      <div className="food-grid">
        {list.map((item) => (
          <article className="food-card" key={item.id}>
            <div className="food-photo">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} />
              ) : (
                <span>{item.icon}</span>
              )}
              <em>{item.category}</em>
              {!item.available && (
                <strong className="unavailable">Unavailable</strong>
              )}
            </div>
            <div className="food-info">
              <h3>{item.name}</h3>
              <p>{item.description || "No description added"}</p>
              {item.isCombo && (
                <div className="combo-parts">
                  {item.components.map((c) => (
                    <span key={c.menuId}>
                      {c.quantity}× {c.name}
                    </span>
                  ))}
                </div>
              )}
              <b>{money(item.price)}</b>
              <div>
                <button
                  onClick={() =>
                    setEditor({ type: item.isCombo ? "combo" : "dish", item })
                  }
                >
                  Customize
                </button>
                <label className="upload-btn">
                  {uploading === item.id ? "Uploading…" : "Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => upload(item, e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </article>
        ))}
      </div>
      {editor?.type === "dish" && (
        <DishEditor
          item={editor.item}
          close={() => setEditor(null)}
          refresh={refresh}
          toast={toast}
        />
      )}{" "}
      {editor?.type === "combo" && (
        <ComboEditor
          item={editor.item}
          dishes={data.menu.filter((i) => !i.isCombo)}
          close={() => setEditor(null)}
          refresh={refresh}
          toast={toast}
        />
      )}
    </>
  );
}
function DishEditor({ item, close, refresh, toast }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    category: item?.category || "Mains",
    description: item?.description || "",
    price: item?.price || "",
    icon: item?.icon || "🍽️",
    available: item?.available ?? true,
  });
  async function save(e) {
    e.preventDefault();
    await api(item ? `/menu/${item.id}` : "/menu", {
      method: item ? "PUT" : "POST",
      body: JSON.stringify(form),
    });
    await refresh();
    toast(item ? "Dish customized" : "New dish added");
    close();
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">
        {item ? "CUSTOMIZE ITEM" : "NEW MENU ITEM"}
      </span>
      <h2>{item ? "Edit dish or juice" : "Add a dish or juice"}</h2>
      <form className="modal-form" onSubmit={save}>
        <label>
          Food name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Category
            <ThemeSelect
              value={form.category}
              onChange={(category) => setForm({ ...form, category })}
              options={["Starters", "Mains", "Desserts", "Beverages", "Juices", "Sides", "Specials"]}
            />
          </label>
          <label>
            Icon
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
          </label>
        </div>
        <label>
          Description
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Ingredients or short description"
          />
        </label>
        <label>
          Amount / selling price
          <input
            required
            min="0"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </label>
        <label className="toggle-field">
          <input
            type="checkbox"
            checked={form.available}
            onChange={(e) => setForm({ ...form, available: e.target.checked })}
          />{" "}
          Available for ordering
        </label>
        <button className="primary wide">
          {item ? "Save customization" : "Add to menu"}
        </button>
      </form>
    </Modal>
  );
}
function ComboEditor({ item, dishes, close, refresh, toast }) {
  const [form, setForm] = useState({
      name: item?.name || "",
      description: item?.description || "",
      price: item?.price || "",
      icon: item?.icon || "🎁",
    }),
    [parts, setParts] = useState(
      item?.components?.map((c) => ({
        menuId: c.menuId,
        quantity: c.quantity,
      })) || [],
    );
  function toggle(id) {
    setParts((p) =>
      p.some((x) => x.menuId === id)
        ? p.filter((x) => x.menuId !== id)
        : [...p, { menuId: id, quantity: 1 }],
    );
  }
  function qty(id, value) {
    setParts((p) =>
      p.map((x) =>
        x.menuId === id ? { ...x, quantity: Math.max(1, +value || 1) } : x,
      ),
    );
  }
  async function save(e) {
    e.preventDefault();
    await api(item ? `/combos/${item.id}` : "/combos", {
      method: item ? "PUT" : "POST",
      body: JSON.stringify({ ...form, components: parts }),
    });
    await refresh();
    toast(item ? "Combo customized" : "Combo offer created");
    close();
  }
  return (
    <Modal close={close} wide>
      <span className="eyebrow">COMBO BUILDER</span>
      <h2>{item ? "Customize combo offer" : "Create a combo offer"}</h2>
      <form className="modal-form" onSubmit={save}>
        <div className="form-grid">
          <label>
            Combo name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Family Feast Combo"
            />
          </label>
          <label>
            Combo amount
            <input
              required
              min="0"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>
          <label>
            Icon
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
          </label>
          <label>
            Description
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
        </div>
        <h3 className="builder-title">Select dishes and juices</h3>
        <div className="combo-builder">
          {dishes.map((d) => {
            const selected = parts.find((x) => x.menuId === d.id);
            return (
              <div className={selected ? "selected" : ""} key={d.id}>
                <button type="button" onClick={() => toggle(d.id)}>
                  <span>{d.icon}</span>
                  <div>
                    <b>{d.name}</b>
                    <small>
                      {d.category} · {money(d.price)}
                    </small>
                  </div>
                  <CheckCircle2 size={16} />
                </button>
                {selected && (
                  <label>
                    Qty
                    <input
                      type="number"
                      min="1"
                      value={selected.quantity}
                      onChange={(e) => qty(d.id, e.target.value)}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
        <div className="combo-footer">
          <span>{parts.length} different items selected</span>
          <button className="primary" disabled={!parts.length}>
            {item ? "Save combo" : "Create combo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function ParcelPanel({ data, refresh, user, toast }) {
  const [creating, setCreating] = useState(false),
    [paying, setPaying] = useState(null),
    [prepaying, setPrepaying] = useState(null),
    [selectedDate, setSelectedDate] = useState(null);
  const todayKey = dateKey(new Date()),
    canCreateParcel = selectedDate === todayKey,
    allParcels = data.orders.filter((o) => o.orderType === "parcel"),
    parcels = selectedDate ? allParcels.filter((order) => dateKey(order.createdAt) === selectedDate) : allParcels;
  async function collect(order, method) {
    try {
      const result = await api(`/orders/${order.id}/finalize`, {
        method: "POST",
        body: JSON.stringify({ paymentMethod: method }),
      });
      await refresh();
      toast(
        `Parcel #${order.id} completed${order.paymentStatus === "paid" ? " — already paid" : ` by ${method}`}`,
      );
      return result;
    } catch (e) {
      toast(e.message);
      throw e;
    }
  }
  async function markPaid(order, method) {
    try {
      await api(`/orders/${order.id}/mark-paid`, {
        method: "POST",
        body: JSON.stringify({ paymentMethod: method }),
      });
      await refresh();
      setPrepaying(null);
      toast(`Parcel #${order.id} marked paid by ${method}`);
    } catch (e) {
      toast(e.message);
    }
  }
  if (!selectedDate) return <>
    <OperationsCalendar orders={allParcels} kicker="TAKEAWAY OPERATIONS" title="Parcel Orders Calendar" sub="Select a date to open its parcel orders, payment status, bills and kitchen progress." label="PARCEL ORDER HISTORY" onSelect={setSelectedDate}/>
  </>;
  return (
    <>
      <PageHead
        kicker="TAKEAWAY OPERATIONS"
        title={new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        sub={`${parcels.length} parcel order${parcels.length === 1 ? "" : "s"} created on this date.`}
        action={
          <div className="booking-head-actions"><button className="secondary" onClick={() => setSelectedDate(null)}><ChevronLeft size={15}/> Calendar</button>{canCreateParcel ? <button className="primary" onClick={() => setCreating(true)}><Plus size={15}/> New parcel order</button> : null}</div>
        }
      />
      <div className="parcel-flow">
        <span>
          <b>1</b>Admin takes order
        </span>
        <ArrowRight />
        <span>
          <b>2</b>Chef prepares
        </span>
        <ArrowRight />
        <span>
          <b>3</b>Ready returns here
        </span>
        <ArrowRight />
        <span>
          <b>4</b>Handoff & payment
        </span>
      </div>
      <div className="parcel-grid">
        {parcels.map((o) => (
          <article className={`parcel-card ${o.status}`} key={o.id}>
            <header>
              <div>
                <span>PARCEL</span>
                <h2>#{o.id}</h2>
              </div>
              <Status status={o.paymentStatus === "paid" ? "paid" : o.status} />
            </header>
            <h3>{o.guestName}</h3>
            <p>
              {o.customerPhone || "No phone number"} · {elapsed(o.createdAt)}
            </p>
            <div className="parcel-items">
              {o.items.map((i, index) => (
                <span key={`${i.menuId}-${index}`}>
                  <b>{i.qty}×</b>{" "}
                  {data.menu.find((m) => m.id === i.menuId)?.name}
                </span>
              ))}
            </div>
            {o.paymentStatus === "paid" && o.status !== "completed" ? (
              <div className="parcel-paid-note">
                <CheckCircle2 size={14} /> Already paid · {o.paymentMethod}
              </div>
            ) : null}
            {o.status !== "completed" && o.paymentStatus !== "paid" ? (
              <button
                className="parcel-mark-paid"
                onClick={() => setPrepaying(o)}
              >
                <Banknote size={14} /> Mark as paid now
              </button>
            ) : null}
            {o.status === "ready" ? (
              <button className="primary wide" onClick={() => setPaying(o)}>
                Complete parcel handoff
              </button>
            ) : null}
            {o.status === "completed" && (
              <>
                <div className="parcel-done">
                  <CheckCircle2 size={16} /> Parcel completed · {o.paymentMethod}
                </div>
                <button
                  className="parcel-receipt-button"
                  onClick={() => setPaying(o)}
                >
                  <Printer size={14} /> View / print bill
                </button>
              </>
            )}
          </article>
        ))}
      </div>
      {!parcels.length && (
        <div className="empty-state">
          <Package />
          <h3>No parcel orders</h3>
          <p>Create the first parcel order from this panel.</p>
        </div>
      )}
      {creating && canCreateParcel && (
        <ParcelBuilder
          data={data}
          user={user}
          close={() => setCreating(false)}
          refresh={refresh}
          toast={toast}
        />
      )}{" "}
      {prepaying && (
        <ParcelPaymentModal
          order={prepaying}
          title="Mark parcel as paid"
          copy="Record payment now while the parcel is being prepared."
          action={markPaid}
          close={() => setPrepaying(null)}
        />
      )}{" "}
      {paying && (
        <ParcelHandoffModal
          order={paying}
          data={data}
          complete={collect}
          close={() => setPaying(null)}
        />
      )}
    </>
  );
}
function ParcelHandoffModal({ order, data, complete, close }) {
  const alreadyComplete = order.status === "completed";
  const alreadyPaid = order.paymentStatus === "paid";
  const [step, setStep] = useState(alreadyComplete ? "complete" : "bill"),
    [paymentMethod, setPaymentMethod] = useState(order.paymentMethod || ""),
    [finishing, setFinishing] = useState(false);
  const bill = useMemo(() => calculateBill(order, data), [order, data]);

  async function finish() {
    if (!alreadyPaid && !paymentMethod) return;
    setFinishing(true);
    try {
      await complete(order, alreadyPaid ? order.paymentMethod : paymentMethod);
      setStep("complete");
    } catch {
      // The parent displays the API error as an application toast.
    } finally {
      setFinishing(false);
    }
  }

  return (
    <Modal close={close} wide>
      <div className="parcel-handoff-head">
        <div>
          <span className="eyebrow">
            {step === "complete" ? "PARCEL COMPLETED" : "PARCEL HANDOFF"}
          </span>
          <h2>
            {step === "complete" ? "Final bill" : "Complete parcel"} #{billNumber(order)}
          </h2>
        </div>
        <div className="parcel-stepper" aria-label="Parcel billing steps">
          <span className={step === "bill" ? "active" : "done"}>1 Bill</span>
          <span className={step === "payment" ? "active" : step === "complete" ? "done" : ""}>
            2 Payment
          </span>
          <span className={step === "complete" ? "active" : ""}>3 Complete</span>
        </div>
      </div>

      <div className="parcel-handoff-layout">
        <BillReceipt order={order} data={data} bill={bill} />
        <aside className="parcel-handoff-actions">
          {step === "bill" && (
            <>
              <span className="parcel-step-label">STEP 1 · CHECK THE BILL</span>
              <h3>{money(bill.total)}</h3>
              <p>
                Review the parcel invoice and print it before choosing how the
                customer paid.
              </p>
              <button className="secondary wide" onClick={openPrinter}>
                <Printer size={17} /> Print bill
              </button>
              <button className="primary wide" onClick={() => setStep("payment")}>
                Continue to payment <ArrowRight size={16} />
              </button>
            </>
          )}

          {step === "payment" && (
            <>
              <span className="parcel-step-label">STEP 2 · PAYMENT MODE</span>
              <h3>{money(bill.total)}</h3>
              {alreadyPaid ? (
                <div className="already-paid">
                  <CheckCircle2 size={25} />
                  <div>
                    <b>Already paid</b>
                    <small>{order.paymentMethod} was recorded earlier.</small>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    className={`pay-card ${paymentMethod === "Cash" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("Cash")}
                  >
                    <Banknote />
                    <span>
                      <b>Cash</b>
                      <small>Cash payment received</small>
                    </span>
                    {paymentMethod === "Cash" && <CheckCircle2 />}
                  </button>
                  <button
                    className={`pay-card ${paymentMethod === "Card / UPI" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("Card / UPI")}
                  >
                    <CreditCard />
                    <span>
                      <b>Card / UPI</b>
                      <small>Digital payment received</small>
                    </span>
                    {paymentMethod === "Card / UPI" && <CheckCircle2 />}
                  </button>
                </>
              )}
              <button
                className="primary wide parcel-complete-button"
                disabled={finishing || (!alreadyPaid && !paymentMethod)}
                onClick={finish}
              >
                {finishing ? "Completing…" : "Complete parcel bill"}
                {!finishing && <CheckCircle2 size={16} />}
              </button>
              <button className="link wide" onClick={() => setStep("bill")}>
                Back to bill
              </button>
            </>
          )}

          {step === "complete" && (
            <div className="parcel-final-state">
              <CheckCircle2 size={38} />
              <span>PAYMENT COMPLETE</span>
              <h3>{money(bill.total)}</h3>
              <p>
                Parcel #{billNumber(order)} was completed by {paymentMethod || order.paymentMethod}.
              </p>
              <button className="primary wide" onClick={openPrinter}>
                <Printer size={17} /> Print final bill
              </button>
              <button className="secondary wide" onClick={close}>
                Close
              </button>
            </div>
          )}
        </aside>
      </div>
    </Modal>
  );
}
function ParcelPaymentModal({ order, title, copy, action, close }) {
  return (
    <Modal close={close}>
      <span className="eyebrow">PARCEL PAYMENT</span>
      <h2>
        {title} #{order.id}
      </h2>
      <p>{copy}</p>
      <button
        className="pay-card cash-first"
        onClick={() => action(order, "Cash")}
      >
        <Banknote />
        <span>
          <b>Cash</b>
          <small>Cash payment received</small>
        </span>
        <ArrowRight />
      </button>
      <button className="pay-card" onClick={() => action(order, "Card / UPI")}>
        <CreditCard />
        <span>
          <b>Card / UPI</b>
          <small>Digital payment received</small>
        </span>
        <ArrowRight />
      </button>
    </Modal>
  );
}
function ParcelBuilder({ data, user, close, refresh, toast }) {
  const [cart, setCart] = useState([]),
    [customer, setCustomer] = useState(""),
    [phone, setPhone] = useState(""),
    [paymentMethod, setPaymentMethod] = useState("");
  function add(id) {
    setCart((c) => {
      const found = c.find((i) => i.menuId === id);
      return found ? c : [...c, { menuId: id, qty: 1, note: "" }];
    });
  }
  function change(id, delta) {
    setCart((c) =>
      c
        .map((i) => (i.menuId === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  }
  async function send() {
    try {
      await api("/parcels", {
        method: "POST",
        body: JSON.stringify({
          customerName: customer,
          customerPhone: phone,
          adminName: user.name,
          items: cart,
          paymentMethod: paymentMethod || null,
        }),
      });
      await refresh();
      toast(
        paymentMethod
          ? `Parcel paid by ${paymentMethod} and sent to Chef`
          : "Parcel sent to Chef — payment due at handoff",
      );
      close();
    } catch (e) {
      toast(e.message);
    }
  }
  return (
    <Modal close={close} wide>
      <span className="eyebrow">NEW PARCEL ORDER</span>
      <h2>Take a parcel order</h2>
      <div className="parcel-customer">
        <input
          placeholder="Customer name"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
        />
        <input
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="order-builder">
        <div className="menu-list">
          {data.menu.map((m) => (
            <button key={m.id} disabled={!m.available} className={`${cart.some((item) => item.menuId === m.id) ? "selected-food" : ""} ${!m.available ? "dish-disabled" : ""}`} onClick={() => add(m.id)}>
              <span>
                {m.imageUrl ? <img src={m.imageUrl} alt="" /> : m.icon}
              </span>
              <div>
                <b>{m.name}</b>
                <small>{m.category}</small>
              </div>
              <strong>{!m.available ? "Unavailable" : cart.some((item) => item.menuId === m.id) ? <><CheckCircle2 size={14}/> Selected</> : money(m.price)}</strong>
            </button>
          ))}
        </div>
        <aside className="order-cart">
          <h3>Parcel basket</h3>
          <p>Items will be sent directly to Chef</p>
          <div className="cart-lines">
            {cart.map((i) => {
              const m = data.menu.find((x) => x.id === i.menuId);
              return (
                <div key={i.menuId}>
                  <div>
                    <b>{m.name}</b>
                    <small>{money(m.price)} each</small>
                  </div>
                  <span>
                    <button onClick={() => change(i.menuId, -1)}>
                      <Minus size={12} />
                    </button>
                    {i.qty}
                    <button onClick={() => change(i.menuId, 1)}>
                      <Plus size={12} />
                    </button>
                  </span>
                  <strong>{money(m.price * i.qty)}</strong>
                </div>
              );
            })}
          </div>
          <div className="cart-total">
            <span>Subtotal</span>
            <b>
              {money(
                cart.reduce(
                  (s, i) =>
                    s + data.menu.find((m) => m.id === i.menuId).price * i.qty,
                  0,
                ),
              )}
            </b>
          </div>
          <div className="parcel-payment-choice">
            <small>PAYMENT STATUS</small>
            <button
              className={!paymentMethod ? "selected" : ""}
              onClick={() => setPaymentMethod("")}
            >
              Pay on handoff
            </button>
            <button
              className={paymentMethod === "Cash" ? "selected" : ""}
              onClick={() => setPaymentMethod("Cash")}
            >
              Cash paid
            </button>
            <button
              className={paymentMethod === "Card / UPI" ? "selected" : ""}
              onClick={() => setPaymentMethod("Card / UPI")}
            >
              Card / UPI paid
            </button>
          </div>
          <button
            className="primary wide"
            disabled={!cart.length || !customer}
            onClick={send}
          >
            Send parcel to kitchen <ChefHat size={15} />
          </button>
        </aside>
      </div>
    </Modal>
  );
}
function OrderTable({ orders, tables }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Type / Guest</th>
            <th>Created by</th>
            <th>Items</th>
            <th>Status</th>
            <th>Started</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <b>#{o.id}</b>
              </td>
              <td>
                <b>
                  {o.orderType === "parcel"
                    ? "Parcel"
                    : `Table ${tables.find((t) => t.id === o.tableId)?.number}`}
                </b>
                <small>{o.guestName}</small>
              </td>
              <td>{o.waiter}</td>
              <td>{o.items.reduce((s, x) => s + x.qty, 0)} items</td>
              <td>
                <Status
                  status={o.paymentStatus === "paid" ? "paid" : o.status}
                />
              </td>
              <td>{elapsed(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Status({ status }) {
  return (
    <span className={`status ${status}`}>
      {status === "chef" ? "Head Chef" : status}
    </span>
  );
}
function Stock({ data, refresh, toast, user }) {
  const [editing, setEditing] = useState(null),
    [moving, setMoving] = useState(null),
    [tab, setTab] = useState("inventory"),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [health, setHealth] = useState("all"),
    [movementFilter, setMovementFilter] = useState("all");
  const low = data.inventory.filter((i) => i.quantity <= i.min),
    value = data.inventory.reduce((s, i) => s + i.quantity * i.cost, 0),
    transactions = data.inventoryTransactions || [],
    purchases = transactions
      .filter((x) => x.movementType === "purchase")
      .reduce((s, x) => s + Math.abs(x.quantity) * (x.unitCost || 0), 0),
    cutoff = Date.now() - 30 * 86400000,
    recent = transactions.filter((x) => new Date(x.createdAt).getTime() >= cutoff),
    usageCost = recent
      .filter((x) => x.movementType === "usage")
      .reduce((s, x) => s + Math.abs(x.quantity) * (x.unitCost || 0), 0),
    wasteCost = recent
      .filter((x) => x.movementType === "waste")
      .reduce((s, x) => s + Math.abs(x.quantity) * (x.unitCost || 0), 0),
    todayKey = dateKey(new Date()),
    todayMovements = transactions.filter((x) => dateKey(x.createdAt) === todayKey),
    todayReceived = todayMovements.filter((x) => x.movementType === "purchase").reduce((s, x) => s + Math.abs(x.quantity), 0),
    todayUsed = todayMovements.filter((x) => x.movementType === "usage").reduce((s, x) => s + Math.abs(x.quantity), 0),
    todayWaste = todayMovements.filter((x) => x.movementType === "waste").reduce((s, x) => s + Math.abs(x.quantity), 0),
    categories = [...new Set(data.inventory.map((i) => i.category).filter(Boolean))].sort(),
    visibleInventory = data.inventory.filter((item) => {
      const matchesText = `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()),
        matchesCategory = category === "all" || item.category === category,
        state = item.quantity === 0 ? "out" : item.quantity <= item.min ? "low" : "healthy";
      return matchesText && matchesCategory && (health === "all" || health === state);
    }),
    filteredTransactions = transactions.filter((x) =>
      movementFilter === "all" ? true : x.movementType === movementFilter,
    ),
    planning = data.inventory
      .map((item) => {
        const consumed = recent
            .filter((x) => x.inventoryId === item.id && ["usage", "waste"].includes(x.movementType))
            .reduce((s, x) => s + Math.abs(x.quantity), 0),
          dailyUse = consumed / 30,
          daysCover = dailyUse > 0 ? item.quantity / dailyUse : null,
          reorderQty = Math.max(0, item.min * 2 - item.quantity);
        return { ...item, consumed, dailyUse, daysCover, reorderQty, reorderCost: reorderQty * item.cost };
      })
      .sort((a, b) => (a.daysCover ?? 9999) - (b.daysCover ?? 9999)),
    reorderItems = planning.filter((x) => x.quantity <= x.min || (x.daysCover !== null && x.daysCover <= 7)),
    reorderCost = reorderItems.reduce((s, x) => s + x.reorderCost, 0);
  const stockRequests = data.stockRequests || [];
  async function updateRequest(request, status) {
    try { await api(`/stock-requests/${request.id}/status`, { method:"PATCH", body:JSON.stringify({status}) }); await refresh(); toast(`${request.itemName} request marked ${status}`); }
    catch (error) { toast(error.message); }
  }
  const exportMovements = () =>
    exportCsv(`knockout-stock-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Date", "Item", "Category", "Movement", "Quantity", "Unit", "Unit cost", "Value", "Note", "Recorded by"],
      ...filteredTransactions.map((entry) => {
        const item = data.inventory.find((x) => x.id === entry.inventoryId);
        return [entry.createdAt, item?.name, item?.category, entry.movementType, entry.quantity, item?.unit, entry.unitCost, Math.abs(entry.quantity) * (entry.unitCost || 0), entry.note, entry.createdBy];
      }),
    ]);
  return (
    <>
      <PageHead
        kicker="INVENTORY OPERATIONS"
        title="Stock Management"
        sub="Track every ingredient, purchase, consumption, adjustment, and waste movement."
        action={
          <button className="primary" onClick={() => setEditing({})}>
            <Plus size={15} /> Add stock item
          </button>
        }
      />
      <div className="stats">
        <Stat
          icon={Boxes}
          label="Stock Items"
          value={data.inventory.length}
          note={`${new Set(data.inventory.map((i) => i.category)).size} categories`}
        />
        <Stat
          icon={AlertTriangle}
          label="Low / Out of Stock"
          value={low.length}
          note="Purchase action required"
          tone="warning"
        />
        <Stat
          icon={Banknote}
          label="Inventory Value"
          value={money(value)}
          note="Quantity × unit cost"
        />
        <Stat
          icon={ShoppingCart}
          label="Recorded Purchases"
          value={money(purchases)}
          note="From stock movement history"
        />
        <Stat
          icon={ArrowDownUp}
          label="30-day Consumption"
          value={money(usageCost)}
          note="Kitchen usage at recorded cost"
        />
        <Stat
          icon={AlertTriangle}
          label="30-day Waste"
          value={money(wasteCost)}
          note="Spoilage and wastage cost"
          tone="warning"
        />
        <Stat
          icon={Gauge}
          label="Reorder Estimate"
          value={money(reorderCost)}
          note={`${reorderItems.length} items need attention`}
          tone={reorderItems.length ? "warning" : undefined}
        />
      </div>
      <section className="stock-daily-desk">
        <div><span className="eyebrow">TODAY'S STOCK DESK</span><h3>Daily inventory movement</h3><p>{todayMovements.length} movements recorded today</p></div>
        <span className="stock-daily-number received"><b>+{todayReceived.toFixed(2)}</b><small>Received</small></span>
        <span className="stock-daily-number used"><b>−{todayUsed.toFixed(2)}</b><small>Used</small></span>
        <span className="stock-daily-number waste"><b>−{todayWaste.toFixed(2)}</b><small>Wasted</small></span>
        <div className="stock-urgent-actions"><small>{low.length ? `${low.length} urgent items` : "Stock healthy"}</small>{low.slice(0,3).map((item)=><button key={item.id} onClick={()=>setMoving(item)}><Plus size={12}/>{item.name}</button>)}</div>
      </section>
      {stockRequests.length ? <section className="panel admin-stock-requests"><PanelHead title="Chef stock requests" sub="Kitchen replenishment notifications and purchase progress"/><div>{stockRequests.map((request)=><article className={request.status} key={request.id}><span><Bell/><i/></span><div><b>{request.itemName}</b><small>{request.requestedBy} requested {request.requestedQuantity} {request.unit} · Current {request.currentQuantity} {request.unit}</small><p>{request.note || "Kitchen stock is approaching its minimum level."}</p></div><Status status={request.status}/><time>{new Date(request.createdAt).toLocaleString("en-IN")}</time><div className="request-actions">{request.status==="pending"?<button onClick={()=>updateRequest(request,"ordered")}>Mark ordered</button>:null}{request.status!=="resolved"?<button onClick={()=>updateRequest(request,"resolved")}>Resolve</button>:null}</div></article>)}</div></section>:null}
      <div className="inventory-tabs">
        <button
          className={tab === "inventory" ? "active" : ""}
          onClick={() => setTab("inventory")}
        >
          Current inventory
        </button>
        <button
          className={tab === "activity" ? "active" : ""}
          onClick={() => setTab("activity")}
        >
          Movement history
        </button>
        <button
          className={tab === "planning" ? "active" : ""}
          onClick={() => setTab("planning")}
        >
          Reorder & forecasting
        </button>
      </div>
      {tab === "inventory" ? (
        <>
          <div className="stock-toolbar">
            <label><Search size={15}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search item or category…"/></label>
            <ThemeSelect value={category} onChange={setCategory} options={[{value:"all",label:"All categories"},...categories.map((x)=>({value:x,label:x}))]}/>
            <ThemeSelect value={health} onChange={setHealth} options={[{value:"all",label:"All stock levels"},{value:"healthy",label:"Healthy"},{value:"low",label:"Low stock"},{value:"out",label:"Out of stock"}]}/>
            <span>{visibleInventory.length} items shown</span>
          </div>
          <div className="stock-grid">
          {visibleInventory.map((item) => {
            const ratio = item.min ? item.quantity / item.min : 2,
              status =
                item.quantity === 0
                  ? "Out of stock"
                  : ratio <= 1
                    ? "Low stock"
                    : "Healthy";
            return (
              <article
                className={`stock-card ${ratio <= 1 ? "low" : ""}`}
                key={item.id}
              >
                <header>
                  <span>{item.category || "General"}</span>
                  <em>{status}</em>
                </header>
                <h2>{item.name}</h2>
                <div className="stock-quantity">
                  <b>{item.quantity}</b>
                  <span>
                    {item.unit}
                    <small>minimum {item.min}</small>
                  </span>
                </div>
                <div className="stock-meter">
                  <i style={{ width: `${Math.min(100, ratio * 50)}%` }} />
                </div>
                <footer>
                  <span>
                    <small>Unit cost</small>
                    <b>{money(item.cost)}</b>
                  </span>
                  <span>
                    <small>Stock value</small>
                    <b>{money(item.quantity * item.cost)}</b>
                  </span>
                </footer>
                <div className="stock-actions">
                  <button onClick={() => setEditing(item)}>Edit details</button>
                  <button onClick={() => setMoving(item)}>
                    <ArrowDownUp size={13} /> Record movement
                  </button>
                </div>
              </article>
            );
          })}
          </div>
          {!visibleInventory.length?<div className="empty-state"><Search/><h3>No matching stock items</h3><p>Try changing the search or stock-level filter.</p></div>:null}
        </>
      ) : tab === "activity" ? (
        <section className="panel">
          <div className="stock-history-tools">
            <div>{["all","purchase","usage","waste","adjustment"].map((x)=><button key={x} className={movementFilter===x?"active":""} onClick={()=>setMovementFilter(x)}>{x}</button>)}</div>
            <button className="secondary" onClick={exportMovements}><FileDown size={14}/> Export CSV</button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Stock item</th>
                  <th>Movement</th>
                  <th>Quantity</th>
                  <th>Unit cost</th>
                  <th>Note / Admin</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((entry) => {
                  const item = data.inventory.find(
                    (x) => x.id === entry.inventoryId,
                  );
                  return (
                    <tr key={entry.id}>
                      <td>
                        {new Date(entry.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <b>{item?.name || "Removed item"}</b>
                      </td>
                      <td>
                        <Status status={entry.movementType} />
                      </td>
                      <td
                        className={
                          entry.quantity < 0 ? "amount-out" : "amount-in"
                        }
                      >
                        {entry.quantity > 0 ? "+" : ""}
                        {entry.quantity} {item?.unit}
                      </td>
                      <td>{money(entry.unitCost)}</td>
                      <td>
                        {entry.note || "—"}
                        <small>{entry.createdBy}</small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filteredTransactions.length ? (
            <div className="empty-state">
              <ArrowDownUp />
              <h3>No stock movements yet</h3>
            </div>
          ) : null}
        </section>
      ) : (
        <div className="stock-planning-grid">
          <section className="panel">
            <PanelHead title="Smart reorder plan" sub="Items below minimum level or with seven days of estimated cover" />
            <div className="table-scroll"><table><thead><tr><th>Item</th><th>On hand</th><th>30-day usage</th><th>Days cover</th><th>Suggested order</th><th>Estimated cost</th><th></th></tr></thead><tbody>{reorderItems.map((item)=><tr key={item.id}><td><b>{item.name}</b><small>{item.category}</small></td><td className={item.quantity<=item.min?"amount-out":""}>{item.quantity} {item.unit}</td><td>{item.consumed.toFixed(2)} {item.unit}</td><td>{item.daysCover===null?"No usage data":`${Math.max(0,item.daysCover).toFixed(1)} days`}</td><td><b>{item.reorderQty.toFixed(2)} {item.unit}</b></td><td>{money(item.reorderCost)}</td><td><button className="mini-action" onClick={()=>setMoving(item)}>Add stock</button></td></tr>)}</tbody></table></div>
            {!reorderItems.length?<div className="empty-state"><CheckCircle2/><h3>Stock levels are healthy</h3><p>No item currently needs a suggested reorder.</p></div>:null}
          </section>
          <aside className="panel stock-risk-summary"><PanelHead title="Inventory health" sub="Operational signals from the last 30 days"/><div><span>Current stock value <b>{money(value)}</b></span><span>Suggested reorder <b>{money(reorderCost)}</b></span><span>Kitchen consumption <b>{money(usageCost)}</b></span><span>Waste cost <b className="amount-out">{money(wasteCost)}</b></span><span>Waste / consumption <b>{usageCost?`${((wasteCost/usageCost)*100).toFixed(1)}%`:"—"}</b></span></div></aside>
        </div>
      )}
      {editing ? (
        <StockEditor
          item={editing.id ? editing : null}
          close={() => setEditing(null)}
          refresh={refresh}
          toast={toast}
          user={user}
        />
      ) : null}
      {moving ? (
        <StockMovement
          item={moving}
          close={() => setMoving(null)}
          refresh={refresh}
          toast={toast}
          user={user}
        />
      ) : null}
    </>
  );
}
function StockEditor({ item, close, refresh, toast, user }) {
  const [form, setForm] = useState(
      item
        ? {
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            min: item.min,
            cost: item.cost,
          }
        : { name: "", category: "", quantity: 0, unit: "kg", min: 0, cost: 0 },
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(item ? `/inventory/${item.id}` : "/inventory", {
        method: item ? "PUT" : "POST",
        body: JSON.stringify({ ...form, createdBy: user.name }),
      });
      await refresh();
      toast(item ? "Stock item updated" : "Stock item created");
      close();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">STOCK CATALOG</span>
      <h2>{item ? "Edit stock item" : "Add stock item"}</h2>
      <form className="modal-form" onSubmit={save}>
        <label>
          Ingredient / item name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Category
            <input
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </label>
          <label>
            Unit
            <ThemeSelect
              value={form.unit}
              onChange={(unit) => setForm({ ...form, unit })}
              options={["kg", "g", "L", "ml", "pcs", "pack"]}
            />
          </label>
        </div>
        {!item ? (
          <label>
            Opening quantity
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </label>
        ) : null}
        <div className="form-grid">
          <label>
            Minimum level
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.min}
              onChange={(e) => setForm({ ...form, min: e.target.value })}
            />
          </label>
          <label>
            Unit cost
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />
          </label>
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary wide" disabled={busy}>
          {busy ? "Saving…" : "Save stock item"}
        </button>
      </form>
    </Modal>
  );
}
function StockMovement({ item, close, refresh, toast, user }) {
  const [form, setForm] = useState({
      movementType: "purchase",
      quantity: "",
      unitCost: item.cost,
      note: "",
      adjustmentDirection: 1,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/inventory/${item.id}/movements`, {
        method: "POST",
        body: JSON.stringify({ ...form, createdBy: user.name }),
      });
      await refresh();
      toast(`${item.name} stock movement recorded`);
      close();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">STOCK MOVEMENT</span>
      <h2>{item.name}</h2>
      <p>
        Current stock: {item.quantity} {item.unit}
      </p>
      <form className="modal-form" onSubmit={save}>
        <label>
          Movement type
          <ThemeSelect
            value={form.movementType}
            onChange={(movementType) => setForm({ ...form, movementType })}
            options={[{value:"purchase",label:"Purchase / stock in"},{value:"usage",label:"Kitchen usage"},{value:"waste",label:"Waste / spoilage"},{value:"adjustment",label:"Manual adjustment"}]}
          />
        </label>
        {form.movementType === "adjustment" ? (
          <label>
            Adjustment direction
            <ThemeSelect
              value={form.adjustmentDirection}
              onChange={(adjustmentDirection) => setForm({ ...form, adjustmentDirection: Number(adjustmentDirection) })}
              options={[{value:1,label:"Increase stock"},{value:-1,label:"Decrease stock"}]}
            />
          </label>
        ) : null}
        <div className="form-grid">
          <label>
            Quantity ({item.unit})
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </label>
          <label>
            Unit cost
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
            />
          </label>
        </div>
        <label>
          Notes
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Invoice, supplier, reason…"
          />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary wide" disabled={busy}>
          Record movement
        </button>
      </form>
    </Modal>
  );
}
function Finance({ data, refresh, toast, user }) {
  const [creating, setCreating] = useState(false),
    entries = data.financeEntries || [],
    sales = data.orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((s, o) => s + Number(o.total || 0), 0),
    income = entries
      .filter((x) => x.entryType === "income")
      .reduce((s, x) => s + x.amount, 0),
    expenses = entries
      .filter((x) => x.entryType === "expense")
      .reduce((s, x) => s + x.amount, 0),
    net = sales + income - expenses;
  async function remove(entry) {
    if (!confirm(`Delete ${entry.description}?`)) return;
    try {
      await api(`/finance/${entry.id}`, { method: "DELETE" });
      await refresh();
      toast("Finance entry deleted");
    } catch (e) {
      toast(e.message);
    }
  }
  return (
    <>
      <PageHead
        kicker="FINANCIAL CONTROL"
        title="Finance Management"
        sub="Track restaurant sales, additional income, operating expenses, and net cash position."
        action={
          <button className="primary" onClick={() => setCreating(true)}>
            <Plus size={15} /> Add finance entry
          </button>
        }
      />
      <div className="stats finance-stats">
        <Stat
          icon={TrendingUp}
          label="Order Revenue"
          value={money(sales)}
          note="All paid dine-in and parcel bills"
        />
        <Stat
          icon={ArrowDownUp}
          label="Other Income"
          value={money(income)}
          note="Manual income entries"
        />
        <Stat
          icon={Wallet}
          label="Expenses"
          value={money(expenses)}
          note="Recorded operating costs"
          tone="warning"
        />
        <Stat
          icon={Banknote}
          label="Net Balance"
          value={money(net)}
          note="Revenue + income − expenses"
        />
      </div>
      <div className="finance-grid">
        <section className="panel">
          <PanelHead
            title="Finance ledger"
            sub="Manual income and expense entries"
          />
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category / Description</th>
                  <th>Payment</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      {new Date(entry.entryDate).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <Status status={entry.entryType} />
                    </td>
                    <td>
                      <b>{entry.category}</b>
                      <small>{entry.description}</small>
                    </td>
                    <td>{entry.paymentMethod}</td>
                    <td>{entry.reference || "—"}</td>
                    <td
                      className={
                        entry.entryType === "expense"
                          ? "amount-out"
                          : "amount-in"
                      }
                    >
                      {entry.entryType === "expense" ? "-" : "+"}
                      {money(entry.amount)}
                    </td>
                    <td>
                      <button
                        className="icon-delete"
                        onClick={() => remove(entry)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!entries.length ? (
            <div className="empty-state">
              <Wallet />
              <h3>No finance entries</h3>
              <p>
                Paid order revenue is already included. Add rent, purchases,
                utilities, or other income here.
              </p>
            </div>
          ) : null}
        </section>
        <aside className="panel finance-summary">
          <PanelHead title="Cash position" sub="Current recorded totals" />
          <div>
            <span>
              Paid order sales<b>{money(sales)}</b>
            </span>
            <span>
              Additional income<b className="amount-in">+{money(income)}</b>
            </span>
            <span>
              Operating expenses<b className="amount-out">−{money(expenses)}</b>
            </span>
            <span className="finance-net">
              Net balance<b>{money(net)}</b>
            </span>
          </div>
        </aside>
      </div>
      {creating ? (
        <FinanceEntry
          close={() => setCreating(false)}
          refresh={refresh}
          toast={toast}
          user={user}
        />
      ) : null}
    </>
  );
}
function FinanceEntry({ close, refresh, toast, user }) {
  const today = new Date().toISOString().slice(0, 10),
    [form, setForm] = useState({
      entryType: "expense",
      category: "Purchases",
      description: "",
      amount: "",
      paymentMethod: "Cash",
      entryDate: today,
      reference: "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/finance", {
        method: "POST",
        body: JSON.stringify({ ...form, createdBy: user.name }),
      });
      await refresh();
      toast("Finance entry recorded");
      close();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">FINANCE LEDGER</span>
      <h2>Add finance entry</h2>
      <form className="modal-form" onSubmit={save}>
        <div className="form-grid">
          <label>
            Entry type
            <ThemeSelect
              value={form.entryType}
              onChange={(entryType) => setForm({ ...form, entryType })}
              options={[{value:"expense",label:"Expense"},{value:"income",label:"Income"}]}
            />
          </label>
          <label>
            Category
            <input
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </label>
        </div>
        <label>
          Description
          <input
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Amount
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </label>
          <label>
            Payment method
            <ThemeSelect
              value={form.paymentMethod}
              onChange={(paymentMethod) => setForm({ ...form, paymentMethod })}
              options={["Cash", "Card / UPI", "Bank Transfer"]}
            />
          </label>
        </div>
        <div className="form-grid">
          <label>
            Date
            <input
              required
              type="date"
              value={form.entryDate}
              onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
            />
          </label>
          <label>
            Reference
            <input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
          </label>
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary wide" disabled={busy}>
          Save finance entry
        </button>
      </form>
    </Modal>
  );
}

const dateKey = (value) => {
  if (!value) return "";
  const d = new Date(value),
    pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
function DailyFinance(props) {
  const [selectedDate, setSelectedDate] = useState(null);
  return selectedDate ? (
    <DailyFinanceDetails
      {...props}
      initialDate={selectedDate}
      onBack={() => setSelectedDate(null)}
    />
  ) : (
    <FinanceCalendar data={props.data} selectDate={setSelectedDate} />
  );
}
function FinanceCalendar({ data, selectDate }) {
  const today = new Date(),
    [month, setMonth] = useState(
      () => new Date(today.getFullYear(), today.getMonth(), 1),
    ),
    year = month.getFullYear(),
    monthIndex = month.getMonth(),
    days = new Date(year, monthIndex + 1, 0).getDate(),
    leading = new Date(year, monthIndex, 1).getDay(),
    entries = data.financeEntries || [],
    purchases = data.supplierPurchases || [],
    payments = data.supplierPayments || [],
    cells = [
      ...Array(leading).fill(null),
      ...Array.from({ length: days }, (_, i) => i + 1),
    ];
  while (cells.length % 7) cells.push(null);
  const keyFor = (day) =>
      `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    metrics = (day) => {
      const key = keyFor(day),
        bills = data.orders.filter(
          (o) => o.paymentStatus === "paid" && dateKey(o.completedAt) === key,
        ),
        sales = bills.reduce((s, o) => s + Number(o.total || 0), 0),
        expense = entries
          .filter(
            (x) => x.entryType === "expense" && dateKey(x.entryDate) === key,
          )
          .reduce((s, x) => s + x.amount, 0),
        dealerPaid = payments
          .filter((x) => dateKey(x.paymentDate) === key)
          .reduce((s, x) => s + x.amount, 0),
        bought = purchases
          .filter((x) => dateKey(x.purchaseDate) === key)
          .reduce((s, x) => s + x.totalAmount, 0);
      return {
        bills: bills.length,
        sales,
        spent: expense + dealerPaid,
        bought,
        activity: bills.length || expense || dealerPaid || bought,
      };
    },
    monthMetrics = Array.from({ length: days }, (_, i) => metrics(i + 1)),
    monthSales = monthMetrics.reduce((s, x) => s + x.sales, 0),
    monthSpent = monthMetrics.reduce((s, x) => s + x.spent, 0),
    monthPurchases = monthMetrics.reduce((s, x) => s + x.bought, 0),
    monthBills = monthMetrics.reduce((s, x) => s + x.bills, 0);
  return (
    <>
      <PageHead
        kicker="FINANCIAL CALENDAR"
        title="Choose a finance date"
        sub="Select a day to open its bills, spending, purchases, dealer payments, and daily calculation."
      />
      <div className="monthly-report-selector"><div><span className="eyebrow">OVERALL REVENUE REPORT</span><b>Select any month to review the complete business performance</b></div><label>REPORT MONTH<input type="month" value={`${year}-${String(monthIndex+1).padStart(2,"0")}`} onChange={(event)=>{const [nextYear,nextMonth]=event.target.value.split("-").map(Number);if(nextYear&&nextMonth)setMonth(new Date(nextYear,nextMonth-1,1));}}/></label></div>
      <div className="finance-month-summary">
        <DailyKpi icon={ReceiptText} label="Monthly bills" value={monthBills} amount={monthSales} tone="income" />
        <DailyKpi icon={Wallet} label="Cash paid out" value={money(monthSpent)} note="Expenses and dealer payments" tone="expense" />
        <DailyKpi icon={ShoppingCart} label="Purchase invoices" value={money(monthPurchases)} note="Products bought this month" />
        <DailyKpi icon={TrendingUp} label="Monthly net cash" value={money(monthSales-monthSpent)} note="Paid bills minus cash outflow" tone={monthSales-monthSpent>=0?"income":"expense"} />
      </div>
      <MonthlyRevenueReport data={data} year={year} monthIndex={monthIndex}/>
      <section className="finance-calendar">
        <header>
          <div>
            <span>FINANCE RECORDS</span>
            <h2>
              {month.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>
          <div>
            <button onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}>
              <ChevronLeft size={18} />
            </button>
            <button
              className="calendar-today"
              onClick={() =>
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
              }
            >
              Today
            </button>
            <button onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}>
              <ChevronRight size={18} />
            </button>
          </div>
        </header>
        <div className="finance-weekdays">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        <div className="finance-month-grid">
          {cells.map((day, index) => {
            if (!day)
              return <span className="calendar-blank" key={`blank-${index}`} />;
            const item = metrics(day),
              key = keyFor(day),
              isToday = key === dateKey(today),
              weekend = index % 7 === 0 || index % 7 === 6;
            return (
              <button
                key={key}
                className={`${item.activity ? "has-activity" : ""} ${isToday ? "is-today" : ""} ${weekend ? "weekend" : ""}`}
                onClick={() => selectDate(key)}
              >
                <header>
                  <b>{day}</b>
                  <em>{item.activity ? "REC" : weekend ? "W/E" : "OPEN"}</em>
                </header>
                {item.activity ? (
                  <div className="calendar-day-data">
                    <strong>{money(item.sales - item.spent)}</strong>
                    <small>Net cash</small>
                    <p>
                      <span>{item.bills} bills</span>
                      <span>{money(item.spent)} spent</span>
                    </p>
                    {item.bought > 0 ? (
                      <u>{money(item.bought)} products</u>
                    ) : null}
                  </div>
                ) : (
                  <div className="calendar-no-data">
                    <CalendarDays size={19} />
                    <small>No records</small>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <footer>
          <span>
            <i className="activity" /> Financial records
          </span>
          <span>
            <i className="today" /> Today
          </span>
          <span>
            <i /> No records
          </span>
        </footer>
      </section>
    </>
  );
}

function MonthlyRevenueReport({ data, year, monthIndex }) {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    orders = data.orders.filter((order) => order.paymentStatus === "paid" && dateKey(order.completedAt).startsWith(prefix)),
    entries = (data.financeEntries || []).filter((entry) => dateKey(entry.entryDate).startsWith(prefix)),
    payments = (data.supplierPayments || []).filter((payment) => dateKey(payment.paymentDate).startsWith(prefix)),
    revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    income = entries.filter((entry) => entry.entryType === "income").reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    expenses = entries.filter((entry) => entry.entryType === "expense").reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    dealerPayments = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    net = revenue + income - expenses - dealerPayments,
    days = new Date(year, monthIndex + 1, 0).getDate(),
    daily = Array.from({ length: days }, (_, index) => {
      const key = `${prefix}-${String(index + 1).padStart(2, "0")}`,
        rows = orders.filter((order) => dateKey(order.completedAt) === key),
        total = rows.reduce((sum, order) => sum + Number(order.total || 0), 0);
      return { key, bills: rows.length, total };
    }),
    paymentMix = Object.entries(orders.reduce((result, order) => { const method = order.paymentMethod || "Unspecified"; result[method] = (result[method] || 0) + Number(order.total || 0); return result; }, {})),
    maxRevenue = Math.max(1, ...daily.map((day) => day.total));
  const exportMonth = () => exportCsv(`knockout-revenue-${prefix}.csv`, [
    ["KnockOUT monthly revenue report", prefix], ["Metric", "Amount"], ["Bill revenue", revenue], ["Other income", income], ["Operating expenses", expenses], ["Dealer payments", dealerPayments], ["Net cash", net], ["Paid bills", orders.length], [], ["Date", "Bills", "Revenue"], ...daily.map((day) => [day.key, day.bills, day.total]), [], ["Payment method", "Revenue"], ...paymentMix,
  ]);
  return <section className="panel monthly-revenue-report">
    <header><div><span className="eyebrow">MONTHLY PERFORMANCE</span><h2>{new Date(year,monthIndex,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"})} revenue report</h2><p>Complete paid-bill revenue, inflow, outflow, and daily sales performance.</p></div><button className="secondary" onClick={exportMonth}><FileDown size={14}/> Export monthly CSV</button></header>
    <div className="monthly-report-kpis"><span><small>Overall revenue</small><b>{money(revenue)}</b><em>{orders.length} completed bills</em></span><span><small>Average bill</small><b>{money(orders.length?revenue/orders.length:0)}</b><em>Per paid order</em></span><span><small>Total cash outflow</small><b className="amount-out">{money(expenses+dealerPayments)}</b><em>Expenses + dealers</em></span><span><small>Net business cash</small><b className={net>=0?"amount-in":"amount-out"}>{money(net)}</b><em>Revenue + income − outflow</em></span></div>
    <div className="monthly-report-body"><div className="monthly-bars">{daily.map((day)=><button key={day.key} title={`${day.key}: ${money(day.total)} from ${day.bills} bills`}><i style={{height:`${Math.max(day.total?5:1,(day.total/maxRevenue)*100)}%`}}/><small>{Number(day.key.slice(-2))}</small></button>)}</div><aside><h3>Payment collection</h3>{paymentMix.map(([method,amount])=><span key={method}><b>{method}</b><em>{revenue?`${((amount/revenue)*100).toFixed(1)}%`:"0%"}</em><strong>{money(amount)}</strong></span>)}{!paymentMix.length?<p>No paid bills in this month.</p>:null}</aside></div>
  </section>;
}
function DailyFinanceDetails({
  data,
  refresh,
  toast,
  user,
  initialDate,
  onBack,
}) {
  const date = initialDate,
    [tab, setTab] = useState("daily"),
    [creatingEntry, setCreatingEntry] = useState(false),
    [creatingPurchase, setCreatingPurchase] = useState(false),
    [paying, setPaying] = useState(null),
    entries = data.financeEntries || [],
    purchases = data.supplierPurchases || [],
    payments = data.supplierPayments || [];
  const dailyBills = data.orders.filter(
      (o) => o.paymentStatus === "paid" && dateKey(o.completedAt) === date,
    ),
    billTotal = dailyBills.reduce((s, o) => s + Number(o.total || 0), 0),
    dailyEntries = entries.filter((x) => dateKey(x.entryDate) === date),
    generalExpense = dailyEntries
      .filter((x) => x.entryType === "expense")
      .reduce((s, x) => s + x.amount, 0),
    otherIncome = dailyEntries
      .filter((x) => x.entryType === "income")
      .reduce((s, x) => s + x.amount, 0),
    dailyPurchases = purchases.filter((x) => dateKey(x.purchaseDate) === date),
    purchasedTotal = dailyPurchases.reduce((s, x) => s + x.totalAmount, 0),
    dailyPayments = payments.filter((x) => dateKey(x.paymentDate) === date),
    dealerPaid = dailyPayments.reduce((s, x) => s + x.amount, 0),
    dailyOutflow = generalExpense + dealerPaid,
    totalDue = purchases.reduce(
      (sum, p) =>
        sum +
        Math.max(
          0,
          p.totalAmount -
            payments
              .filter((x) => x.purchaseId === p.id)
              .reduce((s, x) => s + x.amount, 0),
        ),
      0,
    ),
    netCash = billTotal + otherIncome - dailyOutflow;
  const reportEnd = new Date(`${date}T23:59:59`),
    reportStart = new Date(reportEnd.getTime() - 29 * 86400000),
    inReportRange = (value) => {
      const d = new Date(value);
      return d >= reportStart && d <= reportEnd;
    },
    reportOrders = data.orders.filter((o) => o.paymentStatus === "paid" && inReportRange(o.completedAt)),
    reportEntries = entries.filter((x) => inReportRange(`${dateKey(x.entryDate)}T12:00:00`) && dateKey(x.entryDate) >= dateKey(reportStart)),
    reportPayments = payments.filter((x) => inReportRange(`${dateKey(x.paymentDate)}T12:00:00`) && dateKey(x.paymentDate) >= dateKey(reportStart)),
    reportSales = reportOrders.reduce((s,o)=>s+Number(o.total||0),0),
    reportIncome = reportEntries.filter((x)=>x.entryType==="income").reduce((s,x)=>s+x.amount,0),
    reportExpense = reportEntries.filter((x)=>x.entryType==="expense").reduce((s,x)=>s+x.amount,0),
    reportDealerPaid = reportPayments.reduce((s,x)=>s+x.amount,0),
    reportNet = reportSales+reportIncome-reportExpense-reportDealerPaid,
    paymentMix = Object.entries(reportOrders.reduce((acc,o)=>{const key=o.paymentMethod||"Unspecified";acc[key]=(acc[key]||0)+Number(o.total||0);return acc},{})).sort((a,b)=>b[1]-a[1]),
    expenseMix = Object.entries(reportEntries.filter((x)=>x.entryType==="expense").reduce((acc,x)=>{acc[x.category]=(acc[x.category]||0)+x.amount;return acc},{})).sort((a,b)=>b[1]-a[1]),
    dailyTrend = Array.from({length:30},(_,index)=>{const d=new Date(reportStart.getTime()+index*86400000),key=dateKey(d),sales=reportOrders.filter((o)=>dateKey(o.completedAt)===key).reduce((s,o)=>s+Number(o.total||0),0),expense=reportEntries.filter((x)=>dateKey(x.entryDate)===key&&x.entryType==="expense").reduce((s,x)=>s+x.amount,0)+reportPayments.filter((x)=>dateKey(x.paymentDate)===key).reduce((s,x)=>s+x.amount,0);return{key,sales,expense,net:sales-expense}}),
    maxTrend=Math.max(1,...dailyTrend.map((x)=>Math.max(x.sales,x.expense)));
  const purchaseRows = purchases.map((p) => {
    const paid = payments
      .filter((x) => x.purchaseId === p.id)
      .reduce((s, x) => s + x.amount, 0);
    return { ...p, paid, due: Math.max(0, p.totalAmount - paid) };
  });
  async function removePurchase(purchase) {
    if (!confirm(`Delete purchase from ${purchase.supplierName}?`)) return;
    try {
      await api(`/supplier-purchases/${purchase.id}`, { method: "DELETE" });
      await refresh();
      toast("Supplier purchase deleted");
    } catch (e) {
      toast(e.message);
    }
  }
  function exportDailyReport(){
    exportCsv(`knockout-finance-${date}.csv`,[
      ["KnockOUT finance report",date],["Metric","Amount"],["Bill revenue",billTotal],["Other income",otherIncome],["General expenses",generalExpense],["Dealer payments",dealerPaid],["Net cash",netCash],[],["Bills"],["Bill","Type","Customer","Payment","Total","Completed"],...dailyBills.map((o)=>[o.id,o.orderType,o.guestName,o.paymentMethod,o.total,o.completedAt]),[],["Income and expenses"],["Date","Type","Category","Description","Payment","Reference","Amount"],...dailyEntries.map((x)=>[dateKey(x.entryDate),x.entryType,x.category,x.description,x.paymentMethod,x.reference,x.amount])
    ]);
  }
  return (
    <>
      <div className="daily-finance-head">
        <PageHead
          kicker="DAILY FINANCIAL CONTROL"
          title="Finance Management"
          sub="Daily bills, spending, product purchases, dealer payments, and outstanding balances."
        />
        <div className="selected-finance-date">
          <button onClick={onBack}>
            <ChevronLeft size={15} /> Back to calendar
          </button>
          <label>
            SELECTED DATE
            <strong>
              {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </strong>
          </label>
          <button onClick={exportDailyReport}><FileDown size={15}/> Export report</button>
        </div>
      </div>
      <div className="daily-finance-tabs">
        <button
          className={tab === "daily" ? "active" : ""}
          onClick={() => setTab("daily")}
        >
          Daily closing
        </button>
        <button
          className={tab === "purchases" ? "active" : ""}
          onClick={() => setTab("purchases")}
        >
          Products & dealers
        </button>
        <button
          className={tab === "ledger" ? "active" : ""}
          onClick={() => setTab("ledger")}
        >
          Income & expenses
        </button>
        <button className={tab === "analytics" ? "active" : ""} onClick={() => setTab("analytics")}>
          30-day analytics
        </button>
      </div>
      {tab === "daily" ? (
        <>
          <div className="daily-kpis">
            <DailyKpi
              icon={ReceiptText}
              label="Bills completed"
              value={dailyBills.length}
              amount={billTotal}
              tone="income"
            />
            <DailyKpi
              icon={Wallet}
              label="Spent today"
              value={money(dailyOutflow)}
              note="Expenses + dealer payments"
              tone="expense"
            />
            <DailyKpi
              icon={ShoppingCart}
              label="Products purchased"
              value={money(purchasedTotal)}
              note={`${dailyPurchases.length} purchase invoices`}
            />
            <DailyKpi
              icon={Building2}
              label="Paid to shops / dealers"
              value={money(dealerPaid)}
              note={`${dailyPayments.length} payments today`}
            />
            <DailyKpi
              icon={AlertTriangle}
              label="Total still payable"
              value={money(totalDue)}
              note="All unpaid dealer balances"
              tone="due"
            />
            <DailyKpi
              icon={TrendingUp}
              label="Daily net cash"
              value={money(netCash)}
              note="Bills + income − cash outflow"
              tone={netCash >= 0 ? "income" : "expense"}
            />
          </div>
          <div className="daily-close-grid">
            <section className="panel">
              <PanelHead
                title="Completed bills"
                sub={`${dailyBills.length} bills completed on ${new Date(date + "T00:00:00").toLocaleDateString("en-IN", { dateStyle: "long" })}`}
              />
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Bill</th>
                      <th>Type / Table</th>
                      <th>Customer</th>
                      <th>Payment</th>
                      <th>Completed</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyBills.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <b>#{order.id}</b>
                        </td>
                        <td>
                          {order.orderType === "parcel"
                            ? "Parcel"
                            : `Table ${data.tables.find((t) => t.id === order.tableId)?.number || "—"}`}
                        </td>
                        <td>{order.guestName}</td>
                        <td>{order.paymentMethod}</td>
                        <td>
                          {new Date(order.completedAt).toLocaleTimeString(
                            "en-IN",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </td>
                        <td className="amount-in">{money(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!dailyBills.length ? (
                <div className="mini-empty">
                  No bills completed for this date.
                </div>
              ) : null}
            </section>
            <aside className="panel daily-breakdown">
              <PanelHead
                title="Daily calculation"
                sub="How today's balance is calculated"
              />
              <div>
                <span>
                  Completed bill income
                  <b className="amount-in">+{money(billTotal)}</b>
                </span>
                <span>
                  Other recorded income
                  <b className="amount-in">+{money(otherIncome)}</b>
                </span>
                <span>
                  General expenses
                  <b className="amount-out">−{money(generalExpense)}</b>
                </span>
                <span>
                  Paid to dealers
                  <b className="amount-out">−{money(dealerPaid)}</b>
                </span>
                <span className="daily-total">
                  Net cash for date<b>{money(netCash)}</b>
                </span>
              </div>
              <button
                className="secondary wide"
                onClick={() => setTab("purchases")}
              >
                View dealer balances <ArrowRight size={14} />
              </button>
            </aside>
          </div>
        </>
      ) : tab === "purchases" ? (
        <>
          <div className="finance-actions">
            <button
              className="primary"
              onClick={() => setCreatingPurchase(true)}
            >
              <Plus size={14} /> Add product purchase
            </button>
            <span>
              Total purchased:{" "}
              <b>{money(purchases.reduce((s, x) => s + x.totalAmount, 0))}</b>
            </span>
            <span>
              Total paid:{" "}
              <b>{money(payments.reduce((s, x) => s + x.amount, 0))}</b>
            </span>
            <span className="amount-out">
              Still payable: <b>{money(totalDue)}</b>
            </span>
          </div>
          <section className="panel">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date / Invoice</th>
                    <th>Shop or dealer</th>
                    <th>Products / Description</th>
                    <th>Purchase total</th>
                    <th>Paid</th>
                    <th>Still due</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseRows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <b>
                          {new Date(p.purchaseDate).toLocaleDateString("en-IN")}
                        </b>
                        <small>{p.invoiceNumber || "No invoice number"}</small>
                      </td>
                      <td>
                        <b>{p.supplierName}</b>
                      </td>
                      <td>
                        {p.description}
                        <small>{p.notes}</small>
                      </td>
                      <td>{money(p.totalAmount)}</td>
                      <td className="amount-in">{money(p.paid)}</td>
                      <td className={p.due > 0 ? "amount-out" : "amount-in"}>
                        {p.due > 0 ? money(p.due) : "Fully paid"}
                      </td>
                      <td>
                        <div className="row-actions">
                          {p.due > 0 ? (
                            <button onClick={() => setPaying(p)}>
                              Pay dealer
                            </button>
                          ) : null}
                          <button onClick={() => removePurchase(p)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!purchases.length ? (
              <div className="empty-state">
                <ShoppingCart />
                <h3>No product purchases recorded</h3>
                <p>
                  Add an invoice and record how much was paid or remains due.
                </p>
              </div>
            ) : null}
          </section>
        </>
      ) : tab === "ledger" ? (
        <>
          <div className="finance-actions">
            <button className="primary" onClick={() => setCreatingEntry(true)}>
              <Plus size={14} /> Add income / expense
            </button>
          </div>
          <section className="panel">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Payment</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((x) => (
                    <tr key={x.id}>
                      <td>
                        {new Date(x.entryDate).toLocaleDateString("en-IN")}
                      </td>
                      <td>
                        <Status status={x.entryType} />
                      </td>
                      <td>{x.category}</td>
                      <td>
                        {x.description}
                        <small>{x.reference}</small>
                      </td>
                      <td>{x.paymentMethod}</td>
                      <td
                        className={
                          x.entryType === "expense" ? "amount-out" : "amount-in"
                        }
                      >
                        {x.entryType === "expense" ? "-" : "+"}
                        {money(x.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="daily-kpis">
            <DailyKpi icon={ReceiptText} label="30-day revenue" value={money(reportSales)} note={`${reportOrders.length} paid bills`} tone="income"/>
            <DailyKpi icon={Banknote} label="Other income" value={money(reportIncome)} note="Non-order income" tone="income"/>
            <DailyKpi icon={Wallet} label="Operating expense" value={money(reportExpense)} note="Manual expenses" tone="expense"/>
            <DailyKpi icon={Building2} label="Dealer payments" value={money(reportDealerPaid)} note="Supplier cash outflow" tone="expense"/>
            <DailyKpi icon={TrendingUp} label="Net cash generated" value={money(reportNet)} note="All inflow minus cash outflow" tone={reportNet>=0?"income":"expense"}/>
            <DailyKpi icon={Gauge} label="Average bill value" value={money(reportOrders.length?reportSales/reportOrders.length:0)} note="Revenue per completed order"/>
          </div>
          <div className="finance-analytics-grid">
            <section className="panel"><PanelHead title="30-day cashflow trend" sub={`Ending ${new Date(date+'T12:00:00').toLocaleDateString('en-IN',{dateStyle:'long'})}`}/><div className="cashflow-chart">{dailyTrend.map((day)=><div className="cashflow-day" key={day.key} title={`${day.key}: revenue ${money(day.sales)}, outflow ${money(day.expense)}`}><div><i className="income-bar" style={{height:`${Math.max(2,(day.sales/maxTrend)*100)}%`}}/><i className="expense-bar" style={{height:`${Math.max(2,(day.expense/maxTrend)*100)}%`}}/></div><span>{new Date(day.key+'T12:00:00').getDate()}</span></div>)}</div><div className="chart-legend"><span><i className="income"/>Revenue</span><span><i className="expense"/>Cash outflow</span></div></section>
            <aside className="panel analytics-breakdown"><PanelHead title="Payment mix" sub="Collected bill revenue by method"/><div>{paymentMix.map(([label,amount])=><span key={label}><b>{label}</b><em>{reportSales?`${((amount/reportSales)*100).toFixed(1)}%`:"0%"}</em><strong>{money(amount)}</strong></span>)}{!paymentMix.length?<p>No paid bills in this period.</p>:null}</div></aside>
          </div>
          <div className="finance-analytics-grid secondary-row">
            <section className="panel analytics-breakdown"><PanelHead title="Expense categories" sub="Where operating money was spent"/><div>{expenseMix.map(([label,amount])=><span key={label}><b>{label}</b><em>{reportExpense?`${((amount/reportExpense)*100).toFixed(1)}%`:"0%"}</em><strong className="amount-out">{money(amount)}</strong></span>)}{!expenseMix.length?<p>No operating expenses in this period.</p>:null}</div></section>
            <aside className="panel stock-risk-summary"><PanelHead title="Business health" sub="Decision indicators for this period"/><div><span>Net cash margin <b>{reportSales?`${((reportNet/reportSales)*100).toFixed(1)}%`:"—"}</b></span><span>Average daily revenue <b>{money(reportSales/30)}</b></span><span>Average daily outflow <b>{money((reportExpense+reportDealerPaid)/30)}</b></span><span>Outstanding dealers <b className="amount-out">{money(totalDue)}</b></span><span>Cashflow status <b className={reportNet>=0?"amount-in":"amount-out"}>{reportNet>=0?"Positive":"Negative"}</b></span></div></aside>
          </div>
        </>
      )}
      {creatingEntry ? (
        <FinanceEntry
          close={() => setCreatingEntry(false)}
          refresh={refresh}
          toast={toast}
          user={user}
        />
      ) : null}
      {creatingPurchase ? (
        <SupplierPurchaseForm
          date={date}
          close={() => setCreatingPurchase(false)}
          refresh={refresh}
          toast={toast}
          user={user}
        />
      ) : null}
      {paying ? (
        <DealerPaymentForm
          purchase={paying}
          date={date}
          close={() => setPaying(null)}
          refresh={refresh}
          toast={toast}
          user={user}
        />
      ) : null}
    </>
  );
}
function DailyKpi({ icon: Icon, label, value, amount, note, tone = "" }) {
  return (
    <article className={`daily-kpi ${tone}`}>
      <span>
        <Icon size={19} />
      </span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
        {amount !== undefined ? <em>{money(amount)}</em> : <em>{note}</em>}
      </div>
    </article>
  );
}
function SupplierPurchaseForm({ date, close, refresh, toast, user }) {
  const [form, setForm] = useState({
      supplierName: "",
      invoiceNumber: "",
      description: "",
      purchaseDate: date,
      totalAmount: "",
      paidAmount: 0,
      paymentMethod: "Cash",
      reference: "",
      notes: "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const due = Math.max(
    0,
    Number(form.totalAmount || 0) - Number(form.paidAmount || 0),
  );
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/supplier-purchases", {
        method: "POST",
        body: JSON.stringify({ ...form, createdBy: user.name }),
      });
      await refresh();
      toast(`Purchase saved · ${money(due)} still payable`);
      close();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">PRODUCT PURCHASE</span>
      <h2>Add shop / dealer invoice</h2>
      <form className="modal-form" onSubmit={save}>
        <label>
          Shop or dealer name
          <input
            required
            value={form.supplierName}
            onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Invoice number
            <input
              value={form.invoiceNumber}
              onChange={(e) =>
                setForm({ ...form, invoiceNumber: e.target.value })
              }
            />
          </label>
          <label>
            Purchase date
            <input
              required
              type="date"
              value={form.purchaseDate}
              onChange={(e) =>
                setForm({ ...form, purchaseDate: e.target.value })
              }
            />
          </label>
        </div>
        <label>
          Products / description
          <input
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Rice, vegetables, beverages…"
          />
        </label>
        <div className="form-grid">
          <label>
            Total invoice amount
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.totalAmount}
              onChange={(e) =>
                setForm({ ...form, totalAmount: e.target.value })
              }
            />
          </label>
          <label>
            Amount paid now
            <input
              type="number"
              min="0"
              step="0.01"
              max={form.totalAmount || undefined}
              value={form.paidAmount}
              onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
            />
          </label>
        </div>
        <div className="payment-balance">
          <span>Still to give dealer</span>
          <b>{money(due)}</b>
        </div>
        <div className="form-grid">
          <label>
            Payment method
            <ThemeSelect
              value={form.paymentMethod}
              onChange={(paymentMethod) => setForm({ ...form, paymentMethod })}
              options={["Cash", "Card / UPI", "Bank Transfer", "Credit"]}
            />
          </label>
          <label>
            Payment reference
            <input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
          </label>
        </div>
        <label>
          Notes
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary wide" disabled={busy}>
          {busy ? "Saving purchase…" : "Save purchase invoice"}
        </button>
      </form>
    </Modal>
  );
}
function DealerPaymentForm({ purchase, date, close, refresh, toast, user }) {
  const [form, setForm] = useState({
      amount: purchase.due,
      paymentMethod: "Cash",
      paymentDate: date,
      reference: "",
      notes: "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/supplier-purchases/${purchase.id}/payments`, {
        method: "POST",
        body: JSON.stringify({ ...form, createdBy: user.name }),
      });
      await refresh();
      toast(`Payment recorded for ${purchase.supplierName}`);
      close();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">DEALER PAYMENT</span>
      <h2>Pay {purchase.supplierName}</h2>
      <div className="payment-balance">
        <span>Outstanding balance</span>
        <b>{money(purchase.due)}</b>
      </div>
      <form className="modal-form" onSubmit={save}>
        <label>
          Amount to pay
          <input
            required
            type="number"
            min="0.01"
            max={purchase.due}
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Payment date
            <input
              required
              type="date"
              value={form.paymentDate}
              onChange={(e) =>
                setForm({ ...form, paymentDate: e.target.value })
              }
            />
          </label>
          <label>
            Payment method
            <ThemeSelect
              value={form.paymentMethod}
              onChange={(paymentMethod) => setForm({ ...form, paymentMethod })}
              options={["Cash", "Card / UPI", "Bank Transfer"]}
            />
          </label>
        </div>
        <label>
          Reference
          <input
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
        </label>
        <label>
          Notes
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary wide" disabled={busy}>
          Record dealer payment
        </button>
      </form>
    </Modal>
  );
}
function Staff({ data }) {
  return (
    <>
      <PageHead
        kicker="TEAM MANAGEMENT"
        title="Staff & Access"
        sub="People with access to your management portals."
      />
      <div className="staff-grid">
        {data.users.map((u) => (
          <div className="panel staff-card" key={u.id}>
            <span>
              {u.name
                .split(" ")
                .map((x) => x[0])
                .join("")}
            </span>
            <h3>{u.name}</h3>
            <Status status={u.role} />
            <p>Active today · Portal access enabled</p>
          </div>
        ))}
      </div>
    </>
  );
}
function StaffManagement({ data, refresh, toast }) {
  const [editor, setEditor] = useState(null),
    [tab, setTab] = useState("team");
  const shifts = data.attendance || [],
    active = (userId) => shifts.find((s) => s.userId === userId && !s.checkOut),
    today = shifts.filter(
      (s) => new Date(s.checkIn).toDateString() === new Date().toDateString(),
    );
  const duration = (s) => {
    const ms = new Date(s.checkOut || Date.now()) - new Date(s.checkIn),
      h = Math.floor(ms / 3600000),
      m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };
  async function toggle(staff) {
    const shift = active(staff.id),
      note = "";
    await api(`/staff/${staff.id}/${shift ? "check-out" : "check-in"}`, {
      method: "POST",
      body: JSON.stringify({ notes: note }),
    });
    await refresh();
    toast(`${staff.name} checked ${shift ? "out" : "in"}`);
  }
  return (
    <>
      <PageHead
        kicker="PEOPLE & ATTENDANCE"
        title="Staff Management"
        sub="Staff logins, check-in/out, working hours, and attendance history."
        action={
          <button className="primary" onClick={() => setEditor({})}>
            <Plus size={15} /> Add staff login
          </button>
        }
      />
      <div className="stats">
        <Stat
          icon={Users}
          label="Total Team"
          value={data.users.filter((u) => u.active).length + (data.kitchenStaff || []).filter((u) => u.active).length}
          note={`${data.users.filter((u) => u.active).length} portal accounts · ${(data.kitchenStaff || []).filter((u) => u.active).length} kitchen employees`}
        />
        <Stat
          icon={CheckCircle2}
          label="On Duty Now"
          value={data.users.filter((u) => active(u.id)).length}
          note="Currently checked in"
        />
        <Stat
          icon={Clock3}
          label="Hours Today"
          value={`${(today.reduce((sum, s) => sum + (new Date(s.checkOut || Date.now()) - new Date(s.checkIn)), 0) / 3600000).toFixed(1)}h`}
          note={`${today.length} recorded shifts`}
        />
        <Stat
          icon={LogOut}
          label="Checked Out"
          value={today.filter((s) => s.checkOut).length}
          note="Completed today"
        />
      </div>
      <div className="menu-tabs">
        <button
          className={tab === "team" ? "active" : ""}
          onClick={() => setTab("team")}
        >
          Staff Accounts
        </button>
        <button
          className={tab === "kitchen" ? "active" : ""}
          onClick={() => setTab("kitchen")}
        >
          Kitchen Team ({(data.kitchenStaff || []).length})
        </button>
        <button
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          Working Time History
        </button>
      </div>
      {tab === "team" ? (
        <div className="staff-work-grid">
          {data.users.map((staff) => {
            const shift = active(staff.id);
            return (
              <article
                className={`staff-work-card role-${staff.role} ${shift ? "on-duty" : ""}`}
                key={staff.id}
              >
                <header>
                  <span>
                    {staff.name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div>
                    <small className="account-type">PORTAL ACCOUNT</small>
                    <h3>{staff.name}</h3>
                    <Status status={staff.role} />
                  </div>
                  <button onClick={() => setEditor(staff)}>Edit details</button>
                </header>
                <div className="staff-details">
                  <p>
                    <span>Login PIN</span>
                    <b>{staff.pin}</b>
                  </p>
                  <p>
                    <span>Phone</span>
                    <b>{staff.phone || "Not added"}</b>
                  </p>
                  <p>
                    <span>Pay</span>
                    <b>
                      {money(staff.payRate)} / {staff.payType}
                    </b>
                  </p>
                </div>
                {shift ? (
                  <div className="live-shift">
                    <i />
                    <span>
                      <b>
                        Checked in{" "}
                        {new Date(shift.checkIn).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </b>
                      <small>Working for {duration(shift)}</small>
                    </span>
                  </div>
                ) : (
                  <div className="off-shift">
                    <Clock3 size={15} /> Not checked in
                  </div>
                )}
                <div className="admin-monitor-note">
                  {shift
                    ? "On duty — controlled by staff portal"
                    : "Waiting for staff check-in"}
                </div>
              </article>
            );
          })}
        </div>
      ) : tab === "kitchen" ? (
        <AdminKitchenTeam
          staff={data.kitchenStaff || []}
          refresh={refresh}
          toast={toast}
        />
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Role</th>
                  <th>Check in</th>
                  <th>Check out</th>
                  <th>Working time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b>{s.name}</b>
                    </td>
                    <td>
                      <Status status={s.role} />
                    </td>
                    <td>{new Date(s.checkIn).toLocaleString("en-IN")}</td>
                    <td>
                      {s.checkOut
                        ? new Date(s.checkOut).toLocaleString("en-IN")
                        : "—"}
                    </td>
                    <td>
                      <b>{duration(s)}</b>
                    </td>
                    <td>
                      <Status status={s.checkOut ? "completed" : "on-duty"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {editor && (
        <StaffEditor
          staff={editor.id ? editor : null}
          users={data.users}
          close={() => setEditor(null)}
          refresh={refresh}
          toast={toast}
        />
      )}
    </>
  );
}
function KitchenMemberCard({ member, edit, remove }) {
  return (
    <article className={`kitchen-member-card ${member.active ? "" : "inactive"}`}>
      <header>
        <span>{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
        <div><small>KITCHEN EMPLOYEE</small><h3>{member.name}</h3><b>{member.designation}</b></div>
        <Status status={member.active ? "active" : "inactive"} />
      </header>
      <div className="chef-card-speciality"><ChefHat size={15} /><span><small>Specialization</small><b>{member.specialization || "General kitchen"}</b></span></div>
      <div className="chef-card-facts">
        <span><small>Phone</small><b>{member.phone || "Not added"}</b></span>
        <span><small>Pay</small><b>{money(member.payRate)} / {member.payType}</b></span>
        <span><small>Joined</small><b>{member.joinedOn ? new Date(member.joinedOn).toLocaleDateString("en-IN") : "Not added"}</b></span>
        <span><small>Added by</small><b>{member.createdBy || "Head Chef"}</b></span>
      </div>
      {member.notes && <p className="chef-card-note">{member.notes}</p>}
      <footer><button onClick={edit}>Edit details</button><button className="danger" onClick={remove}><Trash2 size={13} /> Remove</button></footer>
    </article>
  );
}
function AdminKitchenTeam({ staff, refresh, toast }) {
  const [editor, setEditor] = useState(null);
  async function remove(member) {
    try {
      await api(`/kitchen-staff/${member.id}`, { method: "DELETE" });
      await refresh();
      toast(`${member.name} removed from the kitchen team`);
    } catch (error) {
      toast(error.message);
    }
  }
  return (
    <section className="admin-kitchen-team">
      <PanelHead
        title="Kitchen Team"
        sub="Shared live with the Head Chef portal. Kitchen employees do not receive login PINs."
        action={<button className="primary" onClick={() => setEditor({})}><Plus size={14} /> Add chef</button>}
      />
      <div className="kitchen-team-grid admin-chef-grid">
        {staff.map((member) => <KitchenMemberCard key={member.id} member={member} edit={() => setEditor(member)} remove={() => remove(member)} />)}
        {!staff.length && <div className="empty-state"><ChefHat /><h3>No kitchen employees</h3><p>The Head Chef can add them from Chef Management.</p></div>}
      </div>
      {editor && <KitchenStaffEditor member={editor.id ? editor : null} user={{ name: "Admin" }} close={() => setEditor(null)} refresh={refresh} toast={toast} />}
    </section>
  );
}
function StaffEditor({ staff, users, close, refresh, toast }) {
  const [form, setForm] = useState({
      name: staff?.name || "",
      role: staff?.role || "waiter",
      pin: staff?.pin || "",
      phone: staff?.phone || "",
      payType: staff?.payType || "monthly",
      payRate: staff?.payRate || 0,
      active: staff?.active ?? true,
    }),
    [error, setError] = useState(""),
    [deleteArmed, setDeleteArmed] = useState(false),
    [deleting, setDeleting] = useState(false);
  const roleExists = (role) =>
    users.some((user) => user.role === role && user.id !== staff?.id);
  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      const result = await api(staff ? `/staff/${staff.id}` : "/staff", {
        method: staff ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      await refresh();
      toast(staff ? "Staff login updated" : `Staff login created · Generated PIN ${result.pin}`);
      close();
    } catch (e) {
      setError(e.message);
    }
  }
  async function removeStaff() {
    setDeleting(true);
    setError("");
    try {
      await api(`/staff/${staff.id}`, { method: "DELETE" });
      await refresh();
      toast(`${staff.name} removed from Staff Management`);
      close();
    } catch (e) {
      setError(e.message);
      setDeleteArmed(false);
    } finally {
      setDeleting(false);
    }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">STAFF LOGIN</span>
      <h2>{staff ? "Customize staff" : "Add staff member"}</h2>
      <p>{staff ? "Update this account and its login access." : "A unique six-digit login PIN will be generated automatically."}</p>
      <form className="modal-form" onSubmit={save}>
        <label>
          Full name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label className="choice-field">
            Designation
            <div className="theme-choice-grid role-choices">
              {[
                ["waiter", "Waiter", "Multiple accounts"],
                ["chef", "Head Chef", "Single company login"],
                ["admin", "Admin", "Single company login"],
                ...(staff?.role === "juicer" ? [["juicer", "Juicer", "Created by Head Chef · managed by Admin"]] : []),
              ].map(([value, label, note]) => {
                const disabled = value !== "waiter" && roleExists(value);
                return <button type="button" key={value} disabled={disabled} className={form.role === value ? "selected" : ""} onClick={() => setForm({ ...form, role: value })}><span>{label}</span><small>{disabled ? "Already created · unavailable" : note}</small>{disabled ? <CheckCircle2 size={14}/> : null}</button>;
              })}
            </div>
          </label>
          {staff ? <label>
            6-digit login PIN
            <input
              required
              pattern="[0-9]{6}"
              maxLength="6"
              inputMode="numeric"
              value={form.pin}
              onChange={(e) =>
                setForm({
                  ...form,
                  pin: e.target.value.replace(/\D/g, "").slice(0, 6),
                })
              }
              placeholder="6 digits"
            />
          </label> : <div className="database-preview"><Settings size={17}/><span>Login PIN</span><code>Generated after creation</code></div>}
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="choice-field">
            Pay type
            <div className="theme-choice-grid pay-choices">
              {[['daily','Daily'],['monthly','Monthly']].map(([value,label])=><button type="button" key={value} className={form.payType===value?'selected':''} onClick={()=>setForm({...form,payType:value})}>{label}</button>)}
            </div>
          </label>
        </div>
        <label>
          {form.payType === "daily" ? "Daily salary amount" : "Monthly salary amount"}
          <input
            type="number"
            min="0"
            value={form.payRate}
            onChange={(e) => setForm({ ...form, payRate: e.target.value })}
          />
        </label>
        {staff && (
          <label className="toggle-field">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />{" "}
            Login account active
          </label>
        )}
        {error && <div className="form-error">{error}</div>}
        <button className="primary wide">
          {staff ? "Save staff changes" : "Create staff login"}
        </button>
        {staff && staff.role !== "admin" && !deleteArmed && <button type="button" className="staff-delete-button" onClick={() => setDeleteArmed(true)}><Trash2 size={15}/> Delete staff</button>}
        {staff && staff.role !== "admin" && deleteArmed && <div className="staff-delete-confirm"><b>Delete {staff.name}?</b><p>The login will be removed and its PIN can be reused. Attendance history will be preserved.</p><div><button type="button" className="secondary" onClick={() => setDeleteArmed(false)}>Cancel</button><button type="button" className="danger" disabled={deleting} onClick={removeStaff}>{deleting ? "Deleting…" : "Confirm delete"}</button></div></div>}
        {staff?.role === "admin" && <div className="protected-account-note">Primary Admin login is protected from deletion.</div>}
      </form>
    </Modal>
  );
}
function SettingsPanel({ data, refresh, toast }) {
  const [s, setS] = useState(data.settings);
  async function save() {
    await api("/settings", { method: "PUT", body: JSON.stringify(s) });
    refresh();
    toast("Business settings saved");
  }
  return (
    <>
      <PageHead
        kicker="ADMIN SETTINGS"
        title="Business & Billing"
        sub="Configuration shared by every portal."
        action={
          <button className="primary" onClick={save}>
            Save changes
          </button>
        }
      />
      <section className="panel settings-form">
        <h2>Restaurant details</h2>
        <div className="form-grid">
          <label>
            Business name
            <input
              value={s.hotelName}
              onChange={(e) => setS({ ...s, hotelName: e.target.value })}
            />
          </label>
          <label>
            Currency
            <input value={s.currency} disabled />
          </label>
          {/* GST settings are temporarily disabled; retain for later use.
          <label>
            GST rate (%)
            <input
              type="number"
              value={s.taxRate}
              onChange={(e) => setS({ ...s, taxRate: +e.target.value })}
            />
          </label>
          <label>
            CGST rate (%)
            <input type="number" value={s.cgstRate} onChange={(e) => setS({ ...s, cgstRate: +e.target.value })} />
          </label>
          */}
          {/* Service tax setting is temporarily disabled; retain for later use.
          <label>
            Service tax (%)
            <input type="number" value={s.serviceCharge} onChange={(e) => setS({ ...s, serviceCharge: +e.target.value })} />
          </label>
          */}
        </div>
      </section>
    </>
  );
}

function RoleOverview({ role, data, user, setPage }) {
  const firstName = String(user?.name || role).trim().split(/\s+/)[0];
  const today = dateKey(new Date());
  const todayOrders = data.orders.filter((order) => dateKey(order.createdAt) === today);
  const mine = role === "waiter"
    ? todayOrders.filter((order) => order.orderType !== "parcel" && String(order.waiter || "").toLowerCase().includes(firstName.toLowerCase()))
    : productionOrders(data, role);
  const ready = mine.filter((order) => order.status === "ready").length;
  const preparing = mine.filter((order) => order.status === "preparing").length;
  const fresh = mine.filter((order) => order.status === "new").length;
  const occupied = data.tables.filter((table) => table.status === "occupied").length;
  const availableMenu = role === "juicer"
    ? data.menu.filter((item) => String(item.category).toLowerCase() === "juices" && item.available)
    : data.menu.filter((item) => String(item.category).toLowerCase() !== "juices" && !item.isCombo && item.available);
  const config = role === "waiter" ? {
    kicker: "SERVICE PULSE", title: `Welcome back, ${firstName}`, sub: "Your floor, guest requests, and kitchen handoffs in one live view.",
    metrics: [
      [Armchair, "Occupied tables", `${occupied}/${data.tables.length}`, `${data.tables.filter(t => t.status === "available").length} ready for guests`, "gold"],
      [ReceiptText, "My orders today", mine.length, `${mine.filter(o => o.paymentStatus === "paid").length} paid`, "blue"],
      [CheckCircle2, "Ready to serve", mine.filter(o => o.status === "ready").length, "Awaiting Chef handoff", "green"],
      [Clock3, "Awaiting progress", mine.filter(o => ["new", "preparing"].includes(o.status)).length, "Live kitchen status", "orange"],
    ],
    primary: ["floor", "Open floor", "Take orders and manage tables", Armchair], secondary: ["orders", "My order history", "Review today's service", ReceiptText],
  } : role === "chef" ? {
    kicker: "KITCHEN INTELLIGENCE", title: `Good service, Chef ${firstName}`, sub: "Prioritize tickets, balance dine-in and parcel demand, and keep service moving.",
    metrics: [[ReceiptText,"New tickets",fresh,"Waiting to be started","orange"],[ChefHat,"In preparation",preparing,"Currently cooking","blue"],[CheckCircle2,"Ready",ready,"Awaiting handoff","green"],[UtensilsCrossed,"Available dishes",availableMenu.length,`${data.menu.filter(i=>String(i.category).toLowerCase()!=="juices"&&!i.isCombo&&!i.available).length} unavailable`,"gold"]],
    primary: ["kitchen", "Open table orders", "Prioritize table tickets", ChefHat], secondary: ["parcels", "Open parcel queue", "Manage takeaway demand", Package],
  } : {
    kicker: "BEVERAGE STATION", title: `Fresh start, ${firstName}`, sub: "See every juice ticket, preparation state, and menu availability at a glance.",
    metrics: [[ReceiptText,"New juice tickets",fresh,"Waiting to start","orange"],[CupSoda,"Being prepared",preparing,"Active drinks","blue"],[CheckCircle2,"Ready juices",ready,"Ready for pickup","green"],[Gauge,"Available juices",availableMenu.length,`${data.menu.filter(i=>String(i.category).toLowerCase()==="juices"&&!i.available).length} unavailable`,"gold"]],
    primary: ["queue", "Open table orders", "Prepare table drinks", Armchair], secondary: ["parcel-queue", "Open parcel queue", "Prepare parcel drinks", Package],
  };
  const recent = [...mine].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4);
  return <div className={`portal-overview ${role}-overview`}>
    <section className="overview-hero glass-card">
      <div><span className="eyebrow">{config.kicker}</span><h1>{config.title}</h1><p>{config.sub}</p><div className="overview-live"><i/> Live operations · {new Date().toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"})}</div></div>
      <div className="overview-hero-orb"><span>{role === "waiter" ? occupied : mine.length}</span><small>{role === "waiter" ? "tables in service" : "active tickets"}</small></div>
    </section>
    <div className="overview-metrics">{config.metrics.map(([Icon,label,value,note,tone])=><article className={`overview-metric glass-card ${tone}`} key={label}><span><Icon size={19}/></span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>)}</div>
    <div className="overview-workspace">
      <section className="glass-card overview-priority"><PanelHead title="Live priority" sub="The newest operational updates"/><div className="overview-feed">{recent.length?recent.map(order=><div key={order.id}><span className={`priority-dot ${order.status}`}/><div><b>{order.orderType === "parcel" ? `Parcel #${billNumber(order)}` : `Table ${data.tables.find(t=>t.id===order.tableId)?.number || "—"}`}</b><small>{order.items.reduce((sum,item)=>sum+item.qty,0)} items · {elapsed(order.createdAt)}</small></div><Status status={order.status}/></div>):<div className="overview-clear"><CheckCircle2/><b>Everything is clear</b><small>No active work needs attention.</small></div>}</div></section>
      <aside className="overview-actions"><button className="glass-card primary-action" onClick={()=>setPage(config.primary[0])}>{(() => { const Icon=config.primary[3]; return <Icon/>; })()}<span><b>{config.primary[1]}</b><small>{config.primary[2]}</small></span><ArrowRight/></button><button className="glass-card" onClick={()=>setPage(config.secondary[0])}>{(() => { const Icon=config.secondary[3]; return <Icon/>; })()}<span><b>{config.secondary[1]}</b><small>{config.secondary[2]}</small></span><ArrowRight/></button>{/* Attendance shortcut temporarily disabled; retain for later. */}</aside>
    </div>
  </div>;
}

function Waiter({ data, refresh, user, logout, toast }) {
  const [page, setPage] = useState("overview"),
    [selected, setSelected] = useState(null);
  const table = data.tables.find((t) => t.id === selected);
  return (
    <Shell
      role="waiter"
      user={user}
      page={page}
      setPage={setPage}
      logout={logout}
    >
      {page === "overview" && <RoleOverview role="waiter" data={data} user={user} setPage={setPage} />}{" "}
      {/* Temporarily disabled; retain for later:
      {page === "attendance" && <AttendancePanel user={user} toast={toast} />}
      */}{" "}
      {page === "floor" && (
        <>
          <PageHead
            kicker="WAITER FLOOR VIEW"
            title="Tables & Service"
            sub="Select a table to take an order or generate its bill."
          />
          <TableSummary data={data} />
          <div className="table-grid waiter-grid">
            {data.tables.map((t) => (
              <TableCard
                key={t.id}
                table={t}
                data={data}
                order={data.orders.find((o) => o.id === t.orderId)}
                onClick={() => setSelected(t.id)}
              />
            ))}
          </div>
        </>
      )}
      {page === "orders" && <WaiterOrders data={data} user={user} />}{" "}
      {table && (
        <TableDrawer
          table={table}
          data={data}
          user={user}
          close={() => setSelected(null)}
          refresh={refresh}
          toast={toast}
        />
      )}{" "}
    </Shell>
  );
}
const bookingMinutes = (time) => {
  const [hour, minute] = String(time || "00:00").split(":").map(Number);
  return hour * 60 + minute;
};
const bookingTimeLabel = (time) => {
  const [hour, minute] = String(time || "00:00").split(":").map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
};
function Bookings({ data, open, refresh, toast }) {
  const today = new Date(), bookings = data.bookings || [],
    [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1)),
    [selectedDate, setSelectedDate] = useState(null),
    year = month.getFullYear(), monthIndex = month.getMonth(),
    days = new Date(year, monthIndex + 1, 0).getDate(),
    leading = new Date(year, monthIndex, 1).getDay(),
    cells = [...Array(leading).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const keyFor = (day) => `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    selectedBookings = selectedDate ? bookings.filter((booking) => booking.bookingDate === selectedDate) : [];
  async function cancelBooking(id) {
    if (!confirm("Cancel this table booking?")) return;
    try { await api(`/bookings/${id}`, { method: "DELETE" }); await refresh(); toast("Booking cancelled and the time slot released"); }
    catch (error) { toast(error.message); }
  }
  if (selectedDate) return <>
    <PageHead
      kicker="RESERVATION SCHEDULE"
      title={new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      sub={`${selectedBookings.length} confirmed booking${selectedBookings.length === 1 ? "" : "s"} for this date.`}
      action={<div className="booking-head-actions"><button className="secondary" onClick={() => setSelectedDate(null)}><ChevronLeft size={15}/> Calendar</button><button className="primary" onClick={() => open(selectedDate)}><Plus size={15}/> Add booking</button></div>}
    />
    <section className="panel booking-day-panel">
      {selectedBookings.length ? <div className="booking-list">{selectedBookings.map((booking) => <div key={booking.id}>
        <span><CalendarDays size={18}/></span>
        <div><b>Table {booking.tableNumber}</b><small>{booking.seats} seats · {booking.area} · {booking.customerPhone}</small></div>
        <div className="booking-slot"><strong>{bookingTimeLabel(booking.bookingTime)}</strong><small>{booking.durationMinutes} minutes</small></div>
        <span className={`sms-delivery ${booking.notificationStatus}`}><Bell size={12}/>{booking.notificationStatus === "sent" ? "SMS sent" : booking.notificationStatus === "failed" ? "SMS failed" : "SMS queued"}</span>
        <button className="booking-cancel" onClick={() => cancelBooking(booking.id)}><Trash2 size={14}/></button>
      </div>)}</div> : <div className="empty-state"><CalendarDays/><h3>No bookings for this date</h3><p>Select Add booking to lock a table and time.</p></div>}
    </section>
  </>;
  return <>
    <PageHead kicker="RESERVATION CALENDAR" title="Choose a booking date" sub="Select a date to view its reservations or lock a new table time." action={<button className="primary" onClick={() => open(dateKey(today))}><Plus size={15}/> Add booking</button>}/>
    <section className="finance-calendar booking-calendar">
      <header><div><span>TABLE RESERVATIONS</span><h2>{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2></div><div>
        <button onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}><ChevronLeft size={18}/></button>
        <button className="calendar-today" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>
        <button onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}><ChevronRight size={18}/></button>
      </div></header>
      <div className="finance-weekdays">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="finance-month-grid">{cells.map((day,index) => {
        if (!day) return <span className="calendar-blank" key={`blank-${index}`}/>;
        const key=keyFor(day), daily=bookings.filter((booking) => booking.bookingDate === key), isToday=key===dateKey(today), weekend=index%7===0||index%7===6;
        return <button key={key} className={`${daily.length ? "has-activity" : ""} ${isToday ? "is-today" : ""} ${weekend ? "weekend" : ""}`} onClick={() => setSelectedDate(key)}>
          <header><b>{day}</b><em>{daily.length ? `${daily.length} BOOKED` : weekend ? "W/E" : "OPEN"}</em></header>
          {daily.length ? <div className="booking-day-data"><strong>{daily.length} reservation{daily.length===1?"":"s"}</strong>{daily.slice(0,2).map((booking) => <small key={booking.id}>T{booking.tableNumber} · {bookingTimeLabel(booking.bookingTime)}</small>)}{daily.length>2?<small>+{daily.length-2} more</small>:null}</div> : <div className="calendar-no-data"><CalendarDays size={19}/><small>No bookings</small></div>}
        </button>;
      })}</div>
      <footer><span><i className="activity"/> Confirmed booking</span><span><i className="today"/> Today</span><span><i/> Available date</span></footer>
    </section>
  </>;
}
function WaiterOrders({ data, user }) {
  const [selectedDate, setSelectedDate] = useState(null),
    firstName = String(user?.name || "").trim().split(/\s+/)[0].toLowerCase(),
    mine = data.orders.filter((order) => {
      if (order.orderType === "parcel") return false;
      const waiter = String(order.waiter || "").toLowerCase();
      return !firstName || waiter.includes(firstName);
    }),
    daily = selectedDate ? mine.filter((order) => dateKey(order.createdAt) === selectedDate) : [];
  if (!selectedDate) return <OperationsCalendar orders={mine} kicker="MY SERVICE" title="My Orders Calendar" sub="Select a date to review your table orders and their kitchen and payment status." label="WAITER TABLE ORDERS" onSelect={setSelectedDate}/>;
  return <>
    <PageHead
      kicker="DAILY TABLE SERVICE"
      title={new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      sub={`${daily.length} table order${daily.length === 1 ? "" : "s"} handled on this date.`}
      action={<button className="secondary" onClick={() => setSelectedDate(null)}><ChevronLeft size={15}/> Calendar</button>}
    />
    <DailyOrderCards orders={daily} data={data}/>
  </>;
}
function BookingModal({ data, close, refresh, toast, initialDate }) {
  const [form, setForm] = useState({
      tableId: "",
      customerPhone: "",
      bookingDate: initialDate || dateKey(new Date()),
      bookingTime: "18:00",
      durationMinutes: 90,
    }),
    [error, setError] = useState(""), [busy, setBusy] = useState(false),
    bookings = data.bookings || [],
    requestedStart = bookingMinutes(form.bookingTime), requestedEnd = requestedStart + Number(form.durationMinutes),
    tableOptions = data.tables.map((table) => {
      const conflicts = bookings.filter((booking) => booking.tableId === table.id && booking.bookingDate === form.bookingDate && bookingMinutes(booking.bookingTime) < requestedEnd && bookingMinutes(booking.bookingTime) + Number(booking.durationMinutes) > requestedStart);
      return { value: table.id, label: `Table ${table.number} · ${table.seats} seats`, note: conflicts.length ? `Locked ${conflicts.map((booking) => bookingTimeLabel(booking.bookingTime)).join(", ")}` : table.area, disabled: conflicts.length > 0 };
    });
  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const result = await api("/bookings", { method: "POST", body: JSON.stringify(form) });
      await refresh();
      toast(result.notificationStatus === "sent" ? "Booking confirmed · SMS sent to customer" : result.notificationStatus === "failed" ? "Booking confirmed · SMS delivery failed" : "Booking confirmed · SMS queued (gateway configuration required)");
      close();
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">NEW RESERVATION</span>
      <h2>Book a table</h2>
      <p>The selected table and overlapping time are locked across Admin and Waiter.</p>
      <form className="modal-form" onSubmit={submit}>
        <label>Customer mobile number<input type="tel" required placeholder="Example: +91 7904951736" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}/></label>
        <div className="booking-form-grid">
          <label>Booking date<input type="date" min={dateKey(new Date())} required value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value, tableId: "" })}/></label>
          <label>Booking time<input type="time" required value={form.bookingTime} onChange={(e) => setForm({ ...form, bookingTime: e.target.value, tableId: "" })}/></label>
        </div>
        <label>Reservation duration<ThemeSelect value={form.durationMinutes} onChange={(durationMinutes) => setForm({ ...form, durationMinutes: Number(durationMinutes), tableId: "" })} options={[60,90,120,150,180].map((minutes) => ({ value: minutes, label: `${minutes} minutes`, note: `Table locked until ${bookingTimeLabel(String(Math.floor((requestedStart+minutes)/60)%24).padStart(2,"0")+":"+String((requestedStart+minutes)%60).padStart(2,"0"))}` }))}/></label>
        <label>
          Available table for this time
          <ThemeSelect value={form.tableId} onChange={(tableId) => setForm({ ...form, tableId })} placeholder="Choose an unlocked table" options={tableOptions}/>
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary wide" disabled={!form.tableId || !form.customerPhone || busy}>{busy ? "Locking table…" : "Confirm booking & send SMS"}</button>
      </form>
    </Modal>
  );
}
function Modal({ close, children, wide = false, hideClose = false, closeLeft = false }) {
  return (
    <div
      className="modal-wrap"
      onMouseDown={(e) => !hideClose && e.target === e.currentTarget && close()}
    >
      <div className={`modal ${wide ? "wide-modal" : ""}`}>
        {!hideClose ? (
          <button className={`modal-close ${closeLeft ? "left" : ""}`} onClick={close}>
            <X size={18} />
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
function TableDrawer({ table, data, user, close, refresh, toast }) {
  const order = data.orders.find((o) => o.id === table.orderId),
    [mode, setMode] = useState(order ? "history" : "order"),
    [handoffBusy, setHandoffBusy] = useState("");
  async function updateRoundHandoff(batchNo, status) {
    setHandoffBusy(`${batchNo}-${status}`);
    try {
      await api(`/orders/${order.id}/batches/${batchNo}/handoff`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refresh();
      toast(`Round ${batchNo} of order #${order.id} received at Table ${table.number}`);
    } catch (e) {
      toast(e.message);
    } finally {
      setHandoffBusy("");
    }
  }
  return (
    <Modal close={close} wide>
      <div className="drawer-head">
        <div>
          <span className="eyebrow">TABLE SERVICE</span>
          <h2>Table {table.number}</h2>
          <p>
            {table.area} · {table.seats} seats ·{" "}
            <Status status={table.status} />
          </p>
        </div>
        {order && !["billing_requested", "completed"].includes(order.status) ? (
          <div className="drawer-tabs">
            <button
              className={mode === "history" ? "active" : ""}
              onClick={() => setMode("history")}
            >
              View orders
            </button>
            <button
              className={mode === "order" ? "active" : ""}
              onClick={() => setMode("order")}
            >
              Add new order
            </button>
            {["received", "served"].includes(order.status) ? (
              <button
                className={mode === "bill" ? "active" : ""}
                onClick={() => setMode("bill")}
              >
                Bill
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <TableStatusControls table={table} refresh={refresh} toast={toast} />
      {mode === "order" ? (
        table.status === "cleaning" && !order ? (
          <div className="service-handoff table-cleaning-lock">
            <Clock3 size={34} />
            <span className="eyebrow">TABLE UNAVAILABLE</span>
            <h3>Table {table.number} is under cleaning</h3>
            <p>The food menu is disabled until this table is marked Available or Reserved.</p>
          </div>
        ) : <OrderBuilder
            table={table}
            data={data}
            user={user}
            existing={order}
            refresh={refresh}
            toast={toast}
            close={close}
          />
      ) : mode === "history" ? (
        <WaiterOrderRounds order={order} data={data} table={table} busy={handoffBusy} confirmRoundReceived={(batchNo) => updateRoundHandoff(batchNo, "received")} addOrder={() => setMode("order")} openBill={() => setMode("bill")} />
      ) : mode === "bill" ? (
        <Bill
          table={table}
          order={order}
          data={data}
          refresh={refresh}
          toast={toast}
          close={close}
        />
      ) : (
        <div className="service-handoff">
          <span className="eyebrow">ORDER HANDOFF</span>
          {order.status === "ready" ? (
            <>
              <ChefHat size={34} />
              <h3>Waiting for kitchen handoff</h3>
              <p>The order is ready. The Chef must confirm that it was collected from the kitchen.</p>
            </>
          ) : order.status === "collected" ? (
            <>
              <Armchair size={34} />
              <h3>Deliver to Table {table.number}</h3>
              <p>The Chef confirmed collection. Confirm after the complete order reaches the guest.</p>
              <button className="primary" disabled={handoffBusy} onClick={() => updateHandoff("received")}>
                {handoffBusy ? "Updating…" : "Order received at table"}
              </button>
            </>
          ) : order.status === "received" ? (
            <>
              <CheckCircle2 size={34} />
              <h3>Order received</h3>
              <p>Would the guest like another order, or is the table ready for billing?</p>
              <div className="service-handoff-actions">
                <button className="secondary" onClick={() => setMode("order")}><Plus size={16} /> More order</button>
                <button className="primary" onClick={() => setMode("bill")}><ReceiptText size={16} /> Complete & billing</button>
              </div>
            </>
          ) : (
            <>
              <Clock3 size={34} />
              <h3>Kitchen is preparing this order</h3>
              <p>The collect action will appear as soon as the chef marks every item ready.</p>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
function WaiterOrderRounds({ order, data, table, busy, confirmRoundReceived, addOrder, openBill }) {
  const batches = [...new Set(order.items.map((item) => Number(item.batchNo) || 1))]
    .sort((a, b) => b - a)
    .map((batchNo) => {
      const items = order.items.filter((item) => (Number(item.batchNo) || 1) === batchNo);
      const status = items.every((item) => item.itemStatus === "ready")
        ? "ready"
        : items.every((item) => (item.itemStatus || "new") === "new")
          ? "new"
          : "preparing";
      const handoffStatus = items.every((item) => item.handoffStatus === "received")
        ? "received"
        : items.every((item) => ["collected", "received"].includes(item.handoffStatus))
          ? "collected"
          : "pending";
      return { batchNo, items, status, handoffStatus, displayStatus: handoffStatus === "pending" ? status : handoffStatus };
    });
  const allReceived = batches.length > 0 && batches.every((batch) => batch.handoffStatus === "received");
  return (
    <section className="waiter-order-rounds">
      <header>
        <div><span className="eyebrow">TABLE ORDER HISTORY</span><h3>Order #{order.id}</h3></div>
        <small>{batches.length} separate kitchen round{batches.length === 1 ? "" : "s"}</small>
      </header>
      {allReceived ? <div className="service-handoff-actions waiter-history-actions"><button className="secondary" onClick={addOrder}><Plus size={16}/> Add new order</button><button className="primary" onClick={openBill}><ReceiptText size={16}/> Complete & billing</button></div> : null}
      <div className="waiter-round-list">
        {batches.map((batch, index) => (
          <article key={batch.batchNo} className={`waiter-round-card ${batch.displayStatus}`}>
            <header>
              <div><b>Round {batch.batchNo}</b><small>{index === 0 ? "Latest order" : "Previous order"}</small></div>
              <Status status={batch.displayStatus}/>
            </header>
            {batch.items.map((item, itemIndex) => {
              const menu = data.menu.find((entry) => entry.id === item.menuId);
              return <div className="waiter-round-line" key={`${item.menuId}-${itemIndex}`}><span><b>{item.qty}×</b>{menu?.name || "Menu item"}</span><em>{item.itemStatus || "new"}</em></div>;
            })}
            <div className="waiter-round-handoff">
              <span className={batch.status === "ready" ? "done" : "active"}><ChefHat size={15}/> {batch.status === "ready" ? "Kitchen ready" : "Preparing"}</span>
              <span className={["collected", "received"].includes(batch.handoffStatus) ? "done" : ""}><Package size={15}/> {batch.handoffStatus === "pending" ? "Awaiting collection" : "Collected"}</span>
              <span className={batch.handoffStatus === "received" ? "done" : ""}><Armchair size={15}/> {batch.handoffStatus === "received" ? `Received at Table ${table.number}` : "Awaiting table receipt"}</span>
            </div>
            {batch.handoffStatus === "collected" ? <button className="primary waiter-received-action" disabled={!!busy} onClick={() => confirmRoundReceived(batch.batchNo)}><CheckCircle2 size={16}/>{busy === `${batch.batchNo}-received` ? "Updating…" : `Confirm Round ${batch.batchNo} received`}</button> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
function TableStatusControls({ table, refresh, toast }) {
  const [busy, setBusy] = useState("");
  async function update(status) {
    setBusy(status);
    try {
      await api(`/tables/${table.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refresh();
      toast(`Table ${table.number} marked ${status}`);
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="table-status-controls">
      <span>Update table status</span>
      {["available", "cleaning", "reserved"].map((status) => (
        <button
          key={status}
          className={table.status === status ? "active" : ""}
          disabled={!!table.orderId || busy === status}
          onClick={() => update(status)}
        >
          {status === "available"
            ? "Free / available"
            : status === "cleaning"
              ? "Under cleaning"
              : "Reserved"}
        </button>
      ))}
      {table.orderId ? (
        <small>
          Finalize the bill before releasing or changing this table.
        </small>
      ) : null}
    </div>
  );
}
function OrderBuilder({ table, data, user, existing, refresh, toast, close }) {
  const [cart, setCart] = useState([]),
    [cat, setCat] = useState("All"),
    [sending, setSending] = useState(false);
  const categories = ["All", ...new Set(data.menu.map((m) => m.category))];
  function add(id) {
    setCart((c) => {
      const x = c.find((i) => i.menuId === id);
      return x ? c : [...c, { menuId: id, qty: 1, note: "" }];
    });
  }
  function qty(id, d) {
    setCart((c) =>
      c
        .map((i) => (i.menuId === id ? { ...i, qty: i.qty + d } : i))
        .filter((i) => i.qty > 0),
    );
  }
  async function send() {
    if (!cart.length) return;
    setSending(true);
    try {
      await api(existing ? `/orders/${existing.id}/items` : "/orders", {
        method: "POST",
        body: JSON.stringify(
          existing
            ? { items: cart }
            : {
                tableId: table.id,
                guestName: table.guestName || "Walk-in Guest",
                waiter: user.name.split(" ")[0],
                items: cart,
              },
        ),
      });
      await refresh();
      toast(
        existing ? "Additional order sent to kitchen" : "Order sent to kitchen",
      );
      close();
    } catch (e) {
      toast(e.message);
    } finally {
      setSending(false);
    }
  }
  return (
    <div className="order-builder">
      <div>
        <div className="category-row">
          {categories.map((c) => (
            <button
              className={cat === c ? "active" : ""}
              onClick={() => setCat(c)}
              key={c}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="menu-list">
          {data.menu
            .filter((m) => cat === "All" || m.category === cat)
            .map((m) => (
              <button
                key={m.id}
                disabled={!m.available}
                className={`${cart.some((item) => item.menuId === m.id) ? "selected-food" : ""} ${!m.available ? "dish-disabled" : ""}`}
                onClick={() => add(m.id)}
              >
                <span>
                  {m.imageUrl ? <img src={m.imageUrl} alt="" /> : m.icon}
                </span>
                <div>
                  <b>{m.name}</b>
                  <small>{m.available ? m.category : `${m.category} · Not available`}</small>
                </div>
                <strong>{!m.available ? "Not available" : cart.some((item) => item.menuId === m.id) ? <><CheckCircle2 size={14}/> Selected</> : money(m.price)}</strong>
              </button>
            ))}
        </div>
      </div>
      <aside className="order-cart">
        <h3>{existing ? "Add a second order" : "New order"}</h3>
        <p>
          {existing
            ? `Order #${existing.id} remains open · select extra items`
            : "Add menu items for this table"}
        </p>
        {existing ? (
          <div className="existing-order-summary">
            <b>Already ordered</b>
            <span>
              {existing.items.reduce((sum, item) => sum + item.qty, 0)} items ·
              Kitchen: {existing.status}
            </span>
          </div>
        ) : null}
        <div className="cart-lines">
          {cart.length ? (
            cart.map((i) => {
              const m = data.menu.find((x) => x.id === i.menuId);
              return (
                <div key={i.menuId}>
                  <div>
                    <b>{m.name}</b>
                    <small>{money(m.price)} each</small>
                  </div>
                  <span>
                    <button onClick={() => qty(i.menuId, -1)}>
                      <Minus size={12} />
                    </button>
                    {i.qty}
                    <button onClick={() => qty(i.menuId, 1)}>
                      <Plus size={12} />
                    </button>
                  </span>
                  <strong>{money(m.price * i.qty)}</strong>
                </div>
              );
            })
          ) : (
            <div className="cart-empty">
              <UtensilsCrossed />
              <p>
                {existing
                  ? "Tap + on a dish to add extra items"
                  : "No items added yet"}
              </p>
            </div>
          )}
        </div>
        <div className="cart-total">
          <span>{existing ? "Additional subtotal" : "Estimated subtotal"}</span>
          <b>
            {money(
              cart.reduce(
                (s, i) =>
                  s + data.menu.find((m) => m.id === i.menuId).price * i.qty,
                0,
              ),
            )}
          </b>
        </div>
        <button
          className="primary wide"
          disabled={!cart.length || sending}
          onClick={send}
        >
          {sending
            ? "Sending…"
            : existing
              ? "Send additional order"
              : "Send to kitchen"}{" "}
          <ChefHat size={16} />
        </button>
      </aside>
    </div>
  );
}
function calculateBill(order, data) {
  if (!order) return null;
  const items = order.items.map((i) => ({
      ...i,
      menu: data.menu.find((m) => m.id === i.menuId),
    })),
    subtotal = items.reduce((s, i) => s + (i.menu?.price || 0) * i.qty, 0),
    // GST charges are temporarily disabled. Retain for later use.
    // tax = (subtotal * data.settings.taxRate) / 100,
    // cgst = (subtotal * data.settings.cgstRate) / 100,
    tax = 0,
    cgst = 0,
    // service = (subtotal * data.settings.serviceCharge) / 100,
    service = 0;
  return { items, subtotal, tax, cgst, service, total: subtotal };
}
function billNumber(order) {
  return order?.dailyNumber ?? order?.id;
}
function playReceiptPrintAnimation(receipt, copies) {
  const overlay = document.createElement("div");
  overlay.className = "receipt-print-animation";
  const stage = document.createElement("div");
  stage.className = "receipt-animation-stage";
  const slot = document.createElement("div");
  slot.className = "receipt-animation-slot";
  const paper = receipt.cloneNode(true);
  paper.className = "receipt-animation-paper";
  paper.querySelector(".print")?.remove();
  const message = document.createElement("div");
  message.className = "receipt-animation-message";
  message.innerHTML = `<b>Receipt ready</b><span>${copies} ${copies === 1 ? "bill" : "bills"} prepared for printing</span>`;
  stage.append(slot, paper);
  overlay.append(stage, message);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("playing"));
  return new Promise((resolve) => window.setTimeout(() => {
    overlay.classList.add("leaving");
    window.setTimeout(() => {
      overlay.remove();
      resolve();
    }, 220);
  }, 1750));
}
async function openPrinter(event) {
  const container = event.currentTarget.closest(".modal-wrap") || document;
  const receipt = event.currentTarget.closest(".receipt") || container.querySelector(".receipt");
  if (!receipt) return;
  // Chrome/macOS does not always dispatch afterprint. Remove any abandoned
  // print DOM first so an earlier bill can never be included in this job.
  document.querySelectorAll(".print-receipt-root").forEach((root) => root.remove());
  document.querySelectorAll("style[data-receipt-page-style]").forEach((style) => style.remove());
  document.body.classList.remove("printing-receipt");
  const requestedCopies = window.prompt("How many bills do you want to print?", "1");
  if (requestedCopies === null) return;
  const copies = Number(requestedCopies);
  if (!Number.isInteger(copies) || copies < 1 || copies > 20) {
    window.alert("Please enter a whole number from 1 to 20.");
    return;
  }
  const printRoot = document.createElement("div");
  printRoot.className = "print-receipt-root";
  for (let copy = 0; copy < copies; copy += 1) {
    const printedReceipt = receipt.cloneNode(true);
    printedReceipt.classList.add("print-receipt-copy");
    printRoot.appendChild(printedReceipt);
  }
  const itemRows = receipt.querySelectorAll(".receipt-items > div");
  const itemHeight = [...itemRows].reduce((height, row) => {
    const name = row.querySelector("span")?.textContent?.trim().length || 0;
    return height + Math.max(7, Math.ceil(name / 30) * 5);
  }, 0);
  // Allow room for the larger luxury layout, totals, and closing footer.
  // A little trailing allowance is intentional so the cutter never clips the total.
  const pageHeight = Math.min(500, Math.max(145, 116 + itemHeight));
  const pageStyle = document.createElement("style");
  pageStyle.dataset.receiptPageStyle = "true";
  pageStyle.textContent = `@media print { @page { size: 72mm ${pageHeight}mm; margin: 0; } }`;
  document.head.appendChild(pageStyle);
  const previousTitle = document.title;
  document.title = "";
  document.body.appendChild(printRoot);
  document.body.classList.add("printing-receipt");
  const images = [...printRoot.querySelectorAll("img")];
  await Promise.all(images.map((image) => image.complete
    ? Promise.resolve()
    : new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      })));
  await playReceiptPrintAnimation(receipt, copies);
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.body.classList.remove("printing-receipt");
    printRoot.remove();
    pageStyle.remove();
    document.title = previousTitle;
  };
  window.addEventListener("afterprint", cleanup, { once: true });
  window.addEventListener("focus", () => window.setTimeout(cleanup, 500), { once: true });
  window.print();
}
function BillReceipt({ table, order, data, bill }) {
  return (
    <div className="receipt parcel-print-receipt">
      <img
        className="receipt-watermark"
        src="/knockout-bill-watermark.png"
        alt=""
        aria-hidden="true"
      />
      <div className="receipt-brand">
        <img className="receipt-logo" src="/knockout-logo.png" alt="KnockOUT" />
        <h2>{data.settings.hotelName}</h2>
        <p>Tax Invoice · Bill #{billNumber(order)}</p>
      </div>
      <div className="receipt-meta">
        <span>{table ? `Table ${table.number}` : "Parcel order"}</span>
        <span>{order.guestName}</span>
        <span>{new Date(order.createdAt).toLocaleString("en-IN")}</span>
      </div>
      <div className="receipt-items">
        {bill.items.map((i, index) => (
          <div key={`${i.menuId}-${index}`}>
            <span>
              {i.qty} × {i.menu?.name}
            </span>
            <b>{money((i.menu?.price || 0) * i.qty)}</b>
          </div>
        ))}
      </div>
      <div className="receipt-totals">
        <p>
          <span>Subtotal</span>
          <b>{money(bill.subtotal)}</b>
        </p>
        {/* GST and CGST receipt rows are temporarily disabled; retain for later use.
        <p><span>GST ({data.settings.taxRate}%)</span><b>{money(bill.tax)}</b></p>
        <p><span>CGST ({data.settings.cgstRate}%)</span><b>{money(bill.cgst)}</b></p>
        */}
        {/* Service tax receipt row is temporarily disabled; retain for later use.
        <p>
          <span>Service tax ({data.settings.serviceCharge}%)</span>
          <b>{money(bill.service)}</b>
        </p>
        */}
        <p className="grand">
          <span>Total bill</span>
          <b>{money(bill.total)}</b>
        </p>
      </div>
      <footer className="receipt-footer">
        <b>Thank you for choosing us</b>
        <span>We look forward to welcoming you again</span>
        <i aria-hidden="true">◆</i>
      </footer>
      <button className="print" onClick={openPrinter}>
        <Printer size={14} /> Print bill
      </button>
    </div>
  );
}
function Bill({ table, order, data, refresh, toast, close }) {
  const bill = useMemo(() => calculateBill(order, data), [order, data]),
    [sending, setSending] = useState(false);
  if (!bill)
    return (
      <div className="empty-state">
        <ReceiptText />
        <h3>No active bill</h3>
        <p>Create an order for this table first.</p>
      </div>
    );
  const ready = ["received", "served", "billing_requested"].includes(order.status);
  async function requestBill() {
    setSending(true);
    try {
      await api(`/orders/${order.id}/request-bill`, {
        method: "POST",
        body: "{}",
      });
      await refresh();
      toast(`Bill for Table ${table.number} sent to Admin`);
      close();
    } catch (e) {
      toast(e.message);
    } finally {
      setSending(false);
    }
  }
  return (
    <div className="bill-layout">
      <BillReceipt table={table} order={order} data={data} bill={bill} />
      <div className="payment-panel waiter-bill-action">
        <span className="eyebrow">WAITER BILLING</span>
        <h2>{money(bill.total)}</h2>
        {order.status === "billing_requested" ? (
          <div className="bill-sent-state">
            <CheckCircle2 />
            <h3>Sent to Admin</h3>
            <p>
              Admin has received Table {table.number} and its complete bill.
            </p>
          </div>
        ) : (
          <>
            <p>
              Payment is handled only by Admin. When service is complete, send
              this bill to the Admin payment desk.
            </p>
            {!ready ? (
              <div className="payment-warning">
                <AlertTriangle size={17} /> Wait until the kitchen marks this
                order ready.
              </div>
            ) : null}
            <button
              className="primary wide send-admin-btn"
              disabled={!ready || sending}
              onClick={requestBill}
            >
              {sending ? (
                "Sending…"
              ) : (
                <>
                  Send to Admin <ArrowRight size={16} />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
function AdminBillPopup({ order, table, data, refresh, toast, close }) {
  const bill = useMemo(() => calculateBill(order, data), [order, data]),
    [paying, setPaying] = useState(false);
  async function finish(method) {
    setPaying(true);
    try {
      await api(`/orders/${order.id}/finalize`, {
        method: "POST",
        body: JSON.stringify({ paymentMethod: method }),
      });
      await refresh();
      toast(`Table ${table?.number} payment completed by ${method}`);
      close();
    } catch (e) {
      toast(e.message);
    } finally {
      setPaying(false);
    }
  }
  return (
    <Modal close={close} wide>
      <div className="admin-bill-alert">
        <span>
          <Bell size={17} />
        </span>
        <div>
          <b>Payment requested</b>
          <small>Waiter sent Table {table?.number} for billing</small>
        </div>
      </div>
      <div className="bill-layout">
        <BillReceipt table={table} order={order} data={data} bill={bill} />
        <div className="payment-panel">
          <span className="eyebrow">ADMIN PAYMENT DESK</span>
          <div className="admin-table-callout">
            TABLE <b>{table?.number}</b>
          </div>
          <h2>{money(bill.total)}</h2>
          <p>
            Confirm how payment was received. Completing payment moves this
            table to Cleaning.
          </p>
          <button
            className="pay-card"
            disabled={paying}
            onClick={() => finish("Card / UPI")}
          >
            <CreditCard />
            <span>
              <b>Card / UPI</b>
              <small>Record digital payment</small>
            </span>
            <ArrowRight />
          </button>
          <button
            className="pay-card"
            disabled={paying}
            onClick={() => finish("Cash")}
          >
            <Banknote />
            <span>
              <b>Cash</b>
              <small>Record cash payment</small>
            </span>
            <ArrowRight />
          </button>
        </div>
      </div>
    </Modal>
  );
}

function productionOrders(data, role) {
  const wantsJuice = role === "juicer";
  return data.orders
    .filter((order) => !["completed", "served", "billing_requested"].includes(order.status))
    .flatMap((order) => {
      const items = order.items.filter((line) => {
        const menu = data.menu.find((item) => item.id === line.menuId);
        return (String(menu?.category || "").toLowerCase() === "juices") === wantsJuice;
      });
      if (!items.length) return [];
      const batchNumbers = [...new Set(items.map((line) => Number(line.batchNo) || 1))].sort((a, b) => a - b);
      return batchNumbers.map((batchNo) => {
        const batchItems = items.filter((line) => (Number(line.batchNo) || 1) === batchNo);
        const allBatchItems = order.items.filter((line) => (Number(line.batchNo) || 1) === batchNo);
        const status = batchItems.every((line) => line.itemStatus === "ready")
          ? "ready"
          : batchItems.every((line) => (line.itemStatus || "new") === "new")
            ? "new"
            : "preparing";
        const handoffStatus = allBatchItems.every((line) => line.handoffStatus === "received") ? "received" : allBatchItems.every((line) => ["collected", "received"].includes(line.handoffStatus)) ? "collected" : "pending";
        const roundProductionReady = allBatchItems.every((line) => line.itemStatus === "ready");
        return { ...order, items: batchItems, batchNo, batchKey: `${order.id}-${batchNo}-${role}`, sourceStatus: order.status, productionStatus: status, status: handoffStatus === "pending" ? status : handoffStatus, handoffStatus, roundProductionReady, department: role };
      });
    })
    .filter((order) => order.handoffStatus !== "received");
}

function Chef({ data, refresh, user, logout, toast }) {
  const [page, setPage] = useState("overview");
  const active = productionOrders(data, "chef");
  const navBadges = {
    kitchen: active.filter((order) => order.orderType !== "parcel").length,
    parcels: active.filter((order) => order.orderType === "parcel").length,
  };
  const orders =
    page === "parcels"
      ? active.filter((o) => o.orderType === "parcel")
      : page === "kitchen"
        ? active.filter((o) => o.orderType !== "parcel")
        : active;
  const shown =
    page === "ready" ? orders.filter((o) => o.status === "ready") : orders;
  if (page === "overview") return <Shell role="chef" user={user} page={page} setPage={setPage} logout={logout} navBadges={navBadges}><RoleOverview role="chef" data={data} user={user} setPage={setPage}/></Shell>;
  /* Temporarily disabled; retain the Chef attendance screen for later.
  if (page === "attendance")
    return (
      <Shell
        role="chef"
        user={user}
        page={page}
        setPage={setPage}
        logout={logout}
        navBadges={navBadges}
      >
        <AttendancePanel user={user} toast={toast} />
      </Shell>
    );
  */
  if (page === "team")
    return (
      <Shell
        role="chef"
        user={user}
        page={page}
        setPage={setPage}
        logout={logout}
        navBadges={navBadges}
      >
        <ChefManagement
          data={data}
          refresh={refresh}
          user={user}
          toast={toast}
        />
      </Shell>
    );
  if (page === "stock-booking")
    return <Shell role="chef" user={user} page={page} setPage={setPage} logout={logout} navBadges={navBadges}><ChefStockBooking data={data} refresh={refresh} user={user} toast={toast}/></Shell>;
  if (page === "dishes")
    return (
      <Shell role="chef" user={user} page={page} setPage={setPage} logout={logout} navBadges={navBadges}>
        <ChefDishes data={data} refresh={refresh} toast={toast} />
      </Shell>
    );
  async function status(id, next, batchNo) {
    await api(`/orders/${id}/items/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: next, batchNo }),
    });
    refresh();
    toast(`Order #${id} marked ${next}`);
  }
  async function collect(id, batchNo) {
    try {
      await api(`/orders/${id}/batches/${batchNo}/handoff`, {
        method: "PATCH",
        body: JSON.stringify({ status: "collected" }),
      });
      await refresh();
      toast(`Round ${batchNo} of order #${id} collected from the kitchen`);
    } catch (error) {
      toast(error.message);
    }
  }
  return (
    <Shell
      role="chef"
      user={user}
      page={page}
      setPage={setPage}
      logout={logout}
      navBadges={navBadges}
    >
      <PageHead
        kicker="LIVE KITCHEN DISPLAY"
        title={
          page === "ready"
            ? "Ready to Serve"
            : page === "parcels"
              ? "Parcel Queue"
              : "Table Orders"
        }
        sub={`${orders.length} active orders · live socket tracking enabled.`}
      />
      <div className="kitchen-summary">
        <span>
          <i className="new" />
          <b>{orders.filter((o) => o.status === "new").length}</b> New
        </span>
        <span>
          <i className="preparing" />
          <b>{orders.filter((o) => o.status === "preparing").length}</b>{" "}
          Preparing
        </span>
        <span>
          <i className="ready" />
          <b>{orders.filter((o) => o.status === "ready").length}</b> Ready
        </span>
      </div>
      <div className="kitchen-grid">
        {shown.map((o) => (
          <KitchenTicket key={o.batchKey} order={o} data={data} status={status} collect={collect} />
        ))}
      </div>
      {!shown.length && (
        <div className="empty-state">
          <CheckCircle2 />
          <h3>Kitchen is clear</h3>
          <p>No orders in this queue right now.</p>
        </div>
      )}
    </Shell>
  );
}

function ChefStockBooking({ data, refresh, user, toast }) {
  const [query,setQuery]=useState(""),[booking,setBooking]=useState(null), inventory=data.inventory||[], requests=data.stockRequests||[], activeRequests=requests.filter((request)=>request.status!=="resolved"), low=inventory.filter((item)=>item.quantity<=item.min), visible=inventory.filter((item)=>`${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>(a.quantity/a.min||0)-(b.quantity/b.min||0));
  return <>
    <PageHead kicker="KITCHEN PROCUREMENT" title="Book Kitchen Stock" sub="Request ingredients before they finish. Admin receives the request immediately."/>
    <div className="stats chef-stock-stats"><Stat icon={AlertTriangle} label="Low / finished" value={low.length} note="Needs kitchen attention" tone="warning"/><Stat icon={Bell} label="Active requests" value={activeRequests.length} note="Pending or ordered by Admin"/><Stat icon={Boxes} label="Ingredients" value={inventory.length} note="Available stock records"/></div>
    {low.length?<section className="chef-low-alert"><AlertTriangle/><div><b>{low.length} ingredient{low.length===1?" is":"s are"} at or below minimum</b><small>Book these items now to avoid interrupting kitchen service.</small></div></section>:null}
    <div className="chef-stock-toolbar"><label><Search/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search ingredient or category"/></label><span>{visible.length} stock items</span></div>
    <div className="chef-stock-grid">{visible.map((item)=>{const request=activeRequests.find((entry)=>entry.inventoryId===item.id),ratio=item.min?item.quantity/item.min:2,status=item.quantity===0?"Finished":ratio<=1?"Low":"Available";return <article className={ratio<=1?"low":""} key={item.id}><header><span>{item.category||"Kitchen"}</span><em>{status}</em></header><h2>{item.name}</h2><div className="chef-stock-level"><b>{item.quantity}</b><span>{item.unit}<small>Minimum {item.min} {item.unit}</small></span></div><div className="stock-meter"><i style={{width:`${Math.min(100,ratio*50)}%`}}/></div>{request?<div className={`chef-request-state ${request.status}`}><Bell/><span><b>{request.status}</b><small>{request.requestedQuantity} {item.unit} requested by {request.requestedBy}</small></span></div>:<button className="primary wide" onClick={()=>setBooking(item)}><ShoppingCart/>Book this stock</button>}</article>})}</div>
    {!visible.length?<div className="empty-state"><Search/><h3>No ingredients found</h3></div>:null}
    {booking?<ChefStockRequestModal item={booking} user={user} close={()=>setBooking(null)} refresh={refresh} toast={toast}/>:null}
  </>;
}

function ChefStockRequestModal({ item,user,close,refresh,toast }) {
  const suggested=Math.max(item.min*2-item.quantity,item.min||1),[quantity,setQuantity]=useState(String(suggested)),[note,setNote]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function submit(event){event.preventDefault();setBusy(true);setError("");try{await api("/stock-requests",{method:"POST",body:JSON.stringify({inventoryId:item.id,requestedQuantity:Number(quantity),note,requestedBy:user.name})});await refresh();toast(`${item.name} stock request sent to Admin`);close()}catch(err){setError(err.message)}finally{setBusy(false)}}
  return <Modal close={close} hideClose={busy}><div className="master-action-icon"><ShoppingCart/></div><span className="eyebrow">STOCK BOOKING</span><h2>Request {item.name}</h2><p>Current stock is <b>{item.quantity} {item.unit}</b>; the minimum level is <b>{item.min} {item.unit}</b>. Admin will receive this request immediately.</p><form className="modal-form" onSubmit={submit}><label>QUANTITY REQUIRED<input type="number" min="0.01" step="0.01" value={quantity} onChange={(event)=>setQuantity(event.target.value)} required/></label><label>NOTE / REASON<textarea value={note} onChange={(event)=>setNote(event.target.value)} placeholder="Needed for tomorrow's service, supplier preference…"/></label>{error?<div className="form-error">{error}</div>:null}<div className="master-action-buttons"><button type="button" onClick={close} disabled={busy}>Cancel</button><button className="primary" disabled={busy||Number(quantity)<=0}>{busy?"Sending…":"Send request to Admin"}</button></div></form></Modal>;
}

function Juicer({ data, refresh, user, logout, toast }) {
  const [page, setPage] = useState("overview");
  const active = productionOrders(data, "juicer");
  const navBadges = {
    queue: active.filter((order) => order.orderType !== "parcel").length,
    "parcel-queue": active.filter((order) => order.orderType === "parcel").length,
  };
  if (page === "overview") return <Shell role="juicer" user={user} page={page} setPage={setPage} logout={logout} navBadges={navBadges}><RoleOverview role="juicer" data={data} user={user} setPage={setPage}/></Shell>;
  // Temporarily disabled; retain the Juicer attendance screen for later:
  // if (page === "attendance") return <Shell role="juicer" user={user} page={page} setPage={setPage} logout={logout}><AttendancePanel user={user} toast={toast}/></Shell>;
  if (page === "juices") return <Shell role="juicer" user={user} page={page} setPage={setPage} logout={logout} navBadges={navBadges}><ChefDishes data={{...data,menu:data.menu.filter(item=>String(item.category).toLowerCase()==="juices")}} refresh={refresh} toast={toast} juicer/></Shell>;
  const orders = page === "ready"
    ? active.filter(order => order.status === "ready")
    : page === "parcel-queue"
      ? active.filter(order => order.orderType === "parcel")
      : active.filter(order => order.orderType !== "parcel");
  async function status(id, next, batchNo) {
    await api(`/orders/${id}/items/status`, { method: "PATCH", body: JSON.stringify({ status: next, batchNo }) });
    await refresh();
    toast(`Juice order #${id} marked ${next}`);
  }
  return <Shell role="juicer" user={user} page={page} setPage={setPage} logout={logout} navBadges={navBadges}>
    <PageHead kicker="LIVE JUICE STATION" title={page === "ready" ? "Ready Juices" : page === "parcel-queue" ? "Parcel Queue" : "Table Orders"} sub={`${orders.length} live juice tickets · tracked separately for tables and parcels.`}/>
    <div className="kitchen-summary"><span><i className="new"/><b>{active.filter(o=>o.status==="new").length}</b> New</span><span><i className="preparing"/><b>{active.filter(o=>o.status==="preparing").length}</b> Preparing</span><span><i className="ready"/><b>{active.filter(o=>o.status==="ready").length}</b> Ready</span></div>
    <div className="kitchen-grid">{orders.map(order=><KitchenTicket key={order.batchKey} order={order} data={data} status={status} departmentLabel="juice items"/>)}</div>
    {!orders.length?<div className="empty-state"><CupSoda/><h3>Juice station is clear</h3><p>No juice items in this queue right now.</p></div>:null}
  </Shell>;
}
function ChefDishes({ data, refresh, toast, juicer = false }) {
  const [query, setQuery] = useState("");
  const dishes = data.menu.filter((item) => !item.isCombo && (juicer ? String(item.category).toLowerCase() === "juices" : String(item.category).toLowerCase() !== "juices") && item.name.toLowerCase().includes(query.toLowerCase()));
  async function setAvailability(item, available) {
    await api(`/menu/${item.id}/availability`, { method: "PATCH", body: JSON.stringify({ available }) });
    await refresh();
    toast(`${item.name} marked ${available ? "available" : "completed / unavailable"}`);
  }
  return <>
    <PageHead kicker={juicer?"JUICE MENU CONTROL":"KITCHEN MENU CONTROL"} title={juicer?"Juices":"Dishes"} sub={`Mark a completed or sold-out ${juicer?"juice":"dish"} unavailable. Admin and Waiter ordering screens update automatically.`} />
    <div className="dish-control-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dishes…"/><span><b>{dishes.filter((item) => item.available).length}</b> available · <b>{dishes.filter((item) => !item.available).length}</b> completed</span></div>
    <div className="chef-dish-grid">{dishes.map((item) => <article className={`chef-dish-card ${item.available ? "available" : "completed"}`} key={item.id}>
      <div className="chef-dish-visual">{item.imageUrl ? <img src={item.imageUrl} alt=""/> : <span>{item.icon}</span>}</div>
      <div><small>{item.category}</small><h3>{item.name}</h3><p>{item.description || "Kitchen menu item"}</p></div>
      <Status status={item.available ? "available" : "completed"}/>
      {item.available ? <button className="secondary" onClick={() => setAvailability(item, false)}><CheckCircle2 size={15}/> Mark completed</button> : <button className="primary" onClick={() => setAvailability(item, true)}>Make available</button>}
    </article>)}</div>
    {!dishes.length ? <div className="empty-state"><UtensilsCrossed/><h3>No dishes found</h3></div> : null}
  </>;
}
function ChefManagement({ data, refresh, user, toast }) {
  const [editor, setEditor] = useState(null),
    [juicer, setJuicer] = useState(undefined),
    [juicerEditor, setJuicerEditor] = useState(false),
    staff = data.kitchenStaff || [];
  const loadJuicer = useCallback(() => api("/juicer-login").then(setJuicer).catch((error) => toast(error.message)), [toast]);
  useEffect(() => { loadJuicer(); }, [loadJuicer]);
  async function remove(id) {
    try {
      await api(`/kitchen-staff/${id}`, { method: "DELETE" });
      await refresh();
      toast("Chef removed");
    } catch (e) {
      toast(e.message);
    }
  }
  return (
    <>
      <PageHead
        kicker="HEAD CHEF CONTROL"
        title="Chef Management"
        sub="Add kitchen employees without separate application logins."
        action={<div className="page-actions"><button className="secondary" disabled={!!juicer} onClick={() => setJuicerEditor(true)}><CupSoda size={15}/> {juicer ? "Juicer login created" : "Create Juicer login"}</button><button className="primary" onClick={() => setEditor({})}><Plus size={15}/> Add chef</button></div>}
      />
      <section className="panel juicer-account-panel">
        <div><span className="eyebrow">JUICE STATION ACCESS</span><h3>{juicer ? juicer.name : "No Juicer login yet"}</h3><p>{juicer ? `Six-digit PIN assigned · ${juicer.active ? "Active" : "Disabled by Admin"}` : "Create the company’s single Juicer PIN. Admin can edit or disable it from Staff Management."}</p></div>
        <Status status={juicer ? (juicer.active ? "active" : "inactive") : "not created"}/>
      </section>
      <div className="stats">
        <Stat
          icon={ChefHat}
          label="Kitchen Team"
          value={staff.length}
          note="Managed by Head Chef"
        />
        <Stat
          icon={CheckCircle2}
          label="Active Chefs"
          value={staff.filter((x) => x.active).length}
          note="Currently employed"
        />
        <Stat icon={Users} label="App Logins" value="1" note="Head Chef only" />
      </div>
      <div className="kitchen-team-grid">
        {staff.map((member) => <KitchenMemberCard key={member.id} member={member} edit={() => setEditor(member)} remove={() => remove(member.id)} />)}
      </div>
      {!staff.length && (
        <div className="empty-state panel">
          <ChefHat />
          <h3>No chefs added yet</h3>
          <p>Add the kitchen team from this Head Chef account.</p>
        </div>
      )}
      {editor && (
        <KitchenStaffEditor
          member={editor.id ? editor : null}
          user={user}
          close={() => setEditor(null)}
          refresh={refresh}
          toast={toast}
        />
      )}
      {juicerEditor && !juicer ? <JuicerLoginEditor close={() => setJuicerEditor(false)} done={async()=>{setJuicerEditor(false);await loadJuicer();await refresh()}} toast={toast}/> : null}
    </>
  );
}
function JuicerLoginEditor({ close, done, toast }) {
  const [form,setForm]=useState({name:"",phone:"",payType:"monthly",payRate:0}),[busy,setBusy]=useState(false);
  async function save(event){event.preventDefault();setBusy(true);try{const result=await api("/juicer-login",{method:"POST",body:JSON.stringify(form)});toast(`Juicer login created · Generated PIN ${result.pin}`);await done()}catch(error){toast(error.message)}finally{setBusy(false)}}
  return <Modal close={close}><span className="eyebrow">JUICE STATION LOGIN</span><h2>Create Juicer login</h2><p>A unique six-digit PIN will be generated automatically.</p><form className="modal-form" onSubmit={save}><label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><div className="database-preview"><Settings size={17}/><span>Login PIN</span><code>Generated after creation</code></div><div className="form-grid"><label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Salary basis<select value={form.payType} onChange={e=>setForm({...form,payType:e.target.value})}><option value="daily">Daily</option><option value="monthly">Monthly</option></select></label><label>Salary amount<input type="number" min="0" value={form.payRate} onChange={e=>setForm({...form,payRate:e.target.value})}/></label></div><button className="primary wide" disabled={busy||!form.name.trim()}>{busy?"Creating…":"Create Juicer login"}</button></form></Modal>;
}
function KitchenStaffEditor({ member, user, close, refresh, toast }) {
  const [form, setForm] = useState({
      name: member?.name || "",
      designation: member?.designation || "Chef",
      phone: member?.phone || "",
      specialization: member?.specialization || "",
      payType: member?.payType || "monthly",
      payRate: member?.payRate || 0,
      joinedOn: member?.joinedOn ? String(member.joinedOn).slice(0, 10) : "",
      notes: member?.notes || "",
      active: member?.active ?? true,
      createdBy: user?.name || "Admin",
    }),
    [error, setError] = useState("");
  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      await api(member ? `/kitchen-staff/${member.id}` : "/kitchen-staff", {
        method: member ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      await refresh();
      toast(member ? "Chef updated" : "Chef added");
      close();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">KITCHEN TEAM</span>
      <h2>{member ? "Edit chef" : "Add a chef"}</h2>
      <p>No PIN or separate login will be created.</p>
      <form className="modal-form" onSubmit={save}>
        <label>
          Full name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Designation
            <input
              required
              value={form.designation}
              onChange={(e) =>
                setForm({ ...form, designation: e.target.value })
              }
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            Specialization
            <input
              value={form.specialization}
              onChange={(e) =>
                setForm({ ...form, specialization: e.target.value })
              }
            />
          </label>
          <label>
            Joining date
            <input
              type="date"
              value={form.joinedOn}
              onChange={(e) => setForm({ ...form, joinedOn: e.target.value })}
            />
          </label>
          <label className="choice-field">
            Pay type
            <div className="theme-choice-grid pay-choices">
              {[['daily','Daily'],['monthly','Monthly']].map(([value,label])=><button type="button" key={value} className={form.payType===value?'selected':''} onClick={()=>setForm({...form,payType:value})}>{label}</button>)}
            </div>
          </label>
          <label>
            {form.payType === "daily" ? "Daily salary amount" : "Monthly salary amount"}
            <input
              type="number"
              min="0"
              value={form.payRate}
              onChange={(e) => setForm({ ...form, payRate: e.target.value })}
            />
          </label>
        </div>
        <label>
          Notes
          <textarea
            rows="3"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>
        {member && <label className="toggle-field"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active kitchen employee</label>}
        {error && <div className="form-error">{error}</div>}
        <button className="primary wide">
          {member ? "Save changes" : "Add chef"}
        </button>
      </form>
    </Modal>
  );
}
function KitchenTicket({ order, data, status, collect, departmentLabel = "food items" }) {
  const table = data.tables.find((t) => t.id === order.tableId),
    isParcel = order.orderType === "parcel",
    [expanded, setExpanded] = useState(false);
  return (
    <>
      <button className={`chef-order-summary ${order.status} ${isParcel ? "parcel" : ""}`} onClick={() => setExpanded(true)}>
        <span className="chef-summary-table">{isParcel ? "PARCEL" : "TABLE"}<b>{isParcel ? `#${order.id}` : table?.number}</b></span>
        <span><small>ORDER / ROUND</small><b>#{order.id} · {order.batchNo}</b></span>
        <span><small>TIME</small><b><Clock3 size={13}/>{elapsed(order.createdAt)}</b></span>
        <Status status={order.status}/>
        <ChevronRight size={18}/>
      </button>
      {expanded ? (
        <Modal close={() => setExpanded(false)} closeLeft>
          <div className="chef-detail-head">
            <span className={isParcel ? "parcel-label" : "chef-table-number"}>{isParcel ? "PARCEL ORDER" : <>TABLE <b>{table?.number}</b></>}</span>
            <div><small>ORDER / KITCHEN ROUND</small><h2>#{order.id} · {order.batchNo}</h2></div>
            <div><small>ELAPSED TIME</small><b><Clock3 size={14}/>{elapsed(order.createdAt)}</b></div>
            <Status status={order.status}/>
          </div>
          <div className="chef-detail-meta"><span>{isParcel ? order.guestName : `Taken by ${order.waiter}`}</span><span>{order.items.reduce((sum,item)=>sum+item.qty,0)} {departmentLabel}</span></div>
          <div className="ticket-items chef-detail-items">
            <div className="chef-food-columns" aria-hidden="true">
              <span>Food item</span>
              <span>Quantity</span>
            </div>
            {order.items.map((i,index) => {
              const m=data.menu.find((x)=>x.id===i.menuId);
              return <div className="chef-food-line" key={`${i.menuId}-${index}`}>
                <span className="chef-food-name">{m?.name}<small>{m?.isCombo?m.components.map((c)=>c.quantity+"× "+c.name).join(" + "):i.note}</small></span>
                <strong className="chef-food-quantity"><small>QTY</small>{i.qty}</strong>
              </div>;
            })}
          </div>
          {order.status === "new" ? <button className="primary wide" onClick={() => status(order.id,"preparing",order.batchNo)}>Start preparing <ArrowRight size={15}/></button> : null}
          {order.status === "preparing" ? <button className="ready-btn wide" onClick={() => status(order.id,"ready",order.batchNo)}><CheckCircle2 size={16}/> Mark ready for {isParcel?"Admin":"service"}</button> : null}
          {order.productionStatus === "ready" && collect && !isParcel && order.roundProductionReady && order.handoffStatus === "pending" ? <button className="ready-btn wide" onClick={() => collect(order.id,order.batchNo)}><Package size={16}/> Confirm Round {order.batchNo} collected</button> : null}
          {order.handoffStatus === "collected" ? <div className="parcel-done"><CheckCircle2 size={16}/> Round {order.batchNo} collected · waiting for waiter confirmation</div> : null}
          {order.productionStatus === "ready" && order.handoffStatus === "pending" && (!collect || isParcel || !order.roundProductionReady) ? <div className="parcel-done"><CheckCircle2 size={16}/> Kitchen round ready · {!order.roundProductionReady ? "waiting for remaining food or juice items" : "waiting for handoff"}</div> : null}
        </Modal>
      ) : null}
    </>
  );
}
