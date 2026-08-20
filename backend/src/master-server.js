import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import http from 'node:http';
import crypto from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {createNestApplication} from './nest/platform.js';

const app=express(),port=Number(process.env.PORT||5000),masterDb=process.env.MASTER_DB_NAME||'knockout_master';
const server=http.createServer(app),socketServer=new WebSocketServer({server,path:'/ws'});
const rootConfig={host:process.env.DB_HOST||'mariadb',port:Number(process.env.DB_PORT||3306),user:process.env.DB_ROOT_USER||'root',password:process.env.DB_ROOT_PASSWORD||'knockout_root'};
const sessionSecret=process.env.MASTER_SESSION_SECRET||`${rootConfig.password}:${masterDb}:knockout-session`;
let adminPool,masterPool;
app.use(cors());app.use(express.json());
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const ident=value=>{const clean=String(value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');if(!/^[a-z][a-z0-9_]{1,62}$/.test(clean))throw Object.assign(new Error('Company name cannot be converted to a valid database name'),{status:400});return clean};
const validTenant=value=>/^knockout(?:_[0-9]+)?$/.test(String(value||''));
const socketDatabase=value=>validTenant(value)?String(value):value==='master'?'master':null;
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
function issuePortalToken(user){const payload=encode({id:user.id,role:user.role,companyDatabase:user.companyDatabase,exp:Date.now()+12*60*60*1000}),signature=crypto.createHmac('sha256',sessionSecret).update(payload).digest('base64url');return `${payload}.${signature}`}
function verifyPortalToken(value){try{const[payload,signature]=String(value||'').replace(/^Bearer\s+/i,'').split('.'),expected=crypto.createHmac('sha256',sessionSecret).update(payload).digest('base64url');if(!signature||signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;const data=JSON.parse(Buffer.from(payload,'base64url')),validRole=['admin','waiter','chef','juicer','superadmin'].includes(data.role),validCompany=data.role==='superadmin'||validTenant(data.companyDatabase);return data.exp>Date.now()&&validRole&&validCompany?data:null}catch{return null}}
function broadcastChange(database,resource='state'){
 const message=JSON.stringify({type:'state.changed',database,resource,at:new Date().toISOString()});
 for(const client of socketServer.clients)if(client.readyState===WebSocket.OPEN&&(client.database===database||client.database==='master'))client.send(message);
}
socketServer.on('connection',(socket,request)=>{
 const database=socketDatabase(new URL(request.url,'http://localhost').searchParams.get('database'));
 if(!database)return socket.close(1008,'Invalid company database');
 socket.database=database;socket.isAlive=true;
 socket.on('pong',()=>{socket.isAlive=true});
 socket.send(JSON.stringify({type:'connected',database,at:new Date().toISOString()}));
});
const socketHeartbeat=setInterval(()=>{for(const socket of socketServer.clients){if(socket.isAlive===false){socket.terminate();continue}socket.isAlive=false;socket.ping()}},25000);
socketServer.on('close',()=>clearInterval(socketHeartbeat));
app.use((req,res,next)=>{
 if(['GET','HEAD','OPTIONS'].includes(req.method)||['/api/login','/api/public/resolve-login'].includes(req.path))return next();
 res.on('finish',()=>{if(res.statusCode<400){const requested=String(req.headers['x-company-database']||'');const database=socketDatabase(requested)||'master';broadcastChange(database,req.path)}});
 next();
});

async function activeCompanies(includeSuspended=false){
 const[rows]=await masterPool.query(`SELECT id,company_name companyName,database_name databaseName FROM companies ${includeSuspended?'':"WHERE status='active'"} ORDER BY id`);
 return rows.filter(company=>validTenant(company.databaseName));
}

async function findPortalLogins(role,pin,includeInactive=false){
 const matches=[];
 if(!role||role==='superadmin'){
  const[[masterUser]]=await masterPool.query(`SELECT id,name FROM master_users WHERE pin=? ${includeInactive?'':'AND active=TRUE'} LIMIT 1`,[String(pin)]);
  if(masterUser)matches.push({...masterUser,role:'superadmin',companyDatabase:null,companyName:'KnockOUT Master'});
 }
 const params=role?[role,String(pin)]:[String(pin)];
 const[users]=await masterPool.query(`SELECT cu.tenant_user_id id,cu.name,cu.role,cu.active userActive,c.database_name companyDatabase,c.company_name companyName,c.status companyStatus FROM company_users cu JOIN companies c ON c.id=cu.company_id WHERE ${role?'cu.role=? AND ':''}cu.pin=? ${includeInactive?'':"AND cu.active=TRUE AND c.status='active'"}`,params);
 matches.push(...users);
 return matches;
}

async function syncCompanyUsers(databaseName){
 if(!validTenant(databaseName))return;
 const[[company]]=await masterPool.query('SELECT id FROM companies WHERE database_name=?',[databaseName]);
 if(!company)return;
 const[users]=await adminPool.query(`SELECT id,name,role,pin,phone,email,profile_image_url profileImageUrl,active FROM \`${databaseName}\`.users WHERE deleted_at IS NULL`);
 const conn=await masterPool.getConnection();
 try{await conn.beginTransaction();await conn.query('DELETE FROM company_users WHERE company_id=?',[company.id]);for(const user of users)await conn.query('INSERT INTO company_users (company_id,tenant_user_id,name,role,pin,phone,email,profile_image_url,active) VALUES (?,?,?,?,?,?,?,?,?)',[company.id,user.id,user.name,user.role,user.pin,user.phone||'',user.email||'',user.profileImageUrl||null,!!user.active]);await conn.commit()}catch(error){await conn.rollback();throw error}finally{conn.release()}
}

async function initialize(){
 adminPool=mysql.createPool({...rootConfig,waitForConnections:true,connectionLimit:4});
 await adminPool.query(`CREATE DATABASE IF NOT EXISTS \`${masterDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
 masterPool=mysql.createPool({...rootConfig,database:masterDb,waitForConnections:true,connectionLimit:6});
 await masterPool.query(`CREATE TABLE IF NOT EXISTS master_users (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(120) NOT NULL,pin VARCHAR(20) NOT NULL,active BOOLEAN DEFAULT TRUE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
 await masterPool.query(`CREATE TABLE IF NOT EXISTS companies (id INT AUTO_INCREMENT PRIMARY KEY,company_name VARCHAR(160) NOT NULL UNIQUE,database_name VARCHAR(64) NOT NULL UNIQUE,admin_name VARCHAR(120) NOT NULL,email VARCHAR(160) DEFAULT '',phone VARCHAR(30) DEFAULT '',status ENUM('active','suspended') DEFAULT 'active',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
 await masterPool.query(`CREATE TABLE IF NOT EXISTS company_users (id INT AUTO_INCREMENT PRIMARY KEY,company_id INT NOT NULL,tenant_user_id INT NOT NULL,name VARCHAR(120) NOT NULL,role ENUM('admin','waiter','chef','juicer') NOT NULL,pin VARCHAR(80) NOT NULL,phone VARCHAR(30) DEFAULT '',email VARCHAR(160) DEFAULT '',profile_image_url VARCHAR(500) NULL,active BOOLEAN DEFAULT TRUE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,UNIQUE KEY company_tenant_user (company_id,tenant_user_id),UNIQUE KEY global_company_pin (pin),FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE)`);
 for(const statement of ["ALTER TABLE company_users ADD COLUMN email VARCHAR(160) DEFAULT '' AFTER phone","ALTER TABLE company_users ADD COLUMN profile_image_url VARCHAR(500) NULL AFTER email"]){try{await masterPool.query(statement)}catch(error){if(error.code!=='ER_DUP_FIELDNAME')throw error}}
 await masterPool.query(`CREATE TABLE IF NOT EXISTS company_registration_requests (id INT AUTO_INCREMENT PRIMARY KEY,company_name VARCHAR(160) NOT NULL,admin_name VARCHAR(120) NOT NULL,admin_pin VARCHAR(20) NOT NULL,email VARCHAR(160) NOT NULL,phone VARCHAR(30) NOT NULL,status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',review_note VARCHAR(255) DEFAULT '',company_id INT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,reviewed_at DATETIME NULL,INDEX registration_status (status,created_at),FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL)`);
 await adminPool.query(`GRANT SELECT ON \`${masterDb}\`.master_users TO 'knockout'@'%'`);
 await adminPool.query('FLUSH PRIVILEGES');
 const[[masterCount]]=await masterPool.query('SELECT COUNT(*) count FROM master_users');
 if(!masterCount.count)await masterPool.query("INSERT INTO master_users (name,pin) VALUES ('KnockOUT Master','9999')");
 await masterPool.query("INSERT IGNORE INTO companies (company_name,database_name,admin_name,email,status) VALUES ('KnockOUT 1','knockout','Arjun Kumar','admin@knockout1.local','active')");
 const[companies]=await masterPool.query('SELECT database_name databaseName FROM companies');
 for(const company of companies){await ensureDailyFinanceTables(company.databaseName);await syncCompanyUsers(company.databaseName)}
}

async function ensureDailyFinanceTables(databaseName){
 if(!/^knockout(?:_[0-9]+)?$/.test(databaseName))return;
 await adminPool.query(`CREATE TABLE IF NOT EXISTS \`${databaseName}\`.supplier_purchases (id INT AUTO_INCREMENT PRIMARY KEY, supplier_name VARCHAR(160) NOT NULL, invoice_number VARCHAR(100) DEFAULT '', description VARCHAR(255) NOT NULL, purchase_date DATE NOT NULL, total_amount DECIMAL(12,2) NOT NULL, notes VARCHAR(255) DEFAULT '', created_by VARCHAR(120) DEFAULT 'Admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
 await adminPool.query(`CREATE TABLE IF NOT EXISTS \`${databaseName}\`.supplier_payments (id INT AUTO_INCREMENT PRIMARY KEY, purchase_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL, payment_method VARCHAR(40) DEFAULT 'Cash', payment_date DATE NOT NULL, reference VARCHAR(100) DEFAULT '', notes VARCHAR(255) DEFAULT '', created_by VARCHAR(120) DEFAULT 'Admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX (purchase_id))`);
 await adminPool.query(`CREATE TABLE IF NOT EXISTS \`${databaseName}\`.kitchen_staff (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, designation VARCHAR(100) NOT NULL DEFAULT 'Chef', phone VARCHAR(30) DEFAULT '', specialization VARCHAR(120) DEFAULT '', pay_type ENUM('daily','monthly') DEFAULT 'monthly', pay_rate DECIMAL(10,2) DEFAULT 0, joined_on DATE NULL, notes VARCHAR(255) DEFAULT '', active BOOLEAN DEFAULT TRUE, created_by VARCHAR(120) DEFAULT 'Head Chef', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
 await adminPool.query(`ALTER TABLE \`${databaseName}\`.users MODIFY pay_type ENUM('daily','monthly','hourly') DEFAULT 'monthly'`);
 await adminPool.query(`UPDATE \`${databaseName}\`.users SET pay_type='daily' WHERE pay_type='hourly'`);
 await adminPool.query(`ALTER TABLE \`${databaseName}\`.users MODIFY pay_type ENUM('daily','monthly') DEFAULT 'monthly'`);
 await adminPool.query(`ALTER TABLE \`${databaseName}\`.kitchen_staff MODIFY pay_type ENUM('daily','monthly','hourly') DEFAULT 'monthly'`);
 await adminPool.query(`UPDATE \`${databaseName}\`.kitchen_staff SET pay_type='daily' WHERE pay_type='hourly'`);
 await adminPool.query(`ALTER TABLE \`${databaseName}\`.kitchen_staff MODIFY pay_type ENUM('daily','monthly') DEFAULT 'monthly'`);
}

async function provisionCompany({companyName,adminName,adminPin,email='',phone=''}){
 const databaseName=ident(companyName);
 if(!/^knockout_[0-9]+$/.test(databaseName))throw Object.assign(new Error('Use a company name such as KnockOUT 2; its database will be knockout_2'),{status:400});
 if(!adminName||!/^[0-9]{6}$/.test(String(adminPin||'')))throw Object.assign(new Error('Admin name and a unique 6-digit Admin PIN are required'),{status:400});
 const[[exists]]=await masterPool.query('SELECT id FROM companies WHERE company_name=? OR database_name=?',[companyName,databaseName]);
 if(exists)throw Object.assign(new Error('This company or database is already registered'),{status:409});
 const[[dbExists]]=await adminPool.query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?',[databaseName]);
 if(dbExists)throw Object.assign(new Error(`Database ${databaseName} already exists`),{status:409});
 const duplicate=await findPortalLogins(null,adminPin,true);
 if(duplicate.length)throw Object.assign(new Error(`This Admin PIN is already assigned to ${duplicate[0].companyName}. Choose a different PIN.`),{status:409});
 try{
  await adminPool.query(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  const[tables]=await adminPool.query("SELECT TABLE_NAME tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA='knockout' AND TABLE_TYPE='BASE TABLE'");
  for(const {tableName} of tables)await adminPool.query(`CREATE TABLE \`${databaseName}\`.\`${tableName}\` LIKE \`knockout\`.\`${tableName}\``);
  await adminPool.query(`INSERT INTO \`${databaseName}\`.settings (id,hotel_name,tax_rate,service_charge,currency) VALUES (1,?,5,5,'INR')`,[companyName]);
  await adminPool.query(`INSERT INTO \`${databaseName}\`.users (name,role,pin,phone,active) VALUES (?,'admin',?,?,TRUE)`,[adminName,String(adminPin),phone]);
  await adminPool.query(`INSERT INTO \`${databaseName}\`.menu_items (id,name,category,description,price,icon,image_url,image_object,is_combo,available) SELECT id,name,category,description,price,icon,image_url,image_object,is_combo,available FROM knockout.menu_items WHERE available=TRUE`);
  await adminPool.query(`INSERT INTO \`${databaseName}\`.combo_components (combo_id,menu_id,quantity) SELECT combo_id,menu_id,quantity FROM knockout.combo_components`);
  await adminPool.query(`INSERT INTO \`${databaseName}\`.inventory (name,category,quantity,unit,min_quantity,cost) SELECT name,category,0,unit,min_quantity,cost FROM knockout.inventory`);
  await adminPool.query(`GRANT ALL PRIVILEGES ON \`${databaseName}\`.* TO 'knockout'@'%'`);
  await adminPool.query('FLUSH PRIVILEGES');
  const[result]=await masterPool.query('INSERT INTO companies (company_name,database_name,admin_name,email,phone) VALUES (?,?,?,?,?)',[companyName,databaseName,adminName,email,phone]);
  await syncCompanyUsers(databaseName);
  return{id:result.insertId,companyName,databaseName,adminName,email,phone,status:'active'};
 }catch(error){await adminPool.query(`DROP DATABASE IF EXISTS \`${databaseName}\``).catch(()=>{});throw error}
}

async function companySummary(company){
 try{const db=mysql.createPool({...rootConfig,database:company.databaseName,connectionLimit:1});const[[users],[orders],[revenue],[stock],[daily]]=await Promise.all([masterPool.query('SELECT tenant_user_id id,name,role,pin,phone,active FROM company_users WHERE company_id=? ORDER BY role,name',[company.id]),db.query("SELECT COUNT(*) count FROM orders WHERE status<>'completed'"),db.query("SELECT COALESCE(SUM(total),0) total FROM orders WHERE payment_status='paid'"),db.query('SELECT COUNT(*) count FROM inventory WHERE quantity<=min_quantity'),db.query("SELECT DATE_FORMAT(completed_at,'%Y-%m-%d') day,COUNT(*) bills,COALESCE(SUM(total),0) total FROM orders WHERE payment_status='paid' AND completed_at IS NOT NULL GROUP BY DATE(completed_at) ORDER BY day DESC LIMIT 31")]);await db.end();return{...company,users:users.map(user=>({...user,active:!!user.active})),staffCount:users.filter(user=>user.active).length,adminLoginActive:users.some(user=>user.role==='admin'&&user.active),activeOrders:orders[0].count,revenue:Number(revenue[0].total),dailyRevenue:daily.map(row=>({date:row.day,bills:row.bills,total:Number(row.total)})),lowStock:stock[0].count,online:true}}catch{return{...company,users:[],staffCount:0,adminLoginActive:false,activeOrders:0,revenue:0,dailyRevenue:[],lowStock:0,online:false}}
}

app.use('/api',asyncRoute(async(req,res,next)=>{
 const session=verifyPortalToken(req.headers.authorization),role=session?.role||'';
 if(!session&&['admin','waiter','chef','juicer'].includes(String(req.headers['x-portal-role']||'').toLowerCase())&&!['/public/resolve-login','/login'].includes(req.path))return res.status(401).json({message:'Your secure session has expired. Sign in with your PIN again.'});
 if(!['admin','waiter','chef','juicer'].includes(role))return next();
 const[[company]]=await masterPool.query('SELECT status FROM companies WHERE database_name=? LIMIT 1',[session.companyDatabase]);
 if(!company||company.status!=='active')return res.status(403).json({code:'COMPANY_SUSPENDED',message:'This company has been suspended by KnockOUT Master. All company logins are temporarily disabled.'});
 const targets={admin:'http://admin-backend:6001',waiter:'http://waiter-backend:7000',chef:'http://chef-backend:8000',juicer:'http://juicer-backend:9000'},headers={'x-company-database':session.companyDatabase,'x-portal-role':role,'x-portal-user-id':String(session.id)};
 if(req.headers['content-type'])headers['content-type']=req.headers['content-type'];
 const options={method:req.method,headers};
 if(!['GET','HEAD'].includes(req.method)){if(req.is('application/json'))options.body=JSON.stringify(req.body||{});else{options.body=req;options.duplex='half'}}
 const upstream=await fetch(`${targets[role]}${req.originalUrl}`,options),body=Buffer.from(await upstream.arrayBuffer());
 if(upstream.ok&&!['GET','HEAD','OPTIONS'].includes(req.method)&&(/^\/api\/staff(?:\/|$)/.test(req.originalUrl)||req.originalUrl==='/api/juicer-login'||req.originalUrl==='/api/profile'))await syncCompanyUsers(headers['x-company-database']);
 res.status(upstream.status);const contentType=upstream.headers.get('content-type');if(contentType)res.set('content-type',contentType);res.send(body);
}));

app.use('/api',(req,res,next)=>{if(['/health','/framework','/login','/public/companies','/public/resolve-login','/public/company-registrations'].includes(req.path))return next();const session=verifyPortalToken(req.headers.authorization);if(session?.role!=='superadmin')return res.status(401).json({message:'KnockOUT Master approval is required'});next()});

app.get('/api/health',asyncRoute(async(_req,res)=>{await masterPool.query('SELECT 1');res.json({ok:true,service:'knockout-master-api',database:masterDb})}));
app.get('/api/public/companies',asyncRoute(async(_req,res)=>{const[rows]=await masterPool.query("SELECT id,company_name companyName,database_name databaseName FROM companies WHERE status='active' ORDER BY id");res.json(rows)}));
app.post('/api/public/company-registrations',asyncRoute(async(req,res)=>{const companyName=String(req.body.companyName||'').trim(),adminName=String(req.body.adminName||'').trim(),adminPin=String(req.body.adminPin||''),email=String(req.body.email||'').trim(),phone=String(req.body.phone||'').trim();if(!companyName||!adminName||!/^[0-9]{6}$/.test(adminPin)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^\+?[0-9]{8,15}$/.test(phone.replace(/[\s()-]/g,'')))return res.status(400).json({message:'Company, Admin name, valid email, phone, and a unique 6-digit Admin PIN are required'});const databaseName=ident(companyName);if(!/^knockout_[0-9]+$/.test(databaseName))return res.status(400).json({message:'Use a company name such as KnockOUT 2; the requested database will be knockout_2'});const[[company]]=await masterPool.query('SELECT id FROM companies WHERE company_name=? OR database_name=?',[companyName,databaseName]),[[pending]]=await masterPool.query("SELECT id FROM company_registration_requests WHERE (company_name=? OR admin_pin=?) AND status='pending' LIMIT 1",[companyName,adminPin]);if(company)return res.status(409).json({message:'This company is already registered'});if(pending)return res.status(409).json({message:'A pending application already uses this company name or Admin PIN'});const used=await findPortalLogins(null,adminPin,true);if(used.length)return res.status(409).json({message:'This Admin PIN is already assigned. Choose another PIN.'});const[result]=await masterPool.query("INSERT INTO company_registration_requests (company_name,admin_name,admin_pin,email,phone) VALUES (?,?,?,?,?)",[companyName,adminName,adminPin,email,phone.replace(/[\s()-]/g,'')]);res.status(201).json({id:result.insertId,status:'pending',message:'Registration sent to KnockOUT Master for approval'})}));
app.post('/api/public/resolve-login',asyncRoute(async(req,res)=>{const pin=String(req.body.pin||'');if(!/^[0-9]{6}$/.test(pin))return res.status(400).json({message:'Enter your 6-digit KnockOUT PIN'});const matches=await findPortalLogins(null,pin);if(!matches.length){const blocked=await findPortalLogins(null,pin,true),suspended=blocked.find(user=>user.role!=='superadmin'&&user.companyStatus==='suspended');if(suspended)return res.status(403).json({code:'COMPANY_SUSPENDED',message:`${suspended.companyName} is suspended. All company user logins are temporarily disabled.`});return res.status(401).json({message:'Invalid or inactive KnockOUT PIN'})}if(matches.length>1)return res.status(409).json({message:'This PIN is assigned to more than one user. Ask the Super Admin to set a unique PIN.'});const user=matches[0];res.json({...user,accessToken:issuePortalToken(user)})}));
app.post('/api/login',asyncRoute(async(req,res)=>{const[[user]]=await masterPool.query('SELECT id,name FROM master_users WHERE pin=? AND active=TRUE',[req.body.pin]);if(!user)return res.status(401).json({message:'Invalid KnockOUT Master PIN'});const result={...user,role:'superadmin',companyDatabase:null};res.json({...result,accessToken:issuePortalToken(result)})}));
app.get('/api/state',asyncRoute(async(_req,res)=>{const[companies]=await masterPool.query('SELECT id,company_name companyName,database_name databaseName,admin_name adminName,email,phone,status,created_at createdAt FROM companies ORDER BY id'),[masterUsers]=await masterPool.query("SELECT id,name,pin,active,'superadmin' role FROM master_users ORDER BY name"),[registrationRequests]=await masterPool.query('SELECT id,company_name companyName,admin_name adminName,email,phone,status,review_note reviewNote,company_id companyId,created_at createdAt,reviewed_at reviewedAt FROM company_registration_requests ORDER BY FIELD(status,"pending","approved","rejected"),id DESC');res.json({companies:await Promise.all(companies.map(companySummary)),masterUsers,registrationRequests,masterName:'KnockOUT Master'})}));
app.post('/api/companies',asyncRoute(async(req,res)=>res.status(201).json(await provisionCompany(req.body))));
app.post('/api/company-registrations/:id/approve',asyncRoute(async(req,res)=>{const[[request]]=await masterPool.query("SELECT id,company_name companyName,admin_name adminName,admin_pin adminPin,email,phone,status FROM company_registration_requests WHERE id=?",[req.params.id]);if(!request)return res.status(404).json({message:'Registration request not found'});if(request.status!=='pending')return res.status(409).json({message:`This registration is already ${request.status}`});const company=await provisionCompany(request);await masterPool.query("UPDATE company_registration_requests SET status='approved',company_id=?,review_note=?,reviewed_at=NOW() WHERE id=?",[company.id,String(req.body.reviewNote||''),request.id]);res.status(201).json({ok:true,status:'approved',company})}));
app.post('/api/company-registrations/:id/reject',asyncRoute(async(req,res)=>{const[result]=await masterPool.query("UPDATE company_registration_requests SET status='rejected',review_note=?,reviewed_at=NOW() WHERE id=? AND status='pending'",[String(req.body.reviewNote||'Not approved by Master'),req.params.id]);if(!result.affectedRows)return res.status(409).json({message:'Registration request is missing or already reviewed'});res.json({ok:true,status:'rejected'})}));
app.patch('/api/companies/:id/status',asyncRoute(async(req,res)=>{if(!['active','suspended'].includes(req.body.status))return res.status(400).json({message:'Invalid company status'});const[[company]]=await masterPool.query('SELECT company_name companyName,database_name databaseName FROM companies WHERE id=?',[req.params.id]);if(!company)return res.status(404).json({message:'Company not found'});await masterPool.query('UPDATE companies SET status=? WHERE id=?',[req.body.status,req.params.id]);broadcastChange(company.databaseName,'company.status');res.json({ok:true,status:req.body.status,companyName:company.companyName,loginsEnabled:req.body.status==='active'})}));
app.delete('/api/companies/:id/admin-login',asyncRoute(async(req,res)=>{const[[company]]=await masterPool.query('SELECT id,company_name companyName,database_name databaseName FROM companies WHERE id=?',[req.params.id]);if(!company)return res.status(404).json({message:'Company not found'});if(!validTenant(company.databaseName))return res.status(400).json({message:'Invalid company database'});const[result]=await adminPool.query(`UPDATE \`${company.databaseName}\`.users SET active=FALSE WHERE role='admin' AND active=TRUE`);await syncCompanyUsers(company.databaseName);res.json({ok:true,disabled:result.affectedRows,companyName:company.companyName})}));
app.patch('/api/companies/:companyId/users/:userId/pin',asyncRoute(async(req,res)=>{const pin=String(req.body.pin||'');if(!/^[0-9]{6}$/.test(pin))return res.status(400).json({message:'PIN must contain exactly 6 digits'});const[[company]]=await masterPool.query('SELECT id,company_name companyName,database_name databaseName FROM companies WHERE id=?',[req.params.companyId]);if(!company||!validTenant(company.databaseName))return res.status(404).json({message:'Company not found'});const[[user]]=await adminPool.query(`SELECT id,name FROM \`${company.databaseName}\`.users WHERE id=? AND deleted_at IS NULL`,[req.params.userId]);if(!user)return res.status(404).json({message:'User not found'});const matches=await findPortalLogins(null,pin,true),used=matches.find(match=>match.companyDatabase!==company.databaseName||Number(match.id)!==Number(user.id));if(used)return res.status(409).json({message:`This PIN is already assigned to ${used.name} at ${used.companyName}`});await adminPool.query(`UPDATE \`${company.databaseName}\`.users SET pin=? WHERE id=?`,[pin,user.id]);await syncCompanyUsers(company.databaseName);res.json({ok:true,userId:user.id,name:user.name,pin})}));
app.patch('/api/master-users/:userId/pin',asyncRoute(async(req,res)=>{const pin=String(req.body.pin||'');if(!/^[0-9]{6}$/.test(pin))return res.status(400).json({message:'PIN must contain exactly 6 digits'});const[[user]]=await masterPool.query('SELECT id,name FROM master_users WHERE id=?',[req.params.userId]);if(!user)return res.status(404).json({message:'Master user not found'});const matches=await findPortalLogins(null,pin,true),used=matches.find(match=>match.role!=='superadmin'||Number(match.id)!==Number(user.id));if(used)return res.status(409).json({message:`This PIN is already assigned to ${used.name} at ${used.companyName}`});await masterPool.query('UPDATE master_users SET pin=? WHERE id=?',[pin,user.id]);res.json({ok:true,userId:user.id,name:user.name,pin})}));
app.delete('/api/companies/:id',asyncRoute(async(req,res)=>{const[[company]]=await masterPool.query('SELECT id,company_name companyName,database_name databaseName FROM companies WHERE id=?',[req.params.id]);if(!company)return res.status(404).json({message:'Company not found'});if(company.databaseName==='knockout')return res.status(409).json({message:'KnockOUT 1 is the protected primary company and cannot be deleted'});if(!/^knockout_[0-9]+$/.test(company.databaseName))return res.status(400).json({message:'Invalid company database'});if(req.body.companyName!==company.companyName)return res.status(400).json({message:'Type the exact company name to confirm deletion'});await adminPool.query(`DROP DATABASE \`${company.databaseName}\``);await masterPool.query('DELETE FROM companies WHERE id=?',[company.id]);res.json({ok:true,deleted:company.companyName})}));
app.use((error,_req,res,_next)=>{console.error(error);res.status(error.status||500).json({message:error.message||'Master server error'})});

async function start(){for(let attempt=1;attempt<=30;attempt++){try{await initialize();const nest=await createNestApplication(app,'knockout-master');await nest.init();server.listen(port,'0.0.0.0',()=>console.log(`KnockOUT Master NestJS API + WebSocket on http://localhost:${port}`));return}catch(error){console.log(`Waiting for master database (${attempt}/30): ${error.message}`);await new Promise(resolve=>setTimeout(resolve,3000))}}process.exit(1)}
start();
