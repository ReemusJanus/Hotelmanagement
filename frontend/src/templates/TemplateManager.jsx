import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Eye, History, RotateCcw, X } from "lucide-react";
import { api } from "../api";
import { DataTable } from "../ui";
import { registry } from "./registry.js";
import { Dialog, Preview, Thumbnail } from "./TemplateParts";

export default function TemplateManager({ toast, confirm, refreshKey }) {
  const [data, setData] = useState(null), [error, setError] = useState(""), [editing, setEditing] = useState(null), [choice, setChoice] = useState(null), [preview, setPreview] = useState(null), [busy, setBusy] = useState(false), [review, setReview] = useState(null), [note, setNote] = useState(""), lock = useRef(false);
  const load = useCallback(async () => { try { setData(await api("/ui-templates")); setError(""); } catch (e) { setError(e.message); } }, []);
  useEffect(() => { load(); }, [load, refreshKey]);
  if (!data) return error ? <div className="empty-state" role="alert"><h3>Templates could not be loaded</h3><p>{error}</p><button className="primary" onClick={load}>Try again</button></div> : <p className="panel" role="status">Loading templates…</p>;
  const by = (id) => data.templates.find((template) => template.id === id), close = () => { setEditing(null); setPreview(null); };
  const usable = (template) => template.active && Object.hasOwn(registry, template.code);
  async function assign() {
    const template = by(choice);
    if (lock.current || !(await confirm({ title: `Use ${template.name} for ${editing.companyName}?`, message: "Everyone signed in at this company sees the new design within moments. Orders, billing and receipts are not affected.", confirmLabel: "Assign template", cancelLabel: "Cancel" }))) return;
    lock.current = true; setBusy(true);
    try { await api(`/companies/${editing.companyId}/template`, { method: "PATCH", body: JSON.stringify({ templateId: template.id, previousTemplateId: editing.templateId }) }); toast(`${editing.companyName} now uses ${template.name}`); close(); await load(); }
    catch (e) { toast(e.message, "error"); await load(); }
    finally { lock.current = false; setBusy(false); }
  }
  async function act(work, done) {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await work(); toast(done); await load(); return true; }
    catch (e) { toast(e.message, "error"); await load(); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  async function reset(row) {
    if (!(await confirm({ title: `Reset changes for ${row.companyName}?`, message: `The hotel Admin gets ${data.changeLimit} new template changes. The reset is recorded.`, confirmLabel: "Reset allowance", cancelLabel: "Cancel" }))) return;
    await act(() => api(`/companies/${row.companyId}/template-allowance/reset`, { method: "POST", body: "{}" }), `${row.companyName} has ${data.changeLimit} changes again`);
  }
  async function decide(event) {
    event.preventDefault();
    const { request, decision } = review;
    if (await act(() => api(`/template-requests/${request.id}/review`, { method: "POST", body: JSON.stringify({ decision, note }) }), `Request from ${request.companyName} ${decision}`)) setReview(null);
  }
  const pending = data.requests.filter((request) => request.status === "pending"), decided = data.requests.filter((request) => request.status !== "pending");
  return <>
    <section className="panel template-requests"><div className="panel-head"><div><h2>Change requests</h2><p>Hotels that have used their {data.changeLimit} changes.</p></div></div>
      {pending.length ? <ul>{pending.map((request) => <li key={request.id}><div><b>{request.companyName}</b><p>{request.currentName} → <b>{request.templateName}</b></p><p>“{request.reason}”</p><small>{request.requestedBy} · {new Date(request.createdAt).toLocaleString("en-IN")}</small></div><div className="template-row-actions"><button type="button" className="secondary" onClick={() => setPreview({ code: request.templateCode, name: request.templateName })}><Eye size={16}/> Preview</button><button type="button" className="secondary" aria-label={`Reject request from ${request.companyName}`} disabled={busy} onClick={() => { setNote(""); setReview({ request, decision: "rejected" }); }}><X size={16}/> Reject</button><button type="button" className="primary" aria-label={`Approve request from ${request.companyName}`} disabled={busy} onClick={() => { setNote(""); setReview({ request, decision: "approved" }); }}><Check size={16}/> Approve</button></div></li>)}</ul> : <p>No requests are waiting.</p>}
      {decided.length ? <details><summary>Decided requests ({decided.length})</summary><ul>{decided.map((request) => <li key={request.id}><div><b>{request.companyName}</b><p>{request.currentName} → {request.templateName}</p><small>{request.reviewedBy} · {new Date(request.reviewedAt).toLocaleString("en-IN")}{request.reviewNote ? ` · ${request.reviewNote}` : ""}</small></div><span className={`status ${request.status === "approved" ? "ready" : "rejected"}`}>{request.status}</span></li>)}</ul></details> : null}
    </section>
    <div className="template-grid">{data.templates.map((template) => <article className="template-card" key={template.id}><Thumbnail template={template}/><div><h3>{template.name}<span className={`status ${template.active ? "active" : "inactive"}`}>{template.active ? "Active" : "Inactive"}</span></h3><p>{template.preview?.description}</p><small>Version {template.version} · {template.companyCount} {template.companyCount === 1 ? "company" : "companies"}</small><button type="button" className="secondary" disabled={!usable(template)} onClick={() => setPreview(template)}><Eye size={16}/> Preview</button></div></article>)}</div>
    <section className="panel"><div className="panel-head"><div><h2>Company assignments</h2><p>Each company has one template for Admin, Waiter, Chef and Juicer.</p></div></div><div className="table-scroll"><DataTable search="Search companies"><thead><tr><th>Company</th><th>Hotel ID</th><th>Status</th><th>Current template</th><th>Admin changes used</th><th>Action</th></tr></thead><tbody>{data.assignments.map((row) => { const current = by(row.templateId); return <tr key={row.companyId}><td><b>{row.companyName}</b></td><td>{row.hotelId || "—"}</td><td><span className={`status ${row.status}`}>{row.status}</span></td><td><span className="template-current"><i style={{ background: `linear-gradient(90deg,${(current?.preview?.colors || ["#ccc", "#eee"]).slice(0, 2).map((c, i) => `${c} ${i * 50}%,${c} ${(i + 1) * 50}%`).join(",")})` }} aria-hidden="true"/>{current?.name}{current?.active ? "" : " (inactive, showing Classic)"}</span></td><td>{row.changeCount} of {data.changeLimit}</td><td><div className="template-row-actions">{row.changeCount ? <button type="button" className="secondary" aria-label={`Reset changes for ${row.companyName}`} disabled={busy} onClick={() => reset(row)}><RotateCcw size={15}/> Reset</button> : null}<button type="button" className="secondary" aria-label={`Change template for ${row.companyName}`} onClick={() => { setEditing(row); setChoice(row.templateId); }}>Change</button></div></td></tr>; })}</tbody></DataTable></div></section>
    <section className="panel" style={{ marginTop: 18 }}><div className="panel-head"><div><h2><History size={17}/> Change history</h2><p>Latest 100 template changes.</p></div></div>{data.history.length ? <div className="table-scroll"><DataTable><thead><tr><th>When</th><th>Company</th><th>From</th><th>To</th><th>Changed by</th></tr></thead><tbody>{data.history.map((row) => <tr key={row.id}><td>{new Date(row.createdAt).toLocaleString("en-IN")}</td><td><b>{row.companyName}</b></td><td>{row.previousName || "—"}</td><td>{row.templateName} {row.templateVersion}</td><td>{row.assignedBy}<small>{{ admin: "Hotel Admin", request: "Approved request", reset: "Superadmin", superadmin: "Superadmin" }[row.source]}</small></td></tr>)}</tbody></DataTable></div> : <div className="empty-state"><History/><h3>No changes yet</h3><p>Template changes are recorded here.</p></div>}</section>
    {preview && !editing ? <Dialog label={`${preview.name} preview`} close={close}><h2>{preview.name}</h2><p>Sample data only.</p><Preview code={preview.code} name={preview.name}/></Dialog> : null}
    {review ? <Dialog label={`${review.decision === "approved" ? "Approve" : "Reject"} template request`} close={() => setReview(null)} busy={busy}><h2>{review.decision === "approved" ? "Approve" : "Reject"} this request?</h2><p>{review.decision === "approved" ? `${review.request.companyName} switches to ${review.request.templateName} straight away. This does not use a change.` : `${review.request.companyName} keeps its current template.`}</p><form className="modal-form" onSubmit={decide}><label>Note for the Admin (optional)<textarea maxLength={500} rows={3} value={note} disabled={busy} onChange={(event) => setNote(event.target.value)}/></label><button className={`${review.decision === "approved" ? "primary" : "danger"} wide`} disabled={busy}>{busy ? "Saving…" : review.decision === "approved" ? "Approve and apply" : "Reject request"}</button></form></Dialog> : null}
    {editing ? <Dialog label={`Change template for ${editing.companyName}`} close={close} busy={busy}><h2>{editing.companyName}</h2><p>Current template: <b>{by(editing.templateId)?.name}</b></p>
      <fieldset className="template-picker" disabled={busy}><legend className="sr-only">Template</legend>{data.templates.map((template) => <label key={template.id}><input type="radio" name="template" checked={choice === template.id} disabled={!usable(template)} onChange={() => { setChoice(template.id); setPreview(null); }}/><Thumbnail template={template}/><span>{template.name}<small>{!template.active ? "Inactive" : template.id === editing.templateId ? "Current" : `Version ${template.version}`}</small></span></label>)}</fieldset>
      {preview ? <Preview code={preview.code} name={preview.name}/> : null}
      <div className="confirm-actions" style={{ marginTop: 16 }}><button type="button" className="secondary" disabled={!usable(by(choice))} onClick={() => setPreview(preview ? null : by(choice))}><Eye size={16}/> {preview ? "Hide preview" : "Preview"}</button><button type="button" className="primary" disabled={busy || choice === editing.templateId || !usable(by(choice))} onClick={assign}>{busy ? "Assigning…" : "Assign template"}</button></div></Dialog> : null}
  </>;
}
