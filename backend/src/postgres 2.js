import pg from 'pg';

// Preserve the existing JSON contract for dates, bigint IDs and counts.
pg.types.setTypeParser(20, value => {
  const number=Number(value);
  if(!Number.isSafeInteger(number))throw new RangeError('Database integer exceeds the API safe-integer range');
  return number;
});
pg.types.setTypeParser(1082, value => value);

export function quoteIdentifier(value) {
  if(!/^[a-z][a-z0-9_]{0,62}$/.test(String(value)))throw new Error('Invalid PostgreSQL identifier');
  return `"${value}"`;
}

// Bind-marker compatibility only. SQL statements in the application are native
// PostgreSQL; literals, quoted identifiers, comments and function bodies are left intact.
export function bindParameters(sql) {
  let output='',index=0,i=0;
  while(i<sql.length){
    const c=sql[i];
    if(c==='\''||c==='"'){
      const quote=c;output+=c;i++;
      while(i<sql.length){output+=sql[i];if(sql[i]===quote){i++;if(sql[i]===quote){output+=sql[i++];continue}break}i++}
    }else if(sql.startsWith('--',i)){
      const end=sql.indexOf('\n',i);if(end<0){output+=sql.slice(i);break}output+=sql.slice(i,end+1);i=end+1;
    }else if(sql.startsWith('/*',i)){
      let depth=1;output+='/*';i+=2;while(i<sql.length&&depth){if(sql.startsWith('/*',i)){depth++;output+='/*';i+=2}else if(sql.startsWith('*/',i)){depth--;output+='*/';i+=2}else output+=sql[i++]}
    }else if(c==='$' && /^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/.test(sql.slice(i))){
      const tag=sql.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/)[0],end=sql.indexOf(tag,i+tag.length);
      if(end<0)throw new Error('Unterminated PostgreSQL function body');
      output+=sql.slice(i,end+tag.length);i=end+tag.length;
    }else if(c==='?'){output+=`$${++index}`;i++}
    else {output+=c;i++}
  }
  return output;
}

export function createPool(config={}) {
  const schema=config.database||'public';quoteIdentifier(schema);
  const timezone=process.env.DB_TIMEZONE||'Asia/Kolkata';
  if(!/^[A-Za-z0-9_+\-/]+$/.test(timezone))throw new Error('Invalid DB_TIMEZONE');
  const native=new pg.Pool({
    host:config.host||process.env.DB_HOST||'127.0.0.1',
    port:Number(config.port||process.env.DB_PORT||5432),
    user:config.user||process.env.DB_USER||'knockout',
    password:config.password??process.env.DB_PASSWORD,
    database:process.env.PGDATABASE||'knockout',
    max:config.connectionLimit||Number(process.env.DB_POOL_SIZE||20),
    idleTimeoutMillis:config.idleTimeout||Number(process.env.DB_POOL_IDLE_TIMEOUT_MS||60000),
    connectionTimeoutMillis:config.connectTimeout||Number(process.env.DB_CONNECT_TIMEOUT_MS||10000),
    keepAlive:true,
    options:`-c search_path=${schema},pg_catalog -c timezone=${timezone}`,
    ssl:process.env.PGSSL==='true'?{rejectUnauthorized:true}:undefined,
  });
  native.on('error',error=>console.error('Idle PostgreSQL connection error:',error.message));
  async function query(client,sql,values=[]) {
    let text=bindParameters(sql);
    // Existing service handlers consume [rows] or [{insertId,affectedRows}].
    // RETURNING is explicit here; never infer the ID using MAX(id).
    if(/^\s*INSERT\s+INTO\b/i.test(text)&&! /\bRETURNING\b/i.test(text)){
      const table=text.match(/^\s*INSERT\s+INTO\s+([\w".]+)/i)?.[1].split('.').pop().replaceAll('"','');
      if(table!=='module_pricing')text+=' RETURNING id';
    }
    const result=await client.query(text,values);
    if(Array.isArray(result))return [result];
    if(result.command==='SELECT'||result.command==='SHOW')return [result.rows];
    return [{insertId:result.rows[0]?.id,affectedRows:result.rowCount??0,rows:result.rows}];
  }
  return {
    query:(sql,values)=>query(native,sql,values),
    async getConnection(){
      const client=await native.connect();let released=false;
      return {query:(sql,values)=>query(client,sql,values),beginTransaction:()=>client.query('BEGIN'),commit:()=>client.query('COMMIT'),rollback:()=>client.query('ROLLBACK'),release:()=>{if(!released){released=true;client.release()}}};
    },
    end:()=>native.end(),
  };
}
