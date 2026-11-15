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
 const adjustments=[['Tax',number(order.tax)??number(bill.tax)],['CGST',number(order.cgst)??number(bill.cgst)],['Service charge',number(order.serviceCharge)??number(bill.service)],['Parcel charges',number(order.parcelCharges)??number(bill.parcelCharges)],['Packaging charges',number(order.packagingCharges)??number(bill.packagingCharges)],['Discount',number(order.discount)??number(bill.discount)]].filter(([,value])=>value!==null&&value!==0).map(([label,value])=>({label,value:label==='Discount'?-Math.abs(value):value}));
 const total=number(order.total)??subtotal+adjustments.reduce((sum,row)=>sum+row.value,0);
 return {items,subtotal,adjustments,total,error:order.status==='cancelled'?'Cancelled orders cannot be printed as bills.':items.some(i=>i.price===null)?'Stored item prices are unavailable. Refresh the bill before printing.':''};
}
export function printPreferences(value={}) {
 const width=Number(value.width),feed=Number(value.feed);
 return {driverPaper:value.driverPaper===true,width:Number.isFinite(width)&&width>=60&&width<=76?width:72,feed:Number.isFinite(feed)&&feed>=0&&feed<=30?feed:20};
}

// Width must never exceed height: short custom forms can be treated as landscape.
export function receiptPageHeight(heightPx) {
 if (!Number.isFinite(heightPx) || heightPx <= 0) throw new Error('Receipt has no printable content');
 return Math.max(81, Math.ceil(heightPx * 25.4 / 96 + 0.5));
}
