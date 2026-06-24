---
name: performance-audit
description: Audit MCP Gateway performance across system health, routing, caching,
  and scalability. Use when the task is specifically about diagnosing or improving
  MCP Gateway runtime performance.
metadata:
  owner: global-agents
  tier: contextual
---

# Performance Audit

Use this skill when the request is specifically about MCP Gateway runtime performance.

## Use When

- MCP Gateway responsiveness, routing latency, cache behavior, or scalability is in question.
- The task is to diagnose bottlenecks and recommend performance improvements for MCP Gateway.
- Capacity or performance evidence is needed before shipping or tuning the gateway.

## Do Not Use When

- The task is generic application performance work outside MCP Gateway.
- The request is a different product's performance-testing workflow. Use that domain's performance skill.
- The problem is ordinary infrastructure monitoring with no MCP Gateway performance question.

## Inputs / Prereqs

- The MCP Gateway environment, performance symptom, and target metric or complaint.
- Whether the likely problem is system resources, routing and caching, load and scale, or optimization reporting.
- Load only the relevant reference for the current audit problem.

## Workflow

1. Confirm the task is actually about MCP Gateway performance.
2. Choose the focused reference for system resources, routing and caching, load and scale, or reporting.
3. Keep the analysis grounded in measurable gateway behavior instead of generic performance advice.
4. Report the bottleneck, the likely cause, and the next optimization step.

## Outputs / Evidence

- MCP Gateway-specific performance findings and the area they affect.
- The highest-value optimization or next measurement step.
- Any domain boundary where another performance skill should take over.

## Failure / Stop Conditions

- Do not generalize this skill into a catch-all performance router.
- Do not report performance conclusions without tying them to observable gateway behavior.
- Do not hide tradeoffs between latency, throughput, cache behavior, and operational cost.

## OpenTelemetry Integration

As of v1.9.0, the gateway supports optional OpenTelemetry instrumentation:
- Install with `pip install forge-mcp-gateway[otel]`
- Set `OTEL_ENABLED=true` and `OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4317`
- FastAPI and HTTPX are auto-instrumented when OTel packages are present
- Trace context (`trace_id`, `span_id`) is injected into structured logs
- Prometheus metrics available via OTel Prometheus exporter or the existing hand-rolled `/metrics` endpoint
- Key module: `tool_router/observability/otel_setup.py`

## Load These Resources

- `references/system-and-resources.md`
- `references/routing-and-caching.md`
- `references/load-and-scale.md`
- `references/optimization-and-reporting.md`

## Memory Hooks

- Read memory when prior MCP Gateway performance incidents, baselines, or infra constraints matter.
- Write memory only if the session establishes a durable performance baseline or tuning rule.
