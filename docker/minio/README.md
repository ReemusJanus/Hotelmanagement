# Local MinIO image

Compose builds `knockout-minio:local` because the previous Docker Hub image is unavailable. This Dockerfile compiles the official source at commit `7aac2a2c5b7c882e68c1ce017d8256be2feea27f` and includes its license in the runtime image.

The first build downloads Go and module dependencies and may take several minutes. Docker caches the resulting image for later starts. The existing MinIO volume, credentials, ports and health check are unchanged.

Rebuild with `docker compose build minio`. Source: https://github.com/minio/minio
