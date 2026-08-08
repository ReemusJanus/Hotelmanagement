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
} from "lucide-react";
import { api, API_BASE, portalHeaders, resolvePortalLogin } from "./api";
import AttendancePanel from "./AttendancePanel";

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
const elapsed = (iso) =>
  `${Math.max(1, Math.floor((Date.now() - new Date(iso)) / 60000))} min`;
const loginRoles = [
  {
    id: "admin",
    title: "Admin",
    desc: "Business, billing and staff",
    icon: LayoutDashboard,
    pin: "1234",
    port: "6100",
  },
  {
    id: "waiter",
    title: "Waiter",
    desc: "Tables, bookings and service",
    icon: UtensilsCrossed,
    pin: "1111",
    port: "7100",
  },
  {
    id: "chef",
    title: "Chef",
    desc: "Kitchen and parcel queues",
    icon: ChefHat,
    pin: "2222",
    port: "8100",
  },
];

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
  const refresh = useCallback(
    () =>
      api("/state")
        .then(setData)
        .catch((e) => setNotice(e.message)),
    [],
  );
  useEffect(() => {
    if (user && user.role !== "superadmin") {
      refresh();
      const id = setInterval(refresh, 5000);
      return () => clearInterval(id);
    }
  }, [user, refresh]);
  const login = (u) => {
    localStorage.setItem("knockout-company-db", u.companyDatabase);
    localStorage.setItem("knockout-portal-role", u.role);
    sessionStorage.setItem("knockout-portal-user", JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    sessionStorage.removeItem("knockout-portal-user");
    setUser(null);
    setData(null);
  };
  const toast = (m) => {
    setNotice(m);
    setTimeout(() => setNotice(""), 2800);
  };
  if (!user) return <Login onLogin={login} />;
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
      ) : (
        <Chef
          data={data}
          refresh={refresh}
          user={user}
          logout={logout}
          toast={toast}
        />
      )}
      <div className={`toast ${notice ? "show" : ""}`}>{notice}</div>
    </>
  );
}

function WebRoleSelect({ choose }) {
  return (
    <main className="web-auth role-entry">
      <header className="web-auth-brand">
        <span className="logo">K</span>
        <div>
          <b>KnockOUT</b>
          <small>ONE APP · EVERY SERVICE</small>
        </div>
      </header>
      <section className="role-entry-copy">
        <span className="eyebrow">HOSPITALITY OS</span>
        <h1>
          Choose your
          <br />
          workspace.
        </h1>
        <p>
          Select your portal and enter your PIN. KnockOUT securely detects your
          company automatically.
        </p>
      </section>
      <section className="web-role-grid">
        {loginRoles.map((item, index) => (
          <button key={item.id} onClick={() => choose(item.id)}>
            <span className="web-role-icon">
              <item.icon size={25} />
            </span>
            <span>
              <b>{item.title}</b>
              <small>{item.desc}</small>
            </span>
            <em>0{index + 1}</em>
            <ArrowRight size={20} />
          </button>
        ))}
      </section>
      <footer>KnockOUT Hospitality OS · Web, iOS & Android</footer>
    </main>
  );
}

