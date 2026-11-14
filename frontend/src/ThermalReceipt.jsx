import {useState} from 'react';
import {receiptModel,receiptAmount,printPreferences} from './receipt-model.mjs';
import {openPrinter} from './thermal-print.mjs';
// Preserve existing width/driver settings, but migrate the old 0–5mm feed default once.
const storedPreferences=()=>{try{const saved=localStorage.getItem('hms-thermal-printer-v2');return printPreferences(saved?JSON.parse(saved):{...JSON.parse(localStorage.getItem('hms-thermal-printer')||'{}'),feed:15})}catch{return printPreferences()}};
export default function ThermalReceipt({table,order,data,bill}) {
 const model=receiptModel(order,data,bill),[prefs,setPrefs]=useState(storedPreferences),[draft,setDraft]=useState(storedPreferences);
 const date=new Date(order.createdAt),dateOptions={timeZone:data.settings.timezone||'Asia/Kolkata'};
 const billDate=order.billDate?String(order.billDate).slice(0,10).split('-').reverse().join('/'):date.toLocaleDateString('en-GB',dateOptions);
 const save=(key,value)=>{const next=printPreferences({...prefs,[key]:value});setPrefs(next);setDraft(next);try{localStorage.setItem('hms-thermal-printer-v2',JSON.stringify(next))}catch{}};
 return <section className="receipt thermal-receipt" data-print-width={prefs.width} data-print-feed={prefs.feed} data-driver-paper={prefs.driverPaper} data-print-error={model.error||undefined}>
 {data.settings.showLogoOnBill!==false&&data.settings.logoUrl?<img className="thermal-logo" src={data.settings.logoUrl} alt=""/>:null}
 <h2>{data.settings.hotelName}</h2><p className="thermal-title">RESTAURANT BILL</p>
 <div className="thermal-meta"><p>Bill No: #{order.billNumber??order.dailyNumber??order.id}</p><p>Date: {billDate}</p><p>Time: {date.toLocaleTimeString('en-GB',{...dateOptions,hour:'2-digit',minute:'2-digit'})}</p><p>{table?`Table: T${String(table.number).padStart(2,'0')}`:'Type: Parcel / takeaway'}</p><p>Customer: {order.guestName||'Walk-in Guest'}</p>{order.guestCount&&<p>Group: #{order.id} · Guests: {order.guestCount}</p>}{order.paymentStatus==='paid'&&<p>Payment: Paid{order.paymentMethod?` · ${order.paymentMethod}`:''}</p>}</div>
 <table className="thermal-items"><colgroup><col/><col style={{width:'10mm'}}/><col style={{width:'23mm'}}/></colgroup><thead><tr><th>ITEM</th><th className="quantity">QTY</th><th className="amount">AMOUNT</th></tr></thead><tbody>{model.items.map((item,index)=><tr key={index}><td>{item.name}<small className="thermal-unit">@ {item.price===null?'—':receiptAmount(item.price)}</small></td><td className="quantity">{item.qty}</td><td className="amount bill-amount">{item.amount===null?'—':receiptAmount(item.amount)}</td></tr>)}</tbody></table>
 <div className="thermal-totals"><p><span>Subtotal</span><b className="bill-amount">{receiptAmount(model.subtotal)}</b></p>{model.adjustments.map(row=><p key={row.label}><span>{row.label}</span><b className="bill-amount">{receiptAmount(row.value)}</b></p>)}<p className="thermal-total"><span>TOTAL</span><b className="bill-amount">₹{receiptAmount(model.total)}</b></p></div>
 <footer className="thermal-footer"><p>THANK YOU!</p><p>VISIT AGAIN</p></footer>
 {model.error&&<p className="no-print form-error" role="alert">{model.error}</p>}
 <button className="print no-print" disabled={!!model.error} onClick={openPrinter}>Print bill</button>
 <details className="no-print thermal-settings"><summary>80 mm printer settings</summary><label>Printable width (mm)<input type="number" min="60" max="76" value={draft.width} onChange={e=>setDraft({...draft,width:e.target.value})} onBlur={()=>save('width',draft.width)}/></label><label>Tear-off space (mm)<input type="number" min="0" max="30" value={draft.feed} onChange={e=>setDraft({...draft,feed:e.target.value})} onBlur={()=>save('feed',draft.feed)}/></label><label><input type="checkbox" checked={prefs.driverPaper} onChange={e=>save("driverPaper",e.target.checked)}/>Use printer paper size (fixed-form driver)</label><p>Default: compact measured 80 mm receipt with 15 mm tear-off space (adjustable 0–30 mm). For a driver that rejects custom lengths, enable printer paper size and choose its supported 80 mm receipt form. Set Portrait, 100% scale, no margins, one copy, and disable headers/footers in Chrome/Edge. Fixed forms can feed unused paper; cutter/feed settings belong to the driver.</p></details>
 </section>;
}
