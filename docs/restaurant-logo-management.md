# Restaurant logo management

## Implementation
The existing admin Settings → Business & Billing page sends one multipart PUT to `/api/settings`. It accepts `logo`, `removeLogo`, `showLogoOnBill`, `showLogoWatermark` alongside the existing business fields. JSON clients still work and preserve branding fields they omit. Client-supplied logo URLs/storage keys are ignored.

The route checks the authenticated administrator role before accepting the upload. The existing verified session and tenant context select the settings schema; client headers do not select logo ownership. Multer enforces 2 MB and PNG/JPEG/WebP MIME types; the controller also checks binary signatures using the existing image validator. File extensions come from detected types, not uploaded names.

Storage reuses configured MinIO/S3, with immutable keys `<authenticated company database>/images/restaurant-logo-<UUID>.<extension>`. Names are not based on business names. Images must be publicly retrievable through the existing storage public URL configuration. Restaurant logos are public brand assets, not private documents.

Uploads occur before a transactional settings update. The previous database configuration remains valid if the transaction fails; the new object is removed on failure. On success the previous tenant-owned logo is removed. A failed storage cleanup can leave an orphan object and logs a cleanup notice; it does not undo committed settings.

## Database
Four additive settings columns: `logo_url TEXT`, `logo_storage_key TEXT`, `show_logo_on_bill BOOLEAN NOT NULL DEFAULT TRUE`, `show_logo_watermark BOOLEAN NOT NULL DEFAULT FALSE`.

`ensureSchema` adds them for new and existing tenant schemas at normal startup. For an existing staging database, back up first and apply `migrations/staging/03-restaurant-logos.sql` against the shared physical PostgreSQL database. It upgrades registered tenants and the default knockout schema. No master table columns change. The script assumes the existing master registry is `knockout_master.companies`.

## UI and receipts
The existing admin sidebar uses refreshed tenant settings after saving and after login. Image failures fall back to the default brand icon. Images use object-fit contain in the circular container.

The shared `BillReceipt` component renders the tenant logo and optional 7% watermark, covering dine-in, parcel and bill reprints in desktop/mobile browsers. Print clones wait for images, with a five-second timeout and hidden failed images. Page height includes the header logo allowance. No billing calculation changed.

Printing uses `window.print()`; saving as PDF through that dialog uses the same template. There is no separate PDF generator, direct ESC/POS transport or native printer renderer in the inspected code. The existing receipt page is fixed at 72 mm; this change does not add a 58/80 mm paper selector. Physical printer quality/scaling is not certified. Watermark defaults off and should remain off for thermal devices that cannot reproduce it clearly. Browser/printer print settings can suppress faint imagery.

The native Expo app has payment views but no equivalent printer integration; this feature's upload UI and sidebar are in the web Admin Portal. It does not replace public platform branding or other restaurants' logos.

## Verification
- Frontend production build and backend bundle passed.
- Nine PostgreSQL/controller/multipart/regression tests passed, including logo isolation across identically named restaurants, rejected formats/size, replacements/removals, persistence, old-client compatibility and rollback/failed-upload cleanup.
- Object storage was stubbed in integration tests; live MinIO/S3 credentials and physical printers were not exercised.
- Browser fixtures exercise settings upload/save, sidebar refresh/reload, receipt branding and responsive layout at 390/768/1440 px; these do not replace a live storage smoke test.
- Full application release certification remains separate; the previously recorded origin-policy integration failure is not addressed by this feature.

Deployed to staging on 9 November 2026, backend before frontend. Verified API/Redis health, all four tenant/default settings schemas and served frontend layout checks with synthetic API fixtures. Live tenant logo uploads and physical printer output remain unverified. Both deployment scripts now install dependencies in isolated temporary source directories to avoid iCloud/shared node_modules cleanup failures.

## Files changed for this feature
Frontend: `frontend/src/App.jsx`, `frontend/src/responsive.css`.
Backend: `backend/src/controllers/tenant.controller.js`, `backend/src/routes/portal.routes.js`, `backend/src/uploads/multer.js`, `backend/src/database.js`, `backend/src/schema.js`.
Migration: `migrations/staging/03-restaurant-logos.sql`.
Tests: `backend/test/restaurant-logo.test.js`.

Earlier unrelated working-tree changes were retained.
