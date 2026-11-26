// Superadmin console screens. Real data only: every figure comes from /state, /master/* or /ui-templates.
// Business rules (approvals, assignment, status) stay in the existing endpoints; this file only presents and calls them.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, Building2, CheckCircle2, Clock3, CreditCard, Database, Eye, Inbox, Palette, PauseCircle, PlayCircle, Radio, Search, ShieldCheck, Sparkles, UserPlus, Users } from "lucide-react";
import { api } from "../api";
import { DataTable } from "../ui";
import { registry } from "../templates/registry.js";
import { Dialog, Preview, Thumbnail } from "../templates/TemplateParts";
import "./console.css";

const DAY = 864e5;
export const RANGES = [["7d", "7 days", 7], ["30d", "30 days", 30], ["90d", "90 days", 90], ["12m", "12 months", 365], ["all", "All time", null]];
const dateText = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const timeText = (value) => value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";
const ago = (value) => { const m = Math.round((Date.now() - new Date(value)) / 6e4); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const isDark = (code) => registry[code]?.scheme === "dark";
export const needsAttention = (company) => !company.online || company.lowStock > 0 || !company.adminLoginActive;

/** Range start (ms) or null for all time. */
function since(range, companies) {
  const days = RANGES.find(([id]) => id === range)?.[2];
  if (days) return Date.now() - days * DAY;
  const first = Math.min(...companies.map((company) => +new Date(company.createdAt)).filter(Number.isFinite));
  return Number.isFinite(first) ? first : Date.now() - 30 * DAY;
}
/** Day, week or month buckets that fit the range. */
function buckets(start) {
  const span = (Date.now() - start) / DAY, unit = span <= 31 ? "day" : span <= 120 ? "week" : "month", out = [];
  const d = new Date(start); d.setHours(0, 0, 0, 0); if (unit === "week") d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); if (unit === "month") d.setDate(1);
  while (+d <= Date.now()) {
    const next = new Date(d); if (unit === "day") next.setDate(d.getDate() + 1); else if (unit === "week") next.setDate(d.getDate() + 7); else next.setMonth(d.getMonth() + 1);
    out.push({ from: +d, to: +next, label: unit === "month" ? d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) });
    d.setTime(+next);
  }
  return { unit, list: out };
}

/* ---------- Charts: thin marks, recessive grid, hover tooltip, data table for every chart ---------- */
function ChartCard({ title, sub, legend, table, children, empty }) {
  return <section className="panel console-chart"><header><div><h2>{title}</h2>{sub ? <p>{sub}</p> : null}</div>{legend ? <ul className="console-legend">{legend.map(([label, color]) => <li key={label}><i style={{ background: color }}/>{label}</li>)}</ul> : null}</header>
    {empty ? <div className="console-empty"><Inbox size={20}/><p>{empty}</p></div> : children}
    {table && !empty ? <details className="console-data"><summary>Show data</summary><div className="table-scroll"><table><thead><tr>{table[0].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{table.slice(1).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div></details> : null}
  </section>;
}
function Tip({ tip }) { return tip ? <div className="console-tip" role="status" style={{ left: `${tip.x}%`, top: tip.y }}><b>{tip.title}</b>{tip.lines.map(([label, value, color]) => <span key={label}>{color ? <i style={{ background: color }}/> : null}{label}<strong>{value}</strong></span>)}</div> : null; }
const W = 640, H = 220, P = { l: 36, r: 12, t: 12, b: 28 };
const ticks = (max) => { const step = Math.max(1, Math.ceil(max / 4)); return [0, step, step * 2, step * 3, step * 4]; };

function GrowthChart({ companies, start }) {
  const [tip, setTip] = useState(null), { list } = buckets(start);
  const points = list.map((b) => ({ ...b, total: companies.filter((c) => +new Date(c.createdAt) < b.to).length, added: companies.filter((c) => { const t = +new Date(c.createdAt); return t >= b.from && t < b.to; }).length }));
  const yt = ticks(Math.max(1, ...points.map((p) => p.total))), max = yt.at(-1), x = (i) => P.l + (points.length < 2 ? (W - P.l - P.r) / 2 : (i / (points.length - 1)) * (W - P.l - P.r)), y = (v) => H - P.b - (v / max) * (H - P.t - P.b);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.total)}`).join(""), every = Math.ceil(points.length / 7);
  return <ChartCard title="Tenant growth" sub={`${points.at(-1)?.total ?? 0} tenants · ${points.reduce((s, p) => s + p.added, 0)} added in this period`} table={[["Period", "New", "Total"], ...points.map((p) => [p.label, p.added, p.total])]} empty={!companies.length && "No tenants yet."}>
    <div className="console-plot" onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Tenant count over time, now ${points.at(-1)?.total ?? 0}`}>
        {yt.map((v) => <g key={v}><line className="grid" x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)}/><text className="axis" x={P.l - 8} y={y(v) + 4} textAnchor="end">{v}</text></g>)}
        <path className="area" d={`${line}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`}/><path className="line" d={line}/>
        {points.map((p, i) => <g key={p.from}>{i % every === 0 || i === points.length - 1 ? <text className="axis" x={x(i)} y={H - 8} textAnchor="middle">{p.label}</text> : null}{tip?.i === i ? <><line className="cross" x1={x(i)} x2={x(i)} y1={P.t} y2={H - P.b}/><circle className="dot" cx={x(i)} cy={y(p.total)} r="5"/></> : null}
          <rect className="hit" x={x(i) - (W / points.length) / 2} y={0} width={W / points.length} height={H} tabIndex={-1} onMouseEnter={() => setTip({ i, x: (x(i) / W) * 100, y: 8, title: p.label, lines: [["Total tenants", p.total], ["New", p.added]] })}/></g>)}
      </svg><Tip tip={tip}/></div>
  </ChartCard>;
}

