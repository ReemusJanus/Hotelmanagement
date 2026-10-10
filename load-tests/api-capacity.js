import http from 'k6/http';
import ws from 'k6/ws';
import {check,sleep} from 'k6';
import {Rate} from 'k6/metrics';

const base=__ENV.BASE_URL||'http://localhost:5100';
const hotelId=__ENV.HOTEL_ID||'1234';
const pin=__ENV.USER_PIN;
const failures=new Rate('application_failures');

export const options={
 scenarios:{
  active_users:{executor:'ramping-vus',startVUs:0,stages:[{duration:'2m',target:500},{duration:'5m',target:500},{duration:'1m',target:0}],gracefulRampDown:'30s'},
  realtime_users:{executor:'constant-vus',vus:100,duration:'7m',exec:'realtime'}
 },
 thresholds:{http_req_failed:['rate<0.01'],http_req_duration:['p(95)<500','p(99)<1200'],application_failures:['rate<0.01']}
};

function login(){
 if(!pin)throw new Error('Set USER_PIN to a non-production load-test account');
 const response=http.post(`${base}/api/public/resolve-login`,JSON.stringify({hotelId,pin}),{headers:{'content-type':'application/json'}});
 failures.add(!check(response,{'login succeeds':r=>r.status===200}));
 return response.json();
}

export default function(){
 const session=login(),headers={authorization:`Bearer ${session.accessToken}`,'x-company-database':session.companyDatabase};
 const response=http.get(`${base}/api/state`,{headers});
 failures.add(!check(response,{'state succeeds':r=>r.status===200,'state is JSON':r=>String(r.headers['Content-Type']).includes('application/json')}));
 sleep(3);
}

export function realtime(){
 const session=login(),url=base.replace(/^http/,'ws')+`/ws?database=${encodeURIComponent(session.companyDatabase)}&token=${encodeURIComponent(session.accessToken)}`;
 ws.connect(url,{},socket=>{socket.on('open',()=>socket.setTimeout(()=>socket.close(),30000));socket.on('error',()=>failures.add(true))});
}
