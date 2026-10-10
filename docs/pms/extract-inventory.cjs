const fs=require('fs'),path=require('path');
const root=process.argv[2]||path.resolve(__dirname,'../..');
const parser=require(path.join(root,'mobile/node_modules/@babel/parser'));
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const [k,v] of Object.entries(n))if(!['loc','start','end','extra','tokens','comments'].includes(k)){if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn)}}
function member(n){if(n?.type==='Identifier')return n.name;if(n?.type==='MemberExpression'||n?.type==='OptionalMemberExpression')return member(n.object)+'.'+(n.property.name||n.property.value);return ''}
function shape(n){if(!n)return '';if(n.type==='ObjectExpression')return '{'+n.properties.map(p=>p.type==='SpreadElement'?'spread '+shape(p.argument):(p.key.name||p.key.value)+': '+shape(p.value)).join(', ')+'}';if(n.type==='ArrayExpression')return '['+n.elements.map(shape).join(', ')+']';if(['StringLiteral','NumericLiteral','BooleanLiteral'].includes(n.type))return JSON.stringify(n.value);if(n.type==='NullLiteral')return 'null';if(n.type==='Identifier')return '<'+n.name+'>';return '<computed>'}
const routes=[];
for(const file of ['backend/src/server.js','backend/src/master-server.js']){
 const source=fs.readFileSync(path.join(root,file),'utf8'),ast=parser.parse(source,{sourceType:'module'});
 walk(ast,n=>{if(n.type!=='CallExpression'||n.callee?.object?.name!=='app'||!['get','post','put','patch','delete'].includes(n.callee?.property?.name)||n.arguments[0]?.type!=='StringLiteral')return;
 const r={service:file.includes('master-')?'master':'role',method:n.callee.property.name.toUpperCase(),path:n.arguments[0].value,file,line:n.loc.start.line,body:[],query:[],params:[],responses:[],errors:[],statuses:[],defaults:[]};
 walk(n,x=>{const m=member(x);for(const [prefix,key] of [['req.body.','body'],['req.query.','query'],['req.params.','params']])if(m.startsWith(prefix))r[key].push(m.slice(prefix.length));
 if(x.type==='VariableDeclarator'&&member(x.init)==='req.body'&&x.id.type==='ObjectPattern')for(const p of x.id.properties){r.body.push(p.key?.name);if(p.value?.type==='AssignmentPattern')r.defaults.push(p.key.name+'='+shape(p.value.right))}
 if(x.type==='CallExpression'&&x.callee?.property?.name==='json')r.responses.push(shape(x.arguments[0]));
 if(x.type==='CallExpression'&&x.callee?.property?.name==='status'&&x.arguments[0]?.value)r.statuses.push(x.arguments[0].value);
 if(x.type==='ObjectProperty'&&x.key?.name==='message'&&x.value.type==='StringLiteral')r.errors.push(x.value.value);
 if(x.type==='NewExpression'&&x.callee.name==='Error'&&x.arguments[0]?.type==='StringLiteral')r.errors.push(x.arguments[0].value);
 });for(const k of ['body','query','params','responses','errors','statuses','defaults'])r[k]=[...new Set(r[k].filter(x=>x!==undefined))];
 if(r.path==='/api/companies'&&r.method==='POST')r.body=['companyName','adminName','email','phone','selectedModules'];routes.push(r);
 });
}
fs.writeFileSync(path.join(__dirname,'api-inventory.json'),JSON.stringify(routes,null,2)+'\n');console.log('Extracted',routes.length,'route handlers');
