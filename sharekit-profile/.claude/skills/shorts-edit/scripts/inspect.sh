#!/usr/bin/env bash
# Summarize a video: duration, resolution, fps, audio presence. Exit 1 if unreadable.
set -euo pipefail
[[ $# -eq 1 ]] || { echo "usage: inspect.sh <video>" >&2; exit 1; }
IN=$1
[[ -f $IN ]] || { echo "not found: $IN" >&2; exit 1; }

ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,codec_name \
  -show_entries format=duration,size \
  -of default=noprint_wrappers=1 "$IN"

if ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels \
   -of default=noprint_wrappers=1 "$IN" | grep -q codec_name; then
  ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels \
    -of default=noprint_wrappers=1 "$IN"
else
  echo "audio=NONE"
fi

W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$IN")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$IN")
if [[ "$W" == "1080" && "$H" == "1920" ]]; then
  echo "vertical=YES (1080x1920, no conversion needed)"
elif (( H > W )); then
  echo "vertical=PORTRAIT but ${W}x${H} (scale to 1080x1920)"
else
  echo "vertical=NO (${W}x${H} landscape — run to-vertical.sh)"
fi
