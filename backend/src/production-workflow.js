import {pool} from './database.js';
import {isJuiceItem,stationSQL} from './production-routing.js';
const fail=(message,status=409)=>{throw Object.assign(new Error(message),{status})};
const terminal=['cancelled','completed','billing_requested','served','received'];
async function aggregate(conn,id){
 const [lines]=await conn.query('SELECT production_status p,handoff_status h FROM order_items WHERE order_id=?',[id]);
 const next=lines.every(x=>x.h==='received')?'received':lines.every(x=>['collected','received'].includes(x.h))?'collected':lines.every(x=>x.p==='ready')?'ready':lines.every(x=>x.p==='new')?'new':'preparing';
 await conn.query("UPDATE orders SET status=? WHERE id=? AND status NOT IN ('cancelled','completed','billing_requested','served')",[next,id]);return next;
}
async function transition(req,res,handoff,allBatches=false){
 const role=req.portalSession.role,next=req.body.status;
 if(handoff ? !(next==='collected'&&['chef','juicer'].includes(role)||next==='received'&&role==='waiter') : !['chef','juicer'].includes(role))return res.status(403).json({message:'Your role cannot perform this transition'});
 if(!handoff&&!['new','preparing','ready'].includes(next))return res.status(400).json({message:'Invalid preparation status'});
 const batch=Number(req.params.batchNo??req.body.batchNo??1),menuId=req.body.menuId;
 if(!allBatches&&(!Number.isInteger(batch)||batch<1)||menuId!==undefined&&(!Number.isInteger(Number(menuId))||Number(menuId)<1))return res.status(400).json({message:'Invalid round or item'});
 const conn=await pool.getConnection();
 try{
 await conn.beginTransaction();
 const [[order]]=await conn.query('SELECT id,status,order_type FROM orders WHERE id=? FOR UPDATE',[req.params.id]);
 if(!order)fail('Order not found',404);
 if(terminal.includes(order.status))fail('This order no longer accepts preparation changes');
 if(next==='received'&&order.order_type==='parcel')fail('Parcel delivery uses the Admin handoff flow');
 const [rows]=await conn.query(`SELECT oi.id,oi.menu_id,oi.production_status p,oi.handoff_status h,m.category,${stationSQL('m')} FROM order_items oi JOIN menu_items m ON m.id=oi.menu_id WHERE oi.order_id=? ${allBatches?'':'AND oi.batch_no=?'} FOR UPDATE OF oi`,allBatches?[order.id]:[order.id,batch]);
 let lines=role==='waiter'?rows:rows.filter(x=>isJuiceItem(x)===(role==='juicer'));
 if(menuId!==undefined){const requested=rows.filter(x=>Number(x.menu_id)===Number(menuId));if(requested.some(x=>!lines.includes(x)))fail('Item belongs to another preparation station',403);lines=lines.filter(x=>Number(x.menu_id)===Number(menuId));}
 if(!lines.length)fail('No assigned items found',404);
 const field=handoff?'h':'p';
 for(const line of lines){
 if(line[field]===next)continue;
 if(handoff){if(next==='collected'&&(line.p!=='ready'||line.h!=='pending'))fail('Only ready, uncollected items can be collected');if(next==='received'&&!['collected','received'].includes(line.h))fail('Both stations must confirm collection before table receipt');}
 else if(line.h!=='pending'||!(line.p==='new'&&next==='preparing'||line.p==='preparing'&&next==='ready'))fail('Preparation must progress from Pending to Preparing to Ready');
 }
 const ids=lines.filter(x=>x[field]!==next).map(x=>x.id);
 if(ids.length)await conn.query(`UPDATE order_items SET ${handoff?'handoff_status':'production_status'}=? WHERE id IN (${ids.map(()=>'?').join(',')})`,[next,...ids]);
 const orderStatus=await aggregate(conn,order.id);await conn.commit();
 if(res.locals){res.locals.skipMutation=!ids.length;res.locals.broadcastDetails={action:'station_status',station:role,orderId:order.id,status:next};}
 res.json({ok:true,status:next,batchNo:batch,orderStatus,updatedItems:ids.length,unchanged:!ids.length});
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
}
export const updateOrderItemStatus=(req,res)=>transition(req,res,false);
export const updateBatchHandoff=(req,res)=>transition(req,res,true);
export const updateOrderStatus=(req,res)=>transition(req,res,true,true);
