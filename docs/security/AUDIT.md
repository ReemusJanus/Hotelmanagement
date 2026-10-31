# KnockOUT security audit — 2026-10-13

Status: implementation in progress. No running deployment or live database is modified by this audit. Existing frontend work is preserved. Findings below are code-supported, not an external penetration-test certification.

## Prioritized findings (initial evidence)

| ID | Severity | Evidence / affected surface | Remediation and verification |
|---|---|---|---|
| S01 | High | `server.js` PUT /api/settings and POST /api/menu/:id/image lack a role guard inside routers available to four roles | Enforce admin permission; test waiter/chef/juicer denial |
| S02 | High | `verifyPortalStaff` compares role, not authenticated user ID; same-role attendance can target another user | Enforce self for non-admin; cross-user tests |
| S03 | High | `/api/state` removes financeEntries but retains supplierPurchases/supplierPayments for non-admin roles | Remove unauthorized financial collections; test all three non-admin roles |
| S04 | High | Login and onboarding PIN endpoints have no attempt limit | Bound per-IP auth/public endpoint rates; test 429/expiry; document distributed limits |
| S05 | High | Gateway verifies signed token but does not recheck active user; WebSocket heartbeat ignores token expiry | Revalidate current user on API requests and heartbeat; test revoked and expired sessions |
| S06 | High | multer accepts arbitrary `image/*`; original extension retained | Raster MIME/signature validation and canonical extensions; reject active content |
| S07 | Medium | Both Express error handlers return raw error.message for 500s | Generic internal error responses, safe structured logs; regression tests |
| S08 | High | Six-digit PINs in tenant/master tables and admin response contracts are plaintext | Requires approved credential migration and replacement of PIN-display workflows; not safe to silently convert |
| S09 | High | MinIO initialization permits anonymous GetObject over entire bucket including reports; report response is permanent URL | Requires approved private-object/presigned delivery migration and existing policy update |
| S10 | High | Session key defaults to DB-password-derived string | Production startup must require independent explicit secret; no automatic rotation |
| S11 | Medium | CORS unrestricted; sockets accept arbitrary Origin | Configurable exact allowlist, same-origin and native clients supported |
| S12 | Medium | Browser bearer token in sessionStorage; logout deletes only local state | HttpOnly cookie/native-token architecture and server revocation require approved compatibility design |
| S13 | High | Orders accept item quantities without positive integer validation | Validate order-line arrays before writes; test negative/nonfinite/oversized requests |
| S14 | Medium | Storage owner is mutable hotel_name, normalized lossily into object prefix | Migrate to immutable tenant identifiers; approval required to relocate existing objects |

## Cleanup classification

Safe to remove after reference verification: byte-identical ` 2` copies of database.js, postgres.js, schema.js, postgres.test.js and storage-loader.mjs. No active imports/configuration reference these copies. Divergent server/master-server/API-test copies require verification and are retained. Historical migrations, staging alter scripts, seed data, main-master compatibility entry, legacy standalone demo and mobile export artifacts are retained pending deployment/archival verification. Public Three.js code is dynamically loaded and must remain.

## Method

Review covers frontend, mobile source, backend routes/schema/SQL adapter, Redis, object storage, configuration, Docker/PM2, migrations and tests. The API inventory is generated separately with endpoint evidence. OWASP references: [REST security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html), [authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [file upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html). This is a risk-based review aligned with these areas, not an ASVS certification.
