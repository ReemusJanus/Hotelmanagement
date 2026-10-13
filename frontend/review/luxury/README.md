> Updated: the story now has ten operational chapters including juice preparation, and the whole web application shares the gold theme. See [the current application review](../application-gold/README.md). The notes below describe the initial 3D implementation.

# KnockOUT cinematic landing page

The public landing page now presents a charcoal-and-gold, nine-chapter service story with an original procedural Three.js restaurant. Authenticated dashboards, authentication handlers, backend, PostgreSQL, business logic and deployment configuration were preserved. Local preview: http://localhost:5200. This change has not been deployed to staging.

## Design and components

The hero reads “Every Moment. One Connected Experience.” Reception, dining tables, kitchen, juice station, takeaway counter, billing and storage form one miniature restaurant. Scroll advances and reverses the camera, guest arrival, table highlight, kitchen signal, parcel handoff and analytics bars. The final chapter connects team roles. Workflow cards accompany the model with explicitly fictional sample data.

Public styles are scoped under `.lux-site` and `.lux-*`: charcoal `#18181B`, near-black `#09090B`, raised surface `#27272A`, luxury gold `#C9A227` and champagne `#D4AF37`. The public logo uses the existing geometric brand shape with gold and ivory. Operational navy/blue styles remain separate.

| File | Responsibility |
| --- | --- |
| `src/LandingStory.jsx` | Hero, navigation, chapters, module filters, roles, FAQs and existing authentication callbacks |
| `src/landing/story-data.js` | Nine chapters, modules, roles and accurate product copy |
| `src/landing/useStoryProgress.js` | RAF-batched scroll progress and reduced-motion preference |
| `src/landing/RestaurantScene.jsx` | Lazy loading, capability checks, visibility and renderer lifecycle |
| `src/landing/restaurant-engine.js` | Procedural model, lighting, camera, scroll actions and GPU cleanup |
| `src/landing/RestaurantPlan.jsx` | Original SVG fallback floor plan |
| `src/landing/StoryPanel.jsx` | Fictional workflow previews |
| `src/landing/luxury.css` | Scoped theme, responsive layouts, focus and reduced-motion styles |
| `public/knockout-gold.svg` | Public charcoal-and-gold brand mark |
| `package.json`, root `package-lock.json` | Exact dependency `three@0.186.1` |

Superseded landing components/styles were removed: LandingMotion, LandingWorkspace, ServiceTheatre and their CSS, plus landing-story.css. No other dependency was added or upgraded for this implementation. Production output in `dist/` was rebuilt.

## Animation and performance

One shared scroll calculation drives reversible story progress; there is no independent autoplay timeline or floating pause button. React state changes at chapter boundaries, while fractional progress reaches the renderer through a ref. Rendering stops when settled, offscreen or when the document is hidden.

Three.js is dynamically imported only near the viewport on capable desktop devices. Mobile/tablet, reduced motion, data saver and reported low-capability devices use the static plan. Unavailable WebGL and context loss also fall back. Repeated furniture uses shared resources and instancing; DPR is capped at 1.5, shadows at 1024, and sustained slow rendering lowers quality. Unmount disposes GPU resources, observers and listeners.

The implementation follows Three.js guidance for [rendering on demand](https://threejs.org/manual/pages/rendering-on-demand.html) and [disposing resources](https://threejs.org/manual/pages/how-to-dispose-of-objects.html).

Final production build:

| Asset | Raw | Gzip |
| --- | --- | --- |
| Main JS | 432.71 kB | 122.76 kB |
| Optional restaurant engine | 548.34 kB | 138.79 kB |
| Application CSS | 279.87 kB | 44.38 kB |

Vite reports its 500 kB warning for the optional renderer chunk. Mobile verification confirmed that neither this engine nor Three.js was requested. These are bundle sizes, not a real-device performance benchmark.

## Accessibility and product accuracy

The readable story exists outside the canvas. Semantic sections, links, buttons, visible focus indicators, native disclosure FAQs and text status labels retain keyboard access. Reduced motion replaces WebGL with the static plan and disables decorative transitions. Mobile retains every chapter and workflow preview. Layout bounds were checked down to 320 px.

All numbers, orders and people are fictional; the landing page makes no live API calls. Inventory is explicitly recorded stock usage, not automatic recipe-based deduction. The copy does not claim a hotel-room booking engine. Existing Sign In and Get Started callbacks and destinations remain functional.

## Verification

- Production Vite build and `git diff --check`: passed.
- All nine desktop chapters, forward and reverse scroll: passed.
- Demand rendering stops at rest and offscreen: passed with WebGL draw-call counters.
- Module filters, team tabs, FAQ, `/login` and `/register`: passed.
- All chapter bounds at 1024, 768, 390 and 320 px: passed.
- Fresh mobile session does not request Three.js: passed.
- Reduced motion, low-capability device, unavailable WebGL and forced context loss: static fallback passed.
- Navigation away removes scene canvases: passed.
- No browser errors or live API calls during the interaction checks.

Browser checks used Chromium with software WebGL. Real mobile hardware, Safari and GPU-specific profiling remain unverified. There is no frontend lint or unit-test script configured. Existing repository-wide dependency audit findings were not changed by this frontend task; Three.js was not among the reported packages. The model is an original stylized architectural miniature, not a photorealistic imported asset.

## Screenshots

[Desktop hero](desktop-hero.png) · [Mobile hero](mobile-hero.png) · [Reduced motion](reduced-motion.png)

| Chapter | Desktop | Mobile |
| --- | --- | --- |
| Arrival | [View](desktop-story-1.png) | [View](mobile-story-1.png) |
| Floor | [View](desktop-story-2.png) | [View](mobile-story-2.png) |
| Order | [View](desktop-story-3.png) | [View](mobile-story-3.png) |
| Kitchen | [View](desktop-story-4.png) | [View](mobile-story-4.png) |
| Takeaway | [View](desktop-story-5.png) | [View](mobile-story-5.png) |
| Billing | [View](desktop-story-6.png) | [View](mobile-story-6.png) |
| Inventory | [View](desktop-story-7.png) | [View](mobile-story-7.png) |
| Analytics | [View](desktop-story-8.png) | [View](mobile-story-8.png) |
| Connected roles | [View](desktop-story-9.png) | [View](mobile-story-9.png) |
