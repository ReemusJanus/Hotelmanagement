import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import http from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';

const app=express(),port=Number(process.env.PORT||5000),masterDb=process.env.MASTER_DB_NAME||'knockout_master';
const server=http.createServer(app),socketServer=new WebSocketServer({server,path:'/ws'});
const rootConfig={host:process.env.DB_HOST||'mariadb',port:Number(process.env.DB_PORT||3306),user:process.env.DB_ROOT_USER||'root',password:process.env.DB_ROOT_PASSWORD||'knockout_root'};
let adminPool,masterPool;
app.use(cors());app.use(express.json());
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const ident=value=>{const clean=String(value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');if(!/^[a-z][a-z0-9_]{1,62}$/.test(clean))throw Object.assign(new Error('Company name cannot be converted to a valid database name'),{status:400});return clean};
const validTenant=value=>/^knockout(?:_[0-9]+)?$/.test(String(value||''));
const socketDatabase=value=>validTenant(value)?String(value):value==='master'?'master':null;
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
 for(const company of await activeCompanies(includeInactive)){
  try{
   const params=role?[role,String(pin)]:[String(pin)];
   const[[user]]=await adminPool.query(`SELECT id,name,role FROM \`${company.databaseName}\`.users WHERE ${role?'role=? AND ':''}pin=? AND deleted_at IS NULL ${includeInactive?'':'AND active=TRUE'} LIMIT 1`,params);
   if(user)matches.push({...user,companyDatabase:company.databaseName,companyName:company.companyName});
  }catch(error){if(error.code!=='ER_NO_SUCH_TABLE')throw error}
 }
 return matches;
}

async function initialize(){
 adminPool=mysql.createPool({...rootConfig,waitForConnections:true,connectionLimit:4});
 await adminPool.query(`CREATE DATABASE IF NOT EXISTS \`${masterDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
 masterPool=mysql.createPool({...rootConfig,database:masterDb,waitForConnections:true,connectionLimit:6});
 await masterPool.query(`CREATE TABLE IF NOT EXISTS master_users (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(120) NOT NULL,pin VARCHAR(20) NOT NULL,active BOOLEAN DEFAULT TRUE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
 await masterPool.query(`CREATE TABLE IF NOT EXISTS companies (id INT AUTO_INCREMENT PRIMARY KEY,company_name VARCHAR(160) NOT NULL UNIQUE,database_name VARCHAR(64) NOT NULL UNIQUE,admin_name VARCHAR(120) NOT NULL,email VARCHAR(160) DEFAULT '',phone VARCHAR(30) DEFAULT '',status ENUM('active','suspended') DEFAULT 'active',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
 await adminPool.query(`GRANT SELECT ON \`${masterDb}\`.master_users TO 'knockout'@'%'`);
 await adminPool.query('FLUSH PRIVILEGES');
 const[[masterCount]]=await masterPool.query('SELECT COUNT(*) count FROM master_users');
 if(!masterCount.count)await masterPool.query("INSERT INTO master_users (name,pin) VALUES ('KnockOUT Master','9999')");
 await masterPool.query("INSERT IGNORE INTO companies (company_name,database_name,admin_name,email,status) VALUES ('KnockOUT 1','knockout','Arjun Kumar','admin@knockout1.local','active')");
 const[companies]=await masterPool.query('SELECT database_name databaseName FROM companies');
 for(const company of companies)await ensureDailyFinanceTables(company.databaseName);
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
  return{id:result.insertId,companyName,databaseName,adminName,email,phone,status:'active'};
 }catch(error){await adminPool.query(`DROP DATABASE IF EXISTS \`${databaseName}\``).catch(()=>{});throw error}
}

async function companySummary(company){
 try{const db=mysql.createPool({...rootConfig,database:company.databaseName,connectionLimit:1});const[[users],[admins],[orders],[revenue],[stock],[daily]]=await Promise.all([db.query('SELECT id,name,role,pin,phone,active FROM users WHERE deleted_at IS NULL ORDER BY role,name'),db.query("SELECT COUNT(*) count FROM users WHERE role='admin' AND active=TRUE AND deleted_at IS NULL"),db.query("SELECT COUNT(*) count FROM orders WHERE status<>'completed'"),db.query("SELECT COALESCE(SUM(total),0) total FROM orders WHERE payment_status='paid'"),db.query('SELECT COUNT(*) count FROM inventory WHERE quantity<=min_quantity'),db.query("SELECT DATE_FORMAT(completed_at,'%Y-%m-%d') day,COUNT(*) bills,COALESCE(SUM(total),0) total FROM orders WHERE payment_status='paid' AND completed_at IS NOT NULL GROUP BY DATE(completed_at) ORDER BY day DESC LIMIT 31")]);await db.end();return{...company,users,staffCount:users.filter(user=>user.active).length,adminLoginActive:admins[0].count>0,activeOrders:orders[0].count,revenue:Number(revenue[0].total),dailyRevenue:daily.map(row=>({date:row.day,bills:row.bills,total:Number(row.total)})),lowStock:stock[0].count,online:true}}catch{return{...company,users:[],staffCount:0,adminLoginActive:false,activeOrders:0,revenue:0,dailyRevenue:[],lowStock:0,online:false}}
}

app.use('/api',asyncRoute(async(req,res,next)=>{
 const role=String(req.headers['x-portal-role']||'').toLowerCase();
 if(!['admin','waiter','chef','juicer'].includes(role))return next();
 const targets={admin:'http://admin-backend:6001',waiter:'http://waiter-backend:7000',chef:'http://chef-backend:8000',juicer:'http://juicer-backend:9000'},headers={'x-company-database':String(req.headers['x-company-database']||'knockout')};
 if(req.headers['content-type'])headers['content-type']=req.headers['content-type'];
 const options={method:req.method,headers};
 if(!['GET','HEAD'].includes(req.method)){if(req.is('application/json'))options.body=JSON.stringify(req.body||{});else{options.body=req;options.duplex='half'}}
 const upstream=await fetch(`${targets[role]}${req.originalUrl}`,options),body=Buffer.from(await upstream.arrayBuffer());
 res.status(upstream.status);const contentType=upstream.headers.get('content-type');if(contentType)res.set('content-type',contentType);res.send(body);
}));

app.get('/api/health',asyncRoute(async(_req,res)=>{await masterPool.query('SELECT 1');res.json({ok:true,service:'knockout-master-api',database:masterDb})}));
app.get('/api/public/companies',asyncRoute(async(_req,res)=>{const[rows]=await masterPool.query("SELECT id,company_name companyName,database_name databaseName FROM companies WHERE status='active' ORDER BY id");res.json(rows)}));
app.post('/api/public/resolve-login',asyncRoute(async(req,res)=>{const pin=String(req.body.pin||'');if(!/^[0-9]{6}$/.test(pin))return res.status(400).json({message:'Enter your 6-digit KnockOUT PIN'});const matches=await findPortalLogins(null,pin);if(!matches.length)return res.status(401).json({message:'Invalid or inactive KnockOUT PIN'});if(matches.length>1)return res.status(409).json({message:'This PIN is assigned to more than one user. Ask the Super Admin to set a unique PIN.'});res.json(matches[0])}));
app.post('/api/login',asyncRoute(async(req,res)=>{const[[user]]=await masterPool.query('SELECT id,name FROM master_users WHERE pin=? AND active=TRUE',[req.body.pin]);if(!user)return res.status(401).json({message:'Invalid KnockOUT Master PIN'});res.json({...user,role:'superadmin'})}));
app.get('/api/state',asyncRoute(async(_req,res)=>{const[companies]=await masterPool.query('SELECT id,company_name companyName,database_name databaseName,admin_name adminName,email,phone,status,created_at createdAt FROM companies ORDER BY id'),[masterUsers]=await masterPool.query("SELECT id,name,pin,active,'superadmin' role FROM master_users ORDER BY name");res.json({companies:await Promise.all(companies.map(companySummary)),masterUsers,masterName:'KnockOUT Master'})}));
app.post('/api/companies',asyncRoute(async(req,res)=>res.status(201).json(await provisionCompany(req.body))));
app.patch('/api/companies/:id/status',asyncRoute(async(req,res)=>{if(!['active','suspended'].includes(req.body.status))return res.status(400).json({message:'Invalid company status'});await masterPool.query('UPDATE companies SET status=? WHERE id=?',[req.body.status,req.params.id]);res.json({ok:true})}));
app.delete('/api/companies/:id/admin-login',asyncRoute(async(req,res)=>{const[[company]]=await masterPool.query('SELECT id,company_name companyName,database_name databaseName FROM companies WHERE id=?',[req.params.id]);if(!company)return res.status(404).json({message:'Company not found'});if(!validTenant(company.databaseName))return res.status(400).json({message:'Invalid company database'});const[result]=await adminPool.query(`UPDATE \`${company.databaseName}\`.users SET active=FALSE WHERE role='admin' AND active=TRUE`);res.json({ok:true,disabled:result.affectedRows,companyName:company.companyName})}));
app.patch('/api/companies/:companyId/users/:userId/pin',asyncRoute(async(req,res)=>{const pin=String(req.body.pin||'');if(!/^[0-9]{6}$/.test(pin))return res.status(400).json({message:'PIN must contain exactly 6 digits'});const[[company]]=await masterPool.query('SELECT id,company_name companyName,database_name databaseName FROM companies WHERE id=?',[req.params.companyId]);if(!company||!validTenant(company.databaseName))return res.status(404).json({message:'Company not found'});const[[user]]=await adminPool.query(`SELECT id,name FROM \`${company.databaseName}\`.users WHERE id=? AND deleted_at IS NULL`,[req.params.userId]);if(!user)return res.status(404).json({message:'User not found'});const matches=await findPortalLogins(null,pin,true),used=matches.find(match=>match.companyDatabase!==company.databaseName||Number(match.id)!==Number(user.id));if(used)return res.status(409).json({message:`This PIN is already assigned to ${used.name} at ${used.companyName}`});await adminPool.query(`UPDATE \`${company.databaseName}\`.users SET pin=? WHERE id=?`,[pin,user.id]);res.json({ok:true,userId:user.id,name:user.name,pin})}));
app.patch('/api/master-users/:userId/pin',asyncRoute(async(req,res)=>{const pin=String(req.body.pin||'');if(!/^[0-9]{6}$/.test(pin))return res.status(400).json({message:'PIN must contain exactly 6 digits'});const[[user]]=await masterPool.query('SELECT id,name FROM master_users WHERE id=?',[req.params.userId]);if(!user)return res.status(404).json({message:'Master user not found'});const matches=await findPortalLogins(null,pin,true),used=matches.find(match=>match.role!=='superadmin'||Number(match.id)!==Number(user.id));if(used)return res.status(409).json({message:`This PIN is already assigned to ${used.name} at ${used.companyName}`});await masterPool.query('UPDATE master_users SET pin=? WHERE id=?',[pin,user.id]);res.json({ok:true,userId:user.id,name:user.name,pin})}));
app.delete('/api/companies/:id',asyncRoute(async(req,res)=>{const[[company]]=await masterPool.query('SELECT id,company_name companyName,database_name databaseName FROM companies WHERE id=?',[req.params.id]);if(!company)return res.status(404).json({message:'Company not found'});if(company.databaseName==='knockout')return res.status(409).json({message:'KnockOUT 1 is the protected primary company and cannot be deleted'});if(!/^knockout_[0-9]+$/.test(company.databaseName))return res.status(400).json({message:'Invalid company database'});if(req.body.companyName!==company.companyName)return res.status(400).json({message:'Type the exact company name to confirm deletion'});await adminPool.query(`DROP DATABASE \`${company.databaseName}\``);await masterPool.query('DELETE FROM companies WHERE id=?',[company.id]);res.json({ok:true,deleted:company.companyName})}));
app.use((error,_req,res,_next)=>{console.error(error);res.status(error.status||500).json({message:error.message||'Master server error'})});

async function start(){for(let attempt=1;attempt<=30;attempt++){try{await initialize();server.listen(port,()=>console.log(`KnockOUT Master API + WebSocket on http://localhost:${port}`));return}catch(error){console.log(`Waiting for master database (${attempt}/30): ${error.message}`);await new Promise(resolve=>setTimeout(resolve,3000))}}process.exit(1)}
start();
