# Single backend application

`backend/src/main.js` starts one Node/NestJS process and one HTTP/WebSocket listener. Master, Admin, Waiter, Chef and Juicer routes run in that process. Role handlers are router factories, not servers. The compatibility `start:master` command starts this same application; do not run it alongside `npm start`.

The authenticated token determines the role, tenant and user. Client-supplied role/tenant/user headers are overwritten. Tenant queries retain AsyncLocalStorage isolation, module/subscription checks remain at the gateway, and role handlers retain their role checks. All roles share the tenant database pools and state cache. Successful mutations invalidate that tenant's cache; staff/profile edits refresh the master login directory before replying. WebSockets use the same listener and signed token.

## PM2 staging

Install the Node/npm versions specified by the project runtime files, run `npm ci`, and install PM2 on the server. Prepare `.env` with PostgreSQL and object-storage credentials and a stable `MASTER_SESSION_SECRET`. For a new database set a private six-digit `MASTER_BOOTSTRAP_PIN`; existing accounts are preserved.

From the project root:

```sh
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
pm2 logs knockout-backend
```

There is exactly one app entry, `knockout-backend`, with `instances: 1` and fork mode. The process loads `.env` through Node's `--env-file` option. The PM2 configuration overrides Docker hostnames with localhost: PostgreSQL 5432 and MinIO 9100. Adjust those PM2 endpoint values if using external services or different published ports. Redis is disabled in the default single-process PM2 configuration; live events work in memory. For multiple replicas, configure a reachable Redis endpoint and require it.

PostgreSQL and object storage must already be running; PM2 manages the Node application only. You can run `docker compose up -d postgres minio` for dependencies, or manage them separately. Do not also start the Compose backend when using PM2. Existing role processes must be stopped during cutover using their exact PM2 names; do not use a global stop command affecting other applications.

The listener is http://localhost:5000 (`/api/health`, `/api/framework`, and `/ws`). The backend signals PM2 readiness only after initialization and drains HTTP/WebSocket/database connections on shutdown. For restart:

```sh
pm2 restart ecosystem.config.cjs --update-env
```

Run `pm2 startup` and follow its generated command to enable boot persistence. Place Nginx/HTTPS in front of port 5000 and enable WebSocket upgrades for `/ws`. Serve the frontend production build from Nginx. For local development, Vite stays on port 5200 and proxies API/WebSocket requests to port 5000; set `VITE_PROXY_TARGET` if using another API port.

## Docker alternative

`docker compose up -d --build` runs one `backend` service, plus frontend, PostgreSQL, Redis and object storage. Backend port 5000 is published as `BACKEND_PORT` (default 5100); frontend stays on 5200. When upgrading from the previous topology, remove the old role containers during a planned cutover so they do not keep accepting requests. Database volumes are unchanged.

## Tests

With a disposable PostgreSQL database available, export connection variables and run:

```sh
PG_INTEGRATION=1 npm test --workspace backend
```

The API test starts exactly one child process and exercises signed role logins, order/billing, bookings, stock, supplier payments, attendance, concurrent tenant isolation, forged-header handling, multipart profile updates, login-directory synchronization and WebSocket changes. Object storage is stubbed in the integration test; actual storage availability and cloud deployment require separate validation.

PM2 configuration reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
