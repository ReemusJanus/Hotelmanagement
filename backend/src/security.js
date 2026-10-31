import crypto from 'node:crypto';

export function requireProductionSecrets(env=process.env) {
 if(env.NODE_ENV!=='production')return;
 if(!env.MASTER_SESSION_SECRET||env.MASTER_SESSION_SECRET.length<32||/change.?me|replace|example/i.test(env.MASTER_SESSION_SECRET))throw new Error('Production requires a unique MASTER_SESSION_SECRET of at least 32 characters');
 if(!env.DB_PASSWORD)throw new Error('Production requires DB_PASSWORD');
}
export function originAllowed(origin,req,configured=process.env.CORS_ALLOWED_ORIGINS||'') {
 if(!origin)return true; // Native mobile/server clients do not send Origin.
 const allowed=configured.split(',').map(s=>s.trim()).filter(Boolean);
 if(allowed.includes(origin))return true;
 if(process.env.NODE_ENV!=='production'&&['http://localhost:5200','http://127.0.0.1:5200'].includes(origin))return true;
 try { const value=new URL(origin);return ['http:','https:'].includes(value.protocol)&&value.origin===origin&&value.host===req.headers.host; } catch{return false;}
}
export function securityHeaders(_req,res,next){
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
 res.setHeader('Cache-Control','no-store');next();
}
// Bounded single-process limiter. No raw PINs, tokens or request bodies are retained.
export function createAttemptLimiter({limit=30,windowMs=60000,maxKeys=10000,now=Date.now}={}) {
 const entries=new Map();
 return (req,res,next)=>{
  const time=now(),key=crypto.createHash('sha256').update(String(req.socket?.remoteAddress||req.ip||'unknown')).digest('hex');
  if(entries.size>=maxKeys)for(const [id,row]of entries)if(row.reset<=time)entries.delete(id);
  let row=entries.get(key);
  if(!row||row.reset<=time){if(!row&&entries.size>=maxKeys){res.setHeader('Retry-After','60');return res.status(429).json({message:'Too many requests. Please try again shortly.'});}row={count:0,reset:time+windowMs};entries.set(key,row);}
  if(++row.count>limit){res.setHeader('Retry-After',String(Math.max(1,Math.ceil((row.reset-time)/1000))));return res.status(429).json({message:'Too many attempts. Please try again shortly.'});}
  next();
 };
}
export function safeError(error,_req,res,_next){
 const supplied=Number(error.status||error.statusCode),status=error.code==='LIMIT_FILE_SIZE'?413:Number.isInteger(supplied)&&supplied>=400&&supplied<500?supplied:500;
 if(status===500)console.error(JSON.stringify({event:'request_error',type:error.name||'Error',code:/^[A-Z0-9_]{1,40}$/.test(error.code||'')?error.code:undefined}));
 res.status(status).json({message:status===500?'An internal server error occurred':error.code==='LIMIT_FILE_SIZE'?'Image exceeds the 5 MB limit':error.message||'Invalid request'});
}
export function validateOrderItems(items){return Array.isArray(items)&&items.length>0&&items.length<=200&&items.every(item=>item&&Number.isSafeInteger(Number(item.menuId))&&Number(item.menuId)>0&&Number.isSafeInteger(Number(item.qty))&&Number(item.qty)>0&&Number(item.qty)<=1000&&(item.note===undefined||typeof item.note==='string'&&item.note.length<=255));}
export function imageExtension(file){
 const b=file?.buffer;if(!Buffer.isBuffer(b))throw Object.assign(new Error('Invalid image'),{status:400});
 let mime,ext;
 if(b.length>=8&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){mime='image/png';ext='png';}
 else if(b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255){mime='image/jpeg';ext='jpg';}
 else if(b.length>=6&&['GIF87a','GIF89a'].includes(b.toString('ascii',0,6))){mime='image/gif';ext='gif';}
 else if(b.length>=12&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'){mime='image/webp';ext='webp';}
 if(!mime||file.mimetype!==mime)throw Object.assign(new Error('Upload a valid PNG, JPEG, GIF or WebP image'),{status:400});
 return ext;
}
export function requireRole(role){return(req,res,next)=>req.portalSession?.role===role?next():res.status(403).json({message:`${role==='admin'?'Admin':role} access required`});}
