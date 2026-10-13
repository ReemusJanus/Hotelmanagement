import { useEffect, useRef, useState } from 'react';
import RestaurantPlan from './RestaurantPlan';

export default function RestaurantScene({ controller, progress, active = 0, hero = false, reduced = false }) {
  const wrapper = useRef(null), canvas = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    let engine, disposed = false, loading = false, failed = false;
    let near = false, visible = false;
    const media = matchMedia('(min-width: 1024px)');
    const capable = () => media.matches && !reduced && !navigator.connection?.saveData && (navigator.deviceMemory || 8) >= 4 && (navigator.hardwareConcurrency || 4) >= 4;
    const stop = () => { engine?.dispose(); engine = undefined; if(controller)controller.current=null;setReady(false); };
    const start = async () => {
      if (!near || !capable() || engine || loading || failed || disposed) return;
      loading = true;
      try {
        const { createRestaurant } = await import('./restaurant-engine');
        if(disposed || !capable())return;
        engine=createRestaurant(canvas.current,{hero,onFailure:()=>{failed=true;stop();}});
        if(controller)controller.current=engine;
        engine.seek(progress?.current || 0);engine.setVisible(visible);setReady(true);
      } catch { failed=true;stop(); } finally { loading=false; }
    };
    const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;engine?.setVisible(visible);},{threshold:0});
    const proximity=new IntersectionObserver(([entry])=>{near=entry.isIntersecting;if(near)start();},{rootMargin:'200px'});
    visibility.observe(wrapper.current);proximity.observe(wrapper.current);
    const resized=()=>{if(!capable())stop();else start();};media.addEventListener('change',resized);
    const heroScroll=()=>{if(hero&&engine){const rect=wrapper.current.getBoundingClientRect();engine.seek(Math.max(0,Math.min(1,-rect.top/innerHeight)));}};
    if(hero)addEventListener('scroll',heroScroll,{passive:true});
    return()=>{disposed=true;visibility.disconnect();proximity.disconnect();media.removeEventListener('change',resized);removeEventListener('scroll',heroScroll);engine?.dispose();if(controller)controller.current=null;};
  }, [controller, progress, hero, reduced]);
  return <div ref={wrapper} className={`lux-restaurant ${hero?'lux-restaurant-hero':''}`} data-renderer={ready?'webgl':'plan'}>
    <div className="lux-model-fallback" hidden={ready}><RestaurantPlan active={active}/></div>
    <canvas ref={canvas} className="lux-model-canvas" aria-hidden="true" style={{visibility:ready?'visible':'hidden'}}/>
    <span className="lux-model-caption">{ready?'ARCHITECTURAL SERVICE STUDY':'YOUR CONNECTED RESTAURANT'}<i/> ILLUSTRATIVE VIEW</span>
  </div>;
}
