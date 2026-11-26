// Application shells. Each receives the same ready-made parts; none contains business logic.
function Sidebar({ shellClass, parts, children }) {
  return <div className={shellClass}>
    <aside>{parts.brand}{parts.navigation}{parts.toggle}{parts.account}</aside>
    <main><header>{parts.title}{parts.search}{parts.actions}</header><div className="page">{children}</div>{parts.footer}</main>
    {parts.tabbar}{parts.overlay}
  </div>;
}
function Masthead({ shellClass, parts, children }) {
  return <div className={shellClass}>
    <aside>{parts.brand}{parts.navigation}{parts.account}</aside>
    <main>
      <header className="masthead"><div className="masthead-row">{parts.search}{parts.wordmark}{parts.actions}</div><div className="masthead-nav">{parts.nav}</div></header>
      <div className="page">{children}</div>{parts.footer}
    </main>
    {parts.tabbar}{parts.overlay}
  </div>;
}
/** The rail has no room for a collapse control. */
function Rail(props) { return <Sidebar {...props} parts={{ ...props.parts, toggle: null }}/>; }
export const shellLayouts = { sidebar: Sidebar, floating: Sidebar, split: Sidebar, text: Rail, rail: Rail, masthead: Masthead };

// Dashboard arrangements. Slots: hero, kpis, chart, floor, work (orders/queue), side.
const Pair = ({ a, b, className = "" }) => a && b ? <div className={`dash-columns-2 ${className}`}>{a}{b}</div> : a || b || null;
export const dashboardLayouts = {
  classic: ({ hero, kpis, chart, floor, work, side }) => <div className="dash">{hero}{kpis}{chart ? <><Pair a={chart} b={floor}/><Pair a={work} b={side}/></> : <Pair a={work} b={side || floor}/>}</div>,
  editorial: ({ hero, kpis, chart, floor, work, side }) => <div className="dash dash-editorial">{hero}<div className="dash-editorial-body"><div className="dash-stack">{work}{chart}</div><div className="dash-stack">{kpis}{floor}{side}</div></div></div>,
  bento: ({ hero, kpis, chart, floor, work, side }) => <div className="dash dash-bento">{kpis}<Pair a={hero} b={floor || side} className="dash-bento-top"/>{chart ? <Pair a={chart} b={side}/> : null}{floor && !chart && side ? side : null}{work}</div>,
  focus: ({ hero, kpis, chart, floor, work, side }) => <div className="dash dash-focus">{hero}{kpis}<div className="dash-focus-body"><div className="dash-stack">{work}{chart}</div><div className="dash-stack">{floor}{side}</div></div></div>,
  split: ({ hero, kpis, chart, floor, work, side }) => <div className="dash dash-split"><div className="dash-stack">{hero}{floor}{side}</div><div className="dash-stack">{kpis}{chart}{work}</div></div>,
  ledger: ({ hero, kpis, chart, floor, work, side }) => <div className="dash dash-ledger">{hero}{kpis}{work}{chart}<Pair a={floor} b={side}/></div>,
  court: ({ hero, kpis, chart, floor, work, side }) => <div className="dash dash-court">{hero}<Pair a={side || floor} b={work} className="dash-court-top"/>{kpis}{chart ? <Pair a={floor} b={chart} className="dash-court-top"/> : null}</div>,
};