function Login({ onLogin }) {
  const [pin, setPin] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [verified, setVerified] = useState(false),
    input = useRef(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    if (pin.length === 6 && !busy) submit();
  }, [pin]);
  async function submit(e) {
    e?.preventDefault();
    if (pin.length !== 6 || busy) return;
    setBusy(true);
    setError("");
    try {
      const user = await resolvePortalLogin(pin);
      setVerified(true);
      setTimeout(() => onLogin(user), 500);
    } catch (e) {
      setError(e.message);
      setPin("");
      setTimeout(() => input.current?.focus(), 100);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="web-auth otp-entry">
      <header className="otp-web-brand">
        <span className="logo">K</span>
        <b>KnockOUT</b>
        <small>UNIVERSAL ACCESS · ONE APPLICATION</small>
      </header>
      <section className={`web-otp-card ${verified ? "verified" : ""}`}>
        <i />
        <span className="eyebrow">6-DIGIT PIN VERIFICATION</span>
        <h1>{verified ? "Access verified" : "Enter your access PIN"}</h1>
        <p>
          {verified
            ? "Opening your correct workspace…"
            : "One unique PIN identifies Super Admin, Admin, Waiter, or Chef and the correct company."}
        </p>
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
          Forgot your PIN? Ask KnockOUT Master to change it.
        </small>
      </section>
    </main>
  );
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
    [creating, setCreating] = useState(false),
    [masterAction, setMasterAction] = useState(null),
    [pinUser, setPinUser] = useState(null),
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
      const id = setInterval(refresh, 7000);
      return () => clearInterval(id);
    }
  }, [user, refresh]);
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
  async function confirmMasterAction(typed = "") {
    const action = masterAction;
    if (!action || actionBusy) return;
    setActionBusy(true);
    try {
      if (action.type === "admin") {
        const result = await api(
          `/companies/${action.company.id}/admin-login`,
          { method: "DELETE" },
        );
        toast(
          result.disabled
            ? `${action.company.companyName} Admin login deleted`
            : `${action.company.companyName} has no active Admin login`,
        );
      } else {
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
  if (!user)
    return (
      <MasterLogin
        login={(value) => {
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
    revenue = companies.reduce((sum, x) => sum + x.revenue, 0);
  const logoutMaster = () => {
    sessionStorage.removeItem("knockout-master-user");
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
          <button className="active">
            <LayoutDashboard size={18} />
            Companies
          </button>
        </nav>
        <div className="system-ok">
          <i />
          <span>
            <b>Master database online</b>
            <small>Tenant isolation active</small>
          </span>
        </div>
        <div className="side-user">
          <span>KM</span>
          <div>
            <b>KnockOUT Master</b>
            <small>Super Admin</small>
          </div>
          <button onClick={logoutMaster}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <span className="eyebrow">MULTI-COMPANY CONTROL</span>
            <h2>KnockOUT Master</h2>
          </div>
          <button className="primary" onClick={() => setCreating(true)}>
            <Plus size={15} /> Register company
          </button>
        </header>
        <div className="page">
          <PageHead
            kicker="SUPER ADMIN"
            title="Company Network"
            sub="Register isolated KnockOUT companies and monitor every business database."
          />
          <div className="stats master-stats">
            <Stat
              icon={Building2}
              label="Companies"
              value={companies.length}
              note={`${companies.filter((x) => x.status === "active").length} active`}
            />
            <Stat
              icon={TrendingUp}
              label="Network Revenue"
              value={money(revenue)}
              note="Paid orders across companies"
            />
            <Stat
              icon={Users}
              label="Total Staff"
              value={companies.reduce((s, x) => s + x.staffCount, 0)}
              note="Active accounts"
            />
            <Stat
              icon={AlertTriangle}
              label="Low Stock Alerts"
              value={companies.reduce((s, x) => s + x.lowStock, 0)}
              note="Across all databases"
              tone="warning"
            />
          </div>
          <div className="company-grid">
            {companies.map((company) => (
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
                <code>{company.databaseName}</code>
                <p>
                  Admin: {company.adminName} ·{" "}
                  <strong
                    className={
                      company.adminLoginActive
                        ? "admin-enabled"
                        : "admin-disabled"
                    }
                  >
                    {company.adminLoginActive
                      ? "Login active"
                      : "Login deleted"}
                  </strong>
                </p>
                <div>
                  <span>
                    <b>{company.activeOrders}</b>
                    <small>Active orders</small>
                  </span>
                  <span>
                    <b>{company.staffCount}</b>
                    <small>Staff</small>
                  </span>
                  <span>
                    <b>{money(company.revenue)}</b>
                    <small>Total revenue</small>
                  </span>
                </div>
                <footer>
                  <em className={company.online ? "online" : ""}>
                    {company.online
                      ? "Database online"
                      : "Database unavailable"}
                  </em>
                  <button onClick={() => status(company)}>
                    {company.status === "active" ? "Suspend" : "Activate"}
                  </button>
                </footer>
                <section className="company-danger-actions">
                  <button
                    onClick={() => setMasterAction({ type: "admin", company })}
                    disabled={!company.adminLoginActive}
                  >
                    <Users size={13} />
                    {company.adminLoginActive
                      ? "Delete Admin login"
                      : "Admin login deleted"}
                  </button>
                  {company.databaseName === "knockout" ? (
                    <span>Primary company protected</span>
                  ) : (
                    <button
                      className="danger"
                      onClick={() =>
                        setMasterAction({ type: "company", company })
                      }
                    >
                      <Trash2 size={13} />
                      Delete company
                    </button>
                  )}
                </section>
              </article>
            ))}
          </div>
          <MasterUsers
            companies={companies}
            masterUsers={data.masterUsers || []}
            changePin={setPinUser}
          />
          <MasterRevenue companies={companies} />
        </div>
      </main>
      {creating ? (
        <CompanyRegistration
          close={() => setCreating(false)}
          refresh={refresh}
          toast={toast}
        />
      ) : null}
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

function MasterActionModal({ action, busy, close, confirm }) {
  const [typed, setTyped] = useState(""),
    company = action.company,
    isCompany = action.type === "company",
    matches = typed === company.companyName;
  return (
    <Modal close={close} hideClose={busy}>
      <div className={`master-action-icon ${isCompany ? "danger" : ""}`}>
        {isCompany ? <Trash2 size={24} /> : <Users size={24} />}
      </div>
      <span className="eyebrow">
        {isCompany ? "PERMANENT COMPANY DELETION" : "ADMIN ACCESS CONTROL"}
      </span>
      <h2>
        {isCompany ? `Delete ${company.companyName}?` : `Delete Admin login?`}
      </h2>
      <p>
        {isCompany ? (
          <>
            This permanently removes <b>{company.companyName}</b>, database{" "}
            <code>{company.databaseName}</code>, and all company data. This
            cannot be undone.
          </>
        ) : (
          <>
            The Admin login for <b>{company.companyName}</b> will stop working.
            Waiter and Chef accounts and historical records will remain
            available.
          </>
        )}
      </p>
      {isCompany ? (
        <label className="master-confirm-input">
          TYPE <b>{company.companyName}</b> TO CONFIRM
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={company.companyName}
            autoFocus
            disabled={busy}
          />
        </label>
      ) : null}
      <div className="master-action-buttons">
        <button onClick={close} disabled={busy}>
          Cancel
        </button>
        <button
          className="danger"
          onClick={() => confirm(typed)}
          disabled={busy || (isCompany && !matches)}
        >
          {busy
            ? "Please wait…"
            : isCompany
              ? "Delete company"
              : "Delete Admin login"}
        </button>
      </div>
    </Modal>
  );
}

function MasterUsers({ companies, masterUsers = [], changePin }) {
  const masterCompany = {
      id: "master",
      companyName: "KnockOUT Master",
      databaseName: "knockout_master",
    },
    rows = [
      ...masterUsers.map((user) => ({
        company: masterCompany,
        user,
        isMaster: true,
      })),
      ...companies.flatMap((company) =>
        (company.users || []).map((user) => ({
          company,
          user,
          isMaster: false,
        })),
      ),
    ];
  return (
    <section className="master-users-panel">
      <div>
        <span className="eyebrow">ACCESS DIRECTORY</span>
        <h2>Every KnockOUT user</h2>
        <p>
          Every six-digit PIN is unique across Super Admin, Admin, Waiter, Chef,
          and every company.
        </p>
      </div>
      <div className="table-scroll">
        <table className="master-users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Designation</th>
              <th>Company</th>
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
                  <b>{company.companyName}</b>
                  <small>{company.databaseName}</small>
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

function MasterRevenue({ companies }) {
  const dates = [
    ...new Set(
      companies.flatMap((company) =>
        (company.dailyRevenue || []).map((item) => item.date),
      ),
    ),
  ]
    .sort()
    .reverse()
    .slice(0, 10);
  return (
    <section className="master-revenue-panel">
      <div>
        <span className="eyebrow">DAILY PERFORMANCE</span>
        <h2>Day-by-day company revenue</h2>
        <p>
          Completed and paid bills are grouped by completion date for every
          company.
        </p>
      </div>
      {dates.length ? (
        <div className="master-revenue-scroll">
          <table className="master-revenue-table">
            <thead>
              <tr>
                <th>Company</th>
                {dates.map((date) => (
                  <th key={date}>
                    {new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <th>{company.companyName}</th>
                  {dates.map((date) => {
                    const day = (company.dailyRevenue || []).find(
                      (item) => item.date === date,
                    );
                    return (
                      <td key={date}>
                        <b>{money(day?.total || 0)}</b>
                        <small>{day?.bills || 0} bills</small>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="master-revenue-empty">
          Daily revenue will appear after paid orders are completed.
        </div>
      )}
    </section>
  );
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
      companyName: "KnockOUT 2",
      adminName: "",
      adminPin: "",
      email: "",
      phone: "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const database = form.companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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
        `${result.companyName} registered with database ${result.databaseName}`,
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
      <h2>Register a company</h2>
      <p>
        A separate MariaDB database and initial Admin account will be created
        automatically.
      </p>
      <form className="modal-form" onSubmit={register}>
        <label>
          Company name
          <input
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            required
          />
        </label>
        <div className="database-preview">
          <Building2 size={17} />
          <span>Database to create</span>
          <code>{database || "—"}</code>
        </div>
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
            Unique 6-digit Admin PIN
            <input
              value={form.adminPin}
              onChange={(e) =>
                setForm({
                  ...form,
                  adminPin: e.target.value.replace(/\D/g, "").slice(0, 6),
                })
              }
              pattern="[0-9]{6}"
              maxLength="6"
              inputMode="numeric"
              type="password"
              required
            />
          </label>
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
          disabled={busy || form.adminPin.length !== 6}
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
    ["orders", "Orders & Billing", ReceiptText],
    ["parcels", "Parcel Orders", Package],
    ["menu", "Food & Photos", UtensilsCrossed],
    ["stock", "Stock Management", Boxes],
    ["finance", "Finance Management", Wallet],
    ["staff", "Staff", Users],
    ["settings", "Settings", Settings],
  ],
  waiter: [
    ["attendance", "Check In / Out", Clock3],
    ["floor", "Tables", Armchair],
    ["bookings", "Bookings", CalendarDays],
    ["orders", "My Orders", ReceiptText],
  ],
  chef: [
    ["attendance", "Check In / Out", Clock3],
    ["team", "Chef Management", Users],
    ["kitchen", "Dine-in Kitchen", ChefHat],
    ["parcels", "Parcel Queue", Package],
    ["ready", "Ready to Serve", CheckCircle2],
  ],
};
function Shell({ role, user, page, setPage, logout, children }) {
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <span className="logo">K</span>
          <div>
            <b>KnockOUT</b>
            <small>{role} portal</small>
          </div>
        </div>
        <nav>
          {portalNav[role].map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => setPage(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="system-ok">
          <i />
          <span>
            <b>All systems online</b>
            <small>Last synced just now</small>
          </span>
        </div>
        <div className="side-user">
          <span>
            {user.name
              .split(" ")
              .map((x) => x[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div>
            <b>{user.name}</b>
            <small>{role}</small>
          </div>
          <button onClick={logout}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main>
        <header>
          <div className="global-search">
            <Search size={16} />
            <input placeholder="Search anything…" />
          </div>
          <div className="header-actions">
            <span className="live">
              <i /> Live
            </span>
            <button>
              <Bell size={17} />
            </button>
            <div>
              <b>
                {new Date().toLocaleDateString("en-IN", { weekday: "long" })}
              </b>
              <small>
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </small>
            </div>
          </div>
        </header>
        <div className="page">{children}</div>
      </main>
    </div>
  );
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

function Admin({ data, refresh, user, logout, toast }) {
  const [page, setPage] = useState("overview");
  return (
    <>
      <Shell
        role="admin"
        user={user}
        page={page}
        setPage={setPage}
        logout={logout}
      >
        {page === "overview" && <AdminOverview data={data} setPage={setPage} />}{" "}
        {page === "tables" && (
          <AdminTables data={data} refresh={refresh} toast={toast} />
        )}{" "}
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
      </Shell>
    </>
  );
}
function AdminOverview({ data, setPage }) {
  const active = data.orders.filter(
      (o) => !["completed", "served"].includes(o.status),
    ),
    revenue = data.orders
      .filter((o) => o.total)
      .reduce((s, o) => s + o.total, 0);
  return (
    <>
      <PageHead
        kicker="ADMIN COMMAND CENTER"
        title="Good afternoon, Arjun"
        sub="A complete view of today's restaurant operations."
        action={
          <button className="primary" onClick={() => setPage("orders")}>
            View all orders <ArrowRight size={15} />
          </button>
        }
      />
      <div className="stats">
        <Stat
          icon={TrendingUp}
          label="Today's Revenue"
          value={money(revenue || 28460)}
          note="↑ 12.4% vs yesterday"
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
            {[52, 69, 45, 77, 62, 91, 83].map((x, i) => (
              <div key={i}>
                <span style={{ height: `${x}%` }}></span>
                <small>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </small>
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
                  data.tables.length) *
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
    </>
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
function AdminTables({ data, refresh, toast }) {
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
            Table {data.tables.find((t) => t.id === billOrder.tableId)?.number} · Bill #{billOrder.id}
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
              <button className="primary wide" onClick={() => window.print()}>
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
function TableCard({ table, order, onClick, onBill, onPay }) {
  const idle =
      table.status === "cleaning" ? "Cleaning in progress" : "Clean & ready",
    paymentRequested = order?.status === "billing_requested",
    kitchenStatus = order
      ? {
          new: { key: "kitchen-new", label: "New order" },
          preparing: { key: "kitchen-preparing", label: "Preparing" },
          ready: { key: "kitchen-ready", label: "Ready to serve" },
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
    };
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
          <div className={`table-kitchen-state ${visibleStatus.key}`}>
            {order.status === "ready" ? (
              <CheckCircle2 size={15} />
            ) : (
              <ChefHat size={15} />
            )}
            <span>
              <small>Kitchen status</small>
              <b>{visibleStatus.label}</b>
            </span>
          </div>
        ) : null}
        <h3>
          {table.guestName ||
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
function AdminTableDetails({ table, order, data, close, refresh, toast }) {
  const [billing, setBilling] = useState(false),
    [paying, setPaying] = useState(false);
  const lines =
      order?.items.map((i) => ({
        ...i,
        menu: data.menu.find((m) => m.id === i.menuId),
      })) || [],
    subtotal = lines.reduce((sum, i) => sum + (i.menu?.price || 0) * i.qty, 0);
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
          <small>Guest</small>
          <b>{table.guestName || "No guest assigned"}</b>
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
function AdminOrders({ data }) {
  return (
    <>
      <PageHead
        kicker="SALES & SERVICE"
        title="Orders & Billing"
        sub="Every open and completed order in one place."
      />
      <section className="panel">
        <OrderTable orders={data.orders} tables={data.tables} />
      </section>
    </>
  );
}
function FoodManager({ data, refresh, toast }) {
  const [uploading, setUploading] = useState(null);
  async function upload(item, file) {
    if (!file) return;
    setUploading(item.id);
    try {
      const form = new FormData();
      form.append("image", file);
      const response = await fetch(`${API_BASE}/menu/${item.id}/image`, {
        method: "POST",
        headers: portalHeaders(),
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
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
      const r = await fetch(`${API_BASE}/menu/${item.id}/image`, {
          method: "POST",
          headers: portalHeaders(),
          body: form,
        }),
        result = await r.json();
      if (!r.ok) throw new Error(result.message);
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
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option>Starters</option>
              <option>Mains</option>
              <option>Desserts</option>
              <option>Beverages</option>
              <option>Juices</option>
              <option>Sides</option>
              <option>Specials</option>
            </select>
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
    [prepaying, setPrepaying] = useState(null);
  const parcels = data.orders.filter((o) => o.orderType === "parcel");
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
  return (
    <>
      <PageHead
        kicker="TAKEAWAY OPERATIONS"
        title="Parcel Orders"
        sub="Take parcel orders, record advance payment, and complete handoff when Chef sends them back."
        action={
          <button className="primary" onClick={() => setCreating(true)}>
            <Plus size={15} /> New parcel order
          </button>
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
      {creating && (
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
            {step === "complete" ? "Final bill" : "Complete parcel"} #{order.id}
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
              <button className="secondary wide" onClick={() => window.print()}>
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
                Parcel #{order.id} was completed by {paymentMethod || order.paymentMethod}.
              </p>
              <button className="primary wide" onClick={() => window.print()}>
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
      return found
        ? c.map((i) => (i.menuId === id ? { ...i, qty: i.qty + 1 } : i))
        : [...c, { menuId: id, qty: 1, note: "" }];
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
            <button key={m.id} onClick={() => add(m.id)}>
              <span>
                {m.imageUrl ? <img src={m.imageUrl} alt="" /> : m.icon}
              </span>
              <div>
                <b>{m.name}</b>
                <small>{m.category}</small>
              </div>
              <strong>{money(m.price)}</strong>
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
    [tab, setTab] = useState("inventory");
  const low = data.inventory.filter((i) => i.quantity <= i.min),
    value = data.inventory.reduce((s, i) => s + i.quantity * i.cost, 0),
    purchases = (data.inventoryTransactions || [])
      .filter((x) => x.movementType === "purchase")
      .reduce((s, x) => s + Math.abs(x.quantity) * (x.unitCost || 0), 0);
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
      </div>
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
      </div>
      {tab === "inventory" ? (
        <div className="stock-grid">
          {data.inventory.map((item) => {
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
      ) : (
        <section className="panel">
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
                {(data.inventoryTransactions || []).map((entry) => {
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
          {!data.inventoryTransactions?.length ? (
            <div className="empty-state">
              <ArrowDownUp />
              <h3>No stock movements yet</h3>
            </div>
          ) : null}
        </section>
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
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              {["kg", "g", "L", "ml", "pcs", "pack"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
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
          <select
            value={form.movementType}
            onChange={(e) => setForm({ ...form, movementType: e.target.value })}
          >
            <option value="purchase">Purchase / stock in</option>
            <option value="usage">Kitchen usage</option>
            <option value="waste">Waste / spoilage</option>
            <option value="adjustment">Manual adjustment</option>
          </select>
        </label>
        {form.movementType === "adjustment" ? (
          <label>
            Adjustment direction
            <select
              value={form.adjustmentDirection}
              onChange={(e) =>
                setForm({
                  ...form,
                  adjustmentDirection: Number(e.target.value),
                })
              }
            >
              <option value="1">Increase stock</option>
              <option value="-1">Decrease stock</option>
            </select>
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
            <select
              value={form.entryType}
              onChange={(e) => setForm({ ...form, entryType: e.target.value })}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
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
            <select
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
            >
              <option>Cash</option>
              <option>Card / UPI</option>
              <option>Bank Transfer</option>
            </select>
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
    };
  return (
    <>
      <PageHead
        kicker="FINANCIAL CALENDAR"
        title="Choose a finance date"
        sub="Select a day to open its bills, spending, purchases, dealer payments, and daily calculation."
      />
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
      ) : (
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
            <select
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
            >
              <option>Cash</option>
              <option>Card / UPI</option>
              <option>Bank Transfer</option>
              <option>Credit</option>
            </select>
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
            <select
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
            >
              <option>Cash</option>
              <option>Card / UPI</option>
              <option>Bank Transfer</option>
            </select>
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
function StaffEditor({ staff, close, refresh, toast }) {
  const [form, setForm] = useState({
      name: staff?.name || "",
      role: staff?.role || "waiter",
      pin: staff?.pin || "",
      phone: staff?.phone || "",
      payType: staff?.payType || "monthly",
      payRate: staff?.payRate || 0,
      active: staff?.active ?? true,
    }),
    [error, setError] = useState("");
  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      await api(staff ? `/staff/${staff.id}` : "/staff", {
        method: staff ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      await refresh();
      toast(staff ? "Staff login updated" : "Staff login created");
      close();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">STAFF LOGIN</span>
      <h2>{staff ? "Customize staff" : "Add staff member"}</h2>
      <p>Every six-digit PIN must be unique across all roles and companies.</p>
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
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="waiter">Waiter</option>
              <option value="chef">Head Chef (single login)</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
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
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            Pay type
            <select
              value={form.payType}
              onChange={(e) => setForm({ ...form, payType: e.target.value })}
            >
              <option value="monthly">Monthly</option>
              <option value="hourly">Hourly</option>
            </select>
          </label>
        </div>
        <label>
          Pay amount
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
          <label>
            GST / Tax rate (%)
            <input
              type="number"
              value={s.taxRate}
              onChange={(e) => setS({ ...s, taxRate: +e.target.value })}
            />
          </label>
          <label>
            Service charge (%)
            <input
              type="number"
              value={s.serviceCharge}
              onChange={(e) => setS({ ...s, serviceCharge: +e.target.value })}
            />
          </label>
        </div>
      </section>
    </>
  );
}

function Waiter({ data, refresh, user, logout, toast }) {
  const [page, setPage] = useState("attendance"),
    [selected, setSelected] = useState(null),
    [booking, setBooking] = useState(false);
  const table = data.tables.find((t) => t.id === selected);
  return (
    <Shell
      role="waiter"
      user={user}
      page={page}
      setPage={setPage}
      logout={logout}
    >
      {page === "attendance" && <AttendancePanel user={user} toast={toast} />}{" "}
      {page === "floor" && (
        <>
          <PageHead
            kicker="WAITER FLOOR VIEW"
            title="Tables & Service"
            sub="Select a table to take an order or generate its bill."
            action={
              <button className="primary" onClick={() => setBooking(true)}>
                <CalendarDays size={15} /> New booking
              </button>
            }
          />
          <TableSummary data={data} />
          <div className="table-grid waiter-grid">
            {data.tables.map((t) => (
              <TableCard
                key={t.id}
                table={t}
                order={data.orders.find((o) => o.id === t.orderId)}
                onClick={() => setSelected(t.id)}
              />
            ))}
          </div>
        </>
      )}
      {page === "bookings" && (
        <Bookings data={data} open={() => setBooking(true)} />
      )}{" "}
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
      {booking && (
        <BookingModal
          data={data}
          close={() => setBooking(false)}
          refresh={refresh}
          toast={toast}
        />
      )}
    </Shell>
  );
}
function Bookings({ data, open }) {
  const booked = data.tables.filter((t) => t.status === "reserved");
  return (
    <>
      <PageHead
        kicker="RESERVATION BOOK"
        title="Upcoming Bookings"
        sub={`${booked.length} reservations currently on the floor plan.`}
        action={
          <button className="primary" onClick={open}>
            <Plus size={15} /> Add booking
          </button>
        }
      />
      <section className="panel">
        <div className="booking-list">
          {booked.map((t) => (
            <div key={t.id}>
              <span>
                <CalendarDays size={18} />
              </span>
              <div>
                <b>{t.guestName}</b>
                <small>
                  Table {t.number} · {t.seats} guests
                </small>
              </div>
              <strong>{t.bookingTime}</strong>
              <Status status="confirmed" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
function WaiterOrders({ data, user }) {
  const mine = data.orders.filter(
    (o) =>
      o.waiter.toLowerCase().includes(user.name.split(" ")[0].toLowerCase()) ||
      true,
  );
  return (
    <>
      <PageHead
        kicker="MY SERVICE"
        title="Orders"
        sub="Track the kitchen and payment status of your tables."
      />
      <section className="panel">
        <OrderTable orders={mine} tables={data.tables} />
      </section>
    </>
  );
}
function BookingModal({ data, close, refresh, toast }) {
  const [form, setForm] = useState({
      tableId: "",
      guestName: "",
      bookingTime: "20:00",
    }),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    try {
      await api("/bookings", { method: "POST", body: JSON.stringify(form) });
      await refresh();
      toast("Booking confirmed");
      close();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <Modal close={close}>
      <span className="eyebrow">NEW RESERVATION</span>
      <h2>Book a table</h2>
      <p>Reserve an available table for your guest.</p>
      <form className="modal-form" onSubmit={submit}>
        <label>
          Guest name
          <input
            required
            value={form.guestName}
            onChange={(e) => setForm({ ...form, guestName: e.target.value })}
          />
        </label>
        <label>
          Available table
          <select
            required
            value={form.tableId}
            onChange={(e) => setForm({ ...form, tableId: e.target.value })}
          >
            <option value="">Choose a table</option>
            {data.tables
              .filter((t) => t.status === "available")
              .map((t) => (
                <option value={t.id} key={t.id}>
                  Table {t.number} · {t.seats} seats
                </option>
              ))}
          </select>
        </label>
        <label>
          Booking time
          <input
            type="time"
            required
            value={form.bookingTime}
            onChange={(e) => setForm({ ...form, bookingTime: e.target.value })}
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary wide">Confirm booking</button>
      </form>
    </Modal>
  );
}
function Modal({ close, children, wide = false, hideClose = false }) {
  return (
    <div
      className="modal-wrap"
      onMouseDown={(e) => !hideClose && e.target === e.currentTarget && close()}
    >
      <div className={`modal ${wide ? "wide-modal" : ""}`}>
        {!hideClose ? (
          <button className="modal-close" onClick={close}>
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
    [mode, setMode] = useState(order ? "bill" : "order");
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
        {order ? (
          <div className="drawer-tabs">
            <button
              className={mode === "order" ? "active" : ""}
              onClick={() => setMode("order")}
            >
              Add order
            </button>
            <button
              className={mode === "bill" ? "active" : ""}
              onClick={() => setMode("bill")}
            >
              Bill
            </button>
          </div>
        ) : null}
      </div>
      <TableStatusControls table={table} refresh={refresh} toast={toast} />
      {mode === "order" ? (
        <OrderBuilder
          table={table}
          data={data}
          user={user}
          existing={order}
          refresh={refresh}
          toast={toast}
          close={close}
        />
      ) : (
        <Bill
          table={table}
          order={order}
          data={data}
          refresh={refresh}
          toast={toast}
          close={close}
        />
      )}
    </Modal>
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
      return x
        ? c.map((i) => (i.menuId === id ? { ...i, qty: i.qty + 1 } : i))
        : [...c, { menuId: id, qty: 1, note: "" }];
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
            .filter((m) => m.available && (cat === "All" || m.category === cat))
            .map((m) => (
              <button key={m.id} onClick={() => add(m.id)}>
                <span>
                  {m.imageUrl ? <img src={m.imageUrl} alt="" /> : m.icon}
                </span>
                <div>
                  <b>{m.name}</b>
                  <small>{m.category}</small>
                </div>
                <strong>{money(m.price)}</strong>
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
    tax = (subtotal * data.settings.taxRate) / 100,
    service = (subtotal * data.settings.serviceCharge) / 100;
  return { items, subtotal, tax, service, total: subtotal + tax + service };
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
        <span className="logo">K</span>
        <h2>{data.settings.hotelName}</h2>
        <p>Tax Invoice · Order #{order.id}</p>
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
        <p>
          <span>GST ({data.settings.taxRate}%)</span>
          <b>{money(bill.tax)}</b>
        </p>
        <p>
          <span>Service charge ({data.settings.serviceCharge}%)</span>
          <b>{money(bill.service)}</b>
        </p>
        <p className="grand">
          <span>Total bill</span>
          <b>{money(bill.total)}</b>
        </p>
      </div>
      <button className="print" onClick={() => window.print()}>
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
  const ready = ["ready", "served", "billing_requested"].includes(order.status);
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

function Chef({ data, refresh, user, logout, toast }) {
  const [page, setPage] = useState("attendance");
  const active = data.orders.filter(
    (o) => !["completed", "served", "billing_requested"].includes(o.status),
  );
  const orders =
    page === "parcels"
      ? active.filter((o) => o.orderType === "parcel")
      : page === "kitchen"
        ? active.filter((o) => o.orderType !== "parcel")
        : active;
  const shown =
    page === "ready" ? orders.filter((o) => o.status === "ready") : orders;
  if (page === "attendance")
    return (
      <Shell
        role="chef"
        user={user}
        page={page}
        setPage={setPage}
        logout={logout}
      >
        <AttendancePanel user={user} toast={toast} />
      </Shell>
    );
  if (page === "team")
    return (
      <Shell
        role="chef"
        user={user}
        page={page}
        setPage={setPage}
        logout={logout}
      >
        <ChefManagement
          data={data}
          refresh={refresh}
          user={user}
          toast={toast}
        />
      </Shell>
    );
  async function status(id, next) {
    await api(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    refresh();
    toast(`Order #${id} marked ${next}`);
  }
  return (
    <Shell
      role="chef"
      user={user}
      page={page}
      setPage={setPage}
      logout={logout}
    >
      <PageHead
        kicker="LIVE KITCHEN DISPLAY"
        title={
          page === "ready"
            ? "Ready to Serve"
            : page === "parcels"
              ? "Parcel Queue"
              : "Dine-in Kitchen"
        }
        sub={`${orders.length} active orders · updates automatically every 5 seconds.`}
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
          <KitchenTicket key={o.id} order={o} data={data} status={status} />
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
function ChefManagement({ data, refresh, user, toast }) {
  const [editor, setEditor] = useState(null),
    staff = data.kitchenStaff || [];
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
        action={
          <button className="primary" onClick={() => setEditor({})}>
            <Plus size={15} /> Add chef
          </button>
        }
      />
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
    </>
  );
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
          <label>
            Pay type
            <select
              value={form.payType}
              onChange={(e) => setForm({ ...form, payType: e.target.value })}
            >
              <option value="monthly">Monthly</option>
              <option value="hourly">Hourly</option>
            </select>
          </label>
          <label>
            Pay amount
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
function KitchenTicket({ order, data, status }) {
  const table = data.tables.find((t) => t.id === order.tableId),
    isParcel = order.orderType === "parcel";
  return (
    <article
      className={`ticket ${order.status} ${isParcel ? "parcel-ticket" : ""}`}
    >
      <header>
        <div>
          <span className={isParcel ? "parcel-label" : "chef-table-number"}>
            {isParcel ? (
              "PARCEL ORDER"
            ) : (
              <>
                TABLE <b>{table?.number}</b>
              </>
            )}
          </span>
          <h2>Order #{order.id}</h2>
        </div>
        <div>
          <Clock3 size={14} />
          <b>{elapsed(order.createdAt)}</b>
        </div>
      </header>
      <div className="ticket-meta">
        <span>{isParcel ? order.guestName : order.waiter}</span>
        <Status status={order.status} />
      </div>
      <div className="ticket-items">
        {order.items.map((i) => {
          const m = data.menu.find((x) => x.id === i.menuId);
          return (
            <div key={i.menuId}>
              <b>{i.qty}</b>
              <span>
                {m?.name}
                <small>
                  {m?.isCombo
                    ? m.components
                        .map((c) => c.quantity + "× " + c.name)
                        .join(" + ")
                    : i.note}
                </small>
              </span>
            </div>
          );
        })}
      </div>
      {order.status === "new" && (
        <button
          className="primary wide"
          onClick={() => status(order.id, "preparing")}
        >
          Start preparing <ArrowRight size={15} />
        </button>
      )}
      {order.status === "preparing" && (
        <button
          className="ready-btn wide"
          onClick={() => status(order.id, "ready")}
        >
          <CheckCircle2 size={16} /> Mark ready for{" "}
          {isParcel ? "Admin" : "service"}
        </button>
      )}
      {order.status === "ready" && !isParcel && (
        <button
          className="secondary wide"
          onClick={() => status(order.id, "served")}
        >
          Mark collected
        </button>
      )}
      {order.status === "ready" && isParcel && (
        <div className="parcel-done">
          <CheckCircle2 size={16} /> Sent back to Admin
        </div>
      )}
    </article>
  );
}
