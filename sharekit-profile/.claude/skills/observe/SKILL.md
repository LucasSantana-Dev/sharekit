---
name: observe
description: One self-contained observability + monitoring skill — instrument (logs/metrics/traces/errors), debug broken signals, analyze/query data, tune cost/cardinality, and set up monitoring practice (SLOs/alerts/on-call/synthetics). Stack-agnostic (Node/Python/Go/Rust + OTEL/Prometheus/Loki/Grafana/Tempo/Sentry). Use for any observability or monitoring work; pick the mode below.
metadata:
  type: skill
  status: stable
  family: observability
---

# observe

Everything observability + monitoring in one skill. Detect the stack, pick the **mode**
that matches intent, run it. (This used to be a router over 7 sibling skills; it was
consolidated — the detailed historical versions are recoverable from git history if a
deep edge case ever needs them.)

## Auto-invocation triggers

"set up observability/monitoring", "instrument <service>", "wire up Sentry/OTEL/Prometheus",
"alert flapping / metric missing / logs not arriving", "investigate <anomaly> / build a
PromQL/LogQL", "metrics bill / cardinality too high", "set up SLOs / alerts / on-call /
dashboards / synthetics". For LLM-app traces specifically, that's a separate concern (use
`/langfuse-observe`); for Sentry-MCP error operations use `/sentry`.

## Step 0 — Detect the stack (always)

```text
node:   package.json: @opentelemetry/*, @sentry/*, pino, winston, prom-client, dd-trace
python: pyproject/requirements: opentelemetry-*, sentry-sdk, prometheus-client, structlog, loguru
go:     go.mod: go.opentelemetry.io/*, getsentry/sentry-go, prometheus/client_golang, log/slog
rust:   Cargo.toml: opentelemetry*, tracing*, sentry, metrics
infra:  docker-compose / k8s / helm: prometheus, loki, grafana, tempo, jaeger, otel-collector, alloy, vector
config: .env / vault: SENTRY_DSN, OTEL_EXPORTER_*, GRAFANA_*, DATADOG_*
```
Emit one line: `Detected: <lang> + <log> + <metrics> + <trace> + <errors> + <backend>` (or `bare — greenfield`).
**Default backends when unconstrained:** self-hosted OSS pull-based — Loki (logs), Prometheus
(metrics), Tempo (traces), Sentry/Glitchtip (errors), all on Grafana. SaaS only if the user
chose one or the repo already commits to it. Confirm backend in one line before instrumenting
(hard to reverse after PRs land).

## Pick the mode

| Intent | Mode |
| --- | --- |
| no instrumentation / add a missing pillar | **Implement** |
| signal broken / missing / noisy / late / corrupt | **Debug** |
| answer a question / query / correlate / anomaly | **Analyze** |
| cost / cardinality / retention / sample rate | **Tune** |
| have data, need alerts/SLOs/on-call/dashboards | **Monitor** |
| new service → full stack in one pass | **Bootstrap** (Implement → Monitor → Analyze smoke-test) |
| existing service health review | **Audit** (Analyze → Debug → Tune top offender → Implement gaps → Monitor gaps → GREEN/YELLOW/RED) |

### Implement — wire the 4 pillars (one pillar per commit, smallest slice first)

| Lang | Logs | Metrics | Traces | Errors |
| --- | --- | --- | --- | --- |
| Node/TS | `pino` > `winston` | `prom-client` | `@opentelemetry/sdk-node` | `@sentry/node` |
| Python | `structlog` > `loguru` > stdlib JSON | `prometheus-client` | `opentelemetry-sdk` | `sentry-sdk` |
| Go | `log/slog` | `prometheus/client_golang` | `go.opentelemetry.io/otel` | `sentry-go` |
| Rust | `tracing` + JSON subscriber | `metrics` + prom exporter | `tracing-opentelemetry` | `sentry-rust` |

Gap-check each pillar (Status [OK]/[FAIL] · Library · Backend) first. Smoke-test the pillar
(synthetic request → confirm it surfaces) before calling it done.

### Debug — signal is broken, not the app

Classify the symptom, then walk the hypothesis tree (priority order):
- **Absent:** app idle (synthetic request to confirm) · library not initialized · exporter wrong endpoint · network/egress blocked · backend auth failing silently · right data, wrong query/filter.
- **Noisy:** threshold too tight (use percentile baseline) · cardinality explosion · sample rate too high · replicas double-reporting.
- **Late:** exporter flush interval · collector backpressure · ingestion rate-limit.
- **Corrupt:** trace context lost across an async boundary (missing W3C `traceparent` / context propagation) · log-schema mid-migration · clock skew · producer/collector version mismatch.

### Analyze — read healthy data to find truth

Frame the question (When / What / Why / Compare / Correlate), pick the primary pillar
(metrics = how many/fast; logs = what exactly; traces = where the time went), then query.
Examples: `histogram_quantile(0.95, sum by (le,route) (rate(http_request_duration_seconds_bucket[5m])))`
for p95-by-route; compare to `... offset 1w` for week-over-week; `sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))`
for 5xx rate. Correlate by `trace_id`/`request_id` across logs↔traces.

### Tune — cut cost/cardinality with a measured delta

Find the top offender first (highest-cardinality metric, biggest log stream, over-sampled trace).
Levers: Prometheus `metric_relabel_configs` to drop a high-cardinality label; OTel collector
attribute/filter processor to drop noisy attributes; Loki pipeline stage to drop healthcheck
logs; tail-sampling at the collector (keep 100% errors, ~1% success). Always report before/after
(series count, bytes/day, or bill).

### Monitor — the practice layer

SLIs → SLOs → burn-rate (multi-window) alerts → dashboards → on-call rotation → synthetic/uptime
checks. Don't alert on causes; alert on symptoms (SLO burn). Every alert needs an owner and a
runbook link, or it's noise.

## Stop / negative rules

- Greenfield/hobby code going nowhere near prod → just structured logs; full bootstrap is
  over-investment. Confirm the service is production-shaped before wiring the whole stack.
- One invocation = one mode. Don't batch unrelated needs.
- Backend choice and alert thresholds are hard to reverse — confirm in one line before applying.
- Capture blockers as evidence; don't route around them.

## Related

- `/sentry` — Sentry-MCP-driven error operations · `/langfuse-observe` — LLM-app tracing (a separate concern) · `/debug-deep` — generic app root-cause (not pipeline) · `/incident-response` — live incident handling (do NOT run an observability audit mid-incident) · `/verify-before-done`, `/ship-it` — pre-ship gate + post-release watch.
- Consolidated 2026-06-06 from 7 sibling skills (observability-implement / -debug / -analyze / -tune / -audit / -bootstrap + monitoring-setup) into this single self-contained skill.
