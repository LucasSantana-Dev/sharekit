# Reference

## Platform specs (all three accept the same master)

| Platform | Resolution | Max length | Notes |
|----------|-----------|-----------|-------|
| TikTok | 1080x1920 | 10 min (sweet spot < 60s) | UI covers right edge (~120px) and bottom |
| Instagram Reels | 1080x1920 | 3 min (since Jan 2025) | Bottom ~420px covered by caption/actions |
| YouTube Shorts | 1080x1920 | 3 min (since Oct 2024) | Title overlays top |

**Safe area:** keep all text within x: 60–1020, y: 250–1500. Scripts already respect this via caption margins. Per-platform UI chrome (1080x1920): TikTok right ~180px (like/share column) + bottom ~350px; Reels bottom ~320px + right ~120px; Shorts bottom ~300px. The universal rule that survives every platform: critical content inside the central 1080x1080 square.

**Master export:** H.264 High, yuv420p, CRF 19, AAC 192k, 30 or 60fps (match source), `+faststart`. One master serves all three platforms.

## Whisper

```bash
mlx_whisper input.mp4 --model mlx-community/whisper-large-v3-turbo --language pt \
  --word-timestamps True --output-format json \
  --initial-prompt "Vídeo sobre tecnologia e programação. Termos: DeepSeek, ChatGPT, GPT, Claude, IA, NVIDIA, Huawei, deploy, commit, open source."
```

- **Default model: `whisper-large-v3-turbo`** — the small model mangled PT-BR badly in production (DeepSeek→"Pissique", ChatGPT→"cheiro de PT", 35%→25%). Turbo is fast on Apple Silicon and dramatically more accurate. Use small only for throwaway drafts.
- **Always pass `--initial-prompt` with a tech glossary** — it biases Whisper toward the domain terms the video actually uses. Update the term list per video (product names, libs).
- Even with turbo: review the SRT before burning; numbers spoken on camera (stats, versions) must be confirmed by ear — two runs of the small model disagreed 35% vs 25%.
- Set `HF_HOME="${EXTERNAL_HD}/.hf-cache"` — model weights are >1GB (storage policy).
- Model cache lives in `~/.cache/whisper` — move to external drive and symlink once it exceeds ~100MB (storage policy).

## Caption styling (force_style values used by captions.sh)

```
FontName=Arial Black,FontSize=16,Bold=1,PrimaryColour=&H00FFFFFF,
OutlineColour=&H00000000,Outline=2,Shadow=1,Alignment=2,MarginV=80,MarginL=60,MarginR=60
```

Variants:
- **motivacao-dev:** `FontSize=20`, split SRT lines to 2–4 words each before burning.
- **Yellow highlight:** convert SRT → ASS (`ffmpeg -i in.srt out.ass`) and wrap key words with `{\c&H00D4FF&}word{\c&HFFFFFF&}` (ASS colors are BGR).

## FFmpeg recipes

**Hook text overlay (first 2.5s):**
```bash
ffmpeg -y -i in.mp4 -vf "drawtext=text='VOCÊ ESTUDA ERRADO':fontfile=/System/Library/Fonts/Supplemental/Arial\ Black.ttf:fontsize=72:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=420:enable='lt(t,2.5)'" -c:a copy out.mp4
```

**Source credit lower-third (last 5s of a 40s video):**
```bash
-vf "drawtext=text='Fonte\: blog.github.com':fontsize=36:fontcolor=white@0.9:box=1:boxcolor=black@0.5:boxborderw=12:x=(w-text_w)/2:y=1450:enable='gt(t,35)'"
```

**Jump cuts — remove silences > 0.6s (great for talking-head niches):**
```bash
ffmpeg -y -i in.mp4 -af "silenceremove=stop_periods=-1:stop_duration=0.6:stop_threshold=-35dB" -vf "select='1'" out.mp4
# Better sync: detect with silencedetect, then cut segments explicitly:
ffmpeg -i in.mp4 -af silencedetect=noise=-35dB:d=0.6 -f null - 2>&1 | grep silence_
```
Prefer the detect-then-cut approach: build a `select='between(t,a,b)+between(t,c,d)'` filter from the detected speech segments so audio and video stay in sync.

**Cut-quality guards (mandatory — burst cuts read as stutter):**
- **Anti-burst:** if the speech chunk between two removed silences is < 1.2s, keep the later silence — never remove 3 pauses in rapid succession.
- **Protected zones:** rhetorical pauses are content. After cutting, read the transcript around every cut cluster; if a sentence got chopped ("existisse quando eu... Quando eu dei"), rebuild with that window protected. The first production run created an artificial stutter at exactly such a pause.
- QA pass: listen to (or transcribe) the cut video and check sentence integrity before burning captions.

