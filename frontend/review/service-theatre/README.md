# Service story layout correction

## Root causes

- `LandingMotion` started paused, and its global `animation-play-state: paused` rule froze the caption's entrance at opacity 0.2. The caption therefore remained faint indefinitely.
- The right illustration placed four 340px-high faces absolutely inside a rotating 3D cube. Increased readable font sizes and wrapping exceeded the available height. Perspective, translated faces, a pedestal and an oversized floor produced additional overlap and overflow.
- The illustration's automatic progression depended on the global floating control being switched on, while its caption and cube used unrelated transition durations.

## Source changes

- `src/ServiceTheatre.jsx`: bounded scene index, independent visibility/reduced-motion-aware automatic progression, separate hover and focus holds, stable caption and illustration layers, unchanged four-stage content, accessible previous/next and direct scene controls.
- `src/service-theatre.css`: replaced fixed cube faces and decorations with naturally sized grid layers; the largest scene reserves space at each viewport. One scene is visible at a time. Captions remain fully opaque; card entrances use a short 4px translation. Mobile order is description, illustration, navigation. All six navigation targets are 44px.
- `src/LandingMotion.jsx`: removed the floating button, icons, manual pause state and toggle handler. Motion follows the operating-system preference. Entrance effects no longer fade or blur important copy.
- `src/landing-motion.css`: removed floating-control styles and obsolete hover shine; disabled motion cancels animations instead of freezing them on partial frames.
- `frontend/dist`: regenerated production output.

The navy/blue/emerald tokens, application routes, backend, authentication and dashboard code are unchanged by this correction.

## Validation

- Frontend production build passed. The existing Vite JavaScript chunk-size advisory remains.
- No existing lint script is configured in `frontend/package.json`.
- Browser checks passed for all four scenes at 1440, 1024, 768, 390 and 320px: readable current caption, one visible scene, content inside the card, no document overflow, and identical section/card/navigation geometry between scenes.
- Previous/next wraparound and direct selection passed.
- Automatic progression after 5.5 seconds passed with the section visible and not hovered/focused.
- Switching to reduced motion retained the visible scene, stopped automatic progression and still allowed manual navigation.
- The floating control and obsolete cube/caption-animation selectors are absent from the source.
- Browser console and page-error checks passed, as did the existing Get started → registration and Sign in → login actions.
- `git diff --check` passed.

## Captured screenshots

| Scene | Desktop, 1440px viewport | Mobile, 390px viewport |
| --- | --- | --- |
| Welcome | [Desktop](1440-1-welcome.png) | [Mobile](390-1-welcome.png) |
| Order | [Desktop](1440-2-order.png) | [Mobile](390-2-order.png) |
| Prepare | [Desktop](1440-3-prepare.png) | [Mobile](390-3-prepare.png) |
| Complete | [Desktop](1440-4-complete.png) | [Mobile](390-4-complete.png) |

Review locally at http://localhost:5200/ and scroll to “Watch the pieces come together.” Staging has not been deployed. No remaining layout issues were found in the tested section and viewport sizes; this validation does not cover every browser engine.
