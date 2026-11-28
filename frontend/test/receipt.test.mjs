import test from 'node:test';import assert from 'node:assert/strict';
import {receiptModel,receiptAmount,printPreferences,receiptPageHeight,receiptLayout,defaultPrintableWidth} from '../src/receipt-model.mjs';
const data={menu:[{id:1,name:'Food',price:999}]};
test('saved paid prices and totals survive menu price changes',()=>{const order={status:'completed',items:[{menuId:1,qty:2,price:'90.00'}],subtotal:'180.00',tax:'9.00',serviceCharge:'5.00',total:'194.00'};const before=JSON.stringify(order);const m=receiptModel(order,data,{total:1998});assert.equal(m.items[0].amount,180);assert.equal(m.total,194);assert.equal(m.subtotal,180);assert.equal(JSON.stringify(order),before);assert.equal(m.error,'')});
test('missing saved item prices blocks an inaccurate paid reprint',()=>assert.match(receiptModel({status:'completed',items:[{menuId:1,qty:1}],total:90},data,{items:[{price:999}]}).error,/Stored item prices/));
test('configured charges and discounts display separately, once',()=>{const m=receiptModel({items:[{menuId:1,qty:1,price:100}],subtotal:100,tax:5,parcelCharges:10,packagingCharges:4,discount:9,total:110},data);assert.deepEqual(m.adjustments.map(x=>x.value),[5,10,4,-9]);assert.equal(m.total,110);assert.equal(m.adjustments.filter(x=>x.label==='Parcel charge').length,1)});
test('zero stored values are not replaced by current menu prices',()=>{const m=receiptModel({status:'completed',items:[{menuId:1,qty:1,price:0}],subtotal:0,total:0},data);assert.equal(m.total,0);assert.equal(m.items[0].amount,0)});
test('currency precision and printer preference bounds',()=>{assert.equal(receiptAmount(1250.5),'1,250.50');assert.deepEqual(printPreferences(),{driverPaper:false,paper:80,width:72,feed:20});assert.deepEqual(printPreferences({width:400,feed:99}),{driverPaper:false,paper:80,width:72,feed:20});assert.deepEqual(printPreferences({driverPaper:false,width:68,feed:0}),{driverPaper:false,paper:80,width:68,feed:0})});

test('cancelled orders cannot print as payable bills',()=>assert.match(receiptModel({status:'cancelled',items:[{menuId:1,qty:1,price:90}]},data).error,/Cancelled/));

test('short receipts remain portrait; long receipts use measured height',()=>{assert.equal(receiptPageHeight(180),81);assert.equal(receiptPageHeight(1500),398);assert.throws(()=>receiptPageHeight(NaN));assert.throws(()=>receiptPageHeight(0));assert.equal(printPreferences({driverPaper:true}).driverPaper,true);assert.equal(printPreferences({driverPaper:'true'}).driverPaper,false)});

test('tear-off feed accepts 15mm and bounded customization',()=>{for(const feed of [0,5,15,30])assert.equal(printPreferences({feed}).feed,feed);for(const feed of [-1,31,NaN])assert.equal(printPreferences({feed}).feed,20)});
test('parcel charge: ₹150 food + ₹20 charge = ₹170; shown once',()=>{const m=receiptModel({orderType:'parcel',items:[{menuId:1,qty:1,price:150}],parcelCharges:20,total:null},data);assert.equal(m.subtotal,150);assert.deepEqual(m.adjustments,[{label:'Parcel charge',value:20}]);assert.equal(m.total,170)});
test('zero parcel charge is omitted from the bill',()=>{const m=receiptModel({orderType:'parcel',items:[{menuId:1,qty:1,price:150}],parcelCharges:'0.00',total:null},data);assert.deepEqual(m.adjustments,[]);assert.equal(m.total,150)});
test('paid parcel reprint uses the stored total and shows the stored charge once',()=>{const m=receiptModel({orderType:'parcel',status:'completed',paymentStatus:'paid',items:[{menuId:1,qty:1,price:'150.00'}],subtotal:'150.00',parcelCharges:'20.00',total:'170.00'},data,{parcelCharges:20});assert.equal(m.total,170);assert.equal(m.adjustments.filter(x=>x.label==='Parcel charge').length,1)});
test('any paper roll: presets, custom widths and bounds',()=>{
 assert.deepEqual([58,76,80,112].map(paper=>printPreferences({paper}).width),[48,64,72,104]);
 assert.equal(printPreferences({paper:70}).width,62,'custom roll defaults to paper - 8 mm');
 assert.equal(printPreferences({paper:58,width:72}).width,48,'printable width never exceeds the paper');
 for(const paper of [39,121,'abc',NaN])assert.equal(printPreferences({paper}).paper,80);
 assert.equal(printPreferences({paper:'58'}).paper,58);assert.equal(defaultPrintableWidth(50),42);
 assert.deepEqual([48,62,72,104].map(width=>receiptLayout({width})),['narrow','standard','standard','wide']);
 assert.equal(receiptPageHeight(10,58),59);assert.equal(receiptPageHeight(10,112),113);assert.equal(receiptPageHeight(180),81);
 assert.deepEqual(printPreferences({width:72,feed:20}),{driverPaper:false,paper:80,width:72,feed:20},'saved 80 mm settings keep working');
});
