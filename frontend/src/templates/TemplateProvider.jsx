import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DEFAULT_TEMPLATE, registry, resolveTemplate } from "./registry.js";

const TemplateContext = createContext(registry[DEFAULT_TEMPLATE]);
export const useTemplate = () => useContext(TemplateContext);

/** Loads a template's assets; any failure (offline, stale deploy) resolves to Classic instead of rejecting. */
export async function loadTemplate(config) {
  const entry = resolveTemplate(config);
  try { await entry.load?.(); return entry; }
  catch (error) { console.error(`Template "${entry.code}" could not load; using Classic.`, error); return registry[DEFAULT_TEMPLATE]; }
}
const applied = (entry) => {
  if (entry.code === DEFAULT_TEMPLATE) delete document.documentElement.dataset.template; else document.documentElement.dataset.template = entry.code;
  if (entry.scheme) document.documentElement.dataset.scheme = entry.scheme; else delete document.documentElement.dataset.scheme;
  if (entry.glass) document.documentElement.dataset.glass = ''; else delete document.documentElement.dataset.glass;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", entry.themeColor);
};

/**
 * Applies one tenant's template. `tenant` scopes the state: changing it, or unmounting (logout),
 * discards the previous template before anything else paints. `config` undefined = not known yet.
 */
export function TemplateProvider({ tenant, config, pending, children }) {
  const [state, setState] = useState(null), shown = useRef(null), known = config !== undefined, key = `${tenant}|${config?.code}|${config?.version}`;
  useEffect(() => {
    if (!known) return;
    let current = true;
    let timer;
    loadTemplate(config).then((entry) => {
      // A live change must not remount a screen while someone is filling in a dialog.
      const commit = () => {
        if (!current) return;
        if (shown.current?.tenant === tenant && shown.current.entry !== entry && document.querySelector(".modal-wrap")) { timer = setTimeout(commit, 800); return; }
        shown.current = { tenant, entry }; setState(shown.current);
      };
      commit();
    });
    return () => { current = false; clearTimeout(timer); };
  }, [key, known]);
  const active = state?.tenant === tenant ? state.entry : null;
  // Layout effects run before paint, so content never shows under another template's tokens.
  useLayoutEffect(() => { if (active) applied(active); else applied(registry[DEFAULT_TEMPLATE]); }, [active]);
  useLayoutEffect(() => () => applied(registry[DEFAULT_TEMPLATE]), []);
  if (!active) return pending;
  return <TemplateContext.Provider value={active}>{children}</TemplateContext.Provider>;
}
