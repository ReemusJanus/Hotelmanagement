# Thermal receipt printing — staging, 13 November 2026

Deployed to https://stg.hms.byteberrytech.com. Production was not changed.

## Root causes

The original receipt modal is a React portal attached directly to body. Printing cloned another receipt into body, hid only the React root, and globally made every `.receipt` visible/fixed. Both copies printed and overlapped. The print animation and copy-count prompt also allowed unnecessary copies/concurrent jobs. Page length was estimated from text with a 145 mm minimum. Body decoration pseudo-elements generated black artifacts and an extra blank page on longer receipts.

Paid reprints could also use current menu prices through `calculateBill`, instead of saved order-item prices. The API now exposes saved item price, subtotal, tax and service charge. No stored amounts, billing calculations, numbering, statuses or credentials were changed.

## Implementation and files

- `frontend/src/ThermalReceipt.jsx`: one shared template for existing waiter, admin, dine-in, parcel, and historical invoice callsites. Restaurant bill designation; compact header, fixed quantity/amount columns, wrapping names, saved amounts, one footer, optional hotel logo.
- `frontend/src/receipt-model.mjs`: saved monetary values; paid receipts with missing saved prices are blocked rather than silently repriced. Separate nonzero adjustment lines where supplied.
- `frontend/src/thermal-print.mjs`: guarded single print job, isolated Shadow DOM print copy, excludes all unrelated body elements and decorations, waits for logo loading, measures actual content height, cleans up after print/cancel. Browser beforeprint uses the same isolation for an open receipt.
- `frontend/src/thermal-base.css`, `thermal-receipt.css`: shared black-on-white Arial print typography, 80 mm paper, configurable 60–76 mm content width (default 72), trailing space 0–5 mm (default 1), no fixed minimum height or decorative receipt card.
- `frontend/src/App.jsx`: replaces old duplicate printing/template implementations with shared imports.
- `frontend/src/main.jsx`, `styles.css`, `knockout.css`, `responsive.css`: stylesheet integration and removal of conflicting print rules.
- `backend/src/database.js`: read-only saved invoice field projections.
- `frontend/test/receipt.test.mjs`: monetary and settings regression tests.

The page height is calculated from rendered print content, not a preset long paper form. Each item row/totals group avoids splitting. Browser/driver paper-form limits still apply to exceptionally long receipts.

## Verification

- Frontend and backend production builds passed. Existing bundle-size warning and dependency audit findings remain; this is not a whole-project security certification.
- Automated regression run: 22 passed, 0 failed, 8 database-dependent tests skipped (no integration test database configured).
- Chromium and installed Google Chrome: synthetic paid invoices with 1, 10 and 20 items, long names, saved unit price 90 despite current menu price 999; correct 180-per-line totals, stable columns, no horizontal overflow, exactly one cloned receipt, repeated clicks create one job, cleanup restores screen.
- Generated PDFs: each has one page of 80 mm width; content-dependent heights 77 / 232 / 404 mm for those fixtures. Rendered PDF images visually inspected. The one-item sample previously requested at least 145 mm.
- Admin parcel history and waiter dine-in history exercised with mocked API fixtures; browser beforeprint/afterprint lifecycle checked. All existing billing callsites reuse the shared template.
- Unit tests cover tax, parcel/packaging charges, discount, zero values and saved paid reprints without mutating source orders. These fee fixtures do not imply new business features: the current schema does not persist parcel/packaging/discount fields. This patch neither invents fees nor adds those workflows.
- Deployed backend health returns PostgreSQL and Redis ready. Staging browser tests use synthetic API responses, not changes to real invoices.
- No supplied physical receipt photograph was accessible; before preview is a browser reproduction of the old staging implementation.

[Before](thermal-receipts/before.png) · [After](thermal-receipts/after.png)

## Windows 11 / SHREYANS SRS39C-U setup

