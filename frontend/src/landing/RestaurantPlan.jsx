// Original vector floor plan. It is the instant loading state and the complete
// mobile, reduced-motion and unavailable-WebGL alternative to the 3D scene.
export default function RestaurantPlan({ active = 0 }) {
  return <svg className="lux-floorplan" viewBox="0 0 700 500" role="img" aria-label="Restaurant plan with reception, eight dining tables, kitchen, juice station, billing, pickup and stock room">
    <defs><pattern id="lux-floor-grid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="currentColor" strokeWidth=".5" opacity=".14"/></pattern></defs>
    <rect x="45" y="45" width="610" height="410" rx="12" className="lux-plan-base"/>
    <rect x="55" y="55" width="590" height="390" fill="url(#lux-floor-grid)"/>
    <g className={active === 7 ? 'is-lit' : ''}><rect x="65" y="65" width="125" height="115" rx="5"/><text x="127" y="100">STORAGE</text><path d="M80 120H175M80 142H175M80 164H175"/></g>
    <g className={active === 3 || active === 4 || active === 2 ? 'is-lit' : ''}><rect x="205" y="65" width="290" height="115" rx="5"/><text x="350" y="100">KITCHEN & JUICE</text><path d="M225 155V122H400V155M420 120H475V158H420Z"/></g>
    <g className={active === 5 ? 'is-lit' : ''}><rect x="510" y="65" width="125" height="115" rx="5"/><text x="572" y="100">PICKUP</text><path d="M550 130H595V160H550ZM545 130L550 120H595L600 130"/></g>
    {[0,1,2,3,4,5,6,7].map(i => { const x = 200+(i%4)*95, y = 245+Math.floor(i/4)*100; return <g key={i} className={`lux-plan-table ${i===7&&active>=1?'is-occupied':''}`}><rect x={x-17} y={y-38} width="34" height="9" rx="3"/><rect x={x-17} y={y+29} width="34" height="9" rx="3"/><circle cx={x} cy={y} r="25"/><text x={x} y={y+4}>0{i+1}</text></g>;})}
    <g className={active === 0 ? 'is-lit' : ''}><rect x="65" y="285" width="75" height="145" rx="5"/><text x="102" y="325" transform="rotate(-90 102 325)">RECEPTION</text></g>
    <g className={active === 6 ? 'is-lit' : ''}><rect x="555" y="285" width="80" height="145" rx="5"/><text x="595" y="350" transform="rotate(-90 595 350)">BILLING</text></g>
    <path d="M270 455V430H420V455" className="lux-plan-entry"/><text x="345" y="483" className="lux-plan-label">THE NEXT GREAT SERVICE STARTS HERE</text>
    {active===2&&<path d="M485 345V205H350V175" className="lux-plan-connection"/>}
  </svg>;
}
