import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Drawn from preview metadata so no screenshots need to be stored or kept in sync. */
export function Thumbnail({ template }) {
  const [a, b, bg, card = "#fff"] = template.preview?.colors || ["#333", "#999", "#fff"], layout = template.preview?.layout, dark = parseInt(bg.slice(1, 3), 16) < 90, line = dark ? "#ffffff26" : "#00000014", soft = dark ? "#ffffff22" : "#0000000d";
  const tiles = (x, y, w, n = 4) => Array.from({ length: n }, (_, i) => <rect key={i} x={x + i * (w / n)} y={y} width={w / n - 6} height="26" rx="3" fill={card} stroke={line}/>);
  return <svg className="template-thumb" viewBox="0 0 320 200" role="img" aria-label={`${template.name} layout preview`}>
    <rect width="320" height="200" fill={bg}/>
    {layout === "masthead" ? <><rect width="320" height="52" fill={card} opacity=".8"/><rect x="128" y="12" width="64" height="9" fill={a}/><path d="M40 42h26M88 42h26M136 42h26M184 42h26M232 42h26" stroke={b} strokeWidth="3"/><path d="M0 52h320" stroke={b}/><rect x="24" y="68" width="120" height="16" fill={a}/><rect x="230" y="68" width="66" height="20" fill={a} opacity=".85"/><path d="M24 104h170M24 124h170M24 144h170M24 164h170M216 104h80M216 134h80M216 164h80" stroke={b} strokeOpacity=".6"/></>
      : layout === "split" ? <><rect width="62" height="200" fill={card} stroke={line}/><rect x="10" y="44" width="42" height="13" rx="5" fill={soft}/><path d="M12 74h36M12 92h36M12 110h36" stroke={soft} strokeWidth="7"/><rect x="74" y="16" width="86" height="106" rx="8" fill={card} stroke={line}/><rect x="84" y="30" width="54" height="9" fill={a}/><rect x="84" y="52" width="44" height="16" rx="5" fill={a}/><rect x="74" y="130" width="86" height="56" rx="8" fill={card} stroke={line}/>{tiles(170, 16, 144, 3)}<rect x="170" y="50" width="138" height="66" rx="8" fill={card} stroke={line}/><rect x="170" y="124" width="138" height="62" rx="8" fill={card} stroke={line}/></> : layout === "floating" ? <><rect x="10" y="10" width="66" height="180" rx="10" fill={card} stroke={line}/><rect x="18" y="44" width="50" height="14" rx="6" fill={a}/><path d="M22 74h38M22 92h38M22 110h38" stroke={soft} strokeWidth="7"/>{tiles(88, 16, 224)}<rect x="88" y="52" width="146" height="70" rx="9" fill={a}/><rect x="242" y="52" width="66" height="70" rx="9" fill={card} stroke={line}/><rect x="88" y="132" width="220" height="58" rx="9" fill={card} stroke={line}/></>
      : layout === "text" ? <><path d="M18 26h40" stroke={a} strokeWidth="7"/><path d="M18 56h34M18 74h44M18 92h30M18 110h38" stroke={b} strokeWidth="4"/><rect x="92" y="22" width="90" height="12" fill={a}/><path d="M92 56h208M92 88h208" stroke={a}/><path d="M92 112h208M92 134h208M92 156h208M92 178h208" stroke={line} strokeWidth="2"/></>
      : layout === "rail" ? <><rect width="46" height="200" fill={a}/><path d="M46 0v200" stroke={b} strokeWidth="3"/><circle cx="23" cy="24" r="11" fill="none" stroke={b} strokeWidth="2"/>{[56, 88, 120, 152].map((y) => <rect key={y} x="14" y={y} width="18" height="16" rx="3" fill={b} opacity={y === 56 ? 1 : .35}/>)}<rect x="60" y="14" width="248" height="70" fill={a}/><rect x="66" y="20" width="236" height="58" fill="none" stroke={b}/><rect x="150" y="36" width="68" height="18" fill={b}/><rect x="60" y="96" width="86" height="90" fill={card} stroke={line}/><path d="M60 96h86M156 96h152" stroke={b} strokeWidth="3"/><rect x="156" y="97" width="152" height="89" fill={card} stroke={line}/></>
      : <><rect width="70" height="200" fill={a}/><rect x="12" y="46" width="48" height="13" rx="4" fill={b} opacity=".5"/><path d="M14 76h40M14 94h40M14 112h40" stroke="#ffffff40" strokeWidth="5"/><rect x="82" y="14" width="226" height="66" rx="8" fill={a}/><rect x="94" y="54" width="44" height="13" rx="4" fill={b}/>{tiles(82, 90, 232)}<rect x="82" y="126" width="144" height="62" rx="6" fill={card} stroke={line}/><rect x="234" y="126" width="74" height="62" rx="6" fill={card} stroke={line}/></>}
  </svg>;
}
export function Dialog({ label, close, busy, children }) {
  const ref = useRef(null), latest = useRef({ close, busy }); latest.current = { close, busy };
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow; document.body.style.overflow = "hidden"; ref.current.focus();
    const key = (event) => { if (document.querySelector(".confirm-dialog")) return; if (event.key === "Escape" && !latest.current.busy) latest.current.close(); if (event.key === "Tab") { const nodes = [...ref.current.querySelectorAll("button:not(:disabled),input:not(:disabled)")], first = nodes[0], last = nodes.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = overflow; previous?.focus?.(); };
  }, []);
  return createPortal(<div className="modal-wrap"><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className="modal wide-modal"><button type="button" className="modal-close" aria-label="Close dialog" disabled={busy} onClick={close}><X size={18}/></button>{children}</div></div>, document.body);
}
export function Preview({ code, name }) {
  const [phone, setPhone] = useState(false);
  return <><div className="template-frame-tools" role="group" aria-label="Preview size"><button type="button" className="secondary" aria-pressed={!phone} onClick={() => setPhone(false)}>Desktop</button><button type="button" className="secondary" aria-pressed={phone} onClick={() => setPhone(true)}>Phone</button></div><iframe className={`template-frame ${phone ? "phone" : ""}`} title={`${name} preview with sample data`} src={`/template-preview?code=${encodeURIComponent(code)}`}/></>;
}