**Punch-in zoom (emphasis, e.g. 10s–13s, 1.15x):**
```bash
-vf "scale=iw*1.15:ih*1.15,crop=1080:1920:(iw-1080)/2:(ih-1920)/2:enable='between(t,10,13)'"
```

**Loudness normalize (do this on the final master — platforms expect ~-14 LUFS):**
```bash
-af "loudnorm=I=-14:TP=-1.5:LRA=11"
```

**Color:** the default grade is the cinematic saturated one in STYLE.md. Subtle fallback for screen recordings where saturation would distort UI colors:
```bash
-vf "eq=contrast=1.06:saturation=1.15"
```

**Concat clips (same codec/resolution):**
```bash
printf "file '%s'\n" clip1.mp4 clip2.mp4 > list.txt
ffmpeg -y -f concat -safe 0 -i list.txt -c copy joined.mp4
```

## Background music sourcing (license-safe)

Preference order for the cozy game-OST vibe (criadora loves game soundtracks):

1. **OpenGameArt CC0** — zero attribution, direct hotlinkable mp3s. Verified Stardew-like: `opengameart.org/sites/default/files/cozy_puzzle_in-game_2_bpm90.mp3` (piano, 90 BPM — the channel's default track), `cozy_puzzle_in-game_1_bpm118.mp3`, `cozy_puzzle_title_bpm95.mp3`.
2. **Real game OSTs with verified creator permission** (OSTs ARE copyrighted — only use these):
   - **Stardew Valley** ✅ ConcernedApe explicitly permits streams/monetized videos (x.com/ConcernedApe/status/1341814074376482817)
   - **Undertale/Deltarune** ❌ NOT for this channel — permission is non-commercial only (materiamusicpub.com/youtube-faq) and the channel's content doesn't qualify; ruled out 2026-06-10
   - **Minecraft/C418** ⚠️ whitelisted for Minecraft gameplay content only (c418.org)
   - **Nintendo** ❌ never use as background music — strict enforcement
3. **incompetech.com (Kevin MacLeod)** — CC-BY 4.0, direct mp3 URLs; requires credit in the post description. Note: "Wholesome" has whistling (rejected once — sounds vocal); prefer "Carefree", "Porch Swing Days (slower)".
4. **Pixabay Music** — free, no attribution; download via site (CDN links are dynamic).

export.sh mixes with sidechain ducking (`MUSIC_LEVEL`, `DUCK_THRESHOLD`, `DUCK_RATIO`, `END_FADE`). For this channel's quiet calm speaker: `MUSIC_LEVEL=0.06 DUCK_THRESHOLD=0.010 DUCK_RATIO=14`. Always state the license/credit obligation when delivering.

## Auto-reframe (face-aware 9:16 crop) — advanced, not yet scripted

When landscape footage has a moving subject, static center-crop loses them. The open-source approach (what Opus Clip's ReframeAnything does commercially): MediaPipe face detection per ~3rd frame → smooth the bounding-box path (Savitzky–Golay order 3, window 5–11 frames, or EMA alpha 0.1–0.2) → emit per-frame `crop` coordinates to ffmpeg. Reference: [KazKozDev/auto-vertical-reframe](https://github.com/KazKozDev/auto-vertical-reframe) (YOLOv11 + MediaPipe + PySceneDetect), Google AutoFlip. Use only when crop/blur modes visibly fail — heavier dependency chain.

## Gotchas

- **Homebrew ffmpeg 8.x is a slim build — NO libass, NO freetype.** `subtitles`, `ass`, and `drawtext` filters are absent; the error is a misleading "Error opening output files: Invalid argument" / "Filter not found". Fix: full static build from ffmpeg.martin-riedl.de (arm64) at `${DEV_ROOT}/.tools/ffmpeg-full/`, symlinked as `~/.local/bin/ffmpeg-full`. All scripts auto-prefer `ffmpeg-full` when present.

- `export.sh` music mixing requires the input to HAVE an audio stream; if the clip is silent, add one first: `-f lavfi -i anullsrc=r=48000:cl=stereo -shortest`.
- Subtitles filter re-encodes video — burn captions BEFORE the final export, never after.
- `drawtext` with PT-BR accents: pass text via `textfile=` if escaping fights you.
- Odd dimensions break libx264 — always use even width/height (`scale=-2:...`).
