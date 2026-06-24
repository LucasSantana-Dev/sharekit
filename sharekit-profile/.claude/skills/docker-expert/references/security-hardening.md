# Security Hardening

## Minimum concerns

- non-root runtime,
- minimal packages,
- secret handling outside the image,
- pinned tags or digest strategy where justified,
- health checks and exposed surface area.

## Avoid

- baking secrets into images,
- relying on `latest` in production guidance,
- assuming Compose defaults are production-safe.
