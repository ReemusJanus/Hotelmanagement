// Shared presentation helpers. No API calls and no business rules live here.
import { Children, cloneElement, isValidElement, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";

/** Re-renders on an interval so service timers stay accurate between live updates. */
export function useNow(interval = 30000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return now;
}

/** localStorage-backed state for harmless view preferences. */
export function usePreference(key, initial) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial; } catch { return initial; }
  });
  const update = (next) => {
    setValue(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Private mode: keep in memory. */ }
  };
  return [value, update];
}

const textOf = (node) => {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (!isValidElement(node)) return String(node);
  return node.props.status ? String(node.props.status) : textOf(node.props.children);
};
// en-IN dates, currency and durations all sort by value instead of alphabetically.
const sortValue = (text) => {
  const value = text.trim(), date = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)?)?/i);
  if (date) {
    const hour = date[4] ? (Number(date[4]) % 12) + (/pm/i.test(date[7] || "") ? 12 : date[7] ? 0 : Number(date[4]) >= 12 ? 12 : 0) : 0;
    return Date.UTC(date[3], date[2] - 1, date[1], hour, date[5] || 0, date[6] || 0);
  }
  const duration = value.match(/^(\d+)h (\d+)m$/);
  if (duration) return Number(duration[1]) * 60 + Number(duration[2]);
  const number = value.replace(/[₹,#\s+]/g, "").match(/^-?\d+(\.\d+)?/);
  return number ? Number(number[0]) : value.toLowerCase();
};

/**
 * Drop-in <table>: adds column sorting, optional search, and cell labels that let
 * rows become stacked cards on phones. Children stay plain thead/tbody markup.
 */
export function DataTable({ children, className = "", search = "", sortable = true }) {
  const [sort, setSort] = useState(null), [query, setQuery] = useState("");
  const parts = Children.toArray(children), head = parts.find((part) => part.type === "thead"), body = parts.find((part) => part.type === "tbody"), rest = parts.filter((part) => part !== head && part !== body);
  const headRow = Children.toArray(head.props.children)[0], columns = Children.toArray(headRow.props.children), labels = columns.map(textOf);
  const rows = Children.toArray(body.props.children);
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle ? rows.filter((row) => textOf(row).toLowerCase().includes(needle)) : [...rows];
    if (!sort) return list;
    const at = (row) => sortValue(textOf(Children.toArray(row.props.children)[sort.index]));
    return list.sort((a, b) => { const x = at(a), y = at(b); return (typeof x === typeof y ? (x < y ? -1 : x > y ? 1 : 0) : String(x).localeCompare(String(y))) * sort.direction; });
  }, [children, query, sort]);
  const toggle = (index) => setSort((current) => current?.index !== index ? { index, direction: 1 } : current.direction === 1 ? { index, direction: -1 } : null);
  return <>
    {search && rows.length > 5 ? <label className="table-search"><Search size={16}/><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={search} aria-label={search}/><span>{shown.length} of {rows.length}</span></label> : null}
    <table className={`data-table ${className}`.trim()}>
      <thead>{cloneElement(headRow, {}, columns.map((column, index) => {
        const active = sort?.index === index;
        if (!sortable || !labels[index].trim() || /^actions?$/i.test(labels[index]) || rows.length < 2) return column;
        return cloneElement(column, { "aria-sort": active ? (sort.direction === 1 ? "ascending" : "descending") : "none" },
          <button type="button" className="sort-button" onClick={() => toggle(index)}>{column.props.children}{active ? (sort.direction === 1 ? <ArrowUp size={13}/> : <ArrowDown size={13}/>) : <ChevronsUpDown size={13}/>}</button>);
      }))}</thead>
      <tbody>{shown.map((row) => isValidElement(row) && row.type === "tr" ? cloneElement(row, {}, Children.toArray(row.props.children).map((cell, index) => isValidElement(cell) ? cloneElement(cell, { "data-label": labels[index] || undefined }) : cell)) : row)}
        {query && !shown.length ? <tr className="table-no-match"><td colSpan={columns.length}>No rows match “{query}”.</td></tr> : null}
      </tbody>
      {rest}
    </table>
  </>;
}

/** Placeholder shown while the workspace loads; mirrors the real layout to avoid a jump. */
export function WorkspaceSkeleton({ label, neutral = false }) {
  return <div className={`workspace-skeleton ${neutral ? "neutral" : ""}`} role="status" aria-label={label}>
    <aside aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i}/>)}</aside>
    <main aria-hidden="true">
      <div className="skeleton-head"><i/><i/></div>
      <div className="skeleton-stats">{Array.from({ length: 4 }, (_, i) => <i key={i}/>)}</div>
      <div className="skeleton-panels"><i/><i/></div>
    </main>
    <p>{label}</p>
  </div>;
}

/** Search with a clear, consistent look for list screens. */
export function SearchField({ value, onChange, label }) {
  return <label className="search-field"><Search size={16}/><input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={label} aria-label={label}/></label>;
}
