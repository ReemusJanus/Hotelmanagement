import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import './landing-motion.css';

const depthTargets = '.story-hero-stage,.story-sticky-preview,.workspace-role-scene,.workspace-finance-scene,.workspace-phone-scene,.story-feature-grid article,.workspace-module-grid article,.story-network-art';
const revealTargets = '.story-intro,.workspace-heading,.story-section-heading,.story-chapter>h2,.story-chapter>p,.story-feature-grid article,.workspace-module-grid article,.workspace-business-copy,.workspace-mobile>div:first-child,.story-network>div:last-child,.workspace-start li,.story-finale>h2';

export default function LandingMotion({ root }) {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => setReduced(query.matches);
    query.addEventListener('change', changed);
    changed();
    return () => query.removeEventListener('change', changed);
  }, []);
  const [paused, setPaused] = useState(false);
  const enabled = !paused && !reduced;
  useEffect(() => {
    const site = root.current;
    if (!site) return;
    site.dataset.motion = enabled ? 'on' : 'off';
    if (!enabled) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const animations = new Set();
    const seen = new WeakSet();
    const observed = new Set();
    let pointerFrame = 0, scrollFrame = 0, activeCard = null, point = null;
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(({target,isIntersecting}) => {
        if (!isIntersecting) return;
        reveal.unobserve(target);
        observed.delete(target);
        if (seen.has(target)) return;
        seen.add(target);
        const animation = target.animate([
          { opacity: .15, translate: '0 30px', filter: 'blur(3px)' },
          { opacity: 1, translate: '0 0', filter: 'blur(0px)' },
        ], { duration: 720, easing: 'cubic-bezier(.16,1,.3,1)', delay: Number(target.dataset.entranceDelay || 0) });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: .12 });
    const ambience = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
      target.classList.toggle('motion-in-view',isIntersecting);
    }), { rootMargin: '100px' });
    const sections = [...site.querySelectorAll('section')];
    sections.forEach(section => ambience.observe(section));
    const scan = () => {
      for (const target of observed) if (!target.isConnected) { reveal.unobserve(target); observed.delete(target); }
      site.querySelectorAll(revealTargets).forEach((target,index) => {
        if (seen.has(target) || observed.has(target)) return;
        target.dataset.entranceDelay = String(Math.min(index % 3 * 65,130));
        observed.add(target); reveal.observe(target);
      });
    };
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(site,{childList:true,subtree:true});
    const resetCard = () => {
      if (!activeCard) return;
      activeCard.style.removeProperty('--depth-x'); activeCard.style.removeProperty('--depth-y');
      activeCard.style.removeProperty('--glow-x'); activeCard.style.removeProperty('--glow-y');
      activeCard.classList.remove('motion-pointed'); activeCard = null;
    };
    const move = event => {
      if (!fine.matches || event.pointerType === 'touch') return;
      const card = event.target.closest(depthTargets);
      if (activeCard !== card) { resetCard(); activeCard = card; }
      if (!card) return;
      point = {x:event.clientX,y:event.clientY};
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        if (!activeCard || !point) return;
        const box = activeCard.getBoundingClientRect();
        if (!box.width || !box.height) return;
        const x = Math.max(0,Math.min(1,(point.x-box.left)/box.width));
        const y = Math.max(0,Math.min(1,(point.y-box.top)/box.height));
        activeCard.style.setProperty('--depth-x',`${(y-.5)*-7}deg`);
        activeCard.style.setProperty('--depth-y',`${(x-.5)*10}deg`);
        activeCard.style.setProperty('--glow-x',`${x*100}%`);
        activeCard.style.setProperty('--glow-y',`${y*100}%`);
        activeCard.classList.add('motion-pointed');
      });
    };
    const scroll = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame=0;
        const height=document.documentElement.scrollHeight-innerHeight;
        site.style.setProperty('--reading-progress',height>0?Math.min(1,scrollY/height):0);
        site.style.setProperty('--hero-drift',`${Math.min(scrollY,innerHeight)*.045}px`);
      });
    };
    site.addEventListener('pointermove',move,{passive:true});
    site.addEventListener('pointerleave',resetCard);
    window.addEventListener('blur',resetCard);
    window.addEventListener('scroll',scroll,{passive:true});
    window.addEventListener('resize',scroll);
    scroll();
    return () => {
      reveal.disconnect(); ambience.disconnect(); mutations.disconnect();
      animations.forEach(animation=>animation.cancel());
      cancelAnimationFrame(pointerFrame);cancelAnimationFrame(scrollFrame);resetCard();
      site.removeEventListener('pointermove',move);site.removeEventListener('pointerleave',resetCard);
      window.removeEventListener('blur',resetCard);window.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll);
      sections.forEach(section=>section.classList.remove('motion-in-view'));
      site.style.removeProperty('--hero-drift');site.style.removeProperty('--reading-progress');
      delete site.dataset.motion;
    };
  },[enabled,root]);
  return <>
    <div className="story-reading-progress" aria-hidden="true"/>
    <button className="story-motion-control" type="button" onClick={()=>setPaused(value=>!value)} disabled={Boolean(reduced)} aria-pressed={!enabled} aria-label={reduced?'Reduced motion enabled':paused?'Resume decorative motion':'Pause decorative motion'}>
      {enabled?<Pause size={13}/>:<Play size={13}/>}<span>{reduced?'Reduced motion':paused?'Motion paused':'Pause motion'}</span>
    </button>
  </>;
}
