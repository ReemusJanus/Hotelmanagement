// Dashboards for every role. Presentation only: figures come from existing state, nothing is fetched here.
import { AlertTriangle, Armchair, ArrowRight, ArrowUpRight, Boxes, Building2, CalendarDays, CheckCircle2, ChefHat, Clock3, CreditCard, CupSoda, Package, ReceiptText, TrendingDown, TrendingUp, Users, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { useNow } from "./ui";
import { useTemplate } from "./templates/TemplateProvider";
import { dashboardLayouts } from "./templates/layouts";
import { isJuiceItem } from "./production-routing.js";

const LIVE = ["new", "preparing", "ready", "collected", "received", "served", "billing_requested"];
const pretty = (value) => String(value ?? "").replaceAll("_", " ");
const greet = () => { const hour = new Date().getHours(); return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"; };
const minutes = (now, iso) => Math.max(0, Math.floor((now - new Date(iso)) / 60000));
const waited = (value) => value < 1 ? "Just now" : value < 60 ? `${value} min` : `${Math.floor(value / 60)}h ${value % 60}m`;
const localDay = (value, timeZone) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", ...(timeZone ? { timeZone } : {}) }).format(new Date(value));
const currency = (code, digits = 0) => (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: code || "INR", maximumFractionDigits: digits }).format(Number(value) || 0);
const compact = (code) => (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: code || "INR", notation: "compact", maximumFractionDigits: 1 }).format(value);
const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

