# Hotel 7969 staging menu import — 10 November 2026

## Result

Verified staging registry: company 5, **Knockout**, hotel **7969**, tenant schema `tenant_knockout`. Existing active admin ID 1 verified. The supplied six-digit identifier was not treated as a password or used to change credentials.

- 74 entries created, 15 source categories retained, 74 marked available.
- Exact names and base prices compared against `menu.csv`: 74 matched; no descriptions or dietary classifications invented.
- Sizes/variants remain separately priced entries, matching the application's existing menu schema.
- Existing items before import: 0. Duplicates: 0. No existing prices overwritten.
- 74 image objects uploaded via the existing menu image API and MinIO bucket: 17 distinct CC0 representative photos, 57 item-labelled **PHOTO PENDING** placeholders.
- All assets are 640×480 WebP, approximately 0.91 MB total. Photograph provenance is in `photo-licenses.json`; CC0 license reference: https://wordpress.org/photos/license/.
- No production changes. Other registered hotels' menu fingerprints remained unchanged during the import and verification rerun.

## Category routing

A tenant-local `menu_category_routes` table maps normalized category keys to `juicer` or `kitchen`. State API projections include `productionStation`. Backend preparation/availability checks, web dashboards/order tickets, and native consumers now use this resolved station. The old Juices default remains only as a compatibility fallback for menus without mappings; other hotels have no new mapping records.

Hotel 7969 maps **Fresh Juice, Falooda, Beverages, Sharja Shake, Karikku Shakes** to the juicer: **38 items**. The other ten categories map to the kitchen: **36 items**. All original category display names are preserved. New entries in these categories inherit the configured route.

## HTTPS image correction

Browser validation found that the existing storage configuration returned `http://localhost:9000` URLs. Staging now serves read-only public bucket images through `https://stg.hms.byteberrytech.com/media/food-images/`. `MINIO_PUBLIC_URL` was corrected, and only hotel 7969's 74 imported image URLs were updated. GET/HEAD access is allowed; writes through the Nginx media route are denied. Existing other-hotel image records were not rewritten.

## Backups and execution

Server backup: `/var/backups/hotel-management/menu-7969-20261110/`.

- `database-before.dump`: complete PostgreSQL custom-format backup, archive listing validated before writes.
- `main.js`, `frontend-before.tar.gz`: previous application artifacts.
- `nginx-before.conf`, `backend-before.env`: previous HTTPS/storage configuration; directory and environment backup restricted to root.

The import used the existing menu creation and image upload APIs with a short-lived, tenant-scoped maintenance session for the verified active admin. No PINs were used, exposed, or changed. It rechecks tenant identity and rejects duplicate/price conflicts, records a resumable result journal, and skips already imported rows/images. An actual second run created no additional items or images.

## Validation

- Import/API/SQL: 74 entries, 15 categories, exact CSV prices, availability, images, unique names/category pairs and station mappings verified.
- Real PostgreSQL controller test: mixed 74-item order, 38 juicer / 36 kitchen transitions, all-ready aggregation, waiter preparation edit lock, and bill subtotal **₹7,785** (one of each item). Transaction rolled back; confirmed no test order persisted.
- Focused regression suite: 20 passed, 1 optional PostgreSQL logo test skipped. Initial sandbox socket restriction resolved by rerunning with local test-server access. This was not the full application test suite.
- Backend and frontend production builds passed; existing Three.js chunk-size warning remains.
- Browser checks use deployed staging assets and the imported, sanitized menu as intercepted API fixtures; they do not claim real PIN sign-in or live order placement. All 12 role/viewport checks passed at 320, 768 and 1440 pixels: correct item counts (74 admin/waiter, 36 chef, 38 juicer), image decoding, no horizontal page overflow or runtime errors, and waiter mixed-food/drink selection. Results are in `browser-validation.log`.
- Native routing consumers were updated locally; no native app binary was distributed or device-tested.

## Manual photo review

57 items retain clearly labelled placeholders; all are enumerated by `imageKind: placeholder` in `import.json`. Shaman Juice and Master Falooda specifically remain placeholders because their recipe/appearance could not be verified. Loaded Fries uses a CC0 representative photograph. Photographs illustrate the dish type and are not asserted to show this restaurant's actual portions or recipe. Restaurant-approved photos can replace them through Food & Photos.
