---
name: oac-ollama
description: Interact with the oac-workstation Ollama instance (RX 9070 XT, 15.9GB VRAM) via Tailscale. Use for model management, inference, status checks, and homelab AI operations.
type: skill
triggers:
  - "ollama on workstation"
  - "check models"
  - "pull model"
  - "oac ollama"
  - "homelab ai"
  - "run model"
---

# OAC Workstation — Ollama (oac-workstation)

**Host**: `100.114.87.119:11434` (Tailscale)
**GPU**: AMD Radeon RX 9070 XT — 15.9 GiB VRAM via ROCm gfx1201
**SSH**: `ssh oac-workstation` or `ssh luk@192.168.1.170`

## Quick Commands (Mac)

```bash
# All ollama CLI commands auto-route via OLLAMA_HOST in ~/.zshrc
ollama list                          # list downloaded models
ollama ps                            # show running models + GPU usage
ollama pull <model>                  # pull a model to workstation
ollama run qwen2.5-coder:14b         # interactive session

# HTTP API
curl $OLLAMA_HOST/api/tags           # list models (JSON)
curl $OLLAMA_HOST/api/ps             # running models + VRAM usage
```

## Installed Models

| Alias in OpenCode | Model ID | Size | Notes |
|-------------------|----------|------|-------|
| forge-dev:14b | `forge-dev:14b` | ~9 GB | Custom model with Forge practices baked in (SCOPE, gotchas, workflow, Forge ecosystem) |
| Qwen 2.5 Coder 14B | `qwen2.5-coder:14b-instruct-q4_K_M` | ~9 GB | Base model |
| Llama 3.1 8B | `llama3.1:8b-instruct-q4_K_M` | ~5 GB | Fast/fallback |

## forge-dev:14b

Custom model trained on Forge Space AI dev practices:
- Source: `ai-dev-toolkit/training/forge-dev.Modelfile`
- Fine-tuning dataset: `ai-dev-toolkit/training/dataset.jsonl` (40 instruction pairs)
- Covers: SCOPE prompting, 10 agent gotchas, memory systems, context management, Forge ecosystem gotchas
- Re-create: `sudo -u ollama OLLAMA_MODELS=/usr/share/ollama/.ollama/models ollama create forge-dev:14b -f /tmp/forge-dev.Modelfile`

## OpenCode / Codex Usage

Models are wired into OpenCode agents via `~/.config/opencode/opencode.jsonc`:
- `openai/gpt-4o-mini` → Qwen 2.5 Coder 14B (primary coding agent)
- `openai/gpt-4o` → Llama 3.1 8B (fast/fallback)

## Service Config

Override file: `/etc/systemd/system/ollama.service.d/override.conf`

Key settings:
- `OLLAMA_FLASH_ATTENTION=1` — reduces KV bandwidth on long contexts
- `OLLAMA_KV_CACHE_TYPE=q8_0` — ~half VRAM vs f16
- `OLLAMA_KEEP_ALIVE=5m` — unload after idle
- `HSA_OVERRIDE_GFX_VERSION=12.0.1` — required for RDNA 4 (gfx1201)
- Context 32K for big tasks: edit override.conf + `sudo systemctl daemon-reload && sudo systemctl restart ollama`

## Troubleshooting

```bash
# If GPU not detected after reboot
ssh oac-workstation "sudo systemctl restart ollama && journalctl -u ollama -n 5"

# Check GPU VRAM live
ssh oac-workstation "ollama ps"

# If model pull stalls
ssh oac-workstation "nohup bash ~/pull-models.sh > ~/pull-models.log 2>&1 &"
ssh oac-workstation "tail -f ~/pull-models.log | cat"
```
