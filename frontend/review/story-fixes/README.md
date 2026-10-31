# Story synchronization and layout fixes

## Root causes and fixes

1. All ten desktop previews occupied the same CSS grid cell. Although inactive parent layers had `visibility:hidden`, phase-label descendants explicitly used `visibility:visible`, which overrides inherited visibility. This leaked kitchen/juice text into unrelated cards. The desktop now mounts exactly one keyed scene preview. Each progressive footer renders one phase string in normal document flow, not four stacked labels.
2. Header offsets were separate hardcoded desktop/mobile values. A ResizeObserver now measures the sticky header; anchor margins, sticky positioning and scene activation share its measured offset. Font readiness and pageshow trigger recalculation, covering wrapped headers and restored page positions.
3. Scene index updates and renderer interpolation could temporarily describe different chapters after rapid jumps. Scene and phase update together at discrete boundaries, and the renderer immediately adopts a new chapter while retaining within-chapter interpolation. Progress remains reversible, driven by one RAF-batched scroll observer.
4. Fixed camera distance was not fitted to the viewport. The existing restaurant now uses projected model bounds, aspect-aware zoom and a more central look target, with a safety margin. The model and materials remain unchanged.

The preview keeps the same header/content/footer structure, with a shared desktop minimum block size for stable navigation and flexible content that can grow. Footer text wraps naturally; no overflow masking is used to conceal the bug. Mobile previews remain independent static scene cards.

## Files modified

- `src/LandingStory.jsx`: one active keyed preview and phase prop.
- `src/landing/StoryPanel.jsx`: one scene-specific status label.
- `src/landing/useStoryProgress.js`: atomic scene/phase state, measured offsets, restoration and cleanup.
- `src/landing/luxury.css`: normal-flow footer, consistent offsets and preview dimensions.
- `src/landing/restaurant-engine.js`: chapter-boundary synchronization and responsive model framing.
- Rebuilt frontend output and updated screenshots in `../luxury/`.

## Verification

Production build passed. Ten-scene browser checks passed for correct active index, single mounted desktop card, absence of unrelated footer labels, header/anchor visibility, reverse scrolling and page bounds at 1440, 1280, 768 and 390 px. Rapid jumps and a browser reload at chapter 8 passed. The broader story suite checks all chapters, controls, reduced motion, idle/offscreen draw cessation, mobile avoiding Three.js, routes, and browser errors. Screenshots of all ten desktop/mobile chapters are in the luxury review folder.

No frontend lint or unit-test script is configured. Browser testing uses Chromium/software WebGL; physical device and Safari verification remain outstanding. Camera screenshots were inspected, but this is not an exhaustive pixel-level overlap or accessibility certification. The existing optional Three.js chunk still triggers Vite's size advisory. No backend, business logic, authentication, authenticated dashboards or routes changed. No dependency added and no deployment performed.
