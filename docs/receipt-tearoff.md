# Receipt tear-off spacing — 15 November 2026

Scope: trailing paper space only. Default 15mm, adjustable 0–30mm in “80 mm printer settings”. Existing width and fixed-driver preferences survive the one-time migration to the new browser preference key. Subsequent custom feed choices persist.

The shared footer owns the trailing padding and avoids splitting, keeping the last line and tear-off space together. Existing page-height measurement includes this padding. Portrait handling, 72mm default printable width, billing and backend remain unchanged. No raw ESC/POS commands are sent. Physical feed/cutter behavior remains driver-controlled.

Files: ThermalReceipt.jsx, receipt-model.mjs, thermal-base.css, receipt.test.mjs, thermal.browser.cjs.

Validation: 12 unit/API tests passed; frontend build passed. Chrome fixture checks cover old-preference migration, 15mm footer padding, configurable saved 7mm padding, duplicate print prevention and print cleanup. 1/5/20/100-item receipts each occupy one upright 80mm page with no extra blank pages. PDF bottom whitespace is approximately 15.7–16.7mm including font leading/measurement rounding. Fixed-form 80x200mm fallback has three nonempty pages for the long test; the driver's fixed final-page remainder cannot be removed by web CSS. No physical printer testing was performed.

Deployment: staging frontend only using the existing deploy script. Release commit and tested artifact hashes are published in staging /release.json after verification. Production and backend are unchanged.