1. Select **80mm Series Printer**, compatible **80 mm receipt/continuous paper**, portrait, **one copy**.
2. Set **100% scale**, margins **None** or minimum supported, disable browser **Headers and footers**. Do not use A4/Letter.
3. In the application's “80 mm printer settings”, start at 72 mm printable width. This is a configurable conservative default, not a verified SRS39C-U hardware specification. Confirm the actual printable width with the installed driver/vendor and a test receipt.
4. The browser supplies measured paper height. If the driver overrides it, use its supported continuous-receipt mode or the shortest custom form that fits. Driver feed/cutter controls are separate; select minimal safe feed according to the device manual. The web app cannot guarantee cutting or silently change Windows settings.
5. Physically test a single item and 20 items, long names, the rupee glyph, paid reprint, no clipping and minimum safe tear/cut distance.

Microsoft's browser instructions: https://support.microsoft.com/en-us/edge/print-in-microsoft-edge
Print lifecycle reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/print

## Remaining limitations

Physical SRS39C-U/USB, Windows 11 driver and Microsoft Edge were not available for testing. Hardware acceptance remains pending. Very long receipts may encounter driver maximum form height. Historical item names still use the application's existing naming data; the database has no original-name snapshot. This patch preserves that existing limitation.

## Backup / rollback

Staging backup: `/var/backups/hotel-management/thermal-receipt-20261113/` (root-only). Contains validated PostgreSQL dump, backend main.js, frontend tar and Nginx configuration. No migration or invoice record writes were performed. Deployment preserves Nginx and existing static assets. Restore backend-main.js and frontend.tar.gz, restart `knockout-backend` if rollback is required.

## Local follow-up — 14 November 2026

The follow-up printing work is **local only**, alongside the cancellation fix; it has not been deployed. The new attachment contained instructions but no physical receipt photographs.

The previously verified application causes remain: portal receipts and cloned receipts both printed, a 145 mm minimum paper length, and decorative body pseudo-elements creating blank pages. The shared Shadow DOM receipt and measured page height address these causes. No additional speculative layout rewrite was made.

Added paid/payment-method information when present in the saved order; corrected printer-width editing so entering a new value is validated on blur instead of resetting halfway through typing; blocked cancelled orders from printing as payable bills. Modified `ThermalReceipt.jsx`, `receipt-model.mjs` and receipt regression tests. No financial calculations or database billing values changed.

Additional checks cover 1, 5 and 20 items, long names, quantities, paid reprints, and supplied tax/packaging/discount values. The existing schema does not persist separate packaging/discount or restaurant address/tax-registration fields: no fictitious values or new business workflows were added. See `thermal-receipts/follow-up-browser.log` and the PDF previews for results.

Use 80mm Series Printer, an 80 mm supported receipt form, portrait, scale 100%, minimum margins, one copy, and disabled browser headers/footers. Default content width is 72 mm; validate against the installed driver. A fixed-length driver form can still feed unused paper even when the application's preview is compact. Driver feed/cutter settings are separate.

Windows/Edge and physical SHREYANS SRS39C-U testing remain pending. No verified model-specific ESC/POS command set was available, so no direct-print bridge or unverified cutter commands were introduced. Chrome browser printing remains the tested path. Staging validation of this follow-up is pending deployment authorization.

Follow-up PDF checks passed: one page each, approximately 80 mm wide; heights 82 / 165 / 408 mm for 1 / 5 / 20 items (the 5-item fixture includes adjustments). First printed text starts approximately 1.2 mm from the top. No horizontal overflow, duplicated header/footer, extra page, overlapping columns or missing total. Payment details and saved amounts are correct. Combined final regression: 45 passed, 8 unrelated opt-in tests skipped, no failures.

[One item](thermal-receipts/follow-up-1.png) · [Five items with adjustments](thermal-receipts/follow-up-5.png) · [Twenty items](thermal-receipts/follow-up-20.png)
