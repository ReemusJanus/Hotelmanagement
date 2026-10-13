# Authenticated luxury glass redesign

All authenticated web roles share frosted charcoal surfaces, champagne-gold accents, floating navigation, layered cards and restrained pointer-responsive depth. Public landing styles, APIs, permissions, calculations, routes and printed receipts were not changed.

## Files

- `src/authenticated-glass.css`: new centralized glass tokens and scoped component presentation.
- `src/main.jsx`: loads the authenticated theme after existing base tokens.
- `src/AnimatedUI.jsx`: event-driven card tilt and short authenticated entrances, with cleanup.
- `src/App.jsx`: adds an applicant-only presentation class to onboarding and activation screens.
- Rebuilt `dist/` and this review with screenshots.

## Theme and components

Primary glass rgba(39,39,42,.68), secondary rgba(24,24,27,.76), elevated rgba(63,63,70,.48); white border rgba(255,255,255,.10), gold border rgba(201,162,39,.38), soft gold #E6C76A. Existing charcoal, text, brand and semantic status tokens remain shared. Glass radius, reflection, nearly opaque surface and layered shadow tokens are centralized in the new stylesheet.

Updated sidebar/header, KPI cards, company cards, panels, turnover charts, floor cards, orders, staff cards, controls, forms, dropdowns, tables, dialogs, drawers and applicant views. Dense table rows and kitchen tickets retain nearly opaque backgrounds. Typography, values, tax breakdowns and visible status labels remain readable. No new chart calculations or business logic were introduced.

Role coverage: master companies, waiting list, SaaS billing, company users and controls; admin overview, floor, bookings, orders, parcels, menu/combos, inventory, finance/suppliers, staff and settings; waiter floor/orders/billing; chef team/stock/menu/tickets; juicer menu/tickets; applicant waiting, setup, rejection and activation. Shared styling also covers retained attendance components without enabling disabled navigation.

## Motion and performance

KPI cards follow the pointer within approximately ±2 degrees per axis, with a restrained gold reflection. A single delegated pointer handler batches writes through requestAnimationFrame; there is no permanent render loop or React state update per move. Pointer exit, window blur, navigation, reduced-motion changes and unmount reset motion. Short 220 ms entrances apply to page headings, dialogs and drawers, not full data tables. Numeric values are not animated.

Backdrop blur is limited to sidebar and header; nested cards use translucent surfaces and lighting rather than repeated blur layers. Mobile, coarse-pointer and reduced-motion/transparency settings use opaque navigation with no blur. Hover tilt requires a fine pointer and no reduced-motion preference. No new dependency or authenticated WebGL renderer was added.

## Verification executed

- Production build passed: main JS 438.76 kB / 124.41 kB gzip; CSS 290.46 kB / 46.01 kB gzip.
- Role navigation across admin, waiter, chef, juicer and superadmin at desktop/mobile and 1024/768 px: no reported page errors or document overflow.
- Company tabs, applicant pending/approved/rejected screens, populated chef/juicer dialogs, profile dialog, modal focus containment/Escape and booking dropdown keyboard selection passed using mock data.
- Pointer tilt, pointer-leave cleanup, reduced-motion suppression, mobile blur fallback and 390 px page bounds passed.
- Text contrast spot checks on sampled dashboards, floor, bookings, stock and finance found no failures. These checks are not a complete WCAG audit, particularly for composited glass surfaces.
- `git diff --check` passed.

No frontend lint or unit-test script is configured. Browser checks used Chromium and mock API data, not live order/payment mutations. Real-device Safari and low-end GPU profiling, exhaustive business-state coverage and printed/PDF visual regression were not performed. Existing print rules were left untouched. The existing optional public Three.js bundle retains Vite's 500 kB advisory. Staging has not been deployed.

## Screenshots

[Desktop](ko-glass-desktop.png) · [Mobile](ko-glass-mobile.png) · [Chef dialog](ko-chef-order.png) · [Juicer dialog](ko-juicer-order.png) · [Company controls](ko-company-controls.png)