const REG = [["pending", "Pending", "var(--color-warning)"], ["approved", "Approved", "var(--color-success)"], ["rejected", "Rejected", "var(--color-error)"]];
function RegistrationChart({ requests, start }) {
  const [tip, setTip] = useState(null), { list } = buckets(start);
  const cols = list.map((b) => { const inside = requests.filter((r) => { const t = +new Date(r.createdAt); return t >= b.from && t < b.to; }); return { ...b, counts: Object.fromEntries(REG.map(([id]) => [id, inside.filter((r) => r.status === id).length])), total: inside.length }; });
  const yt = ticks(Math.max(1, ...cols.map((c) => c.total))), max = yt.at(-1), slot = (W - P.l - P.r) / cols.length, bar = Math.max(3, Math.min(26, slot - 4)), y = (v) => (v / max) * (H - P.t - P.b), every = Math.ceil(cols.length / 7);
  const inRange = cols.reduce((s, c) => s + c.total, 0);
  return <ChartCard title="Registration trends" sub={`${inRange} application${inRange === 1 ? "" : "s"} in this period`} legend={REG.map(([, l, c]) => [l, c])} table={[["Period", ...REG.map(([, l]) => l), "Total"], ...cols.map((c) => [c.label, ...REG.map(([id]) => c.counts[id]), c.total])]} empty={!requests.length && "No registration applications yet."}>
    <div className="console-plot" onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Registration applications per ${buckets(start).unit} by status`}>
        {yt.map((v) => <g key={v}><line className="grid" x1={P.l} x2={W - P.r} y1={H - P.b - y(v)} y2={H - P.b - y(v)}/><text className="axis" x={P.l - 8} y={H - P.b - y(v) + 4} textAnchor="end">{v}</text></g>)}
        {cols.map((c, i) => { let base = H - P.b; const cx = P.l + slot * i + slot / 2; return <g key={c.from}>
          {REG.map(([id, , color]) => { const h = y(c.counts[id]); if (!h) return null; base -= h; return <rect key={id} x={cx - bar / 2} y={base} width={bar} height={Math.max(0, h - 2)} rx="3" fill={color} opacity={tip && tip.i !== i ? .45 : 1}/>; })}
          {i % every === 0 || i === cols.length - 1 ? <text className="axis" x={cx} y={H - 8} textAnchor="middle">{c.label}</text> : null}
          <rect className="hit" x={cx - slot / 2} y={0} width={slot} height={H} onMouseEnter={() => setTip({ i, x: (cx / W) * 100, y: 8, title: c.label, lines: REG.map(([id, l, color]) => [l, c.counts[id], color]) })}/></g>; })}
      </svg><Tip tip={tip}/></div>
  </ChartCard>;
}

function BarList({ title, sub, rows, empty, onPick }) {
  const max = Math.max(1, ...rows.map((r) => r.value)), total = rows.reduce((s, r) => s + r.value, 0);
  return <ChartCard title={title} sub={sub} table={[["Item", "Tenants", "Share"], ...rows.map((r) => [r.label, r.value, `${Math.round((r.value / Math.max(1, total)) * 100)}%`])]} empty={!rows.length && empty}>
    <ul className="console-bars">{rows.map((r) => <li key={r.label}><button type="button" disabled={!onPick} onClick={() => onPick?.(r)} title={`${r.label}: ${r.value} of ${total}`}><span className="console-bar-label">{r.icon ? <r.icon size={15} aria-hidden="true"/> : null}{r.label}</span><span className="console-bar-track"><i style={{ width: `${(r.value / max) * 100}%`, background: r.color || "var(--color-primary)" }}/></span><b>{r.value}</b><small>{Math.round((r.value / Math.max(1, total)) * 100)}%</small></button></li>)}</ul>
  </ChartCard>;
}

/* ---------- Dashboard ---------- */
function useHealth() {
  const [health, setHealth] = useState(null), [error, setError] = useState("");
  const load = useCallback(() => api("/master/health").then((h) => { if (!h?.database || !h.realtime) throw new Error("Unexpected health response"); setHealth(h); setError(""); }).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); const timer = setInterval(load, 60000); return () => clearInterval(timer); }, [load]);
  return { health, error, load };
}
export function useActivity(companyId, refreshKey, limit = 60) {
  const [events, setEvents] = useState(null), [error, setError] = useState("");
  useEffect(() => { let live = true; api(`/master/activity?limit=${limit}${companyId ? `&companyId=${companyId}` : ""}`).then((r) => live && (setEvents(Array.isArray(r?.events) ? r.events : []), setError(""))).catch((e) => live && setError(e.message)); return () => { live = false; }; }, [companyId, refreshKey, limit]);
  return { events, error };
}
const ACTION = { "company.created": "Tenant created", "company.activated": "Tenant activated", "company.suspended": "Tenant suspended", "company.deleted": "Tenant deleted", "module.enabled": "Module enabled", "module.disabled": "Module disabled", "user.pin-reset": "User PIN reset", "registration.submitted": "Registration submitted", "registration.approved": "Registration approved", "registration.rejected": "Registration rejected", "template.superadmin": "Template assigned by Superadmin", "template.admin": "Template changed by Admin", "template.request": "Template applied from request", "template.requested": "Template change requested", "template.approved": "Template request approved", "template.rejected": "Template request rejected", "template.allowance-reset": "Template changes reset" };
const tone = (action) => /suspended|deleted|rejected|disabled/.test(action) ? "error" : /requested|submitted|pin-reset/.test(action) ? "warning" : "success";
export function ActivityList({ events, error, empty = "No activity recorded yet.", showCompany = true }) {
  if (error) return <div className="console-empty" role="alert"><AlertTriangle size={20}/><p>Activity could not be loaded: {error}</p></div>;
  if (!events) return <ul className="console-activity" aria-busy="true">{[0, 1, 2, 3].map((i) => <li key={i} className="console-skeleton"><i/><span/></li>)}</ul>;
  if (!events.length) return <div className="console-empty"><Inbox size={20}/><p>{empty}</p></div>;
  return <ul className="console-activity">{events.map((e) => <li key={e.key}><i className={`console-dot ${tone(e.action)}`} aria-hidden="true"/><div><b>{ACTION[e.action] || e.action}</b><p>{showCompany && e.companyName ? <><span>{e.companyName}</span> · </> : null}{e.detail}</p><small>{e.actor ? `${e.actor} · ` : ""}<time dateTime={e.createdAt} title={timeText(e.createdAt)}>{ago(e.createdAt)}</time></small></div></li>)}</ul>;
}

export function MasterDashboard({ data, range, setRange, go, refreshKey }) {
  const companies = data.companies || [], requests = data.registrationRequests || [], start = since(range, companies);
  const { health, error: healthError } = useHealth(), { events, error } = useActivity(null, refreshKey, 12);
  const active = companies.filter((c) => c.status === "active").length, suspended = companies.filter((c) => c.status === "suspended").length, pending = requests.filter((r) => r.status === "pending");
  const fresh = companies.filter((c) => +new Date(c.createdAt) >= start).length, label = RANGES.find(([id]) => id === range)?.[1].toLowerCase();
  const alerts = [
    ...companies.filter((c) => !c.online).map((c) => ({ key: `db${c.id}`, level: "error", text: `${c.companyName}: database unavailable`, open: () => go.company(c.id) })),
    ...companies.filter((c) => c.online && !c.adminLoginActive).map((c) => ({ key: `ad${c.id}`, level: "warning", text: `${c.companyName}: no active Admin login`, open: () => go.company(c.id, "users") })),
    ...companies.filter((c) => c.lowStock > 0).map((c) => ({ key: `st${c.id}`, level: "warning", text: `${c.companyName}: ${c.lowStock} item${c.lowStock === 1 ? "" : "s"} at or below minimum stock`, open: () => go.company(c.id) })),
    ...(health?.notifications?.failedLastDay ? [{ key: "mail", level: "warning", text: `${health.notifications.failedLastDay} notification${health.notifications.failedLastDay === 1 ? "" : "s"} failed in the last 24 h` }] : []),
  ];
  const kpis = [
    ["Total tenants", companies.length, `${companies.filter((c) => c.online).length} databases online`, Building2, () => go.tenants("all")],
    ["Active tenants", active, `${companies.length ? Math.round((active / companies.length) * 100) : 0}% of all tenants`, CheckCircle2, () => go.tenants("active"), "success"],
    ["Inactive tenants", companies.length - active, "Not currently active", PauseCircle, () => go.tenants("inactive")],
    ["Suspended", suspended, "Logins disabled", AlertTriangle, () => go.tenants("suspended"), suspended ? "error" : ""],
    ["Pending registrations", pending.length, pending.length ? "Awaiting review" : "Nothing waiting", UserPlus, go.approvals, pending.length ? "warning" : ""],
    [`New tenants`, fresh, `Created in the last ${label}`.replace("last all time", "lifetime"), Sparkles, () => go.tenants("new")],
    ["Template requests", data.pendingTemplateRequests || 0, data.pendingTemplateRequests ? "Awaiting decision" : "Nothing waiting", Palette, go.approvals, data.pendingTemplateRequests ? "warning" : ""],
  ];
  const statusRows = [["active", "Active", "var(--color-success)", CheckCircle2], ["suspended", "Suspended", "var(--color-error)", AlertTriangle]].map(([id, l, color, icon]) => ({ id, label: l, color, icon, value: companies.filter((c) => c.status === id).length }));
  const other = companies.filter((c) => !["active", "suspended"].includes(c.status)).length; if (other) statusRows.push({ id: "inactive", label: "Other", color: "var(--color-disabled)", icon: PauseCircle, value: other });
  const usage = [...companies.reduce((m, c) => m.set(c.templateName || "Classic", (m.get(c.templateName || "Classic") || 0) + 1), new Map())].map(([l, v]) => ({ label: l, value: v })).sort((a, b) => b.value - a.value);
  const online = companies.filter((c) => c.online).length;
  return <div className="console">
    <div className="console-toolbar" role="group" aria-label="Date range">{RANGES.map(([id, l]) => <button key={id} type="button" aria-pressed={range === id} className={range === id ? "active" : ""} onClick={() => setRange(id)}>{l}</button>)}</div>
    <div className="console-kpis">{kpis.map(([l, v, note, Icon, open, t]) => <button type="button" key={l} className={`dash-kpi console-kpi ${t || ""}`} onClick={open}><span className="dash-kpi-head"><Icon size={18}/><span>{l}</span><ArrowRight size={15}/></span><strong>{v}</strong><small>{note}</small></button>)}</div>
    <div className="console-grid">
      <GrowthChart companies={companies} start={start}/>
      <RegistrationChart requests={requests} start={start}/>
      <BarList title="Tenant status" sub={`${companies.length} tenants`} rows={statusRows.filter((r) => r.value)} empty="No tenants yet." onPick={(r) => go.tenants(r.id)}/>
      <BarList title="Template usage" sub="Tenants per UI template" rows={usage} empty="No tenants yet." onPick={(r) => go.tenants("all", r.label)}/>
    </div>
    <div className="console-grid three">
      <section className="panel console-card"><header><h2>Pending approvals</h2><button type="button" className="link" onClick={go.approvals}>Open queue <ArrowRight size={14}/></button></header>
        {pending.length || data.pendingTemplateRequests ? <ul className="console-list">{pending.slice(0, 4).map((r) => <li key={r.id}><button type="button" onClick={() => go.registration(r.id)}><UserPlus size={16}/><span><b>{r.companyName}</b><small>Registration · {ago(r.createdAt)}</small></span><ArrowRight size={15}/></button></li>)}{data.pendingTemplateRequests ? <li><button type="button" onClick={go.approvals}><Palette size={16}/><span><b>{data.pendingTemplateRequests} template request{data.pendingTemplateRequests === 1 ? "" : "s"}</b><small>Admins waiting for a decision</small></span><ArrowRight size={15}/></button></li> : null}</ul> : <div className="console-empty"><CheckCircle2 size={20}/><p>Nothing is waiting for approval.</p></div>}
      </section>
      <section className="panel console-card"><header><h2>Alerts</h2><span className={`status ${alerts.length ? "pending" : "active"}`}>{alerts.length ? `${alerts.length} open` : "All clear"}</span></header>
        {alerts.length ? <ul className="console-list">{alerts.slice(0, 6).map((a) => <li key={a.key}><button type="button" disabled={!a.open} onClick={a.open}><AlertTriangle size={16} className={a.level}/><span><b>{a.text}</b></span>{a.open ? <ArrowRight size={15}/> : null}</button></li>)}</ul> : <div className="console-empty"><ShieldCheck size={20}/><p>Databases, Admin logins and stock levels are healthy.</p></div>}
      </section>
      <section className="panel console-card"><header><h2>Recent activity</h2></header><ActivityList events={events} error={error}/></section>
    </div>
    <div className="console-grid">
      <section className="panel console-card console-health" aria-live="polite"><header><h2>System health</h2><small>{health ? `Checked ${timeText(health.checkedAt)}` : healthError ? "" : "Checking…"}</small></header>
        {healthError ? <div className="console-empty" role="alert"><AlertTriangle size={20}/><p>Health check failed: {healthError}</p></div> : <dl>
          <div><dt><Database size={15}/>Master database</dt><dd>{health ? <><span className={`status ${health.database.ok ? "active" : "failed"}`}>{health.database.ok ? "Online" : "Unavailable"}</span> {health.database.latencyMs} ms</> : "…"}</dd></div>
          <div><dt><Building2 size={15}/>Tenant databases</dt><dd><span className={`status ${online === companies.length ? "active" : "failed"}`}>{online}/{companies.length} online</span></dd></div>
          <div><dt><Radio size={15}/>Live updates</dt><dd>{health ? <span className={`status ${health.realtime.ready || health.realtime.provider === "memory" ? "active" : "pending"}`}>{health.realtime.provider === "redis" ? (health.realtime.ready ? "Redis connected" : "Redis reconnecting") : "Single server"}</span> : "…"}</dd></div>
          <div><dt><Activity size={15}/>API uptime</dt><dd>{health ? `${Math.floor(health.uptimeSeconds / 86400)}d ${Math.floor((health.uptimeSeconds % 86400) / 3600)}h ${Math.floor((health.uptimeSeconds % 3600) / 60)}m` : "…"}</dd></div>
          <div><dt><Activity size={15}/>API memory</dt><dd>{health ? `${health.memoryMb} MB (heap ${health.heapMb} MB)` : "…"}</dd></div>
          {health?.notifications ? <div><dt><Inbox size={15}/>Notification queue</dt><dd>{health.notifications.queued} queued · {health.notifications.failedLastDay} failed (24 h)</dd></div> : null}
        </dl>}
      </section>
      <section className="panel console-card"><header><h2>Quick actions</h2></header><div className="console-actions">
        {[[UserPlus, "Review approvals", `${pending.length + (data.pendingTemplateRequests || 0)} waiting`, go.approvals], [Building2, "Tenant directory", `${companies.length} tenants`, () => go.tenants("all")], [Palette, "Tenant templates", "Assign and review", go.templates], [CreditCard, "SaaS billing", "Invoices and pricing", go.billing], [Sparkles, "My appearance", "Your own console theme", go.appearance]].map(([Icon, l, s, open]) => <button type="button" key={l} onClick={open}><Icon size={18}/><span><b>{l}</b><small>{s}</small></span><ArrowRight size={15}/></button>)}
      </div></section>
    </div>
  </div>;
}

/* ---------- Tenant directory ---------- */
export function TenantDirectory({ data, filter, setFilter, template, setTemplate, open, status, assign }) {
  const [query, setQuery] = useState(""), companies = data.companies || [], usage = new Map((data.usage || []).map((u) => [u.companyId, u])), start = Date.now() - 30 * DAY;
  const templates = [...new Set(companies.map((c) => c.templateName || "Classic"))].sort();
  const shown = companies.filter((c) => (filter === "all" || (filter === "inactive" ? c.status !== "active" : filter === "attention" ? needsAttention(c) : filter === "new" ? +new Date(c.createdAt) >= start : c.status === filter))
    && (!template || (c.templateName || "Classic") === template)
    && (!query.trim() || [c.companyName, c.hotelId, c.databaseName, c.adminName, c.email, c.phone].some((v) => String(v || "").toLowerCase().includes(query.trim().toLowerCase()))));
  const chips = [["all", "All"], ["active", "Active"], ["inactive", "Inactive"], ["suspended", "Suspended"], ["new", "New (30 days)"], ["attention", "Needs attention"]];
  return <section className="panel console-directory">
    <div className="console-filters">
      <label className="console-search"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, Hotel ID, admin, email or phone" aria-label="Search tenants"/></label>
      <select value={template} onChange={(e) => setTemplate(e.target.value)} aria-label="Filter by template"><option value="">All templates</option>{templates.map((t) => <option key={t}>{t}</option>)}</select>
      <div className="master-filter-chips" role="group" aria-label="Status">{chips.map(([id, l]) => <button key={id} type="button" aria-pressed={filter === id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{l}<b>{companies.filter((c) => id === "all" || (id === "inactive" ? c.status !== "active" : id === "attention" ? needsAttention(c) : id === "new" ? +new Date(c.createdAt) >= start : c.status === id)).length}</b></button>)}</div>
    </div>
    <p className="console-count" role="status">{shown.length} of {companies.length} tenants</p>
    {shown.length ? <div className="table-scroll"><DataTable><thead><tr><th>Tenant</th><th>Status</th><th>Contact</th><th>Registered</th><th>Template</th><th>Users</th><th>Logins</th><th>Live orders</th><th>Actions</th></tr></thead><tbody>{shown.map((c) => { const u = usage.get(c.id); return <tr key={c.id}>
      <td><button type="button" className="console-tenant" onClick={() => open(c.id)}><span className="registration-company-icon"><Building2 size={16}/></span><span><b>{c.companyName}</b><small>Hotel ID {c.hotelId} · <i className={c.online ? "online" : ""}/>{c.online ? "DB online" : "DB offline"}</small></span></button></td>
      <td><span className={`status ${c.status}`}>{c.status}</span></td>
      <td><span className="console-contact"><b>{c.adminName || "—"}</b><small>{c.email || "No email"}</small><small>{c.phone || "No phone"}</small></span></td>
      <td>{dateText(c.createdAt)}</td>
      <td>{c.templateName || "Classic"}<small className="console-sub">{c.templateChangesUsed ?? 0}/3 Admin changes</small></td>
      <td>{c.staffCount}</td>
      <td>{u?.totalLogins || 0}{u?.lastLogin ? <small className="console-sub">Last {ago(u.lastLogin)}</small> : null}</td>
      <td>{c.activeOrders}</td>
      <td><div className="console-row-actions"><button type="button" className="secondary" onClick={() => open(c.id)} aria-label={`Open ${c.companyName}`}><Eye size={15}/>Open</button><button type="button" className="secondary" onClick={() => assign(c)} aria-label={`Change template for ${c.companyName}`}><Palette size={15}/>Template</button><button type="button" className={c.status === "active" ? "secondary danger-text" : "secondary"} onClick={() => status(c)}>{c.status === "active" ? <><PauseCircle size={15}/>Suspend</> : <><PlayCircle size={15}/>Activate</>}</button></div></td>
    </tr>; })}</tbody></DataTable></div> : <div className="console-empty"><Search size={20}/><p>No tenants match. Change the search or filters.</p><button type="button" className="secondary" onClick={() => { setQuery(""); setFilter("all"); setTemplate(""); }}>Clear filters</button></div>}
  </section>;
}

/** Superadmin template assignment for one tenant; same endpoint and stale-write guard as UI Templates. */
export function AssignTemplate({ company, close, toast, done }) {
  const [list, setList] = useState(null), [choice, setChoice] = useState(company.templateId), [busy, setBusy] = useState(false), [preview, setPreview] = useState(false);
  useEffect(() => { api("/master/appearance").then((r) => setList((r?.templates || []).filter((t) => registry[t.code]))).catch((e) => toast(e.message, "error")); }, []);
  const picked = list?.find((t) => t.id === choice);
  async function save() {
    setBusy(true);
    try { await api(`/companies/${company.id}/template`, { method: "PATCH", body: JSON.stringify({ templateId: choice, previousTemplateId: company.templateId }) }); toast(`${company.companyName} now uses ${picked.name}`); await done(); close(); }
    catch (e) { toast(e.message, "error"); } finally { setBusy(false); }
  }
  return <Dialog label={`Change template for ${company.companyName}`} close={close} busy={busy}><h2>{company.companyName}</h2><p>Current template: <b>{company.templateName || "Classic"}</b>. Superadmin changes do not use the Admin's three changes.</p>
    {!list ? <p role="status">Loading templates…</p> : <fieldset className="template-picker" disabled={busy}><legend className="sr-only">Template</legend>{list.map((t) => <label key={t.id}><input type="radio" name="tenant-template" checked={choice === t.id} onChange={() => { setChoice(t.id); setPreview(false); }}/><Thumbnail template={t}/><span>{t.name}<small>{isDark(t.code) ? "Dark" : "Light"}</small></span></label>)}</fieldset>}
    {preview && picked ? <Preview code={picked.code} name={picked.name}/> : null}
    <div className="confirm-actions" style={{ marginTop: 16 }}><button type="button" className="secondary" disabled={!picked} onClick={() => setPreview(!preview)}><Eye size={16}/>{preview ? "Hide preview" : "Preview"}</button><button type="button" className="primary" disabled={busy || !picked || choice === company.templateId} onClick={save}>{busy ? "Saving…" : "Assign template"}</button></div>
  </Dialog>;
}

/* ---------- Approval queue: registrations + template requests ---------- */
export function ApprovalQueue({ data, openRegistration, toast, confirm, refreshKey, refresh }) {
  const [tpl, setTpl] = useState(null), [error, setError] = useState(""), [busy, setBusy] = useState(null), [tab, setTab] = useState("pending");
  const load = useCallback(() => api("/ui-templates").then((r) => { setTpl(Array.isArray(r?.requests) ? r.requests : []); setError(""); }).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load, refreshKey]);
  const regs = (data.registrationRequests || []).filter((r) => tab === "pending" ? r.status === "pending" : r.status !== "pending").slice(0, 50);
  const reqs = (tpl || []).filter((r) => tab === "pending" ? r.status === "pending" : r.status !== "pending").slice(0, 50);
  async function decide(request, decision) {
    if (!(await confirm({ title: `${decision === "approved" ? "Approve" : "Reject"} ${request.companyName}'s request?`, message: decision === "approved" ? `${request.companyName} switches to ${request.templateName} straight away. It does not use one of their changes.` : `${request.companyName} keeps ${request.currentName}. The Admin is notified.`, confirmLabel: decision === "approved" ? "Approve" : "Reject", cancelLabel: "Cancel" }))) return;
    setBusy(request.id);
    try { await api(`/template-requests/${request.id}/review`, { method: "POST", body: JSON.stringify({ decision, note: "" }) }); toast(`Template request from ${request.companyName} ${decision}`); await Promise.all([load(), refresh()]); }
    catch (e) { toast(e.message, "error"); await load(); } finally { setBusy(null); }
  }
  const pendingCount = (data.registrationRequests || []).filter((r) => r.status === "pending").length + (tpl || []).filter((r) => r.status === "pending").length;
  return <div className="console">
    <div className="console-toolbar" role="group" aria-label="Queue">{[["pending", `Waiting (${pendingCount})`], ["decided", "Decided"]].map(([id, l]) => <button key={id} type="button" aria-pressed={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{l}</button>)}</div>
    <div className="console-grid">
      <section className="panel console-card"><header><h2><UserPlus size={17}/> Tenant registrations</h2><span className="console-count">{regs.length}</span></header>
        {regs.length ? <ul className="console-list">{regs.map((r) => <li key={r.id}><button type="button" onClick={() => openRegistration(r.id)}><Building2 size={16}/><span><b>{r.companyName}</b><small>{r.adminName} · {r.email || r.phone || "No contact"} · {r.packageCode}, {r.periodMonths} mo · {timeText(r.createdAt)}</small></span><span className={`status ${r.status}`}>{r.status}</span><ArrowRight size={15}/></button></li>)}</ul> : <div className="console-empty"><CheckCircle2 size={20}/><p>{tab === "pending" ? "No registrations waiting." : "No decided registrations yet."}</p></div>}
      </section>
      <section className="panel console-card"><header><h2><Palette size={17}/> Template change requests</h2><span className="console-count">{reqs.length}</span></header>
        {error ? <div className="console-empty" role="alert"><AlertTriangle size={20}/><p>{error}</p><button type="button" className="secondary" onClick={load}>Try again</button></div> : !tpl ? <ul className="console-activity" aria-busy="true">{[0, 1, 2].map((i) => <li key={i} className="console-skeleton"><i/><span/></li>)}</ul> : reqs.length ? <ul className="console-requests">{reqs.map((r) => <li key={r.id}><div><b>{r.companyName}</b><p>{r.currentName} → <b>{r.templateName}</b></p>{r.reason ? <p className="console-quote">“{r.reason}”</p> : null}<small>{r.requestedBy} · {timeText(r.createdAt)}{r.status !== "pending" ? ` · ${r.status} by ${r.reviewedBy}` : ""}</small></div>{r.status === "pending" ? <div className="console-row-actions"><button type="button" className="secondary" disabled={busy === r.id} onClick={() => decide(r, "rejected")}>Reject</button><button type="button" className="primary" disabled={busy === r.id} onClick={() => decide(r, "approved")}>Approve</button></div> : <span className={`status ${r.status}`}>{r.status}</span>}</li>)}</ul> : <div className="console-empty"><CheckCircle2 size={20}/><p>{tab === "pending" ? "No template requests waiting." : "No decided template requests yet."}</p></div>}
      </section>
    </div>
  </div>;
}

