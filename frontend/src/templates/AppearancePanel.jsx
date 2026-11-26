import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Eye } from "lucide-react";
import { api } from "../api";
import { Dialog, Preview, Thumbnail } from "./TemplateParts";
import { registry } from "./registry.js";

export default function AppearancePanel({ toast, confirm, refresh, refreshKey }) {
  const [data, setData] = useState(null), [error, setError] = useState(""), [preview, setPreview] = useState(null), [asking, setAsking] = useState(null), [reason, setReason] = useState(""), [formError, setFormError] = useState(""), [busy, setBusy] = useState(false), lock = useRef(false);
  const load = useCallback(async () => { try { setData(await api("/appearance")); setError(""); } catch (e) { setError(e.message); } }, []);
  useEffect(() => { load(); }, [load, refreshKey]);
  // Opening this page acknowledges a decision.
  useEffect(() => { api("/appearance/seen", { method: "POST", body: "{}" }).then(refresh).catch(() => {}); }, []);
  if (!data) return error ? <div className="empty-state" role="alert"><h3>Appearance could not be loaded</h3><p>{error}</p><button className="primary" onClick={load}>Try again</button></div> : <p className="panel" role="status">Loading templates…</p>;
  const current = data.templates.find((template) => template.id === data.currentTemplateId), pending = data.requests.find((request) => request.status === "pending"), open = data.remaining > 0;
  const choices = data.templates.filter((template) => template.active && Object.hasOwn(registry, template.code));
  async function run(work, done) {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setFormError("");
    try { await work(); toast(done); await load(); await refresh(); return true; }
    catch (e) { setFormError(e.message); toast(e.message, "error"); await load(); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  async function change(template) {
    const left = data.remaining - 1;
    if (!(await confirm({ title: `Switch to ${template.name}?`, message: `Everyone in your hotel sees the new design. You will have ${left} ${left === 1 ? "change" : "changes"} left. Orders, billing and receipts are not affected.`, confirmLabel: "Switch template", cancelLabel: "Cancel" }))) return;
    await run(() => api("/appearance/template", { method: "POST", body: JSON.stringify({ templateId: template.id, previousTemplateId: data.currentTemplateId }) }), `Your hotel now uses ${template.name}`);
  }
  async function submit(event) {
    event.preventDefault();
    if (await run(() => api("/appearance/requests", { method: "POST", body: JSON.stringify({ templateId: asking.id, reason }) }), "Request sent for approval")) { setAsking(null); setReason(""); }
  }
  return <>
    <section className="panel appearance-summary"><div><span className="eyebrow">CURRENT TEMPLATE</span><h2>{current?.name}</h2><p>{current?.preview?.description}</p></div><div className="appearance-left"><strong>{data.remaining}</strong><span>of {data.changeLimit} changes left</span><i aria-hidden="true">{Array.from({ length: data.changeLimit }, (_, i) => <b key={i} className={i < data.remaining ? "on" : ""}/>)}</i></div>
      {!open ? <div className="appearance-limit" role="status"><div><b>{pending ? "Your request is waiting for approval" : "You have used all your changes"}</b><p>{pending ? `${pending.templateName} was requested on ${new Date(pending.createdAt).toLocaleDateString("en-IN")}.` : "Ask for a new template and the platform team will review it."}</p></div>{pending ? <span className="status pending">Pending</span> : <button type="button" className="primary" onClick={() => { setFormError(""); setReason(""); setAsking(choices.find((template) => template.id !== data.currentTemplateId)); }}>Request Template Change</button>}</div> : null}</section>
    <div className="template-grid">{choices.map((template) => { const active = template.id === data.currentTemplateId; return <article className={`template-card ${active ? "current" : ""}`} key={template.id}><Thumbnail template={template}/><div><h3>{template.name}{active ? <span className="status ready"><Check size={13}/> Current</span> : null}</h3><p>{template.preview?.description}</p><div className="template-row-actions"><button type="button" className="secondary" aria-label={`Preview ${template.name}`} onClick={() => setPreview(template)}><Eye size={16}/> Preview</button>{active ? null : open ? <button type="button" className="primary" aria-label={`Use ${template.name}`} disabled={busy} onClick={() => change(template)}>Use this</button> : <button type="button" className="secondary" aria-label={`Use ${template.name}`} disabled title="No changes left">Use this</button>}</div></div></article>; })}</div>
    <section className="panel template-requests"><div className="panel-head"><div><h2>Your requests</h2><p>Template changes you asked the platform team for.</p></div></div>{data.requests.length ? <ul>{data.requests.map((request) => <li key={request.id}><div><b>{request.currentName} → {request.templateName}</b><p>“{request.reason}”</p><small>{request.requestedBy} · {new Date(request.createdAt).toLocaleString("en-IN")}{request.reviewNote ? ` · Reply: ${request.reviewNote}` : ""}</small></div><span className={`status ${request.status === "approved" ? "ready" : request.status}`}>{request.status}</span></li>)}</ul> : <p>No requests yet.</p>}</section>
    {preview ? <Dialog label={`${preview.name} preview`} close={() => setPreview(null)}><h2>{preview.name}</h2><p>Sample data only.</p><Preview code={preview.code} name={preview.name}/></Dialog> : null}
    {asking ? <Dialog label="Request template change" close={() => setAsking(null)} busy={busy}><h2>Request a template change</h2><p>Choose a template and tell us why.</p><form className="modal-form" onSubmit={submit}>
      <fieldset className="template-picker" disabled={busy}><legend className="sr-only">Requested template</legend>{choices.filter((template) => template.id !== data.currentTemplateId).map((template) => <label key={template.id}><input type="radio" name="requested" checked={asking.id === template.id} onChange={() => setAsking(template)}/><Thumbnail template={template}/><span>{template.name}</span></label>)}</fieldset>
      <label>Reason<textarea required minLength={5} maxLength={500} rows={3} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} placeholder="For example: we are rebranding the restaurant"/></label>
      {formError ? <div className="form-error" role="alert">{formError}</div> : null}<button className="primary wide" disabled={busy || reason.trim().length < 5}>{busy ? "Sending…" : "Send request"}</button></form></Dialog> : null}
  </>;
}
