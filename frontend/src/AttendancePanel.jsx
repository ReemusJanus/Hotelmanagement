import {useCallback,useEffect,useState} from 'react';
import {CalendarDays,CheckCircle2,Clock3,LogOut} from 'lucide-react';
import {api} from './api';

export default function AttendancePanel({user,toast}) {
  const [record,setRecord]=useState(null),[now,setNow]=useState(Date.now()),[busy,setBusy]=useState(false);
  const load=useCallback(()=>api(`/attendance/${user.id}`).then(setRecord).catch(e=>toast(e.message)),[user.id]);
  useEffect(()=>{load();const clock=setInterval(()=>setNow(Date.now()),1000),protocol=location.protocol==='https:'?'wss:':'ws:';let socket,retry,stopped=false;const connect=()=>{socket=new WebSocket(`${protocol}//${location.host}/ws?database=${encodeURIComponent(user.companyDatabase||localStorage.getItem('knockout-company-db')||'knockout')}`);socket.onmessage=event=>{try{if(JSON.parse(event.data).type==='state.changed')load()}catch{}};socket.onclose=()=>{if(!stopped)retry=setTimeout(connect,2500)}};connect();const fallback=setInterval(load,60000);return()=>{stopped=true;clearInterval(clock);clearInterval(fallback);clearTimeout(retry);socket?.close()}},[load,user.companyDatabase]);
  if(!record)return <div className="loading"><span className="logo">K</span><p>Loading attendance…</p></div>;
  const active=record.activeShift;
  const duration=s=>{const ms=new Date(s.checkOut||now)-new Date(s.checkIn),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),sec=Math.floor(ms%60000/1000);return `${h}h ${m}m ${sec}s`};
  async function toggle(){setBusy(true);try{await api(`/attendance/${user.id}/${active?'check-out':'check-in'}`,{method:'POST',body:'{}'});await load();toast(`You are checked ${active?'out':'in'}`)}catch(e){toast(e.message)}finally{setBusy(false)}}
  const today=record.shifts.filter(s=>new Date(s.checkIn).toDateString()===new Date().toDateString());
  const todayMs=today.reduce((sum,s)=>sum+(new Date(s.checkOut||now)-new Date(s.checkIn)),0);
  return <>
    <div className="page-head"><div><span className="eyebrow">{user.role.toUpperCase()} ATTENDANCE</span><h1>Hello, {user.name.split(' ')[0]}</h1><p>Check yourself in when your shift starts and out when you finish.</p></div></div>
    <div className={`attendance-hero ${active?'working':''}`}>
      <div className="attendance-clock"><Clock3/><span>{new Date(now).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span><small>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</small></div>
      <div className="attendance-state">{active?<><span className="pulse"><i/></span><small>CURRENTLY WORKING</small><h2>{duration(active)}</h2><p>Checked in at {new Date(active.checkIn).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p></>:<><span className="off-duty-icon"><LogOut/></span><small>NOT CHECKED IN</small><h2>Ready to start?</h2><p>Your working time begins when you check in.</p></>}<button className={active?'checkout-main':'primary'} disabled={busy} onClick={toggle}>{busy?'Please wait…':active?<><LogOut/> Check out now</>:<><CheckCircle2/> Check in now</>}</button></div>
    </div>
    <div className="employee-stats"><div><Clock3/><span><small>WORKED TODAY</small><b>{(todayMs/3600000).toFixed(1)}h</b></span></div><div><CalendarDays/><span><small>TOTAL SHIFTS</small><b>{record.shifts.length}</b></span></div><div><CheckCircle2/><span><small>CURRENT STATUS</small><b>{active?'On duty':'Off duty'}</b></span></div></div>
    <section className="panel"><div className="panel-head"><div><h2>My recent working times</h2><p>Your check-in and check-out history</p></div></div><div className="table-scroll"><table><thead><tr><th>Date</th><th>Check in</th><th>Check out</th><th>Working time</th><th>Status</th></tr></thead><tbody>{record.shifts.map(s=><tr key={s.id}><td>{new Date(s.checkIn).toLocaleDateString('en-IN')}</td><td><b>{new Date(s.checkIn).toLocaleTimeString('en-IN')}</b></td><td>{s.checkOut?new Date(s.checkOut).toLocaleTimeString('en-IN'):'—'}</td><td><b>{duration(s)}</b></td><td><span className={`status ${s.checkOut?'completed':'on-duty'}`}>{s.checkOut?'Completed':'On duty'}</span></td></tr>)}</tbody></table></div></section>
  </>;
}
