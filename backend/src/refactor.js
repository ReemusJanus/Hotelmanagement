import fs from "fs";
import path from "path";

const serverFile = path.resolve("backend/src/server/server.js");
let content = fs.readFileSync(serverFile, "utf8");
const lines = content.split("\n");

const controllersDir = path.resolve("backend/src/controllers");
const routesDir = path.resolve("backend/src/routes");
const middlewareDir = path.resolve("backend/src/middleware");

[controllersDir, routesDir, middlewareDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

fs.writeFileSync(
  path.join(middlewareDir, "asyncRoute.js"),
  "export const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);\n",
);

let entities = {};

const routeRegex =
  /^app\.(get|post|put|patch|delete)\('(\/api\/([^/']+)[^']*)',\s*(upload\.single\('[^']+'\),\s*)?(asyncRoute\(async\([^)]+\)=>(?:\{.*\}|.*)\))\);$/;

const remainingLines = [];

for (let line of lines) {
  const match = line.match(routeRegex);
  if (match) {
    const method = match[1];
    const fullPath = match[2];
    const prefix = match[3];
    const middleware = match[4] || "";
    const handler = match[5];

    let entityName = prefix;
    if (!entities[entityName]) {
      entities[entityName] = { routes: [], controllers: [] };
    }

    let routePath = fullPath.replace("/api/" + prefix, "");
    if (routePath === "") routePath = "/";

    const cleanPrefix =
      prefix.charAt(0).toUpperCase() +
      prefix.slice(1).replace(/[^a-zA-Z0-9]/g, "");
    const cleanRoutePath =
      routePath === "/" ? "" : routePath.replace(/[^a-zA-Z0-9]/g, "");
    const functionName = method + cleanPrefix + cleanRoutePath;

    entities[entityName].controllers.push(
      "export const " + functionName + " = " + handler + ";",
    );

    const sq = String.fromCharCode(39);
    let routeLine = "router." + method + "(" + sq + routePath + sq + ", ";
    if (middleware) routeLine += middleware;
    routeLine += functionName + ");";

    entities[entityName].routes.push(routeLine);
  } else {
    if (line.includes("const asyncRoute = fn =>")) {
      continue;
    }
    remainingLines.push(line);
  }
}

let appUseLines = [];
let serverImports = [];

for (const [entity, data] of Object.entries(entities)) {
  const controllerFile = path.join(controllersDir, entity + "Controller.js");
  const routeFile = path.join(routesDir, entity + "Routes.js");

  const controllerCode =
    "import {pool, migrate, getState, runWithTenant} from '../database/database.js';\nimport {minio, bucket, initializeStorage, publicUrl} from '../database/storage.js';\nimport { asyncRoute } from '../middleware/asyncRoute.js';\n\n" +
    "async function billFor(orderId, conn=pool) {\n  const [[settings]] = await conn.query('SELECT tax_rate taxRate,service_charge serviceCharge FROM settings WHERE id=1');\n  const [items] = await conn.query('SELECT oi.menu_id menuId,oi.quantity qty,oi.note,oi.price,m.name,m.icon,m.image_url imageUrl FROM order_items oi JOIN menu_items m ON m.id=oi.menu_id WHERE oi.order_id=?',[orderId]);\n  const subtotal=items.reduce((s,i)=>s+Number(i.price)*i.qty,0),tax=subtotal*Number(settings.taxRate)/100,service=subtotal*Number(settings.serviceCharge)/100;\n  return {items:items.map(i=>({...i,price:Number(i.price)})),subtotal,tax,service,total:subtotal+tax+service};\n}\n\n" +
    "const portalRole = process.env.PORTAL_ROLE || 'admin';\n\n" +
    "async function verifyPortalStaff(userId){const[[staff]]=await pool.query('SELECT id,name,role FROM users WHERE id=? AND active=1',[userId]);if(!staff)return null;if(portalRole!=='admin'&&staff.role!==portalRole)return null;return staff}\n\n" +
    data.controllers.join("\n\n");
  fs.writeFileSync(controllerFile, controllerCode);

  const functionNames = data.controllers.map(
    (c) => c.match(/export const (\w+)/)[1],
  );
  let joinedRoutes = data.routes.join("\n");
  for (let fn of functionNames) {
    joinedRoutes = joinedRoutes.replace(
      new RegExp(fn + "\\)", "g"),
      "controller." + fn + ")",
    );
  }

  const routeCode =
    "import express from 'express';\nimport * as controller from '../controllers/" +
    entity +
    "Controller.js';\nimport multer from 'multer';\nconst upload = multer({storage: multer.memoryStorage(), limits:{fileSize:5*1024*1024}, fileFilter:(_req,file,cb)=>cb(null,file.mimetype.startsWith('image/'))});\n\nconst router = express.Router();\n\n" +
    joinedRoutes +
    "\n\nexport default router;";
  fs.writeFileSync(routeFile, routeCode);

  appUseLines.push("app.use('/api/" + entity + "', " + entity + "Routes);");
  serverImports.push(
    "import " + entity + "Routes from '../routes/" + entity + "Routes.js';",
  );
}

let newServerContent = remainingLines.join("\n");
newServerContent = newServerContent.replace(
  /import express from 'express';/,
  "import express from 'express';\n" + serverImports.join("\n"),
);

newServerContent = newServerContent.replace(
  /app\.use\(\(error,_req,res,_next\)=>/,
  appUseLines.join("\n") + "\n\napp.use((error,_req,res,_next)=>",
);

fs.writeFileSync(serverFile, newServerContent);
console.log("Refactoring complete!");
