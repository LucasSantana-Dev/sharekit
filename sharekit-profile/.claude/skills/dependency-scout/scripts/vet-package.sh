#!/usr/bin/env bash
# vet-package.sh — deterministic vetting signals for candidate npm packages.
# Usage: vet-package.sh <pkg> [<pkg> ...]
# Prints one row per package: latest version · last-publish age · deprecated · license · weekly downloads.
# Read-only: queries the public npm registry. Never installs anything.
set -uo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <pkg> [<pkg> ...]" >&2
  exit 2
fi

# Portable "months since ISO date" (works on macOS/BSD + GNU date).
months_since() {
  local iso="$1"
  [ -z "$iso" ] && { echo "?"; return; }
  local then now
  then=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${iso%%.*}" "+%s" 2>/dev/null) \
    || then=$(date -d "$iso" "+%s" 2>/dev/null) || { echo "?"; return; }
  now=$(date "+%s")
  echo $(( (now - then) / 2629800 ))
}

printf "%-28s %-10s %-7s %-5s %-12s %-14s %s\n" \
  "PACKAGE" "LATEST" "PUB(mo)" "DEPR" "LICENSE" "DOWNLOADS/WK" "FLAGS"

for pkg in "$@"; do
  meta=$(npm view "$pkg" --json 2>/dev/null)
  if [ -z "$meta" ]; then
    printf "%-28s %-10s %-7s %-5s %-12s %-14s %s\n" "$pkg" "-" "-" "-" "-" "-" "NOT_FOUND"
    continue
  fi

  latest=$(printf '%s' "$meta"  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=JSON.parse(s);console.log(m["dist-tags"]?.latest||m.version||"?")})' 2>/dev/null)
  modified=$(printf '%s' "$meta"| node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=JSON.parse(s);console.log((m.time&&m.time.modified)||"")})' 2>/dev/null)
  deprecated=$(printf '%s' "$meta" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=JSON.parse(s);console.log(m.deprecated?"YES":"no")})' 2>/dev/null)
  license=$(printf '%s' "$meta"  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=JSON.parse(s);const l=m.license;console.log(typeof l==="object"?(l.type||"?"):(l||"?"))})' 2>/dev/null)

  dl=$(curl -fsS "https://api.npmjs.org/downloads/point/last-week/${pkg}" 2>/dev/null \
       | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const n=JSON.parse(s).downloads;console.log(n!=null?Intl.NumberFormat("en",{notation:"compact"}).format(n):"?")}catch{console.log("?")}})' 2>/dev/null)

  age=$(months_since "$modified")

  flags=""
  [ "$deprecated" = "YES" ] && flags="${flags}DEPRECATED "
  case "$age" in ''|'?') : ;; *) [ "$age" -gt 18 ] 2>/dev/null && flags="${flags}STALE(${age}mo) " ;; esac
  case "$license" in MIT|ISC|Apache-2.0|BSD-2-Clause|BSD-3-Clause|0BSD|Unlicense|BlueOak-1.0.0|CC0-1.0|MPL-2.0|Python-2.0) : ;; ?|"") flags="${flags}LICENSE? " ;; *) flags="${flags}LICENSE:${license} " ;; esac
  [ -z "$flags" ] && flags="ok"

  printf "%-28s %-10s %-7s %-5s %-12s %-14s %s\n" \
    "$pkg" "${latest:-?}" "${age:-?}" "$deprecated" "${license:-?}" "${dl:-?}" "$flags"
done
