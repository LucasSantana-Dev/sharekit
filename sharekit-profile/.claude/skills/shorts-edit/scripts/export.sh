#!/usr/bin/env bash
# Final platform-spec export: H.264 High, yuv420p, CRF 19, AAC 192k, faststart, -14 LUFS.
# Optional 3rd arg mixes background music at low volume under the existing audio.
# Env knobs:
#   MUSIC_LEVEL    pre-duck music gain (default 0.5; calm/quiet speakers: 0.10)
#   DUCK_THRESHOLD speech level that triggers ducking (default 0.02; quiet voice: 0.010)
#   DUCK_RATIO     ducking compression ratio (default 10; quiet voice: 14)
#   END_FADE       seconds of fade-to-brand-dark + audio fade at the very end (e.g. 0.9; off when unset)
set -euo pipefail
usage() { echo "usage: export.sh <in> <out> [music.mp3]" >&2; exit 1; }
[[ $# -ge 2 ]] || usage
IN=$1 OUT=$2 MUSIC=${3:-}
[[ -f $IN ]] || { echo "not found: $IN" >&2; exit 1; }

FFMPEG=$(command -v ffmpeg-full || command -v ffmpeg)
VOPTS=(-c:v libx264 -profile:v high -pix_fmt yuv420p -crf 19 -preset slow -movflags +faststart)
AOPTS=(-c:a aac -b:a 192k)

ML=${MUSIC_LEVEL:-0.5} DT=${DUCK_THRESHOLD:-0.02} DR=${DUCK_RATIO:-10}
# MUSIC_LOWPASS: cut music above this Hz so it never competes with the voice band
# (true "ambience behind a wall" — channel default 2400)
MLP=""
[[ -n ${MUSIC_LOWPASS:-} ]] && MLP=",lowpass=f=$MUSIC_LOWPASS"

# ending fade (the one transition the style contract allows)
# END_FADE_LEAD: video fade starts this many seconds EARLIER than the audio fade
# (gentle visual ease-out while the voice finishes at full level)
VFADE="null" AFADE="anull"
if [[ -n ${END_FADE:-} ]]; then
  LEAD=${END_FADE_LEAD:-0}
  SRC_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
  FST=$(echo "$SRC_DUR - $END_FADE" | bc)
  VST=$(echo "$FST - $LEAD" | bc)
  VD=$(echo "$END_FADE + $LEAD" | bc)
  VFADE="fade=t=out:st=$VST:d=$VD:color=0x0A020E"
  AFADE="afade=t=out:st=$FST:d=$END_FADE"
fi

if [[ -n $MUSIC ]]; then
  [[ -f $MUSIC ]] || { echo "not found: $MUSIC" >&2; exit 1; }
  # sidechain ducking: music drops automatically under speech peaks (pro-grade vs static volume)
  "$FFMPEG" -y -i "$IN" -stream_loop -1 -i "$MUSIC" \
    -filter_complex "[0:v]$VFADE[v];[0:a]asplit=2[voice][sc];[1:a]volume=$ML$MLP[m];[m][sc]sidechaincompress=threshold=$DT:ratio=$DR:attack=50:release=500[duck];[voice][duck]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-14:TP=-1.5:LRA=11,$AFADE[a]" \
    -map "[v]" -map "[a]" "${VOPTS[@]}" "${AOPTS[@]}" -shortest "$OUT"
else
  "$FFMPEG" -y -i "$IN" -vf "$VFADE" -af "loudnorm=I=-14:TP=-1.5:LRA=11,$AFADE" "${VOPTS[@]}" "${AOPTS[@]}" "$OUT"
fi

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
DUR_INT=${DUR%.*}
echo "exported: $OUT (${DUR_INT}s)"
if (( DUR_INT > 180 )); then
  echo "WARNING: ${DUR_INT}s > 180s — exceeds the 3-min YouTube Shorts/Reels limit; TikTok only." >&2
elif (( DUR_INT > 60 )); then
  echo "note: ${DUR_INT}s — fine on all platforms (3-min limit), but past the <60s engagement sweet spot." >&2
fi