/* ---------- Tenant detail: template history and audit ---------- */
export function TenantTemplates({ company, refreshKey, assign }) {
  const { events, error } = useActivity(company.id, refreshKey, 100), history = events?.filter((e) => e.action.startsWith("template."));
  return <div className="console-grid">
    <section className="panel console-card"><header><h2>Current template</h2><button type="button" className="secondary" onClick={() => assign(company)}><Palette size={15}/>Change template</button></header>
      <dl className="console-facts"><div><dt>Template</dt><dd>{company.templateName || "Classic"}</dd></div><div><dt>Mode</dt><dd>{isDark(company.templateCode) ? "Dark" : "Light"}</dd></div><div><dt>Admin changes used</dt><dd>{company.templateChangesUsed ?? 0} of 3</dd></div></dl>
    </section>
    <section className="panel console-card"><header><h2>Template history</h2></header><ActivityList events={history} error={error} empty="No template changes for this tenant yet." showCompany={false}/></section>
  </div>;
}
export function TenantAudit({ company, refreshKey }) {
  const { events, error } = useActivity(company.id, refreshKey, 200);
  return <section className="panel console-card"><header><h2>Audit activity</h2><small>Status, modules, PIN resets, registrations and templates</small></header><ActivityList events={events} error={error} empty="No recorded activity for this tenant yet." showCompany={false}/></section>;
}

