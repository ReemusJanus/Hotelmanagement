# KnockOUT capacity and production scaling

The application is now stateless at the API edge, uses Redis to relay live events between Master API replicas, reclaims idle tenant pools, coalesces simultaneous state reads, bounds operational history, and exposes separate liveness/readiness endpoints.

This makes horizontal scaling possible; it is not by itself a guarantee of 15,000 concurrent active users. Capacity must be proven on production-sized infrastructure with the included k6 test.

For a local multi-instance smoke test, first let one instance complete migrations, set `RUN_MIGRATIONS=false`, then run:

```bash
docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale superadmin-backend=3 --scale admin-backend=2 --scale waiter-backend=2 --scale chef-backend=2 --scale juicer-backend=2
```

The Master API uses the configured host-port range and Docker's service networking distributes its internal calls among role replicas. Production should run migrations as a separate one-shot deployment before API replicas start.

## Required production topology

- Put the built frontend behind a CDN; do not run the Vite development server.
- Put TLS and a load balancer in front of at least three Master API replicas. Enable WebSocket upgrades and a load-balancer idle timeout above 30 seconds.
- Run at least two replicas of every enabled role backend. Their APIs are stateless.
- Use managed Redis with replication/persistence. Set `REDIS_REQUIRED=true` so a replica does not silently start without cross-instance events.
- Use a managed MariaDB/MySQL cluster with automated backups, failover, connection monitoring, and a read replica for reports. Keep aggregate reporting off transactional request paths.
- Use S3 or clustered MinIO and a CDN for images/reports.
- Run notifications, report generation, and subscription jobs in background workers in the final production environment.

All replicas must share the same `MASTER_SESSION_SECRET`. Generate a random secret of at least 32 bytes and keep it in a secret manager.

## Capacity test

Run against a disposable staging tenant, never production:

```bash
k6 run -e BASE_URL=https://staging.example.com -e HOTEL_ID=1234 -e USER_PIN=123456 load-tests/api-capacity.js
```

Increase the `active_users` and `realtime_users` targets in stages (500, 2,000, 5,000, 10,000, 15,000). Stop when p95 latency, errors, database connections, CPU, or Redis memory crosses the agreed limit. Size replicas and pools from those results; do not multiply every replica's pool until the database connection limit is exceeded.

## Important operating metrics

- request rate, p50/p95/p99 latency, 4xx/5xx rate
- open WebSockets and reconnect rate per replica
- MariaDB active/queued connections, slow queries, lock waits, replication lag
- Redis memory, connections, pub/sub throughput, evictions
- Node event-loop delay, heap, CPU, restarts
- object-storage latency and notification queue depth
