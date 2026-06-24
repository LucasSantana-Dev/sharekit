# Visual identity (reference-derived)

Three references define the look. Every video must pass these rules.

## Brand kit — Criativaria (use when the content belongs to the channel/site)

**ABSOLUTE source of truth: the brand guide at `Criativaria-Projects/obsidian-planner` → `guia-de-marca/`** (00-indice … 06-aplicacoes; local checkout may lag — read from `origin/main`). The web-app `global.css` carries the same tokens in CSS form. When the video is for this brand, these REPLACE the generic yellow/Anton defaults:

- Palette: bg `#0A020E` (preto-roxo) · surface `#1D1313` · text `#EFECE3` (creme) · accent `#FE82B8` (pink glamour) · highlight `#62D240` (verde neon)
- Fonts (per guia-de-marca typography table, 2026-06-11 — supersedes the Chakra Petch experiment): **Nunito ExtraBold** for captions/lower-thirds/callouts (instantiated from the variable font to `~/Library/Fonts/Nunito-ExtraBold.ttf`) · **Departure Mono** ONLY for title cards, kinetic typography, stat reveals (keyword cards, infographic numbers) · Nunito Regular for labels/metadata (header, strip source lines)
- Accent roles (guia): **pink `#FE82B8` = destaque principal** (hook, CTAs, highlights) · **verde `#62D240` = destaque secundário** (stats, complementar — "rosa e verde nunca competem") · captions are TEXT → creme `#EFECE3` with the dark outline
- "O que evitar" (guia): fundo branco como padrão, paleta dessaturada, fontes serifadas, ícones genéricos de código, estética "tutorial do YouTube"
- **Links header (permanent):** `[twitch logo] twitch.tv/criativaria · [discord logo] discord.gg/38HeWgEAUg` — platform logos (Simple Icons, creme) at ~38px + Departure Mono 30px creme@~0.8 on a `#0A020E@0.45` pill at **y 164–230** (raised 2rem/32px on 2026-06-10 feedback to free room for content; still inside Reels' 108px top-safe). Content strips start at y≈244. Header overlays LAST in the filter graph so it sits above everything. Discord invite codes are CASE-SENSITIVE — never uppercase the URL. Pre-rendered as a full-frame PNG (Pillow), not drawtext.
- Mapping: captions = pink `&H00B882FE` with `#0A020E` outline · keyword cards = creme `0xEFECE3` over footage · hook = creme · info card = `0x0A020E@0.92` box with verde number + creme subtitle
- **Contrast rule:** verde neon `#62D240` only over DARK backgrounds (info cards, infographics). Over footage it competes with ambient color (the green-wall video proved it) — text over footage is creme or pink, always with the `#0A020E` outline.
- Voice: a criadora fala baixo e calmo — music is TRUE AMBIENCE, never competing with speech comprehension: `MUSIC_LEVEL=0.035 MUSIC_LOWPASS=2400 DUCK_THRESHOLD=0.008 DUCK_RATIO=16` (refined 4x on 2026-06-10: 0.5 → 0.18 → 0.10 → 0.06 all judged too loud; the lowpass is what finally pulls it out of the voice band).
- General rule: when content belongs to ANY site/app with a design system, extract its tokens (CSS vars, tailwind config) and derive the video kit from them before falling back to the generic defaults.

## Hard rules

1. **No transitions.** Straight cuts only — no crossfades, wipes, whip-pans, zoom-transitions. No speed ramps either: the whole video keeps ONE constant cut cadence from hook to CTA. Emphasis comes from framing (punch-in as a hard cut to a tighter crop), never from changing pace. **Single exception: the ending** — close with a 0.8–1.0s fade to brand dark (`fade=t=out:color=0x0A020E`) + matching audio fade (export.sh `END_FADE`). **The fade must NEVER overlap speech**: check the last word's end timestamp; if the clip ends on speech, freeze the final frame first (`tpad=stop_mode=clone:stop_duration=1.3` + `apad`) and fade over the freeze. This rule exists because v4 faded over the closing line.
2. **Bold display type, always.** Default Arial Black; prefer Anton or Archivo Black when installed (`ls ~/Library/Fonts /Library/Fonts | grep -i 'anton\|archivo'`). Never regular/thin weights — legibility and impact first.
3. **Abstract → visual.** Every key claim gets an on-screen artifact. Never let an important sentence pass as audio-only.
4. **Captions belong to the composition.** Not a strip at the bottom — placed near the subject/action, with highlight colors sampled from the scene.
5. **Saturated cinematic grade** on all footage before burning text.

## The references, decoded

**Cellbit — Cicada 3301 (youtube.com/watch?v=Ep5qn8pLCMA):** abstract concepts become visible objects — the document on screen, the keyword in huge type the moment it's spoken, diagrams connecting ideas. Copy: every concept in a dicas-de-estudo or noticias-dev video gets a *keyword card* or *evidence punch-in* (screenshot of the release notes, the technique name in 120px type).

**Patagonia — Youth Salmon Protectors (tiktok @patagonia/7250186821341302062):** information as full-screen bold text cards hard-cut between footage shots, same rhythm as the cuts. Copy: stats and list items become *info cards* — solid/darkened frame, 3–6 words max, massive type.

**Pinterest ref (pin 10836855347597616):** captions integrated into the scene (placed in negative space near the subject, colors echoing the frame) + heavily saturated, cinematic color. Copy: the grade below + caption placement via ASS `\pos`.

## Recipes

**Cinematic saturated grade (default — apply before any text burn):**
```bash
-vf "eq=contrast=1.12:saturation=1.45:brightness=-0.02,colorbalance=rs=0.05:bs=-0.05:rm=0.03:bm=-0.04,vignette=PI/5"
```
Teal-leaning shadows, warm mids, strong saturation, subtle vignette. For already-saturated footage drop saturation to 1.25.

**Keyword card (Cellbit-style — word appears when spoken, stays 2–3s):**
```bash
-vf "drawtext=textfile=keyword.txt:fontfile='<HOME>/Library/Fonts/Anton-Regular.ttf':fontsize=120:fontcolor=white:borderw=6:bordercolor=black:x=(w-text_w)/2:y=700:enable='between(t,8.2,11)'"
```

**Full-screen info card (Patagonia-style — generate a 2s card, concat with hard cut):**
```bash
ffmpeg -y -f lavfi -i color=c=0x101010:s=1080x1920:d=2 \
  -vf "drawtext=textfile=card.txt:fontfile='<HOME>/Library/Fonts/Anton-Regular.ttf':fontsize=110:fontcolor=white:line_spacing=20:x=(w-text_w)/2:y=(h-text_h)/2" \
  -r 30 -pix_fmt yuv420p card.mp4
# then concat demuxer with the footage segments — same cadence as the other cuts
```
Variant: freeze-frame card — extract a frame, darken (`eq=brightness=-0.25`), drawtext over it.

**Captions — the face-safe mid-frame pattern (DEFAULT for talking heads):**
The reference layout splits the frame into three bands: face (upper), **caption band**, body (lower). Captions sit in the band **directly below the chin** — chest level, roughly 55–65% of frame height — never over the face, never as a bottom strip.
- **ALL CAPS**, 2–3 words per caption chunk (karaoke pacing from word-level timestamps — `mlx_whisper --word-timestamps`), one chunk on screen at a time, each chunk 1–3s (2–2.5s optimal)
- **Karaoke upgrade (optional):** active-word highlight via ASS `\kf` tags (centiseconds per word) — white base, yellow sweeping fill; needs word-accurate timing (WhisperX forced alignment gets ±50ms vs Whisper's ±500ms). Animated captions show ~+15% watch time vs static
- **Yellow fill** `&H0000D4FF` (#FFD400) with thick black outline (Outline 2–3) + shadow; alternative: white fill with the key word in yellow
- **Anton** (installed in ~/Library/Fonts) — `FontName=Anton`, no faux-bold (`Bold=0`; Anton is already heavy)
- Placement via `Alignment=2` + large `MarginV` (≈110 at PlayResY 288 ≈ 60% frame height), or `{\pos(540,1150)}` at PlayRes 1080x1920 in ASS
- **Check the face first:** extract a frame, locate the chin; if the subject sits low in frame, push the band down — overlapping the face is the one unforgivable error
- captions.sh implements this as the `midframe` preset (default); `bottom` preset is the fallback for footage where mid-frame would cover hands/action.

## Logos & infographics (noticias-dev / data moments)

When companies/products are named, show their logo; when data is spoken, show an infographic. Editorial (nominative) use only — never imply endorsement.

- **Logos:** Simple Icons CDN — `https://cdn.simpleicons.org/<slug>/000000` (flat SVG). Convert: `qlmanage -t -s 512 -o . logo.svg` (renders black-on-white) → Pillow: grayscale, `alpha = 255 - L`, recolor to brand creme → transparent PNG.
- **Fallback when Simple Icons lacks the brand** (e.g. OpenAI/ChatGPT, removed from their catalog): Wikimedia Commons — query `commons.wikimedia.org/w/api.php?action=query&titles=File:<Name> logo.svg&prop=imageinfo&iiprop=url&iiurlwidth=512` for the thumb PNG (send a browser User-Agent), then recolor preserving alpha. Last resort: text wordmark badge in Departure Mono.
- **Coverage check (mandatory):** before the final export, list every company/product NAMED in the transcript and confirm each one got its logo/badge moment. A missing logo is a finding to surface, never a silent skip — this rule exists because ChatGPT (mentioned in the hook) shipped without a logo in the first production run.
- **Country mentions get their flag** — `flagcdn.com/w320/<iso>.png` (public domain), framed badge (300x200, rounded 12, creme hairline on `#0A020E@210` backing) in the top zone, timed to the word timestamp. A mention already covered by a full-frame card (e.g., headline about the two countries) doesn't need a duplicate flag.
- **Ending fade lead:** `END_FADE_LEAD=1.0` on export.sh — the VIDEO fade starts 1s before the audio fade, easing the image out while the closing line plays at full volume.
- **Placement:** side-by-side with the keyword card in the top zone (logo ~120–144px at y≈290, text shifted to keep the block centered), or inside the infographic bars.
- **THE SPEAKER'S FACE IS ALWAYS VISIBLE — nothing covers, hides, or dims it, ever.** Images, infographics and evidence are COMPLEMENTS to what she's saying, never the protagonist. Two rejected approaches (2026-06-10): partial boxes floating over the subject ("sticker" effect) and full-frame ghost cards (they hide the speaker).
- **Strip cards (DEFAULT pattern for content moments, chosen 2026-06-11):** the video stays FULL SIZE; content renders as a compact strip (1020x205, `#0A020E@242`, pink border 3) in the free top band at y≈244, below the links header. Text ≥24px; condense content to fit (1-line chat Q + 2-line A, headline crop, horizontal bars, mini grid). Windows never overlap keyword cards/badges/flags.
- **Complement layout (alternative when content needs more room):** hard cut to a split layout — footage scales to ~66% (713x1268) anchored bottom-center at y=652 over the brand-dark backdrop (face AND burned captions stay fully visible), bigger card (940x330) in the top band. Implemented as a parallel `[alt]` composition switched in by one `overlay ... enable='between(...)+...'`. Use when strip-size content would be illegible.
- **Ending (preferred): seamless loop** — crossfade the 1.3s frozen tail into the FIRST frame (`xfade=transition=fade:duration=1.3:offset=<end>`, inputs need `settb=AVTB` + matching size/fps/sar); replay becomes invisible since the talking-head framing is constant. Audio still fades (afade ~1.1s). Fade-to-brand-dark (`END_FADE`/`END_FADE_LEAD`) is the alternative for non-loopable content.
- **Infographics:** generate compact 940x330 complement cards with Pillow using brand tokens + Departure Mono — horizontal bar comparisons for stats, dot/square grid strips for "N units, few active" (MoE-style) concepts. They live in the top band of the complement layout (see above) — NEVER full-frame over the speaker.
- **Compositing:** one ffmpeg pass, `overlay=0:0:eof_action=repeat:enable='between(t,a,b)'` per PNG (no `-loop` needed). Time them as the pattern interrupts of the 3–5s cadence, synced to when the number/name is SPOKEN (word timestamps).
- Every stat shown must carry its source on screen or in the lower-third — bake "FONTE: ..." into the infographic.

## Multi-card visual consistency (when generating a SET of cards)

When a video needs several generated cards (keyword + info + infographic + strip), they must look like ONE set, not N independent renders. Lesson borrowed from deer-flow's slide generator, which forbids parallel slide generation for exactly this reason:

- **Generate sequentially, not in parallel.** Render the first card, then build each subsequent card against the previous one as a visual reference — same tokens, type scale, padding, border, backdrop opacity. Parallel/independent generation drifts (different paddings, sizes, weights) and reads as "assembled" instead of designed.
- **First card sets the language.** Lock palette/font/spacing on card #1; every later card inherits it. Change a token → regenerate the whole set, not just the new card.
- This is why the Pillow card builders share one token block — keep it that way; never hand-tune one card's padding in isolation.

## Order of operations

trim → verticalize → **grade** → keyword/info cards → captions → hook overlay → export. Grade always before text so overlays stay clean white/scene-colored on top.
