---
name: shorts-edit
description: Edit existing footage into vertical 9:16 short-form videos (TikTok/Reels/Shorts) with burned-in styled captions in PT-BR — convert to 1080x1920 (center-crop or blur-pad), trim around a hook, transcribe with Whisper, burn captions, mix background music, and export to platform spec. Includes content templates for dicas de estudo, motivação dev, and notícias dev. Use when the user wants to edit, cut, caption, or export a vertical/short video, or mentions shorts, reels, TikTok, vertical video, legendas, or short-form content about studying tips, coding motivation, or coding news.
---

# shorts-edit

Edits **existing footage** into vertical shorts. No AI generation, no TTS — captions + cuts + music. Default language: **PT-BR** (`--language en` on Whisper to switch).

## Dependencies (check first)

```bash
command -v ffmpeg ffprobe || brew install ffmpeg
command -v ffmpeg-full   # text filters (captions/cards) — Homebrew ffmpeg is slim, see REFERENCE.md gotchas
command -v mlx_whisper || pipx install mlx-whisper  # only needed if footage has speech
```

Whisper downloads models to `~/.cache/whisper` (~500MB–1.5GB). Per storage policy, move it to External HD after first run and symlink back.

## Pipeline

Work in a temp/project dir; keep intermediates until the final export is approved. All scripts live in `scripts/` (relative to this skill).

1. **Inspect** — `scripts/inspect.sh input.mp4` → duration, resolution, fps, audio. Decide: is it landscape (needs conversion) or already 9:16?
2. **Pick the template** — match the content to one of the three niches in [TEMPLATES.md](TEMPLATES.md) (dicas-de-estudo / motivacao-dev / noticias-dev). It defines hook style, pacing, caption look, and CTA.
3. **Trim** — target ≤ 60s (sweet spot 25–45s). The hook must land in the first 2 seconds — cut dead air at the start aggressively:
   ```bash
   ffmpeg -y -ss <start> -to <end> -i input.mp4 -c copy cut.mp4
   ```
4. **Verticalize** — `scripts/to-vertical.sh cut.mp4 vertical.mp4 [crop|blur]`. Use `crop` when the subject is centered (talking head, screen recording zoomed); `blur` (blurred-background pad) when cropping would lose content (code on screen, wide shots).
5. **Grade + captions** — apply the cinematic grade first (STYLE.md), then if there's speech: `scripts/captions.sh graded.mp4 captioned.mp4 pt`. It runs Whisper → SRT → burns styled captions (bold, centered, inside safe areas). Prefer scene-integrated placement when the footage allows (STYLE.md). Review the SRT before burning — fix PT-BR transcription errors and tech terms (Whisper mangles "deploy", "commit", etc.). If no speech, add hook/text overlays instead (drawtext recipes in [REFERENCE.md](REFERENCE.md)).
6. **Hook overlay** — add the template's hook text on the first 2–3s (drawtext recipe in REFERENCE.md). For noticias-dev also add the source credit lower-third.
7. **Export** — `scripts/export.sh captioned.mp4 final.mp4 [music.mp3]`. H.264 high / yuv420p / CRF 19 / AAC 192k / faststart. With music it auto-mixes at low volume under the voice. Warns if > 60s.
8. **Verify** — re-run `scripts/inspect.sh final.mp4`: confirm 1080x1920, ≤ 60s, audio present. Open it (`open final.mp4`) and tell the user to check caption sync before posting.

## Rules

- **No transitions, one pace.** Straight cuts only (no crossfades/wipes/zoom-transitions) and no speed ramps — constant cut cadence from hook to CTA. Full style contract in [STYLE.md](STYLE.md).
- **Bold display type always** (Arial Black default; Anton/Archivo Black if installed). Never regular/thin weights.
- **Abstract → visual.** Every key claim gets an on-screen artifact: keyword card, full-screen info card, or evidence punch-in (recipes in STYLE.md).
- **Grade before text.** Apply the cinematic saturated grade (STYLE.md) before burning captions/overlays.
- Never upscale beyond source quality; if source is < 1080px wide, crop less or use blur mode.
- Keep text inside safe areas: top 250px and bottom 420px are covered by platform UI (margins are pre-set in the scripts; don't move captions out of them).
- One video = one idea. If the footage covers 3 tips, propose 3 separate shorts.
- **Source every spoken claim.** For each factual claim, stat, or news item spoken in the footage: proactively web-search the source (never wait for the user to provide it), verify the claim against it, put it ON SCREEN (infographic `FONTE:` line, lower-third, or an evidence card with the article screenshot), and list the source URLs in the delivery message for the post description. A claim that can't be sourced is a finding to surface before export.
- Always show the user the planned cuts (timestamps) before rendering the final export.

## Advanced

Visual identity — reference-derived hard rules, cinematic grade, keyword/info cards, integrated captions: see [STYLE.md](STYLE.md).
FFmpeg recipes (jump cuts / silence removal, punch-in, loudness normalize), platform spec table, and caption style variants: see [REFERENCE.md](REFERENCE.md).
Niche hooks, structures, and PT-BR copy formulas: see [TEMPLATES.md](TEMPLATES.md).
