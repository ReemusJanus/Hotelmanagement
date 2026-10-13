# KnockOUT complete web theme review

The existing React/Vite web application now uses Charcoal Black + Luxury Gold throughout public, authentication and operational screens. Preview: http://localhost:5200. Staging has not been deployed. Backend, database schemas, APIs, authentication behavior, role permissions, calculations and deployment settings were not changed.

## Centralized theme

`src/theme.css` defines the palette, surfaces, status colors, borders, shadows and focus treatment. Primary #C9A227; hover #D4AF37; background #09090B; sidebar/surface #18181B; elevated surface #27272A; text #FAFAF9; secondary text #D4D4D8; border #3F3F46. Public CSS references these same tokens.

Gold primary buttons use charcoal labels. Emerald, amber, red and teal preserve status meaning, with labels alongside color. Reserved tables use amber. Danger buttons use a darker red for accessible white labels while error accents retain the semantic red. Printed receipts retain light paper and monochrome print rules.

Navigation has a gold active edge and subtle tinted background. Cards use layered shadows and restrained hover elevation. Forms, tables, dropdowns, dialogs, toasts, loading/error states and registration controls share the theme. Inter remains the established typeface.

## Reviewed pages and components

The application uses `/`, `/login`, `/register`, a master entry branch, and state-driven module navigation. Frontend JSX, shared controls, styles and the retained AttendancePanel were inspected.

| Area | Coverage |
| --- | --- |
| Public | Landing, product/features explorer, team views, FAQs, Get Started |
| Authentication | Company PIN login, master login, registration packages/periods, onboarding, activation and errors |
| Superadmin | Company network/workspaces, registration review, users/PIN controls, SaaS billing, subscriptions, module pricing and company controls |
| Administrator | Overview, tables, reservations, orders/billing, parcels, dishes/combos, inventory/movements/requests, finance/revenue, suppliers/payments, staff and settings |
| Waiter | Overview, floor, order rounds, bookings where enabled, personal orders, drawers and billing |
| Chef | Overview, team management, stock booking, dishes, table tickets, parcels and ready queue |
| Juicer | Overview, drink availability, table tickets, parcels and ready queue |
| Applicant | Waiting, approved setup, rejected and activation states |
| Shared | Profile, forms, calendars, tables, status badges, dialogs, notifications and empty/loading/error states |

Previously disabled attendance navigation remains disabled. No nonexistent contact or forgot-password route was introduced. The separate React Native client in `mobile/` was not changed; mobile/tablet coverage here refers to responsive web screens.

## Animation and responsive behavior

The public narrative has twelve scenes: welcome hero, ten operational chapters, and Get Started. Chapters follow arrival, floor, order, kitchen, dedicated juice preparation, takeaway, billing, inventory/suppliers, analytics and connected roles. The juice station has its own camera target, area highlight and progressive ticket. Scroll-linked motion reverses naturally. All landing data is fictional; inventory depicts recorded usage, not automatic recipe deduction.

Three.js remains lazy-loaded only for capable desktops. Mobile, reduced motion and unsupported devices use the floor plan. Rendering stops when settled/offscreen and GPU resources are disposed on unmount. Operational screens use CSS depth and short transitions, not additional WebGL. No new dependency was added in this update; no floating motion control exists.

Responsive navigation, wrapping cards/forms, touch-sized controls and contained table scrolling preserve the existing workflows. Focus styling, keyboard dropdown support, modal focus containment/Escape and native FAQ disclosures remain available. Reduced motion suppresses decorative animation.

## Modified files in this update

- `src/theme.css`: global tokens and shared component styling.
- `src/styles.css`, `src/knockout.css`: remaining decorative colors centralized.
- `src/App.jsx`, `index.html`: gold brand asset and browser theme color.
- `src/LandingStory.jsx`: story introduction and chapter numbering.
- `src/landing/story-data.js`, `StoryPanel.jsx`: dedicated juice chapter.
- `src/landing/useStoryProgress.js`: dynamic chapter count.
- `src/landing/restaurant-engine.js`, `RestaurantPlan.jsx`: juice camera/highlights and chapter mapping.
- `src/landing/luxury.css`: references to shared palette.
- `DESIGN_REVIEW.md`, review documents/screenshots and rebuilt `dist/`.

## Executed checks

- Production build and `git diff --check` passed.
- Admin, waiter, chef, juicer and superadmin navigation exercised at desktop/mobile sizes with mock APIs: no page errors or reported document overflow.
- Role navigation also exercised at 1024 and 768 px.
- Company Overview/Users/SaaS Billing/Controls tabs and mobile applicant pending/approved/rejected screens passed.
- Add-table modal focus containment, Shift+Tab, Escape, profile dialog and booking dropdown keyboard selection passed.
- Populated chef/juicer ticket dialogs opened and fit mobile width.
- Public `/`, `/login`, `/register` rendered at 1440 and 390 px without document overflow.
- Ten story chapters, reverse scrolling, filters, roles, FAQs, CTA routes and reduced motion passed; chapter bounds passed at 1024, 768, 390 and 320 px.
- Draw-call counters confirmed rendering stops when idle/offscreen; mobile did not request Three.js. Landing checks had no live API calls or browser errors.
- Automated text-contrast spot checks found no failures on sampled admin, waiter, chef, superadmin, floor, bookings, stock, finance and landing views. This is not a complete WCAG certification.
- Source search found no previous navy/blue/purple branding hex values in `frontend/src` or `index.html`.

Final build: main JS 433.86 kB (122.98 kB gzip); optional renderer 548.38 kB (138.80 kB gzip); CSS 283.00 kB (44.81 kB gzip). Vite retains its 500 kB advisory for the dynamically loaded renderer.

No frontend lint or unit-test script is configured. Browser checks use Chromium and mock data, not live payment/database mutations; not every business-state permutation was exercised. Real-device Safari/GPU profiling remains outstanding.

## Screenshots

[Admin](ko-admin.png) · [Waiter](ko-waiter.png) · [Chef](ko-chef.png) · [Juicer](ko-juicer.png) · [Superadmin](ko-superadmin.png) · [Registration](ko-register.png) · [Login](ko-login.png) · [Dialog](ko-add-table.png) · [Company controls](ko-company-controls.png)

[Public story screenshots](../luxury/)
