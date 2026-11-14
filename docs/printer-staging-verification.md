# Thermal printing verification — 15 November 2026

## Before changes: independently verified

Branch `version2`, HEAD `16a1b6f`. Previous application fixes were uncommitted locally. No CI deployment metadata was present; established workflow is the sibling `deployment/deploy-frontend.sh` and `deploy-backend.sh`, with isolated locked npm installs, local builds, SSH/rsync, Nginx and PM2.

Staging `HMS-staging` at 139.59.42.193 serves only the configured staging domains from `/var/www/html`, API `/opt/hotel-management/main.js`, PM2 `knockout-backend`. Nginx configuration was inspected without changing it. API health confirmed PostgreSQL and Redis ready.

Staging files dated 14 November 2026 11:59 UTC match the saved local build exactly:
- Backend SHA256: `431f2de1013cd64daf3a35015efe30b3a301088cfdf5f297045da4225bcb0966`
- Frontend `index-BQHPUEU_.js`: `122c58e85e84cba9ff45358a0e4b761f83a8d54f47604cbba1ef780c782800d8`

Runtime bundles contain group sessions, cancellation restrictions, paid receipt labels and isolated thermal printing. Earlier “not deployed” notes describe the state at that earlier time, not the current server. A fresh backend build produces the same hash, so no backend replacement or database migration is needed for this printing-only release.

## Printing changes

Existing duplicate-copy and 145 mm minimum-length fixes are already deployed. Current print CSS measures receipt content and isolates one Shadow DOM receipt, excluding portal dialogs and page decorations. No app-generated raw USB/ESC/POS or cutter commands exist.

Remaining layout risk: a measured short page can be wider than tall, inviting landscape treatment. New page sizing keeps width 80 mm and minimum length 81 mm, with explicit upright orientation and horizontal writing. Longer receipts keep their measured length. Content stays approximately 72 mm wide. No totals, taxes, discounts, payments or historical records are changed.

New optional “Use printer paper size” setting uses valid `size:auto` for drivers rejecting custom lengths. Default remains measured numeric width/height, not unsupported `80mm auto`. A driver-selected fixed form necessarily leaves unused space on its final page; this cannot be removed by CSS. The browser also cannot override a driver's saved rotation, feed or cutter configuration.

Changed printing files: `ThermalReceipt.jsx`, `receipt-model.mjs`, `thermal-print.mjs`, `thermal-base.css`, receipt unit tests, two browser regression fixtures. Previously tested portal sources are recorded in the release commit so the deployed build can be traced to Git.

## Validation

66 automated checks passed, seven unrelated optional suites skipped. Disposable PostgreSQL schemas covered group billing, cancellation, reservations and real signed-login/WebSocket flow. Frontend/backend build-only checks passed. Browser fixtures cover waiter dine-in reprints (1/5/20/100 items), Admin parcel reprints (1/10/20), saved prices, mixed adjustment data, row alignment, duplicate clicks, Ctrl+P lifecycle, cleanup and subsequent print jobs. Browser API responses are synthetic; no customer bills were created.

Chrome PDFs: measured 80 mm width, upright, one copy/header/footer, no blank page; normal jobs have content-dependent height. Fixed 80x200 mm fallback paginates the 20-item test to three nonempty pages, with expected unused space on the last fixed form. Windows 11, Edge and the physical USB printer were unavailable; those checks remain pending.

Existing npm audit findings remain: nine root dependencies flagged (six high), and four in the backend production dependency set (three high). No unrelated dependency upgrades were made. Vite's existing large-chunk warning remains.

## Error B — not identified

No verified manufacturer manual or error-code table was found for the exact **SRS39C-U** name. Other Shreyans models have different drivers; do not install another model's driver just because its name looks similar. Confirm the model label, installed driver/version and where Error B appears. Manufacturer support must confirm the exact code. No hardware repair is claimed.

Official support/driver entry point: https://www.shreyanspos.com/ . This is a vendor entry point, not a verified SRS39C-U driver download.

## Windows 11 operator checks

1. Settings → Bluetooth & devices → Printers & scanners → the USB printer → Printer properties → Print Test Page. Test twice. If this fails too, investigate the driver/USB/queue/device before the browser.
2. Printing preferences: vendor-confirmed 80 mm receipt/continuous form, **Portrait**, one copy, normal/non-rotated output. Use the correct USB port and the manufacturer's driver for the exact label model. Driver option names vary; no exact cutter/reset sequence is verified for this printer.
3. Chrome/Edge Print → More settings: Portrait where shown, Scale **100%**, Margins **None** (or driver minimum), Headers and footers **off**, one copy, 80 mm receipt paper. Avoid A4/Letter and “fit to page”. Start with the app's 72 mm content width and 1 mm trailing space.
4. If custom receipt lengths are rejected, enable the new fixed-paper option and select the shortest supported 80 mm form that fits. Long bills may paginate. Fixed-form feed and cutter feed remain driver-controlled; use the vendor's safe minimum, not an invented command.
5. For stuck jobs: Open print queue → cancel the failed job. Power off/unplug the printer, wait 30 seconds and reconnect; inspect paper/closed cover without forcing the cutter. Retry a Windows test page.
6. If the queue remains stuck, an administrator can restart Print Spooler in `services.msc`. Microsoft's full spool-file reset removes **all printers' pending jobs**; use only when acceptable. If Error B persists, stop repeated printing and send the exact model/error evidence to vendor support.

Sources: https://support.microsoft.com/en-us/windows/hardware/printer/fix-printer-connection-and-printing-problems-in-windows and https://support.microsoft.com/en-us/windows/hardware/printer/fix-print-spooler-service-not-running-errors-in-windows ; CSS sizing/orientation: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40page/size and https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40page/page-orientation .

## Deployment

Release verification and artifact hashes are recorded separately after staging upload. Production is excluded.