/* ---------- Superadmin's own appearance ---------- */
export function MasterAppearance({ current, apply, toast }) {
  const [list, setList] = useState(null), [mode, setMode] = useState("all"), [preview, setPreview] = useState(null), [busy, setBusy] = useState(null), [error, setError] = useState("");
  useEffect(() => { api("/master/appearance").then((r) => setList((r?.templates || []).filter((t) => registry[t.code]))).catch((e) => setError(e.message)); }, []);
  const active = current?.code || "classic", shown = useMemo(() => (list || []).filter((t) => mode === "all" || (mode === "dark") === isDark(t.code)), [list, mode]);
  async function use(template) {
    setBusy(template.id);
    try { const r = await api("/master/appearance", { method: "PUT", body: JSON.stringify({ templateId: template.id }) }); apply(r.current); toast(`Your console now uses ${template.name}`); }
    catch (e) { toast(e.message, "error"); } finally { setBusy(null); }
  }
  if (error) return <div className="console-empty" role="alert"><AlertTriangle size={20}/><p>Templates could not be loaded: {error}</p></div>;
  return <div className="console">
    <div className="console-note"><Users size={17}/><p>This changes only <b>your</b> Superadmin console. Tenants keep their own templates, and there is no limit on how often you change it.</p></div>
    <div className="console-toolbar" role="group" aria-label="Mode">{[["all", "All"], ["light", "Light"], ["dark", "Dark"]].map(([id, l]) => <button key={id} type="button" aria-pressed={mode === id} className={mode === id ? "active" : ""} onClick={() => setMode(id)}>{l}</button>)}</div>
    {!list ? <div className="template-grid" aria-busy="true">{[0, 1, 2, 3].map((i) => <article key={i} className="template-card console-skeleton"><i/><span/></article>)}</div> : <div className="template-grid">{shown.map((t) => <article className={`template-card ${active === t.code ? "is-current" : ""}`} key={t.id}><Thumbnail template={t}/><div><h3>{t.name}{active === t.code ? <span className="status active">In use</span> : <span className="status">{isDark(t.code) ? "Dark" : "Light"}</span>}</h3><p>{t.preview?.description}</p><div className="template-row-actions"><button type="button" className="secondary" onClick={() => setPreview(t)}><Eye size={15}/>Preview</button><button type="button" className="primary" disabled={active === t.code || busy !== null} onClick={() => use(t)}>{busy === t.id ? "Applying…" : active === t.code ? "Current" : "Use for my console"}</button></div></div></article>)}</div>}
    {preview ? <Dialog label={`${preview.name} preview`} close={() => setPreview(null)}><h2>{preview.name}</h2><p>Sample data only.</p><Preview code={preview.code} name={preview.name}/><div className="confirm-actions" style={{ marginTop: 16 }}><button type="button" className="primary" disabled={active === preview.code || busy !== null} onClick={async () => { await use(preview); setPreview(null); }}>{active === preview.code ? "Current" : "Use for my console"}</button></div></Dialog> : null}
  </div>;
}

