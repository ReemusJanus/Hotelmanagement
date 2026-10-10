import { useEffect } from "react";
import { animate, stagger } from "motion";

const animatedSelector = [
  ".page > *",
  ".modal-card",
  ".web-otp-card",
  ".public-registration-card",
  ".company-card",
  ".food-card",
  ".table-card",
  ".ticket",
  ".overview-metric",
  ".chef-stock-grid > article",
  ".registration-request-list > article",
  ".shell > main > header",
  ".shell > aside .brand",
  ".shell > aside nav > button",
  ".shell > aside .side-user",
  ".master-shell > aside nav > button",
].join(",");

function reveal(elements) {
  const fresh = [...new Set(elements)].filter(
    (element) =>
      element instanceof HTMLElement &&
      !element.dataset.koMotion &&
      !element.closest(".receipt, .receipt-print-animation"),
  );
  if (!fresh.length) return;
  fresh.forEach((element) => {
    element.dataset.koMotion = "true";
  });
  animate(
    fresh,
    {
      opacity: [0, 1],
      translate: ["0 12px", "0 0"],
    },
    { duration: 0.42, delay: (index) => Math.min(index * 0.025, 0.2), ease: [0.22, 1, 0.36, 1] },
  );
}

export default function AnimatedUI() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animateDetails = (root) => {
      const scope = root.querySelectorAll ? root : document;
      const barSelector=".chart span, .monthly-bars i, .stock-meter i",modalSelector=".modal-wrap";
      const bars = [...(root instanceof Element&&root.matches(barSelector)?[root]:[]),...scope.querySelectorAll(barSelector)].filter((bar) => !bar.dataset.koBarMotion);
      bars.forEach((bar) => { bar.dataset.koBarMotion = "true"; bar.style.transformOrigin = "center bottom"; });
      if (bars.length) animate(bars,{opacity:[0,1],transform:["scaleY(.04)","scaleY(1)"]},{duration:.7,delay:stagger(.055),ease:[.22,1,.36,1]});
      const wraps = [...(root instanceof Element&&root.matches(modalSelector)?[root]:[]),...scope.querySelectorAll(modalSelector)].filter((item)=>!item.dataset.koModalMotion);
      wraps.forEach((item)=>item.dataset.koModalMotion="true");
      if(wraps.length) animate(wraps,{opacity:[0,1],backdropFilter:["blur(0px)","blur(10px)"]},{duration:.22});
      const modals = wraps.map((wrap)=>wrap.querySelector(".modal")).filter(Boolean);
      if(modals.length) animate(modals,{opacity:[0,1],transform:["translateY(28px) scale(.94)","translateY(0) scale(1)"]},{duration:.48,ease:[.16,1,.3,1]});
    };

    const scan = (root) => {
      const elements = [];
      if (root instanceof Element && root.matches(animatedSelector)) elements.push(root);
      if (root.querySelectorAll) elements.push(...root.querySelectorAll(animatedSelector));
      reveal(elements);
      animateDetails(root);
    };

    scan(document);
    const observer = new MutationObserver((mutations) => {
      const roots = mutations.flatMap((mutation) => [...mutation.addedNodes]);
      requestAnimationFrame(() => roots.forEach(scan));
    });
    observer.observe(document.getElementById("root"), { childList: true, subtree: true });
    const appRoot=document.getElementById("root"),interactive="button:not(:disabled), .side-profile, .company-card, .food-card, .table-card";
    const press=(event)=>{const target=event.target.closest?.(interactive);if(target&&!target.closest(".receipt"))animate(target,{scale:.975},{duration:.11,ease:"easeOut"})};
    const release=(event)=>{const target=event.target.closest?.(interactive);if(target)animate(target,{scale:1},{duration:.32,type:"spring",bounce:.35})};
    const iconIn=(event)=>{const target=event.target.closest?.("button");if(!target||target.contains(event.relatedTarget))return;const icon=target.querySelector(":scope > svg");if(icon)animate(icon,{scale:1.16,rotate:3},{duration:.22})};
    const iconOut=(event)=>{const target=event.target.closest?.("button");if(!target||target.contains(event.relatedTarget))return;const icon=target.querySelector(":scope > svg");if(icon)animate(icon,{scale:1,rotate:0},{duration:.28})};
    const depthSelector=".stat,.overview-metric,.company-card,.food-card,.table-card,.ticket,.parcel-card,.chef-stock-grid > article,.landing-feature-grid article,.landing-visit-details > span,.landing-visit-details > a";
    let depthFrame = 0;
    let pendingPointer = null;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const spotlight = (event) => {
      if (!finePointer.matches || reducedMotion.matches || event.pointerType === "touch") return;
      const card = event.target.closest?.(depthSelector);
      if (!card) return;
      pendingPointer = { card, x: event.clientX, y: event.clientY };
      if (depthFrame) return;
      depthFrame = requestAnimationFrame(() => {
        depthFrame = 0;
        if (!pendingPointer) return;
        const { card, x, y } = pendingPointer;
        pendingPointer = null;
        if (!card.isConnected) return;
        const box = card.getBoundingClientRect();
        if (!box.width || !box.height) return;
        card.style.setProperty("--motion-x", `${x - box.left}px`);
        card.style.setProperty("--motion-y", `${y - box.top}px`);
        card.style.setProperty("--tilt-x", `${(0.5 - (y - box.top) / box.height) * 3}deg`);
        card.style.setProperty("--tilt-y", `${((x - box.left) / box.width - 0.5) * 4}deg`);
      });
    };
    const resetDepth=(event)=>{const card=event.target.closest?.(depthSelector);if(!card||card.contains(event.relatedTarget))return;if(pendingPointer?.card===card)pendingPointer=null;card.style.setProperty("--tilt-x","0deg");card.style.setProperty("--tilt-y","0deg")};
    appRoot.addEventListener("pointerdown",press);appRoot.addEventListener("pointerup",release);appRoot.addEventListener("pointercancel",release);appRoot.addEventListener("pointerover",iconIn);appRoot.addEventListener("pointerout",iconOut);appRoot.addEventListener("pointerout",resetDepth);appRoot.addEventListener("pointermove",spotlight);
    return () => {cancelAnimationFrame(depthFrame);observer.disconnect();appRoot.removeEventListener("pointerdown",press);appRoot.removeEventListener("pointerup",release);appRoot.removeEventListener("pointercancel",release);appRoot.removeEventListener("pointerover",iconIn);appRoot.removeEventListener("pointerout",iconOut);appRoot.removeEventListener("pointerout",resetDepth);appRoot.removeEventListener("pointermove",spotlight)};
  }, []);

  return null;
}
