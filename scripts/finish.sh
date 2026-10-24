#!/bin/bash
# Cierre del video en una sola corrida: render final (placas: render.js · libre: libre.js) + mix + QC + historial + timing.
# uso: bash finish.sh <work>        (logs completos en <work>/finish.log; en pantalla solo lo esencial)
# Frena en el primer error (set -e) mostrando las últimas líneas del log.
set -e
W="$(cd "$1" && pwd)"; SK="$(cd "$(dirname "$0")/.." && pwd)"
PY="$SK/.venv/bin/python"; [ -x "$PY" ] || PY=python3
LOG="$W/finish.log"; : > "$LOG"
trap 'c=$?; [ $c = 0 ] || { echo "✗ finish falló (log: $LOG)"; tail -n 12 "$LOG"; }' EXIT
cfg(){ node -e "const c=require('$W/config.json');const v=c['$1'];process.stdout.write(v===undefined?'':String(v))"; }
step(){ echo "== $1" >> "$LOG"; }
MODO="$(cfg modo)"
if [ "$MODO" = libre ]; then step render; node "$SK/scripts/libre.js" render "$W" >> "$LOG" 2>&1
else                         step render; node "$SK/scripts/render.js" "$W" >> "$LOG" 2>&1; fi
step mix;      "$PY" -I "$SK/scripts/mix.py" "$W" >> "$LOG" 2>&1
OUT="$(cfg out_dir)"; NAME="$(cfg name)"
if [ "$MODO" = libre ]; then step historial; node "$SK/scripts/libre.js" log "$W" >> "$LOG" 2>&1
else                         step look; node "$SK/scripts/look.js" log "$W" >> "$LOG" 2>&1; fi
step timing;   "$PY" -I "$SK/scripts/timing.py" report "$W" > "$W/timing.out" 2>> "$LOG"
echo "MP4: $OUT/$NAME.mp4"
"$PY" -I "$SK/scripts/qc.py" "$W"
head -n 1 "$W/timing.out"
