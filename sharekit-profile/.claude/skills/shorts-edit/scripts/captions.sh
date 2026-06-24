#!/usr/bin/env bash
# Transcribe speech with Whisper and burn styled captions (face-safe, mid-frame by default).
# If a .srt is passed as 4th arg, skips transcription and burns that file instead
# (use this after hand-reviewing/fixing the SRT).
# Presets (5th arg): midframe (default — ALL-CAPS yellow Anton band below the chin)
#                    bottom   (fallback — white bold bottom-centered, safe-area aware)
set -euo pipefail
usage() { echo "usage: captions.sh <in> <out> [lang=pt] [existing.srt] [midframe|bottom]" >&2; exit 1; }
[[ $# -ge 2 ]] || usage
IN=$1 OUT=$2 LANG=${3:-pt} SRT=${4:-} PRESET=${5:-midframe}
[[ -f $IN ]] || { echo "not found: $IN" >&2; exit 1; }
# Homebrew ffmpeg 8.x is built WITHOUT libass/freetype — prefer the full static build
FFMPEG=$(command -v ffmpeg-full || command -v ffmpeg)
"$FFMPEG" -hide_banner -filters 2>/dev/null | grep -q " subtitles " \
  || { echo "this ffmpeg lacks libass (no subtitles filter) — install a full build as ffmpeg-full (see REFERENCE.md)" >&2; exit 1; }

if [[ -z $SRT ]]; then
  WHISPER_BIN=$(command -v mlx_whisper || command -v whisper || true)
  [[ -n $WHISPER_BIN ]] || { echo "whisper not installed: pipx install mlx-whisper (or openai-whisper)" >&2; exit 1; }
  TMP=$(mktemp -d)
  "$WHISPER_BIN" "$IN" --language "$LANG" --output-format srt --output-dir "$TMP" 2>/dev/null \
    || "$WHISPER_BIN" "$IN" --language "$LANG" --output_format srt --output_dir "$TMP"
  SRT="$TMP/$(basename "${IN%.*}").srt"
  [[ -f $SRT ]] || { echo "transcription produced no SRT" >&2; exit 1; }
  echo "--- SRT (review for tech-term errors before trusting the burn) ---"
  cat "$SRT"
  echo "--- saved at: $SRT ---"
fi

case $PRESET in
  midframe)
    # ALL-CAPS yellow Anton, band below the chin (~60% frame height). Uppercase the SRT text.
    STYLE="FontName=Anton,FontSize=18,Bold=0,PrimaryColour=&H0000D4FF,OutlineColour=&H00000000,Outline=2,Shadow=1,Alignment=2,MarginV=110,MarginL=40,MarginR=40"
    UPPER=$(mktemp).srt
    awk '/^[0-9]+$/ || /-->/ || /^$/ { print; next } { print toupper($0) }' "$SRT" > "$UPPER"
    SRT=$UPPER
    ;;
  bottom)
    STYLE="FontName=Arial Black,FontSize=16,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,Alignment=2,MarginV=80,MarginL=60,MarginR=60"
    ;;
  *) usage ;;
esac

"$FFMPEG" -y -i "$IN" -vf "subtitles=$(printf %q "$SRT"):force_style='$STYLE':fontsdir=$HOME/Library/Fonts" -c:v libx264 -crf 18 -preset medium -c:a copy "$OUT"
echo "done: $OUT (preset=$PRESET, captions from $SRT)"
