import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app=express(),port=Number(process.env.PORT||5000),masterDb=process.env.MASTER_DB_NAME||'knockout_master';
const rootConfig={host:process.env.DB_HOST||'mariadb',port:Number(process.env.DB_PORT||3306),user:process.env.DB_ROOT_USER||'root',password:process.env.DB_ROOT_PASSWORD||'knockout_root'};
let adminPool,masterPool;
app.use(cors());app.use(express.json());
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const ident=value=>{const clean=String(value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');if(!/^[a-z][a-z0-9_]{1,62}$/.test(clean))throw Object.assign(new Error('Company name cannot be converted to a valid database name'),{status:400});return clean};

async function initialize(){
 adminPool=mysql.createPool({...rootConfig,waitForConnections:true,connectionLimit:4});
 await adminPool.query(`CREATE DATABASE IF NOT EXISTS \`${masterDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
 masterPool=mysql.createPool({...rootConfig,database:masterDb,waitForConnections:true,connectionLimit:6});
 await masterPool.query(`CREATE TABLE IF NOT EXISTS master_users (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(120) NOT NULL,pin VARCHAR(20) NOT NULL,active BOOLEAN DEFAULT TRUE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
 await masterPool.query(`CREATE TABLE IF NOT EXISTS companies (id INT AUTO_INCREMENT PRIMARY KEY,company_name VARCHAR(160) NOT NULL UNIQUE,database_name VARCHAR(64) NOT NULL UNIQUE,admin_name VARCHAR(120) NOT NULL,email VARCHAR(160) DEFAULT '',phone VARCHAR(30) DEFAULT '',status ENUM('active','suspended') DEFAULT 'active',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
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
}

async function provisionCompany({companyName,adminName,adminPin,email='',phone=''}){
 const databaseName=ident(companyName);
 if(!/^knockout_[0-9]+$/.test(databaseName))throw Object.assign(new Error('Use a company name such as KnockOUT 2; its database will be knockout_2'),{status:400});
 if(!adminName||!/^[0-9]{4,8}$/.test(String(adminPin||'')))throw Object.assign(new Error('Admin name and a 4–8 digit Admin PIN are required'),{status:400});
 const[[exists]]=await masterPool.query('SELECT id FROM companies WHERE company_name=? OR database_name=?',[companyName,databaseName]);
 if(exists)throw Object.assign(new Error('This company or database is already registered'),{status:409});
 const[[dbExists]]=await adminPool.query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?',[databaseName]);
 if(dbExists)throw Object.assign(new Error(`Database ${databaseName} already exists`),{status:409});
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
 try{const db=mysql.createPool({...rootConfig,database:company.databaseName,connectionLimit:1});const[[users],[orders],[revenue],[stock]]=await Promise.all([db.query('SELECT COUNT(*) count FROM users WHERE active=TRUE'),db.query("SELECT COUNT(*) count FROM orders WHERE status<>'completed'"),db.query("SELECT COALESCE(SUM(total),0) total FROM orders WHERE payment_status='paid'"),db.query('SELECT COUNT(*) count FROM inventory WHERE quantity<=min_quantity')]);await db.end();return{...company,staffCount:users[0].count,activeOrders:orders[0].count,revenue:Number(revenue[0].total),lowStock:stock[0].count,online:true}}catch{return{...company,staffCount:0,activeOrders:0,revenue:0,lowStock:0,online:false}}
}

app.get('/api/health',asyncRoute(async(_req,res)=>{await masterPool.query('SELECT 1');res.json({ok:true,service:'knockout-master-api',database:masterDb})}));
app.get('/api/public/companies',asyncRoute(async(_req,res)=>{const[rows]=await masterPool.query("SELECT id,company_name companyName,database_name databaseName FROM companies WHERE status='active' ORDER BY id");res.json(rows)}));
app.post('/api/login',asyncRoute(async(req,res)=>{const[[user]]=await masterPool.query('SELECT id,name FROM master_users WHERE pin=? AND active=TRUE',[req.body.pin]);if(!user)return res.status(401).json({message:'Invalid KnockOUT Master PIN'});res.json({...user,role:'superadmin'})}));
app.get('/api/state',asyncRoute(async(_req,res)=>{const[companies]=await masterPool.query('SELECT id,company_name companyName,database_name databaseName,admin_name adminName,email,phone,status,created_at createdAt FROM companies ORDER BY id');res.json({companies:await Promise.all(companies.map(companySummary)),masterName:'KnockOUT Master'})}));
app.post('/api/companies',asyncRoute(async(req,res)=>res.status(201).json(await provisionCompany(req.body))));
app.patch('/api/companies/:id/status',asyncRoute(async(req,res)=>{if(!['active','suspended'].includes(req.body.status))return res.status(400).json({message:'Invalid company status'});await masterPool.query('UPDATE companies SET status=? WHERE id=?',[req.body.status,req.params.id]);res.json({ok:true})}));
app.use((error,_req,res,_next)=>{console.error(error);res.status(error.status||500).json({message:error.message||'Master server error'})});

async function start(){for(let attempt=1;attempt<=30;attempt++){try{await initialize();app.listen(port,()=>console.log(`KnockOUT Master API on http://localhost:${port}`));return}catch(error){console.log(`Waiting for master database (${attempt}/30): ${error.message}`);await new Promise(resolve=>setTimeout(resolve,3000))}}process.exit(1)}
start();
