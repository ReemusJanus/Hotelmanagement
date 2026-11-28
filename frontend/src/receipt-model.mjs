const number = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;
export const receiptAmount = value => new Intl.NumberFormat('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value)||0);
export function receiptModel(order,data,bill={}) {
 const paid=order.paymentStatus==='paid'||order.status==='completed';
 const items=(order.items||bill.items||[]).map((line,index)=>{
  const menu=data.menu?.find(m=>m.id===line.menuId),source=bill.items?.[index];
  const price=number(line.price)??(!paid?(number(source?.price)??number(menu?.price)):null);
  return {name:line.name||source?.name||menu?.name||'Menu item',qty:Number(line.qty),price,amount:price===null?null:price*Number(line.qty)};
 });
 const subtotal=number(order.subtotal)??items.reduce((sum,line)=>sum+(line.amount||0),0);
 const adjustments=[['Tax',number(order.tax)??number(bill.tax)],['CGST',number(order.cgst)??number(bill.cgst)],['Service charge',number(order.serviceCharge)??number(bill.service)],['Parcel charge',number(order.parcelCharges)??number(bill.parcelCharges)],['Packaging charges',number(order.packagingCharges)??number(bill.packagingCharges)],['Discount',number(order.discount)??number(bill.discount)]].filter(([,value])=>value!==null&&value!==0).map(([label,value])=>({label,value:label==='Discount'?-Math.abs(value):value}));
 const total=number(order.total)??subtotal+adjustments.reduce((sum,row)=>sum+row.value,0);
 return {items,subtotal,adjustments,total,error:order.status==='cancelled'?'Cancelled orders cannot be printed as bills.':items.some(i=>i.price===null)?'Stored item prices are unavailable. Refresh the bill before printing.':''};
}
// Paper roll widths (mm) and their usual printable widths. Any 40–120 mm roll is accepted as custom.
export const PAPER_PRESETS=[58,76,80,112];
export const defaultPrintableWidth=paper=>({58:48,76:64,80:72,112:104})[paper]??Math.max(30,paper-8);
export function printPreferences(value={}) {
 const paperRaw=Number(value.paper),paper=Number.isFinite(paperRaw)&&paperRaw>=40&&paperRaw<=120?Math.round(paperRaw):80;
 const width=Number(value.width),feed=Number(value.feed);
 return {driverPaper:value.driverPaper===true,paper,width:Number.isFinite(width)&&width>=30&&width<=paper?width:defaultPrintableWidth(paper),feed:Number.isFinite(feed)&&feed>=0&&feed<=30?feed:20};
}
/** Layout class for the printable width: narrow rolls stack quantity under the item name. */
export const receiptLayout=prefs=>prefs.width<56?'narrow':prefs.width>=96?'wide':'standard';

// Width must never exceed height: short custom forms can be treated as landscape.
export function receiptPageHeight(heightPx, paper = 80) {
 if (!Number.isFinite(heightPx) || heightPx <= 0) throw new Error('Receipt has no printable content');
 return Math.max(paper + 1, Math.ceil(heightPx * 25.4 / 96 + 0.5));
}
