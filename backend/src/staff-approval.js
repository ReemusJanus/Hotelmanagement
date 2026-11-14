import crypto from 'node:crypto';
import {pool} from './database.js';
const fail=(message,status=409)=>{throw Object.assign(new Error(message),{status})};
export async function actor(conn,session){
 const [[user]]=await conn.query("SELECT id,name,role FROM users WHERE id=? AND role=? AND active=TRUE AND deleted_at IS NULL AND approval_status='approved'",[session.id,session.role]);
 if(!user)fail('An active approved staff session is required',403);return user;
}
export async function reviewStaff(req,res){
 if(req.portalSession.role!=='admin')return res.status(403).json({message:'Only the hotel Admin can approve or reject staff'});
 const {decision,reason=''}=req.body,kind=req.params.kind;
 if(!['approved','rejected'].includes(decision)||!['account','kitchen'].includes(kind)||typeof reason!=='string'||reason.length>1000)return res.status(400).json({message:'Valid decision and optional reason (up to 1000 characters) required'});
 const table=kind==='account'?'users':'kitchen_staff',conn=await pool.getConnection();
 try{await conn.beginTransaction();const admin=await actor(conn,req.portalSession);
 const [[record]]=await conn.query(`SELECT * FROM ${table} WHERE id=? AND deleted_at IS NULL FOR UPDATE`,[req.params.id]);
 if(!record)fail('Staff request not found',404);if(record.approval_status!=='pending')fail('This staff request has already been reviewed');
 if(kind==='kitchen' && decision==='approved'){
   if(record.user_id)fail('This staff request already has a linked account');
   await conn.query('LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE');
   let pin;
   for(let i=0;i<200;i++){const candidate=String(crypto.randomInt(100000,1000000));const [[used]]=await conn.query('SELECT id FROM users WHERE pin=? AND deleted_at IS NULL',[candidate]);if(!used){pin=candidate;break}}
   if(!pin)fail('Unable to allocate a login PIN. Try again.',503);
   const [account]=await conn.query("INSERT INTO users(name,role,pin,phone,pay_type,pay_rate,active,approval_status,reviewed_by,reviewed_at) VALUES(?,'chef',?,?,?,?,TRUE,'approved',?,NOW())",[record.name,pin,record.phone,record.pay_type,record.pay_rate,admin.id]);
   await conn.query('UPDATE kitchen_staff SET user_id=? WHERE id=?',[account.insertId,record.id]);
 }
 await conn.query(`UPDATE ${table} SET approval_status=?,active=?,reviewed_by=?,reviewed_at=NOW(),rejection_reason=? WHERE id=?`,[decision,decision==='approved',admin.id,decision==='rejected'?reason.trim():'',record.id]);
 await conn.commit();if(res.locals)res.locals.broadcastDetails={action:'staff_reviewed',requestedBy:record.requested_by,decision};res.json({ok:true,id:record.id,approvalStatus:decision,active:decision==='approved'});
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
}
export async function staffRequests(role,id){
 if(!['chef','admin'].includes(role))return [];
 const own=role==='chef'?' AND s.requested_by=?':'',args=role==='chef'?[id]:[];
 const results=await Promise.all(['users','kitchen_staff'].map(async table=>{const [rows]=await pool.query(`SELECT s.id,s.name,${table==='users'?'s.role':'s.designation'} role,s.phone,s.approval_status "approvalStatus",s.requested_by "requestedBy",u.name "requestedByName",s.created_at "requestedAt",s.reviewed_at "reviewedAt",s.rejection_reason "rejectionReason",s.active FROM ${table} s LEFT JOIN users u ON u.id=s.requested_by WHERE s.requested_by IS NOT NULL AND s.deleted_at IS NULL${own} ORDER BY s.created_at DESC`,args);return rows.map(r=>({...r,kind:table==='users'?'account':'kitchen'}))}));return results.flat();
}
