# Release review — 9 November 2026

Decision: NO-GO for production until the blockers below are resolved and verified.
Requested domain: hms.byteberry.com (different from staging byteberrytech.com).

## Evidence
- Frontend production build passed.
- Backend bundle built; missing supplier deletion handler discovered and corrected locally.
- Isolated PostgreSQL suite: 15 passed, 1 failed, no skips after local token fix.
- Passing coverage includes daily bill numbering/concurrency/tenant isolation, preparation edit locks, PostgreSQL contracts and migration rollback/idempotency.
- API integration stops at disallowed Origin: expected 403, received 401. Later workflow assertions have NOT completed.
- Token parser now rejects additional token segments. This was not an anonymous authentication bypass: the failing test supplied an otherwise valid signed admin token with a suffix. Missing, invalid and expired tokens were rejected.
- Dependency audit: 7 high, 2 moderate findings. Includes stale lockfile dependencies; regenerate and reassess runtime exposure before remediation.
- Staging has approximately 3.1 GB available RAM and 69 GB free disk; no load capacity certification performed.

## Local changes
- Correct supplier purchase deletion handler reference.
- Reject malformed session tokens with extra segments.
- Remove unused legacy routes/index.js aggregator: no imports or package entry points reference it. Active master/portal routers retained.

## Required before launch
- Wire and verify existing server security helpers: restrictive origin policy, production secrets validation and login attempt protection. Helpers passing unit tests does not establish runtime installation.
- Complete API integration suite, including role access and disabled account checks.
- Resolve dependency audit findings and synchronize package lockfile.
- Verify backend port 5000 is not publicly reachable; it currently listens on all interfaces. Firewall exposure was not established by listener inspection alone.
- Review plaintext PIN storage and public object-storage policy, including financial report confidentiality.
- Verify scheduled database/object backups and perform a restoration rehearsal. Existing deployment backup folders are not evidence of database recovery.
- Configure and verify production DNS/SSL, production environment values, production data isolation and rollback.
- Confirm mobile/tablet landing-page acceptance and test expected concurrent staff load. Hotel/user counts remain unspecified.

No production deployment was performed. Local review changes have not been deployed to staging. This review does not certify all application workflows or all unused code.
