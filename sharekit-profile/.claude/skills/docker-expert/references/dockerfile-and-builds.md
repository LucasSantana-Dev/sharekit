# Dockerfile And Builds

## Focus areas

- base image choice,
- multi-stage builds,
- layer ordering and cacheability,
- build context size,
- reproducibility.

## Guidance

- prefer smaller trusted base images,
- separate dependency installation from frequently changing source where possible,
- keep build-only tooling out of the runtime image,
- explain any tradeoff between cache efficiency and clarity.
