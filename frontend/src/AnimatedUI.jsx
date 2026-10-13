import { useEffect } from 'react';

// Event-driven motion: no React updates or persistent animation loop.
export default function AnimatedUI() {
 useEffect(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),pointer=matchMedia('(hover:hover) and (pointer:fine)');
  const seen=new WeakSet(),animations=new Set();
  const selector='.page-head,.modal,.drawer,.authenticated-onboarding .public-registration-card';
  const root=document.getElementById('root');
  const authenticated=()=>Boolean(root.querySelector('.shell,.master-shell,.authenticated-onboarding'));
  const scan=node=>{
   if(reduced.matches||!authenticated())return;
   const nodes=node instanceof Element&&node.matches(selector)?[node]:[];
   if(node.querySelectorAll)nodes.push(...node.querySelectorAll(selector));
   nodes.forEach(el=>{
    if(seen.has(el)||el.closest('.receipt,.receipt-print-animation'))return;
    seen.add(el);
    const modal=el.matches('.modal'),drawer=el.matches('.drawer');
    const animation=el.animate([{opacity:0,transform:modal?'scale(.98)':drawer?'translateX(12px)':'translateY(8px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});
    animations.add(animation);animation.onfinish=animation.oncancel=()=>animations.delete(animation);
   });
  };
  let card=null,frame=0,position=null;
  const clear=()=>{cancelAnimationFrame(frame);frame=0;if(card){['--glass-tilt-x','--glass-tilt-y','--glass-light-x','--glass-light-y'].forEach(k=>card.style.removeProperty(k));card=null;}};
  const move=e=>{
   if(reduced.matches||!pointer.matches)return;
   const next=e.target.closest?.('.shell .stat,.shell .overview-metric,.master-shell .stat,.master-shell .overview-metric');
   if(next!==card){clear();card=next;}if(!card)return;
   position={x:e.clientX,y:e.clientY};
   if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(!card?.isConnected)return clear();const r=card.getBoundingClientRect(),x=Math.max(0,Math.min(1,(position.x-r.left)/r.width)),y=Math.max(0,Math.min(1,(position.y-r.top)/r.height));card.style.setProperty('--glass-tilt-x',`${(0.5-y)*4}deg`);card.style.setProperty('--glass-tilt-y',`${(x-.5)*4}deg`);card.style.setProperty('--glass-light-x',`${x*100}%`);card.style.setProperty('--glass-light-y',`${y*100}%`);});
  };
  const stop=()=>{clear();if(reduced.matches)animations.forEach(a=>a.finish());};
  scan(root);const observer=new MutationObserver(records=>{for(const a of animations)if(!a.effect?.target?.isConnected)a.cancel();records.forEach(r=>r.addedNodes.forEach(scan));if(card&&!card.isConnected)clear();});observer.observe(root,{childList:true,subtree:true});
  root.addEventListener('pointermove',move,{passive:true});root.addEventListener('pointerleave',clear);window.addEventListener('blur',clear);reduced.addEventListener('change',stop);pointer.addEventListener('change',stop);
  return()=>{observer.disconnect();clear();animations.forEach(a=>a.cancel());root.removeEventListener('pointermove',move);root.removeEventListener('pointerleave',clear);window.removeEventListener('blur',clear);reduced.removeEventListener('change',stop);pointer.removeEventListener('change',stop);};
 },[]);
 return null;
}