/* ---------- Global search ---------- */
export function ConsoleSearch({ data, pages, go }) {
  const [query, setQuery] = useState(""), [open, setOpen] = useState(false), q = query.trim().toLowerCase();
  const results = !q ? [] : [
    ...pages.filter(([, l]) => l.toLowerCase().includes(q)).map(([id, l, Icon]) => ({ key: `p${id}`, Icon, label: l, sub: "Screen", run: () => go.page(id) })),
    ...(data.companies || []).filter((c) => [c.companyName, c.hotelId, c.adminName, c.email, c.phone, c.databaseName].some((v) => String(v || "").toLowerCase().includes(q))).slice(0, 6).map((c) => ({ key: `c${c.id}`, Icon: Building2, label: c.companyName, sub: `Tenant · Hotel ID ${c.hotelId} · ${c.status}`, run: () => go.company(c.id) })),
    ...(data.registrationRequests || []).filter((r) => [r.companyName, r.adminName, r.email, r.phone].some((v) => String(v || "").toLowerCase().includes(q))).slice(0, 4).map((r) => ({ key: `r${r.id}`, Icon: Clock3, label: r.companyName, sub: `Registration · ${r.status}`, run: () => go.registration(r.id) })),
  ];
  const run = (item) => { item.run(); setQuery(""); setOpen(false); };
  return <div className="global-search console-global-search" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <Search size={16}/><input value={query} onFocus={() => setOpen(true)} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onKeyDown={(e) => { if (e.key === "Enter" && results[0]) run(results[0]); if (e.key === "Escape") { setQuery(""); e.currentTarget.blur(); } }} placeholder="Search tenants, registrations, screens…" aria-label="Search tenants, registrations and screens"/>
    {open && q ? <div className="quick-results">{results.length ? results.map((r) => <button type="button" key={r.key} onMouseDown={(e) => e.preventDefault()} onClick={() => run(r)}><r.Icon size={16}/><span><b>{r.label}</b><small>{r.sub}</small></span></button>) : <p>No matches</p>}</div> : null}
  </div>;
}
