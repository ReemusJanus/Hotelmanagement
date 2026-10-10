import { useEffect, useRef, useState } from 'react';
import { Armchair, ReceiptText, ChefHat, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import './service-theatre.css';
const scenes = [
  {name:'Welcome',icon:Armchair,title:'A table. A new beginning.',detail:'See the floor and choose an available table.',lines:['Available tables','Timed reservations','Your next service']},
  {name:'Order',icon:ReceiptText,title:'Every round, connected.',detail:'Send dishes and drinks to the right stations.',lines:['Choose the menu','Build the order','Add another round']},
  {name:'Prepare',icon:ChefHat,title:'A team moving together.',detail:'Follow preparation, collection and receipt.',lines:['Kitchen & juice','Ready for collection','Received at the table']},
  {name:'Complete',icon:CheckCircle2,title:'The finish is a fresh start.',detail:'Record payment, complete the bill and prepare the table.',lines:['Request the bill','Record payment','Table to cleaning']},
];
export default function ServiceTheatre(){
 const [turn,setTurn]=useState(0),[playing,setPlaying]=useState(false),[engaged,setEngaged]=useState(false);
 const section=useRef(null);const active=((turn%4)+4)%4;
 useEffect(()=>{
  const node=section.current,site=node.closest('.story-site');let visible=false;
  const update=()=>setPlaying(visible&&site.dataset.motion==='on'&&!document.hidden);
  const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update()},{threshold:.3});visibility.observe(node);
  const settings=new MutationObserver(update);settings.observe(site,{attributes:true,attributeFilter:['data-motion']});
  document.addEventListener('visibilitychange',update);update();
  return()=>{visibility.disconnect();settings.disconnect();document.removeEventListener('visibilitychange',update)};
 },[]);
 useEffect(()=>{if(!playing||engaged)return;const timer=setInterval(()=>setTurn(value=>value+1),5500);return()=>clearInterval(timer)},[playing,engaged]);
 return <section className="service-theatre" ref={section} aria-label="Interactive 3D service story" onPointerEnter={()=>setEngaged(true)} onPointerLeave={()=>setEngaged(false)} onFocusCapture={()=>setEngaged(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setEngaged(false)}}>
  <div className="theatre-copy"><span className="story-eyebrow">ONE SERVICE. EVERY ANGLE.</span><h2>Watch the pieces<br/><em>come together.</em></h2><p>Explore the four moments of a connected service.</p><div className="theatre-current" key={active}><span>0{active+1} / 04</span><h3>{scenes[active].title}</h3><p>{scenes[active].detail}</p></div><div className="theatre-controls"><button type="button" aria-label="Previous service scene" onClick={()=>setTurn(value=>value-1)}><ArrowLeft size={18}/></button><div>{scenes.map((scene,index)=><button type="button" key={scene.name} aria-label={`Show ${scene.name} scene`} aria-pressed={active===index} onClick={()=>setTurn(value=>value+(index-active))}><span/></button>)}</div><button type="button" aria-label="Next service scene" onClick={()=>setTurn(value=>value+1)}><ArrowRight size={18}/></button></div><small>Illustrative workflow · hover or focus to hold a scene</small></div>
  <div className="theatre-stage" aria-hidden="true"><div className="theatre-aura"/><div className="theatre-floor"/><div className="theatre-cube" style={{'--cube-turn':`${turn*-90}deg`}}>{scenes.map(({name,icon:Icon,lines},index)=><div className={`theatre-face face-${index}`} key={name}><header><img src="/knockout-logo.png" alt=""/><span>SERVICE IN MOTION</span><b>0{index+1}</b></header><div className="theatre-icon"><Icon size={46}/></div><h3>{name}</h3><div className="theatre-face-lines">{lines.map((line,i)=><span key={line}><i>0{i+1}</i>{line}<CheckCircle2 size={13}/></span>)}</div><footer>KNOCKOUT · ONE CONNECTED WORKSPACE</footer></div>)}</div><div className="theatre-pedestal"/><span className="theatre-orbit-dot"/></div>
 </section>;
}
