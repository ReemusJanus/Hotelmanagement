# PostgreSQL verification

Database inventories and SQL export now use `backend/src/schema.js`. API inventory was regenerated from current handlers. Compose validation and backend tests are run during the cleanup; production backup/restore and deployment have not been executed.

See [PostgreSQL setup](../POSTGRESQL.md) for current configuration and test instructions.