function Hero({ kicker, title, sub, label, value, trend, facts, actions }) {
  return <section className="dash-hero">
    <div className="dash-hero-intro"><span className="dash-kicker">{kicker}</span><h1>{title}</h1><p>{sub}</p><div className="dash-actions">{actions}</div></div>
    <div className="dash-hero-figure"><span>{label}</span><strong>{value}</strong>{trend}</div>
    <dl className="dash-facts">{facts.map(([name, figure]) => <div key={name}><dt>{name}</dt><dd>{figure}</dd></div>)}</dl>
  </section>;
}
function Kpis({ items }) {
  return <div className="dash-kpis">{items.map(({ icon: Icon, label, value, note, tone = "", meter, go }) => {
    const body = <><span className="dash-kpi-head"><Icon size={18} aria-hidden="true"/><span>{label}</span>{go ? <ArrowUpRight size={16} aria-hidden="true"/> : null}</span><strong>{value}</strong>{meter === undefined ? null : <span className="dash-meter" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(100, meter))}%` }}/></span>}<small>{note}</small></>;
    return go ? <button type="button" className={`dash-kpi ${tone}`} key={label} onClick={go}>{body}</button> : <div className={`dash-kpi ${tone}`} key={label}>{body}</div>;
  })}</div>;
}
function Card({ title, sub, action, className = "", children }) {
  return <section className={`dash-card ${className}`}><header><div><h2>{title}</h2>{sub ? <p>{sub}</p> : null}</div>{action}</header>{children}</section>;
}
const More = ({ onClick, children = "View all" }) => <button type="button" className="dash-more" onClick={onClick}>{children}<ArrowRight size={15} aria-hidden="true"/></button>;
const Clear = ({ icon: Icon = CheckCircle2, title, children }) => <div className="dash-clear"><Icon size={24} aria-hidden="true"/><b>{title}</b><small>{children}</small></div>;
const Badge = ({ status }) => <span className={`status ${status}`}>{pretty(status)}</span>;

const niceMax = (max) => { if (max <= 0) return 4; const power = 10 ** Math.floor(Math.log10(max)), ratio = max / power; return (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 4 ? 4 : ratio <= 5 ? 5 : ratio <= 8 ? 8 : 10) * power; };
function ColumnChart({ points, format, short, label }) {
  const top = niceMax(Math.max(0, ...points.map((point) => point.value))), peak = points.reduce((best, point, index) => point.value > points[best].value ? index : best, 0);
  return <div className="dash-chart" role="group" aria-label={label}>
    <div className="dash-axis" aria-hidden="true">{[1, .75, .5, .25, 0].map((step) => <span key={step}>{short(top * step)}</span>)}</div>
    <div className="dash-plot">
      <div className="dash-grid" aria-hidden="true">{[0, 1, 2, 3, 4].map((line) => <i key={line}/>)}</div>
      <div className="dash-columns">{points.map((point, index) => <button type="button" key={point.key} className={point.tick === "Today" ? "today" : ""} aria-label={`${point.full}: ${format(point.value)}`}>
        <span className="dash-bar" style={{ height: `${Math.max(0, point.value) / top * 100}%` }}>{point.value > 0 && index === peak ? <em aria-hidden="true">{short(point.value)}</em> : null}</span>
        <span className="dash-tip" aria-hidden="true"><b>{format(point.value)}</b>{point.full}</span>
      </button>)}</div>
      <div className="dash-ticks" aria-hidden="true">{points.map((point) => <span key={point.key}>{point.tick}</span>)}</div>
    </div>
  </div>;
}
function FloorMap({ data, open }) {
  const counts = ["available", "occupied", "reserved", "cleaning"].map((status) => [status, data.tables.filter((table) => table.status === status).length]);
  if (!data.tables.length) return <Clear icon={Armchair} title="No tables yet">Add tables to see the floor here.</Clear>;
  return <>
    <div className="dash-floor">{[...data.tables].sort((a, b) => a.number - b.number).slice(0, 40).map((table) => <button type="button" key={table.id} className={table.status} onClick={open} aria-label={`Table ${table.number}, ${table.status}, ${table.seats} seats`} title={`Table ${table.number} · ${table.status} · ${table.seats} seats`}>{table.number}</button>)}</div>
    <ul className="dash-legend">{counts.map(([status, count]) => <li key={status}><i className={status}/><span>{status}</span><b>{count}</b></li>)}</ul>
  </>;
}
function OrderRows({ orders, data, open, now }) {
  return <ul className="dash-orders">{orders.map((order) => {
    const parcel = order.orderType === "parcel", count = order.items.reduce((sum, line) => sum + Number(line.qty), 0);
    return <li key={order.batchKey || order.id}><button type="button" onClick={open}>
      <span className="dash-order-place">{parcel ? <Package size={18} aria-label="Parcel"/> : data.tables.find((table) => table.id === order.tableId)?.number ?? "—"}</span>
      <span className="dash-order-who"><b>{order.guestName || "Walk-in Guest"}</b><small>{parcel ? "Parcel" : "Table"} · #{order.id} · {plural(count, "item")}</small></span>
      <span className="dash-order-time"><Clock3 size={14} aria-hidden="true"/>{waited(minutes(now, order.createdAt))}</span>
      <Badge status={order.paymentStatus === "paid" ? "paid" : order.status}/>
    </button></li>;
  })}</ul>;
}

function Arrange(slots) { const Layout = dashboardLayouts[useTemplate().dashboard] || dashboardLayouts.classic; return <Layout {...slots}/>; }

export function AdminDashboard({ data, user, setPage, notices }) {
  const now = useNow(), metrics = data.dashboard, can = (module) => user.modules?.[module] !== false;
  if (!metrics) return <div role="alert" className="panel">Dashboard metrics are unavailable. Refresh the page or contact support.</div>;
  const code = data.settings.currency, money = currency(code), today = metrics.revenueDays.at(-1).date, weekTotal = metrics.revenueDays.reduce((sum, day) => sum + day.revenue, 0);
  const active = data.orders.filter((order) => LIVE.includes(order.status)), parcels = active.filter((order) => order.orderType === "parcel");
  const paidToday = data.orders.filter((order) => order.status === "completed" && order.paymentStatus === "paid" && order.completedAt && localDay(order.completedAt, metrics.timezone) === today);
  const bookings = (data.bookings || []).filter((booking) => booking.bookingDate === today && booking.status === "confirmed").sort((a, b) => String(a.bookingTime).localeCompare(String(b.bookingTime)));
  const onDuty = (data.attendance || []).filter((shift) => !shift.checkOut).length, growing = metrics.growthKind !== "no-previous-sales" && (metrics.growthPercent ?? 0) >= 0;
  const growth = metrics.growthKind === "new-sales" ? "First sales since yesterday" : metrics.growthKind === "no-previous-sales" ? "No sales yesterday or today" : `${metrics.growthPercent > 0 ? "+" : ""}${metrics.growthPercent.toFixed(1)}% vs yesterday`;
  const day = (date, options) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", ...options }).format(new Date(`${date}T12:00:00Z`));
  return <Arrange
    hero={<Hero kicker={new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: metrics.timezone }).format(now)} title={`${greet()}, ${user?.name || "Admin"}`} sub={`Here is how ${data.settings.hotelName || "your restaurant"} is doing today.`}
      label="Today’s revenue" value={currency(code, 2)(metrics.todayRevenue)} trend={<em className={metrics.growthKind === "no-previous-sales" ? "" : growing ? "up" : "down"}>{metrics.growthKind === "no-previous-sales" ? null : growing ? <TrendingUp size={16} aria-hidden="true"/> : <TrendingDown size={16} aria-hidden="true"/>}{growth}</em>}
      facts={[["Bills paid today", paidToday.length], ["Average bill", paidToday.length ? money(metrics.todayRevenue / paidToday.length) : "—"], ["Last 7 days", money(weekTotal)], ["Staff on duty", onDuty]]}
      actions={<>{can("billing") ? <button type="button" className="dash-button gold" onClick={() => setPage("orders")}>View all orders <ArrowRight size={16}/></button> : null}{can("tables") ? <button type="button" className="dash-button" onClick={() => setPage("tables")}>Open floor plan</button> : null}</>}/>}
    kpis={<Kpis items={[
      { icon: Armchair, label: "Occupied tables", value: `${metrics.occupiedTables} / ${metrics.totalTables}`, note: `${metrics.occupancyPercent}% of the floor in use`, meter: metrics.occupancyPercent, go: can("tables") ? () => setPage("tables") : null },
      { icon: ReceiptText, label: "Active orders", value: metrics.activeOrders, note: `${plural(active.filter((order) => order.status === "ready").length, "order")} ready to serve`, go: can("billing") ? () => setPage("orders") : null },
      { icon: Package, label: "Live parcels", value: parcels.length, note: parcels.length ? `${parcels.filter((order) => ["ready", "collected"].includes(order.status)).length} ready for handoff` : "No parcels waiting", go: can("parcels") ? () => setPage("parcels") : null },
      { icon: Boxes, label: "Low stock", value: metrics.lowStock, note: metrics.lowStock ? "At or below minimum" : "All items well stocked", tone: metrics.lowStock ? "warning" : "", go: can("stock") ? () => setPage("stock") : null },
    ]}/>}
    chart={<Card title="Revenue" sub={`Paid sales, last 7 days · ${money(weekTotal)} total`} action={can("finance") ? <More onClick={() => setPage("finance")}>Finance</More> : null}>
        {weekTotal ? <ColumnChart label="Revenue for the last seven business dates" format={currency(code, 2)} short={compact(code)} points={metrics.revenueDays.map((item) => ({ key: item.date, value: item.revenue, tick: item.date === today ? "Today" : day(item.date, { weekday: "short" }), full: day(item.date, { weekday: "long", day: "numeric", month: "short" }) }))}/> : <Clear icon={TrendingUp} title="No sales in the last 7 days">Revenue appears here after the first paid bill.</Clear>}
        <p className="dash-foot">Business time zone: {metrics.timezone}</p>
      </Card>}
    floor={<Card title="Floor" sub="Live table status" action={can("tables") ? <More onClick={() => setPage("tables")}>Tables</More> : null}><FloorMap data={data} open={() => setPage("tables")}/></Card>}
    work={<Card title="Live orders" sub="Longest waiting first" action={can("billing") ? <More onClick={() => setPage("orders")}/> : null}>
        {active.length ? <OrderRows now={now} data={data} open={() => setPage("orders")} orders={[...active].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).slice(0, 6)}/> : <Clear icon={ReceiptText} title="No active orders">New dine-in and parcel orders appear here.</Clear>}
      </Card>}
    side={<div className="dash-stack">
        <Card title="Needs attention">{notices.length ? <ul className="dash-notices">{notices.map((notice) => <li key={notice.title}><button type="button" onClick={() => setPage(notice.page)}><AlertTriangle size={17} aria-hidden="true"/><span><b>{notice.title}</b><small>{notice.detail}</small></span><ArrowRight size={16} aria-hidden="true"/></button></li>)}</ul> : <Clear title="All caught up">Nothing needs your attention.</Clear>}</Card>
        {can("tables") ? <Card title="Today’s reservations" action={<More onClick={() => setPage("bookings")}>Bookings</More>}>{bookings.length ? <ul className="dash-bookings">{bookings.slice(0, 4).map((booking) => <li key={booking.id}><b>{booking.bookingTime}</b><span>{booking.guestName || "Guest"}<small>Table {booking.tableNumber} · {plural(booking.guestCount || booking.seats, "guest")}</small></span></li>)}</ul> : <Clear icon={CalendarDays} title="No reservations today">Upcoming bookings appear here.</Clear>}</Card> : null}
      </div>}/>;
}

/** Waiter, chef and juicer. `tickets` are this role's live station tickets (chef/juicer only). */
export function StationDashboard({ role, data, user, setPage, tickets = [] }) {
  const now = useNow(), firstName = String(user?.name || role).trim().split(/\s+/)[0], waiter = role === "waiter", can = (module) => user.modules?.[module] !== false;
  const base = { kicker: new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(now), title: `${greet()}, ${firstName}` };
  if (waiter) {
    const today = localDay(now), mine = data.orders.filter((order) => order.orderType !== "parcel" && String(order.waiter || "").toLowerCase().includes(firstName.toLowerCase()));
    const todays = mine.filter((order) => localDay(order.createdAt) === today && order.status !== "cancelled"), live = mine.filter((order) => LIVE.includes(order.status));
    const ready = live.filter((order) => order.status === "ready"), cooking = live.filter((order) => ["new", "preparing"].includes(order.status)), billing = live.filter((order) => order.status === "billing_requested");
    const occupied = data.tables.filter((table) => table.status === "occupied").length, free = data.tables.filter((table) => table.status === "available").length;
    const rank = (order) => order.status === "ready" ? 0 : order.status === "billing_requested" ? 2 : 1;
    const floor = () => setPage("floor"), canFloor = can("tables");
    return <Arrange
    hero={<Hero {...base} sub="Your tables, kitchen handoffs and bills in one place." label="Tables in service" value={occupied} trend={<em>{plural(free, "table")} ready for guests</em>}
        facts={[["Ready to serve", ready.length], ["In the kitchen", cooking.length], ["Bills with admin", billing.length], ["Paid today", todays.filter((order) => order.paymentStatus === "paid").length]]}
        actions={<>{canFloor ? <button type="button" className="dash-button gold" onClick={floor}>Open floor <ArrowRight size={16}/></button> : null}{can("billing") ? <button type="button" className="dash-button" onClick={() => setPage("orders")}>My order history</button> : null}</>}/>}
    kpis={<Kpis items={[
        { icon: CheckCircle2, label: "Ready to serve", value: ready.length, note: ready.length ? "Collect from the pass" : "Nothing waiting", tone: ready.length ? "success" : "", go: canFloor ? floor : null },
        { icon: ChefHat, label: "In the kitchen", value: cooking.length, note: "New or being prepared", go: canFloor ? floor : null },
        { icon: Armchair, label: "Occupied tables", value: `${occupied} / ${data.tables.length}`, note: `${free} available`, meter: data.tables.length ? occupied / data.tables.length * 100 : 0, go: canFloor ? floor : null },
        { icon: ReceiptText, label: "My orders today", value: todays.length, note: `${todays.filter((order) => order.paymentStatus === "paid").length} paid`, go: can("billing") ? () => setPage("orders") : null },
      ]}/>}
    work={<Card title="My live orders" sub="Ready to serve first" action={canFloor ? <More onClick={floor}>Tables</More> : null}>{live.length ? <OrderRows now={now} data={data} open={floor} orders={[...live].sort((a, b) => rank(a) - rank(b) || new Date(a.createdAt) - new Date(b.createdAt)).slice(0, 7)}/> : <Clear title="Everything is clear">Select a free table to start an order.</Clear>}</Card>}
    floor={<Card title="Floor" sub="Tap a table to open the floor"><FloorMap data={data} open={floor}/></Card>}/>;
  }
  const chef = role === "chef", Icon = chef ? ChefHat : CupSoda, queue = chef ? "kitchen" : "queue", parcelPage = chef ? "parcels" : "parcel-queue", menuPage = chef ? "dishes" : "juices";
  const byAge = [...tickets].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)), of = (status) => tickets.filter((ticket) => ticket.status === status).length;
  const unfinished = byAge.filter((ticket) => ["new", "preparing"].includes(ticket.status)), late = unfinished.filter((ticket) => minutes(now, ticket.createdAt) >= 20).length, oldest = unfinished[0];
  const todo = Object.values(unfinished.flatMap((ticket) => ticket.items).filter((line) => (line.itemStatus || "new") !== "ready").reduce((all, line) => { const entry = all[line.menuId] ||= { id: line.menuId, name: data.menu.find((item) => item.id === line.menuId)?.name || "Menu item", qty: 0 }; entry.qty += Number(line.qty); return all; }, {})).sort((a, b) => b.qty - a.qty);
  const menu = data.menu.filter((item) => chef ? !isJuiceItem(item) && !item.isCombo : isJuiceItem(item)), available = menu.filter((item) => item.available).length, noun = chef ? "dish" : "juice";
  const parcels = tickets.filter((ticket) => ticket.orderType === "parcel").length, go = () => setPage(queue), pageFor = (ticket) => ticket.status === "ready" ? "ready" : ticket.orderType === "parcel" ? parcelPage : queue;
  return <Arrange
    hero={<Hero {...base} title={chef ? `${greet()}, Chef ${firstName}` : base.title} sub={chef ? "Your kitchen queue, longest waiting first." : "Your juice station queue, longest waiting first."} label="Tickets to prepare" value={unfinished.length} trend={<em className={late ? "down" : ""}>{late ? <><AlertTriangle size={16} aria-hidden="true"/>{late} waiting over 20 minutes</> : unfinished.length ? "All within time" : "Station is clear"}</em>}
      facts={[["New", of("new")], ["Preparing", of("preparing")], ["Ready", of("ready")], ["Longest wait", oldest ? waited(minutes(now, oldest.createdAt)) : "—"]]}
      actions={<><button type="button" className="dash-button gold" onClick={go}>Open table orders <ArrowRight size={16}/></button><button type="button" className="dash-button" onClick={() => setPage(parcelPage)}>Open parcel queue</button></>}/>}
    kpis={<Kpis items={[
      { icon: ReceiptText, label: "New tickets", value: of("new"), note: "Waiting to be started", tone: of("new") ? "warning" : "", go },
      { icon: Icon, label: "Being prepared", value: of("preparing"), note: "In progress now", go },
      { icon: CheckCircle2, label: "Ready", value: of("ready"), note: "Awaiting collection", tone: of("ready") ? "success" : "", go: () => setPage("ready") },
      { icon: Package, label: "Parcels", value: parcels, note: "In the parcel queue", go: () => setPage(parcelPage) },
    ]}/>}
    work={<Card title="Queue" sub="Longest waiting first" action={<More onClick={go}>Open queue</More>}>{byAge.length ? <ul className="dash-orders">{byAge.slice(0, 7).map((ticket) => { const age = minutes(now, ticket.createdAt), overdue = ["new", "preparing"].includes(ticket.status) && age >= 20; return <li key={ticket.batchKey} className={overdue ? "late" : ""}><button type="button" onClick={() => setPage(pageFor(ticket))}>
        <span className="dash-order-place">{ticket.orderType === "parcel" ? <Package size={18} aria-label="Parcel"/> : data.tables.find((table) => table.id === ticket.tableId)?.number ?? "—"}</span>
        <span className="dash-order-who"><b>{ticket.items.map((line) => `${line.qty}× ${data.menu.find((item) => item.id === line.menuId)?.name || "Item"}`).join(", ")}</b><small>#{ticket.id} · Round {ticket.batchNo}</small></span>
        <span className="dash-order-time"><Clock3 size={14} aria-hidden="true"/>{waited(age)}{overdue ? " · Late" : ""}</span><Badge status={ticket.status}/></button></li>; })}</ul> : <Clear icon={Icon} title="Station is clear">New tickets appear here automatically.</Clear>}</Card>}
    side={<div className="dash-stack">
        <Card title="Still to prepare" sub="Combined across open tickets">{todo.length ? <ul className="dash-todo">{todo.slice(0, 6).map((entry) => <li key={entry.id}><span>{entry.name}</span><b>{entry.qty}</b><span className="dash-meter" aria-hidden="true"><i style={{ width: `${entry.qty / todo[0].qty * 100}%` }}/></span></li>)}</ul> : <Clear title="Nothing outstanding">All open items are prepared.</Clear>}</Card>
        <Card title="Menu availability" action={can("menu") || !chef ? <More onClick={() => setPage(menuPage)}>Manage</More> : null}><div className="dash-availability"><strong>{available}<small> of {menu.length}</small></strong><span>{menu.length - available ? `${plural(menu.length - available, noun, chef ? "dishes" : "juices")} unavailable` : `Every ${noun} is available`}</span><span className="dash-meter" aria-hidden="true"><i style={{ width: `${menu.length ? available / menu.length * 100 : 0}%` }}/></span></div></Card></div>}/>;
}

export function MasterHero({ companies, invoices, usage, pending, openWaiting, openBilling }) {
  const money = currency("INR"), month = new Date().toISOString().slice(0, 7), current = invoices.filter((invoice) => invoice.billingMonth === month), total = current.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0), collected = current.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const sum = (list, key) => list.reduce((all, item) => all + Number(item[key] || 0), 0), activeCompanies = companies.filter((company) => company.status === "active").length, online = companies.filter((company) => company.online).length;
  return <div className="dash">
    <Hero kicker={new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date())} title="Company Network" sub="Every restaurant on Byteberrytech, in one place." label="Subscription revenue this month" value={money(total)} trend={<em>{money(collected)} collected</em>}
      facts={[["Companies", companies.length], ["Active", activeCompanies], ["Databases online", `${online} / ${companies.length}`], ["Outstanding", money(total - collected)]]}
      actions={<><button type="button" className="dash-button gold" onClick={openWaiting}>Review registrations <ArrowRight size={16}/></button><button type="button" className="dash-button" onClick={openBilling}>Open billing</button></>}/>
    <Kpis items={[
      { icon: Building2, label: "Active companies", value: `${activeCompanies} / ${companies.length}`, note: "Tenants with access", meter: companies.length ? activeCompanies / companies.length * 100 : 0 },
      { icon: UtensilsCrossed, label: "Live orders", value: sum(companies, "activeOrders"), note: "Across all companies" },
      { icon: Users, label: "Software users", value: sum(usage, "uniqueUsers"), note: plural(sum(usage, "totalLogins"), "login") + " tracked" },
      { icon: CreditCard, label: "Pending registrations", value: pending, note: pending ? "Awaiting your review" : "None waiting", tone: pending ? "warning" : "", go: openWaiting },
    ]}/>
  </div>;
}

export function MasterCharts({ companies }) {
  const [selected, setSelected] = useState("all"), money = currency("INR"), totals = new Map();
  companies.filter((company) => selected === "all" || String(company.id) === selected).forEach((company) => (company.dailyRevenue || []).forEach((row) => totals.set(row.date, (totals.get(row.date) || 0) + Number(row.total || 0))));
  const days = [...totals].sort(([a], [b]) => a.localeCompare(b)).slice(-14), ranked = companies.filter((company) => company.online).map((company) => ({ ...company, value: Number(company.revenue || 0) })).sort((a, b) => b.value - a.value), top = Math.max(1, ...ranked.map((company) => company.value));
  const day = (date, options) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", ...options }).format(new Date(`${String(date).slice(0, 10)}T12:00:00Z`));
  return <div className="dash-columns-2 dash-master">
    <Card title="Daily turnover" sub="Latest 14 reported sales dates, paid orders" action={<label className="dash-filter"><span>Company</span><select value={selected} onChange={(event) => setSelected(event.target.value)}><option value="all">All companies</option>{companies.map((company) => <option key={company.id} value={String(company.id)}>{company.companyName}</option>)}</select></label>}>
      {days.length ? <ColumnChart label="Daily turnover" format={money} short={compact("INR")} points={days.map(([date, value]) => ({ key: date, value, tick: day(date, { day: "numeric" }), full: day(date, { weekday: "short", day: "numeric", month: "short" }) }))}/> : <Clear icon={TrendingUp} title="No paid orders yet">Turnover appears after payments are recorded.</Clear>}
    </Card>
    <Card title="Turnover by company" sub="All-time paid orders, excludes SaaS fees">
      {ranked.length ? <ul className="dash-todo">{ranked.map((company) => <li key={company.id}><span>{company.companyName}</span><b>{money(company.value)}</b><span className="dash-meter" aria-hidden="true"><i style={{ width: `${company.value / top * 100}%` }}/></span></li>)}</ul> : <Clear icon={Building2} title="No company data">No online company has reported sales.</Clear>}
      {companies.some((company) => !company.online) ? <p className="dash-foot">Unavailable companies are excluded.</p> : null}
    </Card>
  </div>;
}
