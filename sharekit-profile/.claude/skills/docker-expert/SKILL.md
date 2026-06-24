---
name: docker-expert
description: Provide production-focused Docker guidance for image design, multi-stage
  builds, compose setups, security hardening, and deployment packaging. Use when the
  task is mainly about containerizing, optimizing, or shipping software with Docker.
category: devops
risk: unknown
source: community
date_added: '2026-02-27'
metadata:
  owner: global-agents
  tier: ephemeral
  canonical_source: ~/.agents/skills/docker-expert
---

# Docker Expert

Use this skill when Docker itself is the main design or troubleshooting surface.

## Use When

- The task is about Dockerfiles, image layering, build performance, runtime hardening, or Compose behavior.
- A service needs a container strategy for development or production.
- A Docker review or troubleshooting pass is needed before shipping.

## Do Not Use When

- The main problem is generic deployment orchestration rather than Docker specifics.
- The task is primarily Kubernetes, cloud runtime, or CI pipeline design.
- Docker only appears as a minor implementation detail.

## Inputs / Prereqs

- The current Docker surface: Dockerfile, Compose file, image/runtime constraints, or reported issue.
- Whether the task is about builds, security, runtime behavior, or troubleshooting.
- Load only the relevant reference for the current Docker problem.

## Workflow

1. Identify whether the primary problem is build strategy, runtime security, Compose behavior, or diagnosis and review.
2. Choose the focused reference that matches that Docker concern.
3. Keep the recommendation Docker-specific and route broader deployment questions elsewhere.
4. Report the concrete build, runtime, or review change plus any tradeoffs.

## Outputs / Evidence

- Docker-specific guidance tied to the actual container problem.
- The main build, security, runtime, or troubleshooting implications.
- Any boundary where a broader deployment skill should take over.

## Failure / Stop Conditions

- Do not answer cloud-orchestration questions as if they were only Docker problems.
- Do not recommend insecure image or runtime defaults without calling out the risk.
- Do not hide tradeoffs around image size, cacheability, developer ergonomics, or runtime behavior.

## Load These Resources

- `references/dockerfile-and-builds.md`
- `references/security-hardening.md`
- `references/compose-and-runtime.md`
- `references/troubleshooting-and-review.md`

## Memory Hooks

- Read memory only if the workspace already has Docker conventions or deployment constraints that matter.
- Write memory only if the session establishes a durable Docker standard or anti-pattern.
