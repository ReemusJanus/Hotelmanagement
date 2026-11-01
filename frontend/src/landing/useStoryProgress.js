import { useEffect, useRef, useState } from 'react';

// One scroll listener schedules at most one measurement per frame. React only
// updates at chapter boundaries; the renderer receives fractional progress.
export function useStoryProgress(root, scene, reduced) {
  const [active, setActive] = useState(0);
  const progress = useRef(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const articles = [...root.current.querySelectorAll('[data-lux-chapter]')];
      const anchor = innerHeight * .48;
      let value = 0;
      for (let i = 0; i < articles.length; i++) {
        const rect = articles[i].getBoundingClientRect();
        if (rect.top <= anchor) value = Math.min(articles.length - .001, i + Math.max(0, Math.min(.999, (anchor - rect.top) / rect.height)));
      }
      progress.current = value;
      const phase = Math.min(3, Math.floor((value % 1) * 4));
      root.current.dataset.phase = String(phase);
      root.current.style.setProperty('--lux-phase', String(value % 1));
      setActive(Math.min(articles.length - 1, Math.floor(value)));
      scene.current?.seek(reduced ? Math.floor(value) : value);
      root.current.style.setProperty('--lux-progress', String(Math.min(1, value / articles.length)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    update();
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); };
  }, [root, scene, reduced]);
  return { active, progress };
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}
