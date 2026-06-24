#!/usr/bin/env bash
# Convert any video to 1080x1920 vertical.
# Modes: crop = center-crop (subject centered); blur = blurred-background pad (keeps full frame).
set -euo pipefail
usage() { echo "usage: to-vertical.sh <in> <out> [crop|blur]" >&2; exit 1; }
[[ $# -ge 2 ]] || usage
IN=$1 OUT=$2 MODE=${3:-blur}
[[ -f $IN ]] || { echo "not found: $IN" >&2; exit 1; }

case $MODE in
  crop)
    VF="scale=-2:1920,crop=1080:1920:(iw-1080)/2:0"
    ;;
  blur)
    VF="split[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:5[b];[fg]scale=1080:-2[f];[b][f]overlay=(W-w)/2:(H-h)/2"
    ;;
  *) usage ;;
esac

FFMPEG=$(command -v ffmpeg-full || command -v ffmpeg)
"$FFMPEG" -y -i "$IN" -vf "$VF" -c:v libx264 -crf 18 -preset medium -c:a copy "$OUT"
echo "done: $OUT ($MODE mode)"
